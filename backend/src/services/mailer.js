/**
 * Nodemailer SMTP bridge (Student 5). If SMTP is not configured (local dev),
 * emails are logged to the console instead of failing the request.
 */
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === "true",
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

/** Escape user input before placing it in HTML emails. */
export const esc = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

export function layout(title, rows, footer = "") {
  const body = rows
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;color:#7a5c48;font-weight:600;vertical-align:top">${esc(k)}</td>
             <td style="padding:8px 12px;color:#2b1a12;white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f6efe4;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fffaf2;border-radius:12px;overflow:hidden">
      <tr><td style="background:#2b1a12;color:#e8b04b;padding:20px 24px;font-size:22px;font-family:Georgia,serif">SolCacao</td></tr>
      <tr><td style="padding:24px"><h2 style="margin:0 0 16px;color:#2b1a12;font-family:Georgia,serif">${esc(title)}</h2>
        <table width="100%" cellpadding="0" cellspacing="0">${body}</table>
        ${footer ? `<p style="color:#7a5c48;font-size:13px;margin-top:20px">${esc(footer)}</p>` : ""}
      </td></tr>
    </table></td></tr></table></body></html>`;
}

export async function sendMail({ to, subject, html, replyTo, attachments }) {
  if (!transporter) {
    console.info(`[mailer:dev] -> ${to} | ${subject}`);
    return { sent: false };
  }
  await transporter.sendMail({ from: env.MAIL_FROM, to, subject, html, replyTo, attachments });
  return { sent: true };
}
