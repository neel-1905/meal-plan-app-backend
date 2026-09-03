import { Resend } from 'resend';
import 'dotenv/config';

if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
  throw new Error('RESEND_API_KEY or RESEND_FROM_EMAIL not set!');

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, url: string) {
  const res = resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: 'Reset your password',
    html: `
      <h1>Reset your password</h1>
      <p>
        <a href="${url}">Click here to reset your password</a>
      </p>
    `,
  });

  console.log('📨 Resend response:', res);

  return res;
}
