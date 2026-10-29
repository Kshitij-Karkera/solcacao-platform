import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { CartProvider, cartReducer, useCart } from "@/lib/cart";
import { DICTS, I18nProvider, useI18n } from "@/lib/i18n";
import { AuthDialog } from "@/components/site/AuthDialog";
import { QuoteWizard, estimateQuote, isValidQuoteFile } from "@/components/site/QuoteWizard";
import { readStorage, writeStorage } from "@/lib/storage";
import { whatsappLink } from "@/lib/site";
import { Route as ContactRoute } from "@/routes/contact";
import { Route as SamplerRoute } from "@/routes/sampler";

const Contact = ContactRoute.options.component!;
const Sampler = SamplerRoute.options.component!;

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const item = { key: "test", name: { en: "Bar", es: "Barra" }, price: 9.5, image: "bar.jpg" };
function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
function Probe() {
  const auth = useAuth();
  const cart = useCart();
  const i18n = useI18n();
  return (
    <>
      <button onClick={() => auth.setDialogOpen(true)}>Open auth</button>
      <button onClick={() => i18n.setLang("es")}>Spanish</button>
      <button
        onClick={() => auth.signIn({ name: "Buyer", email: "other@example.com", type: "b2b" })}
      >
        Other user
      </button>
      <output data-testid="user">{auth.user?.email ?? "guest"}</output>
      <output data-testid="quotes">{auth.quotes.length}</output>
      <output data-testid="cart">
        {cart.count}:{cart.subtotal}
      </output>
      <output data-testid="language">{i18n.lang}</output>
    </>
  );
}

describe("Student 1: demo authentication", () => {
  it("validates retail/B2B registration and stores normalized values without a password", () => {
    render(
      <Providers>
        <Probe />
        <AuthDialog />
      </Providers>,
    );
    fireEvent.click(screen.getByText("Open auth"));
    fireEvent.click(screen.getByText("New here? Create an account"));
    fireEvent.click(screen.getByText("Business partner"));
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByText("Enter your company name")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: " Buyer " } });
    fireEvent.change(screen.getByLabelText("Company name"), { target: { value: " Cocoa Ltd " } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: " BUYER@example.com " } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "demo123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(JSON.parse(localStorage.getItem("solcacao.user")!)).toEqual({
      name: "Buyer",
      company: "Cocoa Ltd",
      email: "buyer@example.com",
      role: "pastry-chef",
      type: "b2b",
    });
    expect(screen.getByTestId("user")).toHaveTextContent("buyer@example.com");
  });
  it("ignores invalid saved profiles and hides another account's local quotes", () => {
    localStorage.setItem("solcacao.user", JSON.stringify({ type: "admin" }));
    localStorage.setItem(
      "solcacao.quotes",
      JSON.stringify([
        {
          ref: "SC-1",
          createdAt: "today",
          company: "A",
          profile: "bold",
          packaging: "tin",
          quantity: 500,
          ownerEmail: "buyer@example.com",
        },
      ]),
    );
    render(
      <Providers>
        <Probe />
      </Providers>,
    );
    expect(screen.getByTestId("user")).toHaveTextContent("guest");
    fireEvent.click(screen.getByText("Other user"));
    expect(screen.getByTestId("quotes")).toHaveTextContent("0");
  });
});

describe("Student 2: localization and storage", () => {
  it("restores Spanish, sets the document language and supports both saved formats", () => {
    localStorage.setItem("solcacao.lang", "es");
    render(
      <Providers>
        <Probe />
      </Providers>,
    );
    expect(screen.getByTestId("language")).toHaveTextContent("es");
    expect(document.documentElement.lang).toBe("es");
  });
  it("keeps English and Spanish dictionary structures aligned", () => {
    const keys = (o: object): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        typeof v === "object" && !Array.isArray(v) ? keys(v).map((sub) => `${k}.${sub}`) : [k],
      );
    expect(keys(DICTS.en)).toEqual(keys(DICTS.es));
    expect(DICTS.en.sampler.name(6)).not.toBe(DICTS.es.sampler.name(6));
  });
  it("continues rendering and changing language when storage is denied", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(readStorage("test")).toBeNull();
    expect(() => writeStorage("test", {})).not.toThrow();
    render(
      <Providers>
        <Probe />
      </Providers>,
    );
    fireEvent.click(screen.getByText("Spanish"));
    expect(screen.getByTestId("language")).toHaveTextContent("es");
  });
});

describe("Student 3: cart", () => {
  it("caps known product quantities at the displayed stock", () => {
    const product = { ...item, key: "sierra-nevada-85" };
    let state = cartReducer([], { type: "ADD", item: product, qty: 100 });
    expect(state[0]?.qty).toBe(42);
    state = cartReducer(state, { type: "ADD", item: product });
    expect(state[0]?.qty).toBe(42);
    expect(cartReducer(state, { type: "UPDATE", key: product.key, qty: 99 })[0]?.qty).toBe(42);
  });
  it("adds, merges, updates, removes and clears items", () => {
    let state = cartReducer([], { type: "ADD", item });
    state = cartReducer(state, { type: "ADD", item, qty: 2 });
    expect(state[0]?.qty).toBe(3);
    state = cartReducer(state, { type: "UPDATE", key: item.key, qty: 5 });
    expect(state[0]?.qty).toBe(5);
    expect(cartReducer(state, { type: "REMOVE", key: item.key })).toEqual([]);
    expect(cartReducer(state, { type: "UPDATE", key: item.key, qty: 0 })).toEqual([]);
    expect(cartReducer(state, { type: "CLEAR" })).toEqual([]);
  });
  it("rejects invalid quantities and structurally corrupt stored carts", () => {
    expect(cartReducer([], { type: "ADD", item, qty: -1 })).toEqual([]);
    expect(cartReducer([], { type: "ADD", item, qty: NaN })).toEqual([]);
    expect(cartReducer([], { type: "HYDRATE", items: {} as never })).toEqual([]);
    localStorage.setItem("solcacao.cart", '{"not":"an array"}');
    render(
      <Providers>
        <Probe />
      </Providers>,
    );
    expect(screen.getByTestId("cart")).toHaveTextContent("0:0");
  });
  it("restores saved quantities without overwriting them during mount", () => {
    localStorage.setItem("solcacao.cart", JSON.stringify([{ ...item, qty: 3 }]));
    render(
      <Providers>
        <Probe />
      </Providers>,
    );
    expect(screen.getByTestId("cart")).toHaveTextContent("3:28.5");
    expect(JSON.parse(localStorage.getItem("solcacao.cart")!)[0].qty).toBe(3);
  });
});

describe("Student 4: quote wizard", () => {
  it("rejects unsupported/oversized files and accepts the stated boundary", () => {
    expect(isValidQuoteFile(new File(["x"], "logo.exe"))).toBe(false);
    expect(isValidQuoteFile(new File(["x"], "logo.SVG"))).toBe(true);
    expect(isValidQuoteFile({ name: "logo.pdf", size: 20 * 1024 * 1024 } as File)).toBe(true);
    expect(isValidQuoteFile({ name: "logo.pdf", size: 20 * 1024 * 1024 + 1 } as File)).toBe(false);
    expect(estimateQuote("giftbox", 1000, 2)).toEqual([4335, 5865]);
  });
  it("requires profile, packaging and a contact name before local submission", () => {
    render(
      <Providers>
        <QuoteWizard />
      </Providers>,
    );
    fireEvent.click(screen.getByText("Continue"));
    expect(screen.getByText("Choose your cacao profile")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Bold dark"));
    fireEvent.click(screen.getByText("Continue"));
    fireEvent.click(screen.getByText("Continue"));
    fireEvent.click(screen.getByText("Continue"));
    expect(screen.getByText("Designate your packaging")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Gift box"));
    fireEvent.click(screen.getByText("Continue"));
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Cocoa Ltd" } });
    fireEvent.change(screen.getByLabelText("Work email"), {
      target: { value: "buyer@example.com" },
    });
    fireEvent.click(screen.getByText("Submit quote request"));
    expect(screen.queryByText("Quote request received")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "Buyer" } });
    fireEvent.click(screen.getByText("Submit quote request"));
    expect(screen.getByText("Quote request received")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("solcacao.quotes")!)[0]).toMatchObject({
      contactName: "Buyer",
      contactEmail: "buyer@example.com",
      ownerEmail: "buyer@example.com",
      quantity: 1000,
    });
  });
});

describe("Student 5: notification bridge", () => {
  it("validates contact fields and clears only a valid demo message", () => {
    render(
      <Providers>
        <Contact />
      </Providers>,
    );
    fireEvent.click(screen.getByText("Send message"));
    expect(screen.getByText("Enter your name")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.getByText("Message must be at least 10 characters")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Tester" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "tester@example.com" } });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Please share your wholesale catalog." },
    });
    fireEvent.click(screen.getByText("Send message"));
    expect(screen.getByLabelText("Message")).toHaveValue("");
    expect(screen.queryByText("Enter your name")).not.toBeInTheDocument();
  });
  it("requires a full sampler, caps its size, and stores both cart translations", () => {
    render(
      <Providers>
        <Sampler />
      </Providers>,
    );
    expect(screen.getByText("Add sampler to cart")).toBeDisabled();
    const flavor = screen.getByRole("button", { name: /Sierra Nevada 85%/ });
    for (let n = 0; n < 6; n++) fireEvent.click(flavor);
    expect(screen.getByText("6 of 6 filled")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Add sampler to cart"));
    const saved = JSON.parse(localStorage.getItem("solcacao.cart")!)[0];
    expect(saved.name).toEqual({
      en: "Custom sampler · 6 pcs",
      es: "Surtido personalizado · 6 pzs",
    });
    expect(saved.price).toBe(16.5);
    expect(screen.getByText("0 of 6 filled")).toBeInTheDocument();
  });
  it("encodes Spanish and special characters without changing the WhatsApp destination", () => {
    const message = "¡Hola! cacao & regalo? #1";
    const url = new URL(whatsappLink(message));
    expect(url.origin).toBe("https://wa.me");
    expect(url.searchParams.get("text")).toBe(message);
  });
});
