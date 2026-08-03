// @ts-nocheck
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import fs from 'fs-extra';

export class EmailTool {
  private transporter: nodemailer.Transporter | null = null;

  async send(options: {
    to: string;
    subject: string;
    body: string;
    from?: string;
    html?: boolean;
  }): Promise<string> {
    try {
      if (!this.transporter) {
        const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
        const gmailPass = process.env.GMAIL_PASS || process.env.EMAIL_PASS;

        if (!gmailUser || !gmailPass) {
          return 'Email error: GMAIL_USER and GMAIL_PASS env vars required. For Gmail, use an App Password (not your regular password).';
        }

        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPass
          }
        });
      }

      const info = await this.transporter.sendMail({
        from: options.from || process.env.EMAIL_FROM || 'janex@localhost',
        to: options.to,
        subject: options.subject,
        text: options.html ? undefined : options.body,
        html: options.html ? options.body : undefined
      });

      return `Email sent: ${info.messageId}`;
    } catch (error: any) {
      if (error.code === 'EAUTH') {
        return `Email auth failed: ${error.message}. Use Gmail App Password, not regular password. Enable 2FA first, then generate App Password at https://myaccount.google.com/apppasswords`;
      }
      return `Email error: ${error.message}`;
    }
  }

  async sendWithAttachment(options: {
    to: string;
    subject: string;
    body: string;
    attachmentPath: string;
  }): Promise<string> {
    try {
      if (!this.transporter) {
        const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
        const gmailPass = process.env.GMAIL_PASS || process.env.EMAIL_PASS;

        if (!gmailUser || !gmailPass) {
          return 'Email error: GMAIL_USER and GMAIL_PASS env vars required. Use Gmail App Password.';
        }

        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPass
          }
        });
      }

      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'janex@localhost',
        to: options.to,
        subject: options.subject,
        text: options.body,
        attachments: [{ path: options.attachmentPath }]
      });

      return `Email with attachment sent: ${info.messageId}`;
    } catch (error: any) {
      if (error.code === 'EAUTH') {
        return `Email auth failed: ${error.message}. Use Gmail App Password.`;
      }
      return `Email error: ${error.message}`;
    }
  }

  async listLabels(): Promise<string> {
    try {
      const keyFile = process.env.GOOGLE_CREDENTIALS || './credentials.json';
      if (!await fs.pathExists(keyFile)) {
        return 'Gmail error: credentials.json not found. Set GOOGLE_CREDENTIALS env var or place credentials.json in project root. Download from Google Cloud Console.';
      }

      const auth = new google.auth.GoogleAuth({
        keyFile,
        scopes: ['https://www.googleapis.com/auth/gmail.readonly']
      });

      const gmail = google.gmail({ version: 'v1', auth: await auth.getClient() });
      const res = await gmail.users.labels.list({ userId: 'me' });

      const labels = (res.data.labels || []).map(l => l.name).join(', ');
      return labels || 'No labels found';
    } catch (error: any) {
      return `Gmail error: ${error.message}`;
    }
  }
}

export const emailTool = new EmailTool();
