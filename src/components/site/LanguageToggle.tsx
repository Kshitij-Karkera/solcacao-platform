// LanguageToggle: EN/ES switch shown in the header and mobile menu (Student 2).

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
// Lang = "en" | "es"
import type { Lang } from "@/lib/products";

// className lets the parent adjust spacing or visibility (e.g. hidden on mobile)
export function LanguageToggle({ className }: { className?: string }) {
  // Current language, setter and translated strings from the i18n context
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={cn(
        "inline-flex rounded-full border border-border p-0.5 text-xs font-bold",
        className,
      )}
    >
      {(["en", "es"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          // Switching updates every translated string on the page
          onClick={() => setLang(l)}
          // Tells screen readers which language is currently selected
          aria-pressed={lang === l}
          // Active language gets the filled primary style
          className={cn(
            "rounded-full px-2.5 py-1 uppercase transition-colors",
            lang === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
