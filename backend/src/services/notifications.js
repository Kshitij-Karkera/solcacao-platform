/**
 * Sends an email and records the outcome in the NotificationLog table.
 * Never throws: a failed email or a failed log write is reported on the console only.
 */
import { query } from "../config/db.js";
import { sendMail } from "./mailer.js";

/**
 * @param mail  { to, subject, html, replyTo?, attachments? }
 * @param ref   { sourceType: 'inquiry' | 'b2b_quote', sourceId, inquiryId?, quoteId? }
 * @returns "sent" | "skipped" (no SMTP configured) | "failed"
 */
export async function sendAndLog(mail, ref) {
  let status;
  try {
    status = (await sendMail(mail)).sent ? "sent" : "skipped";
  } catch (err) {
    console.error("email failed", err);
    status = "failed";
  }
  try {
    await query(
      `INSERT INTO NotificationLog
         (channel, recipient, source_type, source_id, inquiry_id, b2b_quote_request_id, delivery_status, sent_at)
       VALUES ('email', $1, $2, $3, $4, $5, $6, CASE WHEN $6 = 'sent' THEN GETDATE() ELSE NULL END)`,
      [mail.to, ref.sourceType, ref.sourceId, ref.inquiryId ?? null, ref.quoteId ?? null, status],
    );
  } catch (err) {
    console.error("notification log failed", err);
  }
  return status;
}
