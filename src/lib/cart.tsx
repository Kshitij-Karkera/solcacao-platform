/**
 * Cart state: useReducer + localStorage persistence.
 * In production, signed-in carts are persisted via POST /api/cart/persist.
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
import type { Localized } from "./products";

export interface CartItem {
  key: string;
  name: Localized;
  detail?: Localized;
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

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "ADD": {
      const qty = action.qty ?? 1;
      const existing = state.find((i) => i.key === action.item.key);
      if (existing)
        return state.map((i) => (i.key === action.item.key ? { ...i, qty: i.qty + qty } : i));
      return [...state, { ...action.item, qty }];
    }
    case "REMOVE":
      return state.filter((i) => i.key !== action.key);
    case "UPDATE":
      if (action.qty <= 0) return state.filter((i) => i.key !== action.key);
      return state.map((i) => (i.key === action.key ? { ...i, qty: action.qty } : i));
    case "CLEAR":
      return [];
    case "HYDRATE":
      return action.items;
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
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "HYDRATE", items: JSON.parse(raw) });
    } catch {
      /* ignore corrupt storage */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

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
