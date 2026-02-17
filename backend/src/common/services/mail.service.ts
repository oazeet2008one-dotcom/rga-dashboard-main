import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  private createTransport() {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const secure = this.config.get<boolean>('SMTP_SECURE');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !port || secure === undefined || !user || !pass) {
      throw new Error('SMTP is not configured. Please set SMTP_HOST/SMTP_PORT/SMTP_SECURE/SMTP_USER/SMTP_PASS');
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  async sendMail(params: { to: string; subject: string; html: string }) {
    const from = this.config.get<string>('SMTP_FROM') || this.config.get<string>('SMTP_USER');
    if (!from) {
      throw new Error('SMTP_FROM is not configured');
    }

    const transporter = this.createTransport();
    const info = await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    this.logger.log(`Email sent to ${params.to} (messageId=${info.messageId})`);
    return { messageId: info.messageId };
  }
}
