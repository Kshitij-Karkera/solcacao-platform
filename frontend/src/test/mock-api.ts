// A small in-memory stand-in for the SolCacao API, used by component tests.
// It follows the same routes, status codes and response shapes as backend/.
import { vi } from "vitest";

interface Call {
    method: string;
    path: string;
    body: unknown;
    auth: string | null;
}

const json = (status: number, data: unknown) =>
    new Response(status === 204 ? null : JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });

export function mockApi() {
    const calls: Call[] = [];
    const users = new Map<string, Record<string, unknown> & { password: string }>();
    let cart: { key: string; qty: number; price: number }[] = [];

    const profile = (u: Record<string, unknown>) => {
        const { password: _password, ...rest } = u;
        return {
            ...rest,
            roles: u["type"] === "b2b" ? ["customer", "partner"] : ["customer"],
        };
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        const headers = (init?.headers ?? {}) as Record<string, string>;
        const body =
            init?.body instanceof FormData
                ? Object.fromEntries(init.body.entries())
                : init?.body
                    ? JSON.parse(String(init.body))
                    : undefined;
        const auth = headers["Authorization"] ?? null;
        calls.push({ method, path: url.pathname, body, auth });
        const who = auth ? users.get(auth.replace("Bearer token-", "")) : undefined;

        switch (`${method} ${url.pathname}`) {
            case "POST /api/auth/register": {
                if (users.has(body.email)) return json(409, { error: "Resource already exists" });
                const u = {
                    name: body.name,
                    email: body.email,
                    type: body.accountType,
                    role: body.role,
                    company: body.company,
                    password: body.password,
                };
                users.set(body.email, u);
                return json(201, { token: `token-${body.email}`, user: profile(u) });
            }
            case "POST /api/auth/login": {
                const u = users.get(body.email);
                if (!u || u.password !== body.password)
                    return json(401, { error: "Invalid email or password" });
                return json(200, { token: `token-${body.email}`, user: profile(u) });
            }
            case "GET /api/auth/me":
                return who ? json(200, { user: profile(who) }) : json(401, { error: "Invalid token" });
            case "GET /api/cart":
                return json(200, { items: cart });
            case "POST /api/cart/merge":
            case "POST /api/cart/persist":
                cart = body.items.map((i: { key: string; qty: number }) => ({ ...i, price: 9.5 }));
                return json(200, { items: cart });
            case "POST /api/b2b/quote":
                if (!who) return json(401, { error: "Missing bearer token" });
                if (who["type"] !== "b2b") return json(403, { error: "Insufficient permissions" });
                return json(201, { ref: "SC-ABC123", status: "received" });
            case "GET /api/b2b/quotes":
                return json(200, { quotes: [] });
            case "POST /api/contact":
                return json(201, { id: 1, received: true });
            default:
                return json(404, { error: `Route ${method} ${url.pathname} not found` });
        }
    });
    vi.stubGlobal("fetch", fetchMock);
    /** Create an existing account; its token is "token-<email>". */
    const seedUser = (u: { name: string; email: string; type: "retail" | "b2b" }) =>
        users.set(u.email, { ...u, password: "secret123" });
    return { calls, fetchMock, seedUser };
}