// WhatsAppFab: floating WhatsApp contact shortcut.
// Mounted once in the root layout so it appears on every page.
// Uses a translated greeting and the destination configured in lib/site.ts.

import { MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { whatsappLink } from "@/lib/site";

/** Floating automated WhatsApp redirection link. */
export function WhatsAppFab() {
  const { t, lang } = useI18n();
  // Choose the greeting from the active site language.
  const msg =
    lang === "es" ? "¡Hola SolCacao! Tengo una pregunta." : "Hi SolCacao! I have a question.";
  return (
    // The landmark and link share a descriptive accessible name.
    <aside aria-label={t.contact.whatsapp}>
      {/* Standard link opens WhatsApp; no message or notification is sent automatically. */}
      <a
        href={whatsappLink(msg)}
        target="_blank"
        rel="noreferrer"
        aria-label={t.contact.whatsapp}
        // Fixed positioning keeps the shortcut in the lower-right corner.
        // Focus-ring styles support keyboard navigation.
        className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lift transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {/* Decorative icon: the accessible link label already describes the action. */}
        <MessageCircle aria-hidden="true" className="h-6 w-6" />
      </a>
    </aside>
  );
}
