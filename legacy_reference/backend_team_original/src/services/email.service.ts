import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// FLOW START: Email Service (EN)
// จุดเริ่มต้น: Service ส่งอีเมล (TH)

// Email service for sending verification emails
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize email transporter
    // For development, use console logging
    // For production, configure with real SMTP
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && smtpPass) {
      const port = parseInt(process.env.SMTP_PORT || '587');
      const secureEnv = (process.env.SMTP_SECURE || '').toLowerCase();
      const secure = port === 465 || secureEnv === 'true' || secureEnv === '1';
      const requireTLS = secureEnv === 'tls' || secureEnv === 'starttls';

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        ...(requireTLS ? { requireTLS: true } : {}),
        auth: {
          user: process.env.SMTP_USER,
          pass: smtpPass,
        },
      });
    } else {
      logger.warn('Email service not configured. Using console logging mode.');
    }
  }

  async sendVerificationEmail(
    email: string,
    verificationToken: string,
    firstName?: string,
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@rgadashboard.com',
      to: email,
      subject: 'ยืนยันอีเมลของคุณ - RGA Dashboard',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ยืนยันอีเมลของคุณ</h1>
            </div>
            <div class="content">
              <p>สวัสดี${firstName ? ` คุณ${firstName}` : ''},</p>
              <p>ขอบคุณที่สมัครใช้งาน RGA Dashboard กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">ยืนยันอีเมล</a>
              </div>
              <p>หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              <p>ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง</p>
              <p>หากคุณไม่ได้สมัครใช้งาน กรุณาเพิกเฉยต่ออีเมลนี้</p>
            </div>
            <div class="footer">
              <p>© 2025 RGA Analytics Company Limited. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        ยืนยันอีเมลของคุณ - RGA Dashboard
        
        สวัสดี${firstName ? ` คุณ${firstName}` : ''},
        
        ขอบคุณที่สมัครใช้งาน RGA Dashboard กรุณาคลิกลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ:
        
        ${verificationUrl}
        
        ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง
        
        หากคุณไม่ได้สมัครใช้งาน กรุณาเพิกเฉยต่ออีเมลนี้
        
        © 2025 RGA Analytics Company Limited. All rights reserved.
      `,
    };

    if (this.transporter) {
      try {
        await this.transporter.sendMail(mailOptions);
        logger.info(`Verification email sent to ${email}`);
      } catch (error: any) {
        logger.error(`Failed to send verification email to ${email}: ${error.message}`);
        throw error;
      }
    } else {
      // Development mode - log to console
      logger.info('=== EMAIL VERIFICATION (Development Mode) ===');
      logger.info(`To: ${email}`);
      logger.info(`Subject: ${mailOptions.subject}`);
      logger.info(`Verification URL: ${verificationUrl}`);
      logger.info('==============================================');
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    firstName?: string,
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@rgadashboard.com',
      to: email,
      subject: 'รีเซ็ตรหัสผ่าน - RGA Dashboard',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>รีเซ็ตรหัสผ่าน</h1>
            </div>
            <div class="content">
              <p>สวัสดี${firstName ? ` คุณ${firstName}` : ''},</p>
              <p>เราได้รับคำขอรีเซ็ตรหัสผ่านของคุณ กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">รีเซ็ตรหัสผ่าน</a>
              </div>
              <p>หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</p>
              <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
              <p>ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
              <p>หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้</p>
            </div>
            <div class="footer">
              <p>© 2025 RGA Analytics Company Limited. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    if (this.transporter) {
      try {
        await this.transporter.sendMail(mailOptions);
        logger.info(`Password reset email sent to ${email}`);
      } catch (error: any) {
        logger.error(`Failed to send password reset email to ${email}: ${error.message}`);
        throw error;
      }
    } else {
      logger.info('=== PASSWORD RESET EMAIL (Development Mode) ===');
      logger.info(`To: ${email}`);
      logger.info(`Subject: ${mailOptions.subject}`);
      logger.info(`Reset URL: ${resetUrl}`);
      logger.info('==============================================');
    }
  }
}

export const emailService = new EmailService();

// FLOW END: Email Service (EN)
// จุดสิ้นสุด: Service ส่งอีเมล (TH)
