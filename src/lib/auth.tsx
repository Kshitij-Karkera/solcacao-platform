/**
 * Mock authentication for the prototype. Real app: POST /api/auth/login and
 * /api/auth/register returning a JWT. Here the "session" lives in localStorage.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { z } from "zod";
import { readStorage, writeStorage } from "./storage";

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
  ownerEmail?: string | undefined;
  contactName?: string | undefined;
  contactEmail?: string | undefined;
  deadline?: string | undefined;
  notes?: string | undefined;
  finishes?: number[] | undefined;
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

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  type: z.enum(["retail", "b2b"]),
  role: z.string().optional(),
  company: z.string().optional(),
});
const quoteSchema = z.object({
  ref: z.string(),
  createdAt: z.string(),
  company: z.string(),
  profile: z.string(),
  packaging: z.string(),
  quantity: z.number().int().positive(),
  fileName: z.string().optional(),
  ownerEmail: z.string().email().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  deadline: z.string().optional(),
  notes: z.string().optional(),
  finishes: z.array(z.number()).optional(),
});

const AuthContext = createContext<AuthValue | null>(null);
const USER_KEY = "solcacao.user";
const QUOTES_KEY = "solcacao.quotes";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const u = userSchema.safeParse(readStorage(USER_KEY));
    if (u.success) setUser(u.data);
    const q = z.array(quoteSchema).safeParse(readStorage(QUOTES_KEY));
    if (q.success) setQuotes(q.data);
  }, []);

  const signIn = (u: MockUser) => {
    setUser(u);
    writeStorage(USER_KEY, u);
  };
  const signOut = () => {
    setUser(null);
    writeStorage(USER_KEY, null);
  };
  const addQuote = (q: QuoteRequest) => {
    setQuotes((prev) => {
      const next = [q, ...prev];
      writeStorage(QUOTES_KEY, next);
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        dialogOpen,
        setDialogOpen,
        quotes: quotes.filter((q) => user && q.ownerEmail === user.email.toLowerCase()),
        addQuote,
      }}
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
