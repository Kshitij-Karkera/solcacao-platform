/**
 * Mock authentication for the prototype. Real app: POST /api/auth/login and
 * /api/auth/register returning a JWT. Here the "session" lives in localStorage.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AccountType = "retail" | "b2b";

export interface MockUser {
  name: string;
  email: string;
  type: AccountType;
  /** Role id, e.g. "pastry-chef"; labels live in i18n `auth.roles`. */
  role?: string | undefined;
  company?: string | undefined;
}

export interface QuoteRequest {
  ref: string;
  createdAt: string;
  company: string;
  profile: string;
  packaging: string;
  quantity: number;
  fileName?: string | undefined;
}

interface AuthValue {
  user: MockUser | null;
  signIn: (u: MockUser) => void;
  signOut: () => void;
  dialogOpen: boolean;
  setDialogOpen: (o: boolean) => void;
  quotes: QuoteRequest[];
  addQuote: (q: QuoteRequest) => void;
}

const AuthContext = createContext<AuthValue | null>(null);
const USER_KEY = "solcacao.user";
const QUOTES_KEY = "solcacao.quotes";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    try {
      const u = window.localStorage.getItem(USER_KEY);
      if (u) setUser(JSON.parse(u));
      const q = window.localStorage.getItem(QUOTES_KEY);
      if (q) setQuotes(JSON.parse(q));
    } catch {
      /* ignore */
    }
  }, []);

  const signIn = (u: MockUser) => {
    setUser(u);
    window.localStorage.setItem(USER_KEY, JSON.stringify(u));
  };
  const signOut = () => {
    setUser(null);
    window.localStorage.removeItem(USER_KEY);
  };
  const addQuote = (q: QuoteRequest) => {
    setQuotes((prev) => {
      const next = [q, ...prev];
      window.localStorage.setItem(QUOTES_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, signIn, signOut, dialogOpen, setDialogOpen, quotes, addQuote }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
