import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { formatPrice, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const { lang, t } = useI18n();
  const { dispatch } = useCart();

  const add = () => {
    dispatch({
      type: "ADD",
      item: {
        key: product.id,
        name: product.name,
        detail: { en: product.origin, es: product.origin },
        price: product.price,
        image: product.image,
      },
    });
    toast.success(t.product.added, { description: product.name[lang] });
  };

  return (
    <article className="group flex flex-col">
      <Link
        to="/products/$productId"
        params={{ productId: product.id }}
        className="relative block aspect-[4/5] overflow-hidden rounded-lg bg-secondary"
      >
        <img
          src={product.image}
          alt={product.name[lang]}
          loading="lazy"
          width={1024}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-bold">
          {product.cacaoPct}%
        </span>
        {product.seasonal && (
          <span className="absolute right-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-gold-foreground">
            {t.product.seasonal}
          </span>
        )}
      </Link>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-muted-foreground">{product.origin}</p>
          <Link
            to="/products/$productId"
            params={{ productId: product.id }}
            className="mt-1 block font-display text-lg leading-snug hover:underline"
          >
            {product.name[lang]}
          </Link>
          <p className="mt-1 text-sm font-semibold">{formatPrice(product.price, lang)}</p>
        </div>
        <button
          onClick={add}
          aria-label={`${t.product.add}: ${product.name[lang]}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
