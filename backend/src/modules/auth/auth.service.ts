import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from './auth.repository';
import { UsersRepository } from '../users/users.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { User, Tenant } from '@prisma/client';
import { Request } from 'express';
import {
  InvalidCredentialsException,
  AccountLockedException,
  EmailExistsException,
  TokenRevokedException,
  TokenExpiredException,
  UserNotFoundException,
} from './auth.exception';

type UserWithTenant = User & { tenant: Tenant };

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly auditLogsService: AuditLogsService,
    private readonly prisma: PrismaService,
  ) { }

  async register(dto: RegisterDto) {
    // Note: For registration, we don't have tenantId yet, so we use a global email check
    // This is acceptable as emails should be globally unique for login purposes
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existing) {
      throw new EmailExistsException();
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.authRepository.createTenantAndUser(dto, hashedPassword) as UserWithTenant;

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
    const accessExpiry = this.config.get<string>('JWT_ACCESS_EXPIRY', '15m');
    const refreshExpiry = this.config.get<string>('JWT_REFRESH_EXPIRY', '7d');

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
}
