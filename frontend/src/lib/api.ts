/**
 * Shared fetch() client for the SolCacao REST API (backend/ in this repo).
 * Every feature calls the API through these helpers, so the base URL, the
 * sign-in token and error handling live in one place.
 *
 * Base URL: VITE_API_URL if set at build time, otherwise the local API in
 * development and the hosted Render API in production.
 */
import { readStorage, writeStorage } from "./storage";

const DEFAULT_API_URL = import.meta.env.DEV
  ? "http://localhost:4000"
  : "https://solcacao-api.onrender.com";

export const API_URL = (
  (import.meta.env["VITE_API_URL"] as string | undefined) || DEFAULT_API_URL
).replace(/\/+$/, "");

/** An HTTP error from the API, or status 0 when the server could not be reached. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const TOKEN_KEY = "solcacao.token";

/** The JWT from /api/auth/login or /api/auth/register, kept in localStorage. */
export function getToken(): string | null {
  const t = readStorage(TOKEN_KEY);
  return typeof t === "string" && t ? t : null;
}

export function setToken(token: string | null) {
  writeStorage(TOKEN_KEY, token);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** A plain object is sent as JSON; FormData is sent as multipart (for file uploads). */
  body?: unknown;
  /** Send the signed-in user's token. Defaults to true whenever a token exists. */
  auth?: boolean;
  signal?: AbortSignal;
}

/** Call the API and return the parsed JSON body (undefined for 204 No Content). */
export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = opts.auth === false ? null : getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let body: BodyInit | null = null;
  if (opts.body instanceof FormData) {
    body = opts.body; // the browser sets the multipart boundary header itself
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? (body ? "POST" : "GET"),
      headers,
      body,
      signal: opts.signal ?? null,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "Network error");
  }

  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as {
    error?: string;
    details?: Record<string, string[] | undefined>;
  } | null;
  if (!res.ok) throw new ApiError(res.status, data?.error ?? res.statusText, data?.details);
  return data as T;
}

/** Product images are served by the API under /static; make such paths absolute. */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  return path.startsWith("/static/") ? `${API_URL}${path}` : path;
}
