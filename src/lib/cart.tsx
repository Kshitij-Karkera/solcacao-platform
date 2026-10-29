/**
 * Cart state: useReducer + localStorage persistence.
 * In production, signed-in carts are persisted via POST /api/cart/persist.
 */
import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from "react";
import { z } from "zod";
import { readStorage, writeStorage } from "./storage";
import { getProduct, type Localized } from "./products";

export interface CartItem {
  key: string;
  name: Localized;
  detail?: Localized | undefined;
  price: number;
  image: string;
  qty: number;
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = z.array(cartItemSchema).safeParse(readStorage(STORAGE_KEY));
    if (saved.success) dispatch({ type: "HYDRATE", items: saved.data });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(STORAGE_KEY, items);
  }, [items, hydrated]);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, open, setOpen, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
