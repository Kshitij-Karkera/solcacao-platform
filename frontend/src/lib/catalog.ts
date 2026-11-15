/**
 * Live catalog from GET /api/products, shared by the home, catalog, product and
 * sampler pages. The first render uses the bundled PRODUCTS list, then the API
 * response replaces it (prices, stock and names come from the database). If the
 * API cannot be reached the bundled list stays in place, so pages never go blank.
 */
import { useSyncExternalStore } from "react";
import { z } from "zod";

import { api, assetUrl } from "./api";
import { PRODUCTS, currentProducts, setCurrentProducts, type Product } from "./products";

const localized = z.object({ en: z.string(), es: z.string() });
const apiProduct = z.object({
  id: z.string(),
  name: localized,
  description: localized.catch({ en: "", es: "" }),
  notes: localized.nullable().catch(null),
  origin: z.string().nullable(),
  cacaoPct: z.number(),
  price: z.number(),
  weight: z.string().nullable(),
  category: z.enum(["bars", "truffles", "bonbons", "seasonal"]),
  image: z.string().nullable(),
  seasonal: z.boolean(),
  stock: z.number(),
});

/** Convert one API product into the shape the UI components use. */
export function fromApi(raw: unknown): Product | null {
  const r = apiProduct.safeParse(raw);
  if (!r.success) return null;
  const p = r.data;
  const bundled = PRODUCTS.find((b) => b.id === p.id);
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    notes: p.notes ?? { en: "", es: "" },
    origin: p.origin ?? "",
    cacaoPct: p.cacaoPct,
    price: p.price,
    weight: p.weight ?? "",
    category: p.category,
    // Prefer the API's image; fall back to the bundled one for the same product.
    image: p.image ? assetUrl(p.image) : (bundled?.image ?? ""),
    seasonal: p.seasonal,
    stock: p.stock,
  };
}

const listeners = new Set<() => void>();
let status: "idle" | "loading" | "live" | "offline" = "idle";

function notify() {
  listeners.forEach((l) => l());
}

/** Fetch the catalog once per page load; later callers reuse the result. */
export async function loadProducts() {
  if (status === "loading" || status === "live") return;
  status = "loading";
  try {
    const res = await api<{ data: unknown[] }>("/api/products?limit=60", { auth: false });
    const list = res.data.map(fromApi).filter((p): p is Product => p !== null);
    if (list.length) {
      setCurrentProducts(list);
      status = "live";
    } else status = "offline";
  } catch {
    status = "offline";
  }
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Load on first use; after a failure (e.g. the API was asleep) retry on the next page visit.
  if (status === "idle" || status === "offline") void loadProducts();
  return () => listeners.delete(listener);
}

/** The product list for rendering; re-renders when the API answers. */
export function useProducts(): Product[] {
  return useSyncExternalStore(subscribe, currentProducts, () => PRODUCTS);
}
