import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;
const enabled = () => Boolean(env.SMTP_HOST && env.NOTIFY_EMAIL);

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

/** Sends an optional e-mail notification for a new contact message. Never throws. */
export async function notifyNewMessage(msg) {
  if (!enabled()) return;
  try {
    await getTransporter().sendMail({
      from: env.MAIL_FROM || env.SMTP_USER,
      to: env.NOTIFY_EMAIL,
      replyTo: msg.email,
      subject: `[Portfolio] ${msg.subject}`.slice(0, 200),
      // Plain text only – no HTML rendering of visitor input.
      text: `New message from ${msg.name} <${msg.email}>\n\n${msg.message}\n\n— Sent from your portfolio contact form`,
    });
  } catch (err) {
    console.warn('Contact notification e-mail failed:', err?.message);
  }
}
