// Site contact configuration and WhatsApp URL helper.
// Imported by the contact page, shared footer and floating WhatsApp button.
// These values are public browser-visible details, never server credentials.

/** Placeholder contact details — replace with real SolCacao info. */
// Before public release, set a verified international number using digits only
// (country code + number, without a plus sign, spaces or punctuation).
export const WHATSAPP_NUMBER = "5215500000000";
// Replace the .example address; it is a reserved placeholder, not a working inbox.
export const CONTACT_EMAIL = "hola@solcacao.example";
// Replace this sample address with the approved customer-facing location.
export const ATELIER_ADDRESS = "Calle del Cacao 12, Oaxaca, México";

// Encode only the message value so accents, spaces, & and # stay inside the text.
// The returned link prefills a chat; the customer must choose to send it.
export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
