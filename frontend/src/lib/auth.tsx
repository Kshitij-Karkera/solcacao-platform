/**
 * Authentication against the SolCacao API.
 *   POST /api/auth/register and /api/auth/login return { token, user }.
 *   GET  /api/auth/me refreshes the signed-in user on page load.
 *   GET  /api/b2b/quotes lists a business partner's quote requests.
 * The JWT is kept in localStorage (see lib/api.ts); the password never is.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { z } from "zod";
import { ApiError, api, getToken, setToken } from "./api";
import { readStorage, writeStorage } from "./storage";

export type AccountType = "retail" | "b2b";

export interface User {
  name: string;
  email: string;
  type: AccountType;
  /** Role id, e.g. "pastry-chef"; labels live in i18n `auth.roles`. */
  role?: string | undefined;
  company?: string | undefined;
  /** "customer" for everyone, plus "partner" for approved B2B accounts. */
  roles?: string[] | undefined;
}

/** A quote request as returned by GET /api/b2b/quotes. */
export interface QuoteRequest {
  ref: string;
  createdAt: string;
  company: string;
  profile: string;
  packaging: string;
  quantity: number;
  finishes?: string[] | undefined;
  fileName?: string | null | undefined;
  status?: string | undefined;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  accountType: AccountType;
  role?: string | undefined;
  company?: string | undefined;
  lang?: "en" | "es";
}

interface AuthValue {
  user: User | null;
  /** True once a saved session has been checked with the API (or there was none). */
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  signOut: () => void;
  dialogOpen: boolean;
  setDialogOpen: (o: boolean) => void;
  quotes: QuoteRequest[];
  refreshQuotes: () => Promise<void>;
}

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  type: z.enum(["retail", "b2b"]),
  role: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  company: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  roles: z.array(z.string()).optional(),
});

const AuthContext = createContext<AuthValue | null>(null);
const USER_KEY = "solcacao.user";

/** Keep only the fields the UI needs from the API's user object. */
function toUser(raw: unknown): User | null {
  const parsed = userSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export const isPartner = (u: User | null) => Boolean(u?.roles?.includes("partner"));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const saveSession = useCallback((token: string | null, u: User | null) => {
    setToken(token);
    writeStorage(USER_KEY, u);
    setUser(u);
    if (!u) setQuotes([]);
  }, []);

  // Restore a saved session: show the cached user at once, then confirm with the API.
  useEffect(() => {
    const token = getToken();
    const cached = toUser(readStorage(USER_KEY));
    if (!token || !cached) {
      if (token || cached) saveSession(null, null);
      setReady(true);
      return;
    }
    setUser(cached);
    let cancelled = false;
    api<{ user: unknown }>("/api/auth/me")
      .then(({ user: fresh }) => {
        const u = toUser(fresh);
        if (!cancelled && u) saveSession(token, u);
      })
      .catch((err: unknown) => {
        // An expired or invalid token ends the session; a network error keeps it.
        if (!cancelled && err instanceof ApiError && err.status === 401) saveSession(null, null);
      })
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [saveSession]);

  const finishAuth = (res: { token: string; user: unknown }) => {
    const u = toUser(res.user);
    if (!u) throw new ApiError(500, "Unexpected response");
    saveSession(res.token, u);
    return u;
  };

  const login = async (email: string, password: string) =>
    finishAuth(
      await api<{ token: string; user: unknown }>("/api/auth/login", {
        body: { email, password },
        auth: false,
      }),
    );

  const register = async (input: RegisterInput) =>
    finishAuth(
      await api<{ token: string; user: unknown }>("/api/auth/register", {
        body: input,
        auth: false,
      }),
    );

  const signOut = () => saveSession(null, null);

  const refreshQuotes = useCallback(async () => {
    if (!isPartner(user)) return setQuotes([]);
    try {
      const res = await api<{ quotes: QuoteRequest[] }>("/api/b2b/quotes");
      setQuotes(res.quotes);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) saveSession(null, null);
    }
  }, [user, saveSession]);

  // Load the partner's quote history whenever a business partner signs in.
  useEffect(() => {
    void refreshQuotes();
  }, [refreshQuotes]);

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login,
        register,
        signOut,
        dialogOpen,
        setDialogOpen,
        quotes,
        refreshQuotes,
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

/** For components that also render without AuthProvider (e.g. isolated tests). */
export function useOptionalAuth() {
  return useContext(AuthContext);
}