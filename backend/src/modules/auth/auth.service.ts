import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from './auth.repository';
import { UsersRepository } from '../users/users.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { User, Tenant } from '@prisma/client';
import { Request } from 'express';
import * as crypto from 'crypto';
import { MailService } from '../../common/services/mail.service';
import {
  InvalidCredentialsException,
  AccountLockedException,
  EmailExistsException,
  UsernameExistsException,
  TermsNotAcceptedException,
  EmailNotVerifiedException,
  InvalidEmailVerificationTokenException,
  EmailVerificationTokenExpiredException,
  TokenRevokedException,
  TokenExpiredException,
  UserNotFoundException,
} from './auth.exception';

type UserWithTenant = User & { tenant: Tenant };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly auditLogsService: AuditLogsService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) { }

  async register(dto: RegisterDto) {
    if (!dto.termsAccepted) {
      throw new TermsNotAcceptedException();
    }

    const normalizedEmail = (dto.email || '').trim().toLowerCase();
    const normalizedUsername = (dto.username || '').trim().toLowerCase();

    // Note: For registration, we don't have tenantId yet, so we use a global email check
    // This is acceptable as emails should be globally unique for login purposes
    const existing = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new EmailExistsException();
    }

    const existingUsername = await this.prisma.user.findFirst({
      where: { username: normalizedUsername },
    });

    if (existingUsername) {
      throw new UsernameExistsException();
    }

    const normalizedDto: RegisterDto = {
      ...dto,
      email: normalizedEmail,
      username: normalizedUsername,
      firstName: (dto.firstName || '').trim(),
      lastName: (dto.lastName || '').trim(),
    };

    const hashedPassword = await bcrypt.hash(normalizedDto.password, 10);

    const user = await this.authRepository.createTenantAndUser(normalizedDto, hashedPassword) as UserWithTenant;

    // Generate email verification token and store hash + expiry
    const { token, tokenHash, expiresAt } = this.generateEmailVerificationToken();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpiresAt: expiresAt,
      },
    });

    // Send verification email
    try {
      await this.sendVerificationEmail(user.email, token);
    } catch (e: any) {
      this.logger.error(
        `Failed to send verification email to ${user.email}: ${e?.message || e}`,
        e?.stack,
      );
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.authRepository.saveRefreshToken(user.id, tokens.refreshToken);

    await this.auditLogsService.createLog({
      userId: user.id,
      action: 'REGISTER',
      resource: 'User',
      details: { email: user.email, tenantId: user.tenant.id },
    });

    // ✅ SECURITY FIX: Return sanitized user object (no password hash)
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new InvalidEmailVerificationTokenException();
    }

    const tokenHash = this.hashToken(token);
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationTokenHash: tokenHash,
      },
    });

    if (!user) {
      throw new InvalidEmailVerificationTokenException();
    }

    if (user.emailVerificationTokenExpiresAt && user.emailVerificationTokenExpiresAt < new Date()) {
      throw new EmailVerificationTokenExpiredException();
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string) {
    if (!email) {
      throw new InvalidCredentialsException();
    }

    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      // Do not leak account existence
      return { message: 'If an account exists for this email, a verification email has been sent.' };
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    const { token, tokenHash, expiresAt } = this.generateEmailVerificationToken();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpiresAt: expiresAt,
      },
    });

    try {
      await this.sendVerificationEmail(email, token);
      return { message: 'Verification email sent' };
    } catch (e: any) {
      this.logger.error(
        `Failed to resend verification email to ${email}: ${e?.message || e}`,
        e?.stack,
      );
      return { message: "We couldn't send the email right now. Please try again later." };
    }
  }

  /**
   * Login with Security Field Updates
   * - Brute force protection (lock after 5 failed attempts)
   * - Track lastLoginAt, lastLoginIp
   * - Track session with IP and UserAgent
   */
  async login(dto: LoginDto, request?: Request) {
    // For login, we look up user by email globally (email is unique across system)
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: { tenant: true },
    }) as UserWithTenant;

    // Check if account is locked
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AccountLockedException(minutesLeft);
    }

    if (!user || !user.isActive) {
      throw new InvalidCredentialsException();
    }

    // Enforce email verification before allowing login
    if (!user.emailVerified) {
      throw new EmailNotVerifiedException();
    }

    const valid = await bcrypt.compare(dto.password, user.password);

    if (!valid) {
      // Increment failed login count
      const newFailedCount = (user.failedLoginCount || 0) + 1;
      const shouldLock = newFailedCount >= 5;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: newFailedCount,
          lockedUntil: shouldLock
            ? new Date(Date.now() + 30 * 60 * 1000)  // Lock for 30 minutes
            : null,
        },
      });

      // Include remaining attempts in error response
      const remainingAttempts = 5 - newFailedCount;
      throw new InvalidCredentialsException(remainingAttempts > 0 ? remainingAttempts : undefined);
    }

    // Reset failed count & update login info on successful login
    const clientIp = request?.ip || request?.socket?.remoteAddress || null;
    const userAgent = request?.headers?.['user-agent'] || null;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: clientIp,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    // Save session with IP and User Agent
    await this.authRepository.saveRefreshToken(
      user.id,
      tokens.refreshToken,
      clientIp,
      userAgent,
    );

    await this.auditLogsService.createLog({
      userId: user.id,
      action: 'LOGIN',
      resource: 'Auth',
      details: {
        email: user.email,
        ip: clientIp,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenant: { id: user.tenant.id, name: user.tenant.name },
      },
      ...tokens,
    };
  }

  /**
   * Refresh token with rotation (ลบ token เก่าก่อนสร้างใหม่)
   */
  async refreshToken(token: string, request?: Request) {
    try {
      // 1. Verify token
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      // 2. ตรวจสอบว่า token ยังอยู่ใน database
      const session = await this.authRepository.findSessionByToken(token);
      if (!session) {
        throw new TokenRevokedException();
      }

      // 3. ลบ token เก่า (Token Rotation)
      await this.authRepository.deleteRefreshToken(token);

      // 4. หา user - use prisma directly since auth doesn't have tenantId context
      const user = await this.prisma.user.findFirst({
        where: { email: payload.email },
      });
      if (!user) {
        throw new UserNotFoundException();
      }

      // 5. สร้าง tokens ใหม่
      const tokens = await this.generateTokens(user.id, user.email);

      const clientIp = request?.ip || request?.socket?.remoteAddress || null;
      const userAgent = request?.headers?.['user-agent'] || null;

      await this.authRepository.saveRefreshToken(
        user.id,
        tokens.refreshToken,
        clientIp,
        userAgent,
      );

      return tokens;
    } catch (e) {
      // ถ้า token ไม่ valid ลบทิ้งเพื่อความปลอดภัย
      await this.authRepository.deleteRefreshToken(token).catch(() => { });
      throw new TokenExpiredException();
    }
  }

  /**
   * Logout - ลบ refresh token
   */
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // ลบเฉพาะ session นี้
      await this.authRepository.deleteRefreshToken(refreshToken);
    }

    await this.auditLogsService.createLog({
      userId,
      action: 'LOGOUT',
      resource: 'Auth',
      details: {},
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string) {
    await this.authRepository.revokeAllUserSessions(userId);

    await this.auditLogsService.createLog({
      userId,
      action: 'LOGOUT_ALL',
      resource: 'Auth',
      details: {},
    });

    return { message: 'Logged out from all devices' };
  }

  private async generateTokens(userId: string, email: string) {
    const accessExpiry =
      this.config.get<string>('JWT_ACCESS_EXPIRY') ||
      this.config.get<string>('JWT_EXPIRES_IN') ||
      '15m';
    const refreshExpiry =
      this.config.get<string>('JWT_REFRESH_EXPIRY') ||
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ||
      '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email },
        { secret: this.config.get('JWT_SECRET'), expiresIn: accessExpiry },
      ),
      this.jwt.signAsync(
        { sub: userId, email },
        { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: refreshExpiry },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Sanitize user object for API response
   * ⚠️ SECURITY: Excludes password hash and internal security fields
   * Per AUTH_INTERFACE_CONTRACT.md specification
   */
  private sanitizeUser(user: UserWithTenant) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
      },
    };
  }

  private generateEmailVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    return { token, tokenHash, expiresAt };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async sendVerificationEmail(email: string, token: string) {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:5173');
    const verifyUrl = `${appUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;

    const subject = 'Email Verification - RGA Dashboard';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; margin-bottom: 20px;">Welcome to RGA Dashboard</h2>
        <p style="color: #666; line-height: 1.6;">Thank you for registering with RGA Dashboard. To complete your registration and access your account, please verify your email address.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #999; font-size: 14px;">If you did not create this account, please disregard this email. Your account will not be activated without verification.</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated message from RGA Dashboard. Please do not reply to this email.</p>
      </div>
    `;

    await this.mailService.sendMail({
      to: email,
      subject,
      html,
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'If an account exists with this email, a password reset link has been sent.' };
    }

    // Generate password reset token
    const { token, tokenHash, expiresAt } = this.generatePasswordResetToken();
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: expiresAt,
      },
    });

    try {
      await this.sendPasswordResetEmail(user.email, token);
    } catch (e: any) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}: ${e?.message || e}`,
        e?.stack,
      );
    }

    return { message: 'If an account exists with this email, a password reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new InvalidCredentialsException();
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null,
      },
    });

    // Log the password reset
    await this.auditLogsService.createLog({
      userId: user.id,
      action: 'PASSWORD_RESET',
      resource: 'user',
      details: { email: user.email },
    });

    return { message: 'Password reset successfully' };
  }

  private generatePasswordResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    return { token, tokenHash, expiresAt };
  }

  private async sendPasswordResetEmail(email: string, token: string) {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:5173');
    const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

    const subject = 'Password Reset - RGA Dashboard';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
        <p style="color: #666; line-height: 1.6;">We received a request to reset your password for your RGA Dashboard account. Click the link below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #999; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
        <p style="color: #999; font-size: 14px;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated message from RGA Dashboard. Please do not reply to this email.</p>
      </div>
    `;

    await this.mailService.sendMail({
      to: email,
      subject,
      html,
    });
  }
}
