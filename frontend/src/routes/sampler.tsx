// Sampler: custom 6- or 12-piece chocolate box builder.
// Customers choose flavors, optionally add a gift message, and add a full box
// to the shared cart. Pricing and products are prototype data.

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/site/PageHeader";
// Cart, product catalog and localization.
import { useCart } from "@/lib/cart";
import { DICTS, useI18n } from "@/lib/i18n";
import { PRODUCTS, formatPrice } from "@/lib/products";
import { cn } from "@/lib/utils";
import truffles from "@/assets/p-truffles.jpg";

// Register the /sampler page and its search/social metadata.
export const Route = createFileRoute("/sampler")({
  head: () => ({
    meta: [
      { title: "Build a Custom Chocolate Sampler — SolCacao" },
      {
        name: "description",
        content: "Fill a 6 or 12 piece keepsake box with your favorite SolCacao chocolates.",
      },
      { property: "og:title", content: "Build Your SolCacao Sampler" },
      {
        property: "og:description",
        content: "Pick your box size and choose every piece.",
      },
    ],
  }),
  component: Sampler,
});

// Demo price per piece. A production server must calculate authoritative prices.
const PIECE_PRICE = 2.75;
// Offer up to eight non-seasonal products as the available flavor choices.
const FLAVORS = PRODUCTS.filter((p) => p.category !== "seasonal").slice(0, 8);

function Sampler() {
  const { t, lang } = useI18n();
  const { dispatch, setOpen } = useCart();
  // A slot stores a product ID; repeated IDs allow several pieces of one flavor.
  const [size, setSize] = useState<6 | 12>(6);
  const [slots, setSlots] = useState<string[]>([]);
  // The optional gift text is included in the cart description.
  const [gift, setGift] = useState("");

  // Refuse extra selections once all positions in the selected box are filled.
  const addPiece = (id: string) => {
    if (slots.length >= size) {
      toast(t.sampler.full);
      return;
    }
    // Recheck inside the state update so rapid clicks cannot exceed capacity.
    setSlots((s) => (s.length < size ? [...s, id] : s));
  };

  // Shrinking from 12 to 6 preserves the first six choices and drops the rest.
  const changeSize = (n: 6 | 12) => {
    setSize(n);
    setSlots((s) => s.slice(0, n));
  };

  // Keep the completeness guard here as well as on the disabled UI button.
  const addToCart = () => {
    if (slots.length !== size) return;
    // Resolve selected IDs into products for translated flavor descriptions.
    const names = slots.map((id) => PRODUCTS.find((p) => p.id === id)!);
    // Keep both language versions so cart contents can change language later.
    const summary = (l: "en" | "es") =>
      [names.map((p) => p.name[l]).join(", "), gift && `“${gift}”`].filter(Boolean).join(" · ");
    // ADD routes through the cart reducer and browser persistence.
    // A unique key keeps separately customized boxes as separate cart lines.
    dispatch({
      type: "ADD",
      item: {
        key: `sampler-${Date.now()}`,
        // Use each dictionary directly, rather than copying the current language twice.
        // This relies on the i18n module exporting DICTS.
        name: {
          en: DICTS.en.sampler.name(size),
          es: DICTS.es.sampler.name(size),
        },
        detail: { en: summary("en"), es: summary("es") },
        price: size * PIECE_PRICE,
        image: truffles,
      },
    });
    // Reset the builder after adding and open the cart so the customer can review it.
    setSlots([]);
    setGift("");
    setOpen(true);
  };

  return (
    <>
      {/* Localized title and introduction from the shared translation dictionary. */}
      <PageHeader eyebrow={t.sampler.eyebrow} title={t.sampler.title} body={t.sampler.body} />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="eyebrow mb-4 text-muted-foreground">{t.sampler.choose}</p>
          {/* Flavor cards adapt from two to four columns as the viewport grows. */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {FLAVORS.map((p) => (
              <button
                key={p.id}
                onClick={() => addPiece(p.id)}
                className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/95 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Plus className="h-4 w-4" />
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-display text-sm leading-tight">{p.name[lang]}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.cacaoPct}% · {p.origin}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Box controls become sticky beside the flavors on large screens. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-cocoa p-6 text-cocoa-foreground shadow-lift">
            <p className="eyebrow text-gold">{t.sampler.size}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {/* Both supported box sizes show their calculated demo totals. */}
              {([6, 12] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => changeSize(n)}
                  aria-pressed={size === n}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-sm font-bold transition-colors",
                    size === n
                      ? "border-gold bg-gold text-gold-foreground"
                      : "border-cocoa-foreground/25 hover:border-gold",
                  )}
                >
                  {t.sampler.pieces(n)} · {formatPrice(n * PIECE_PRICE, lang)}
                </button>
              ))}
            </div>

            <div className={cn("mt-6 grid gap-2", size === 6 ? "grid-cols-3" : "grid-cols-4")}>
              {/* Render every position, including empty slots, to show progress. */}
              {Array.from({ length: size }).map((_, i) => {
                const p = PRODUCTS.find((x) => x.id === slots[i]);
                return (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-full border border-dashed border-cocoa-foreground/30"
                  >
                    {p && (
                      <>
                        <img
                          src={p.image}
                          alt={p.name[lang]}
                          className="h-full w-full object-cover"
                        />
                        {/* Remove exactly this position, even if flavors repeat. */}
                        <button
                          onClick={() => setSlots((s) => s.filter((_, j) => j !== i))}
                          aria-label={t.cart.remove}
                          className="absolute inset-0 flex items-center justify-center bg-cocoa/70 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-cocoa-foreground/70">
                {t.sampler.filled(slots.length, size)}
              </span>
              {slots.length > 0 && (
                <button onClick={() => setSlots([])} className="text-gold hover:underline">
                  {t.sampler.clear}
                </button>
              )}
            </div>

            <div className="mt-6 space-y-1.5">
              <Label htmlFor="gift" className="text-cocoa-foreground/80">
                {t.sampler.gift}
              </Label>
              {/* Limit the optional gift message to the prototype's 140 characters. */}
              <Textarea
                id="gift"
                rows={2}
                maxLength={140}
                value={gift}
                onChange={(e) => setGift(e.target.value)}
                className="border-cocoa-foreground/25 bg-transparent text-cocoa-foreground"
              />
            </div>

            {/* A sampler becomes purchasable only after every slot has a flavor. */}
            <Button
              variant="gold"
              size="lg"
              className="mt-6 w-full"
              disabled={slots.length < size}
              onClick={addToCart}
            >
              {t.sampler.add}
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
