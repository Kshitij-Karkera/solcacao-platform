/**
 * Cart state: useReducer + localStorage, synced with the API for signed-in users.
 *   Guest:   the cart lives in this browser only.
 *   Sign-in: POST /api/cart/merge adds the guest cart to the account's saved cart.
 *   Later:   every change is saved with POST /api/cart/persist (debounced).
 * The server re-prices every item, so the totals shown come from the database.
 */
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { z } from "zod";
import { api, assetUrl } from "./api";
import { useOptionalAuth } from "./auth";
import { readStorage, writeStorage } from "./storage";
import { getProduct, type Localized } from "./products";

export interface CartItem {
  key: string;
  name: Localized;
  detail?: Localized | undefined;
  price: number;
  image: string;
  qty: number;
  /** Sampler boxes only: 6 or 12 pieces (the server prices the box by size). */
  size?: 6 | 12 | undefined;
}

export type CartAction =
  | { type: "ADD"; item: Omit<CartItem, "qty">; qty?: number }
  | { type: "REMOVE"; key: string }
  | { type: "UPDATE"; key: string; qty: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] };

const localizedSchema = z.object({ en: z.string(), es: z.string() });
const cartItemSchema = z.object({
  key: z.string(),
  name: localizedSchema,
  detail: localizedSchema.optional(),
  price: z.number().finite().nonnegative(),
  image: z.string(),
  qty: z.number().int().positive(),
  size: z.union([z.literal(6), z.literal(12)]).optional(),
});

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "ADD": {
      const qty = action.qty ?? 1;
      if (!Number.isSafeInteger(qty) || qty <= 0) return state;
      const existing = state.find((i) => i.key === action.item.key);
      const stock = getProduct(action.item.key)?.stock ?? Number.MAX_SAFE_INTEGER;
      if (stock <= 0) return state;
      if (existing)
        return state.map((i) =>
          i.key === action.item.key ? { ...i, qty: Math.min(stock, i.qty + qty) } : i,
        );
      return [...state, { ...action.item, qty: Math.min(stock, qty) }];
    }
    case "REMOVE":
      return state.filter((i) => i.key !== action.key);
    case "UPDATE":
      if (!Number.isSafeInteger(action.qty)) return state;
      if (action.qty <= 0) return state.filter((i) => i.key !== action.key);
      return state.map((i) =>
        i.key === action.key
          ? { ...i, qty: Math.min(action.qty, getProduct(i.key)?.stock ?? Number.MAX_SAFE_INTEGER) }
          : i,
      );
    case "CLEAR":
      return [];
    case "HYDRATE":
      return z.array(cartItemSchema).safeParse(action.items).success ? action.items : [];
  }
}

interface CartValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (o: boolean) => void;
  dispatch: React.Dispatch<CartAction>;
}

const CartContext = createContext<CartValue | null>(null);
const STORAGE_KEY = "solcacao.cart";
/** Email of the account the stored cart belongs to (absent for a guest cart). */
const OWNER_KEY = "solcacao.cart.owner";

/** The API limits each translated text to 200 characters. */
const clip = (l?: Localized) =>
  l ? { en: l.en.slice(0, 200), es: l.es.slice(0, 200) } : undefined;

/** Cart items as sent to /api/cart/persist and /api/cart/merge (prices are ignored there). */
export function toApiItems(items: CartItem[]) {
  return items.slice(0, 100).map((i) => ({
    key: i.key,
    qty: Math.min(i.qty, 999),
    name: clip(i.name),
    detail: clip(i.detail),
    image: i.image.slice(0, 500),
    ...(i.size ? { size: i.size } : {}),
  }));
}

interface ApiCart {
  items: {
    key: string;
    qty: number;
    price: number;
    name?: Localized;
    detail?: Localized;
    image?: string;
    size?: 6 | 12;
  }[];
}

/** Server cart lines back into UI cart items. */
export function fromApiCart(cart: ApiCart): CartItem[] {
  return cart.items.map((i) => ({
    key: i.key,
    qty: i.qty,
    price: i.price,
    name: i.name ?? { en: i.key, es: i.key },
    ...(i.detail ? { detail: i.detail } : {}),
    image: assetUrl(i.image) || (getProduct(i.key)?.image ?? ""),
    ...(i.size ? { size: i.size } : {}),
  }));
}

const signature = (items: CartItem[]) =>
  JSON.stringify(items.map((i) => [i.key, i.qty, i.size ?? null]));

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const auth = useOptionalAuth();
  const email = auth?.user?.email ?? null;
  /** Account whose server cart is loaded, and the last cart the server confirmed. */
  const syncedFor = useRef<string | null>(null);
  const serverSig = useRef<string | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    const saved = z.array(cartItemSchema).safeParse(readStorage(STORAGE_KEY));
    if (saved.success) dispatch({ type: "HYDRATE", items: saved.data });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(STORAGE_KEY, items);
  }, [items, hydrated]);

  // Sign-in: merge the guest cart into the account (or reload the account's cart).
  // Sign-out: forget the account's cart in this browser.
  useEffect(() => {
    if (!hydrated) return;
    if (!email) {
      if (syncedFor.current || readStorage(OWNER_KEY)) {
        syncedFor.current = null;
        serverSig.current = null;
        writeStorage(OWNER_KEY, null);
        dispatch({ type: "CLEAR" });
      }
      return;
    }
    if (syncedFor.current === email) return;
    const owner = readStorage(OWNER_KEY);
    const local = itemsRef.current;
    // A guest cart is added to the account; a cart already saved for this account is reloaded.
    const request =
      owner === email || local.length === 0
        ? api<ApiCart>("/api/cart")
        : api<ApiCart>("/api/cart/merge", { body: { items: toApiItems(local) } });
    let cancelled = false;
    request
      .then((cart) => {
        if (cancelled) return;
        const next = fromApiCart(cart);
        syncedFor.current = email;
        serverSig.current = signature(next);
        writeStorage(OWNER_KEY, email);
        dispatch({ type: "HYDRATE", items: next });
      })
      .catch(() => {
        // Keep the local cart usable when the API is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, [email, hydrated]);

  // Save changes to the account (debounced so quick +/- clicks send one request).
  useEffect(() => {
    if (!email || syncedFor.current !== email) return;
    const sig = signature(items);
    if (sig === serverSig.current) return;
    const timer = setTimeout(() => {
      api<ApiCart>("/api/cart/persist", { body: { items: toApiItems(items) } })
        .then((cart) => {
          serverSig.current = signature(fromApiCart(cart));
          // Adopt server prices (and drop items the server rejected) if anything differs.
          const next = fromApiCart(cart);
          if (
            signature(next) !== signature(itemsRef.current) ||
            pricesDiffer(next, itemsRef.current)
          )
            dispatch({ type: "HYDRATE", items: next });
        })
        .catch(() => {
          // The local cart is still saved in this browser; the next change retries.
        });
    }, 600);
    return () => clearTimeout(timer);
  }, [items, email]);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, open, setOpen, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

function pricesDiffer(a: CartItem[], b: CartItem[]) {
  return a.some((x) => b.find((y) => y.key === x.key)?.price !== x.price);
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}