import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/ProductCard";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { PRODUCTS, formatPrice, getProduct } from "@/lib/products";

export const Route = createFileRoute("/products/$productId")({
  loader: ({ params }) => {
    const product = getProduct(params.productId);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Chocolate not found — SolCacao" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${p.name.en} — SolCacao` },
        { name: "description", content: p.description.en },
        { property: "og:title", content: `${p.name.en} — SolCacao` },
        { property: "og:description", content: p.description.en },
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <p className="font-display text-3xl">{t.product.notFound}</p>
      <Button asChild className="mt-6">
        <Link to="/catalog">{t.product.back}</Link>
      </Button>
    </div>
  );
}

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { t, lang } = useI18n();
  const { dispatch, setOpen } = useCart();
  const [qty, setQty] = useState(1);

  const related = PRODUCTS.filter(
    (p) => p.id !== product.id && (p.category === product.category || p.origin === product.origin),
  ).slice(0, 3);

  const add = () => {
    dispatch({
      type: "ADD",
      qty,
      item: {
        key: product.id,
        name: product.name,
        detail: { en: product.origin, es: product.origin },
        price: product.price,
        image: product.image,
      },
    });
    toast.success(t.product.added, { description: product.name[lang] });
    setOpen(true);
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t.product.back}
        </Link>
        <div className="mt-8 grid gap-12 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-secondary shadow-soft">
            <img
              src={product.image}
              alt={product.name[lang]}
              width={1024}
              height={1024}
              className="aspect-square h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="eyebrow text-muted-foreground">
              {product.origin} · {t.catalog.categories[product.category]}
            </p>
            <h1 className="mt-3 text-5xl leading-tight">{product.name[lang]}</h1>
            <p className="mt-4 font-display text-3xl">{formatPrice(product.price, lang)}</p>
            <p className="mt-6 text-lg text-muted-foreground">{product.description[lang]}</p>

            <dl className="mt-8 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card">
              {[
                [t.product.cacao, `${product.cacaoPct}%`],
                [t.product.origin, product.origin],
                [t.product.weight, product.weight],
              ].map(([k, v]) => (
                <div key={k} className="p-4">
                  <dt className="eyebrow text-muted-foreground">{k}</dt>
                  <dd className="mt-1 font-display text-lg">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6">
              <p className="eyebrow text-muted-foreground">{t.product.notes}</p>
              <p className="mt-2 font-display text-xl italic">{product.notes[lang]}</p>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="inline-flex h-12 items-center rounded-md border border-border bg-card">
                <button className="px-3" aria-label="-" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button className="px-3" aria-label="+" onClick={() => setQty((q) => q + 1)}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button size="lg" className="flex-1" onClick={add}>
                {t.product.add}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t.product.inStock(product.stock)}</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <h2 className="text-3xl">{t.product.related}</h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
