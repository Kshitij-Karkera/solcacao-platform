import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, Gem, Package, Stamp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuoteWizard } from "@/components/site/QuoteWizard";
import { useI18n } from "@/lib/i18n";
import b2bImage from "@/assets/b2b-custom.jpg";

export const Route = createFileRoute("/wholesale")({
  head: () => ({
    meta: [
      { title: "Wholesale & Custom Corporate Chocolate — SolCacao" },
      {
        name: "description",
        content:
          "Custom chocolate molds, luxury packaging and white-label production for hotels, events and brands.",
      },
      { property: "og:title", content: "SolCacao Wholesale & Custom Orders" },
      {
        property: "og:description",
        content: "Request a custom manufacturing quote in four simple steps.",
      },
    ],
  }),
  component: Wholesale,
});

const ICONS = [Stamp, Package, Gem];

function Wholesale() {
  const { t } = useI18n();
  const w = t.wholesale;

  return (
    <>
      <section className="relative overflow-hidden bg-cocoa text-cocoa-foreground">
        <div className="absolute inset-0 bg-sun-glow opacity-40" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <p className="eyebrow text-gold animate-rise">{w.eyebrow}</p>
            <h1 className="mt-4 text-5xl leading-[1.03] md:text-6xl animate-rise">{w.title}</h1>
            <p className="mt-6 max-w-md text-lg text-cocoa-foreground/80 animate-rise">{w.body}</p>
            <Button variant="gold" size="lg" className="mt-8" asChild>
              <a href="#wizard">
                {w.cta} <ArrowDown />
              </a>
            </Button>
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-cocoa-foreground/15 pt-8">
              {w.stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-3xl text-gold">{s.value}</dt>
                  <dd className="mt-1 text-xs text-cocoa-foreground/70">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <img
            src={b2bImage}
            alt=""
            width={1600}
            height={1200}
            className="rounded-2xl shadow-lift"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {w.services.map((s, i) => {
            const Icon = ICONS[i] ?? Gem;
            return (
              <div key={s.title} className="rounded-2xl border border-border bg-card p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-6 text-2xl">{s.title}</h2>
                <p className="mt-2 text-muted-foreground">{s.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="wizard" className="scroll-mt-20 border-t border-border bg-secondary/50">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <p className="eyebrow text-center text-muted-foreground">{w.wizardEyebrow}</p>
          <h2 className="mt-3 text-center text-4xl md:text-5xl">{w.wizardTitle}</h2>
          <div className="mt-12">
            <QuoteWizard />
          </div>
        </div>
      </section>
    </>
  );
}
