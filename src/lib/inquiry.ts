// Student 5: one validation contract for the contact form and its regression tests.
// The backend must validate again before storing an inquiry or sending email.
import { z } from "zod";
import type { Dict } from "./i18n";

export function createInquirySchema(errors: Dict["contact"]["errors"]) {
  return z.object({
    name: z.string().trim().min(1, errors.name).max(100, errors.nameLong),
    email: z.string().trim().email(errors.email).max(255, errors.emailLong),
    message: z.string().trim().min(10, errors.message).max(2000, errors.messageLong),
    // API category values stay stable when the display language changes.
    category: z.enum(["retail", "wholesale", "sample", "support"], {
      errorMap: () => ({ message: errors.category }),
    }),
  });
}
