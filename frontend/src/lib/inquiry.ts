// One validation contract for the contact form and its regression tests.
// Limits match POST /api/contact, which validates again before storing the inquiry.
import { z } from "zod";
import type { Dict } from "./i18n";

export function createInquirySchema(errors: Dict["contact"]["errors"]) {
  return z.object({
    // The API stores "Name <email>" in a 255-character column, hence 80 + 170.
    name: z.string().trim().min(1, errors.name).max(80, errors.nameLong),
    email: z.string().trim().email(errors.email).max(170, errors.emailLong),
    message: z.string().trim().min(10, errors.message).max(2000, errors.messageLong),
    // API category values stay stable when the display language changes.
    category: z.enum(["retail", "wholesale", "sample", "support"], {
      errorMap: () => ({ message: errors.category }),
    }),
  });
}

export type InquiryTopic = "retail" | "wholesale" | "sample" | "support";

/** The contact form's topics mapped to the API's inquiry categories. */
export const API_CATEGORY: Record<InquiryTopic, "order" | "wholesale" | "general"> = {
  retail: "order",
  wholesale: "wholesale",
  sample: "wholesale",
  support: "general",
};