import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/ProductCard";
import { useI18n } from "@/lib/i18n";
import { ORIGINS, PRODUCTS } from "@/lib/products";
import { cn } from "@/lib/utils";
import heroCacao from "@/assets/hero-cacao.jpg";
import heroTruffles from "@/assets/hero-truffles.jpg";
import b2bImage from "@/assets/b2b-custom.jpg";
import bonbons from "@/assets/p-bonbons.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SolCacao — Single-Origin Chocolate for Home & Business" },
      {
        name: "description",
        content:
          "Shop organic single-origin chocolate bars and truffles, or design custom corporate chocolate with SolCacao.",
      },
      { property: "og:title", content: "SolCacao — Single-Origin Chocolate" },
      {
        property: "og:description",
        content:
          "Organic cacao bars, truffles and custom B2B confections. Available in English & Spanish.",
      },
    ],
  }),
  component: Home,
});

const SLIDE_IMAGES = [heroCacao, heroTruffles];

function Home() {
  const { t } = useI18n();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDE_IMAGES.length), 6500);
    return () => clearInterval(id);
  }, []);

  const current = t.home.slides[slide] ?? t.home.slides[0]!;
  const seasonal = PRODUCTS.filter((p) => p.seasonal || p.category === "bonbons").slice(0, 3);

  return (
    <>
      {/* Hero slides */}
      <section className="relative h-[82vh] min-h-[560px] overflow-hidden bg-cocoa text-cocoa-foreground">
        {SLIDE_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            width={1920}
            height={1088}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
              i === slide ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6">
          <div key={slide} className="max-w-xl">
            <p className="eyebrow text-gold animate-rise">{current.eyebrow}</p>
            <h1 className="mt-4 text-5xl leading-[1.02] md:text-7xl animate-rise">
              {current.title}
            </h1>
            <p className="mt-6 max-w-md text-lg text-cocoa-foreground/80 animate-rise">
              {current.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-rise">
              <Button variant="gold" size="lg" asChild>
                <Link to={slide === 0 ? "/catalog" : "/wholesale"}>
                  {current.cta} <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
          {SLIDE_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === slide ? "w-10 bg-gold" : "w-5 bg-cocoa-foreground/40",
              )}
            />
          ))}
        </div>
      </section>

      {/* Dual channel */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <p className="eyebrow text-center text-muted-foreground">{t.home.channelsEyebrow}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <ChannelCard
            icon={<ShoppingBag className="h-5 w-5" />}
            title={t.home.retailTitle}
            body={t.home.retailBody}
            cta={t.home.retailCta}
            to="/catalog"
            image={bonbons}
          />
          <ChannelCard
            icon={<Briefcase className="h-5 w-5" />}
            title={t.home.b2bTitle}
            body={t.home.b2bBody}
            cta={t.home.b2bCta}
            to="/wholesale"
            image={b2bImage}
          />
        </div>
      </section>

      {/* Seasonal showcase */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-muted-foreground">{t.home.seasonalEyebrow}</p>
              <h2 className="mt-2 text-4xl md:text-5xl">{t.home.seasonalTitle}</h2>
            </div>
            <Link
              to="/catalog"
              className="hidden items-center gap-1 text-sm font-semibold hover:underline sm:inline-flex"
            >
              {t.home.viewAll} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {seasonal.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Origins */}
      <section className="relative overflow-hidden bg-cocoa text-cocoa-foreground">
        <div className="absolute inset-0 bg-sun-glow opacity-40" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2">
          <div>
            <p className="eyebrow text-gold">{t.home.originsEyebrow}</p>
            <h2 className="mt-3 text-4xl md:text-6xl">{t.home.originsTitle}</h2>
            <p className="mt-5 max-w-md text-cocoa-foreground/75">{t.home.originsBody}</p>
          </div>
          <ul className="grid grid-cols-2 gap-px self-center overflow-hidden rounded-lg bg-cocoa-foreground/15">
            {ORIGINS.map((o, i) => (
              <li key={o} className="bg-cocoa p-6">
                <span className="font-display text-sm text-gold">0{i + 1}</span>
                <p className="mt-2 font-display text-xl">{o}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Sampler CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-secondary p-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl md:text-4xl">{t.home.samplerTitle}</h2>
            <p className="mt-2 text-muted-foreground">{t.home.samplerBody}</p>
          </div>
          <Button size="lg" asChild>
            <Link to="/sampler">
              {t.home.samplerCta} <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function ChannelCard({
  icon,
  title,
  body,
  cta,
  to,
  image,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  to: "/catalog" | "/wholesale";
  image: string;
}) {
  return (
    <Link
      to={to}
      className="group relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-2xl bg-cocoa p-8 text-cocoa-foreground shadow-soft"
    >
      <img
        src={image}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-cocoa via-cocoa/50 to-transparent" />
      <div className="relative">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold text-gold-foreground">
          {icon}
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-sm text-cocoa-foreground/80">{body}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-gold">
          {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
