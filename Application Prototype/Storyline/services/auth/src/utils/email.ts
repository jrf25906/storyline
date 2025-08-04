import nodemailer from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'Storyline <noreply@storyline.app>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '')
    };

    if (process.env.NODE_ENV === 'development') {
      logger.info('Email would be sent:', mailOptions);
      return;
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};