import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) { }

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const secure = this.config.get<boolean>('SMTP_SECURE');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');

    if (!host || !port || !user || !pass) {
      this.logger.warn('SMTP is not fully configured (missing host, port, user or pass)');
      return null;
    }

    this.logger.log(`Creating SMTP transporter for ${host}:${port} (secure: ${secure ?? (port === 465)})`);
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: secure ?? (port === 465), // Default to true if port is 465
      auth: { user, pass },
      // TLS Settings to avoid certificate issues on some shared hosting
      tls: {
        rejectUnauthorized: false, // Avoid DH_KEY_TOO_SMALL or certificate hostname mismatches
      },
      connectionTimeout: 10000, // 10s
      greetingTimeout: 10000,   // 10s
      socketTimeout: 10000,     // 10s
      debug: true,             // Show SMTP traffic
      logger: true,            // Log to console
    });

    return this.transporter;
  }

  async sendMail(params: { to: string; subject: string; html: string }) {
    // Try SMTP_FROM, then EMAIL_FROM, then SMTP_USER
    const from = this.config.get<string>('SMTP_FROM') || 
                 this.config.get<string>('EMAIL_FROM') || 
                 this.config.get<string>('SMTP_USER');

    if (!from) {
      this.logger.error('No FROM email address configured (SMTP_FROM/EMAIL_FROM/SMTP_USER)');
      throw new Error('No FROM email address configured');
    }

    this.logger.log(`Attempting to send email to ${params.to} from ${from}...`);

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.error('SMTP Transporter could not be initialized (missing config)');
      throw new Error('SMTP is not configured. Please set SMTP_HOST/SMTP_PORT/SMTP_SECURE/SMTP_USER/SMTP_PASSWORD');
    }

    try {
      this.logger.debug(`Sending mail: ${params.subject} to ${params.to}`);
      const info = await transporter.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      this.logger.log(`✅ Email sent successfully to ${params.to} (messageId=${info.messageId})`);
      return { messageId: info.messageId };
    } catch (err: any) {
      this.logger.error(`❌ SMTP Error sending to ${params.to}: ${err?.message || err}`, err?.stack);
      throw err; // Throw so caller knows it failed
    }
  }
}
