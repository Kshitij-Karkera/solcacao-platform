// SiteFooter: global footer with brand, links, newsletter form and contact details.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
// Shared contact constants
import { ATELIER_ADDRESS, CONTACT_EMAIL } from "@/lib/site";
import { Logo } from "./Logo";

export function SiteFooter() {
  const { t } = useI18n();
  // Controlled value of the newsletter input
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-cocoa text-cocoa-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-12">
        {/* 12-column grid on desktop: brand, two link lists, newsletter */}
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-cocoa-foreground/70">{t.footer.tagline}</p>
        </div>
        <div className="md:col-span-2">
          <p className="eyebrow text-gold">{t.footer.shop}</p>
          <ul className="mt-4 space-y-2 text-sm text-cocoa-foreground/80">
            <li>
              <Link to="/catalog" className="hover:text-gold">
                {t.nav.shop}
              </Link>
            </li>
            <li>
              <Link to="/sampler" className="hover:text-gold">
                {t.nav.sampler}
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="eyebrow text-gold">{t.footer.company}</p>
          <ul className="mt-4 space-y-2 text-sm text-cocoa-foreground/80">
            <li>
              <Link to="/wholesale" className="hover:text-gold">
                {t.nav.wholesale}
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-gold">
                {t.nav.contact}
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="eyebrow text-gold">{t.footer.newsletter}</p>
          {/* Newsletter sign-up: front-end only for now, no API call yet */}
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              // Stop the browser's full-page form submit
              e.preventDefault();
              // Very basic check; the input type=email also validates
              if (!email.includes("@")) return;
              setEmail("");
              toast.success(t.footer.subscribed);
            }}
          >
            <Input
              type="email"
              required
              aria-label={t.auth.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-10 border-cocoa-foreground/25 bg-transparent text-cocoa-foreground placeholder:text-cocoa-foreground/40"
            />
            <Button type="submit" variant="gold">
              {t.footer.newsletterCta}
            </Button>
          </form>
          <p className="mt-6 text-xs text-cocoa-foreground/60">
            {CONTACT_EMAIL} · {ATELIER_ADDRESS}
          </p>
        </div>
      </div>
      {/* Copyright bar; the year updates automatically */}
      <div className="border-t border-cocoa-foreground/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-cocoa-foreground/50 sm:px-6">
          © {new Date().getFullYear()} SolCacao · {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
