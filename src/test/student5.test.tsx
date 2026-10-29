// Student 5: validate inquiry boundaries and the complete sampler/cart journey.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createInquirySchema } from "@/lib/inquiry";
import { DICTS, I18nProvider } from "@/lib/i18n";
import { CartProvider } from "@/lib/cart";
import { whatsappLink } from "@/lib/site";
import { Route as ContactRoute } from "@/routes/contact";
import { Route as SamplerRoute } from "@/routes/sampler";

const Contact = ContactRoute.options.component!;
const Sampler = SamplerRoute.options.component!;
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn() }),
}));
beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const valid = {
  name: "Tester",
  email: "tester@example.com",
  category: "support",
  message: "Please share your catalog.",
};
const schema = createInquirySchema(DICTS.en.contact.errors);

describe("Student 5: inquiry validation", () => {
  it("trims valid input and accepts each supported category", () => {
    for (const category of ["retail", "wholesale", "sample", "support"]) {
      expect(schema.parse({ ...valid, category, name: " Tester " }).name).toBe("Tester");
    }
  });
  it("rejects missing/invalid categories and invalid email", () => {
    for (const category of [undefined, "", "admin"])
      expect(schema.safeParse({ ...valid, category }).success).toBe(false);
    expect(schema.safeParse({ ...valid, email: "bad" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, name: "  " }).success).toBe(false);
  });
  it("enforces exact name and message boundaries", () => {
    expect(
      schema.safeParse({
        ...valid,
        name: "n".repeat(100),
        message: "m".repeat(2000),
      }).success,
    ).toBe(true);
    expect(schema.safeParse({ ...valid, name: "n".repeat(101) }).success).toBe(false);
    expect(schema.safeParse({ ...valid, message: "m".repeat(2001) }).success).toBe(false);
    expect(schema.safeParse({ ...valid, message: "m".repeat(9) }).success).toBe(false);
    expect(schema.safeParse({ ...valid, message: "m".repeat(10) }).success).toBe(true);
  });
  it("uses localized category error messages", () => {
    const result = createInquirySchema(DICTS.es.contact.errors).safeParse({
      ...valid,
      category: "bad",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe("Elige un tema válido");
  });
  it("announces contact errors accessibly and clears a valid demo submission", () => {
    render(
      <I18nProvider>
        <Contact />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByText("Send message"));
    expect(screen.getAllByRole("alert")).toHaveLength(3);
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: valid.name },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: valid.email },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: valid.message },
    });
    fireEvent.click(screen.getByText("Send message"));
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });
});

describe("Student 5: sampler and WhatsApp", () => {
  it("limits a full box, truncates twelve to six, and stores both translations", () => {
    render(
      <I18nProvider>
        <CartProvider>
          <Sampler />
        </CartProvider>
      </I18nProvider>,
    );
    expect(screen.getByText("Add sampler to cart")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /12 pieces/ }));
    const flavor = screen.getByRole("button", { name: /Sierra Nevada 85%/ });
    for (let n = 0; n < 13; n++) fireEvent.click(flavor);
    expect(screen.getByText("12 of 12 filled")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /6 pieces/ }));
    expect(screen.getByText("6 of 6 filled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /6 pieces/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByText("Add sampler to cart"));
    const item = JSON.parse(localStorage.getItem("solcacao.cart")!)[0];
    expect(item.name).toEqual({
      en: "Custom sampler · 6 pcs",
      es: "Surtido personalizado · 6 pzs",
    });
    expect(item.price).toBe(16.5);
    expect(screen.getByText("0 of 6 filled")).toBeInTheDocument();
  });
  it("encodes special characters without sending a WhatsApp message", () => {
    const message = "¡Hola! cacao & regalo? #1";
    const url = new URL(whatsappLink(message));
    expect(url.origin).toBe("https://wa.me");
    expect(url.searchParams.get("text")).toBe(message);
  });
});
