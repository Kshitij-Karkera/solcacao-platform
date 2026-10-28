// Contact: customer inquiry page (Student 5). Shows a localized form,
// field-level validation, topic-specific WhatsApp links and contact details.
// This prototype validates locally; sending email requires a backend endpoint.

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { createInquirySchema } from "@/lib/inquiry";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/site/PageHeader";
// Shared localization is owned by Student 2; contact copy lives in t.contact.
import { useI18n } from "@/lib/i18n";
import { ATELIER_ADDRESS, CONTACT_EMAIL, whatsappLink } from "@/lib/site";

// Register /contact with TanStack Router and supply page metadata.
export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact SolCacao — Orders, Wholesale & Samples" },
      {
        name: "description",
        content:
          "Reach the SolCacao team about retail orders, wholesale, B2B samples or support.",
      },
      { property: "og:title", content: "Contact SolCacao" },
      {
        property: "og:description",
        content: "Email or WhatsApp our chocolate team.",
      },
    ],
  }),
  component: Contact,
});

// Stable category IDs are separate from their translated display labels.
type Topic = "retail" | "wholesale" | "sample" | "support";

function Contact() {
  const { t, lang } = useI18n();
  const c = t.contact;
  // Controlled inputs retain the current form values between React renders.
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  // Default to a retail inquiry; the selected topic also changes the WhatsApp text.
  const [topic, setTopic] = useState<Topic>("retail");
  // Validation messages are stored by field so each appears beside its input.
  const [errors, setErrors] = useState<
    Partial<Record<"name" | "email" | "message" | "category", string>>
  >({});

  // Prevent a browser page reload and validate the inquiry before clearing it.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Build the schema with the current language's required-field messages.
    // Trimming rejects whitespace-only names/messages; maximum lengths limit input.
    const schema = createInquirySchema(c.errors);
    const r = schema.safeParse({ ...form, category: topic });
    // safeParse returns validation issues rather than throwing an exception.
    if (!r.success) {
      const errs: Partial<
        Record<"name" | "email" | "message" | "category", string>
      > = {};
      // Map each issue to its field for the inline error display.
      r.error.issues.forEach(
        (i) =>
          (errs[i.path[0] as "name" | "email" | "message" | "category"] =
            i.message),
      );
      setErrors(errs);
      return;
    }
    // Demo only: no fetch/SMTP call occurs here. When adding POST /api/contact,
    // send r.data (name, email, category, message), and clear only after API success.
    // Keep delivery credentials on the server and preserve input on API failure.
    setErrors({});
    setForm({ name: "", email: "", message: "" });
    toast.success(c.sent);
  };

  // Build the message in EN/ES using the translated label of the chosen topic.
  // whatsappLink encodes the text so punctuation cannot break the URL.
  const waMessage =
    lang === "es"
      ? `¡Hola SolCacao! Tengo una consulta sobre: ${c.categories[topic]}`
      : `Hi SolCacao! I have a question about: ${c.categories[topic]}`;

  return (
    <>
      {/* Shared heading keeps this page consistent with the rest of the site. */}
      <PageHeader eyebrow={c.eyebrow} title={c.title} body={c.body} />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_380px]">
        {/* noValidate delegates validation messages to Zod instead of browser popups. */}
        <form
          onSubmit={submit}
          className="space-y-5 rounded-2xl border border-border bg-card p-6 md:p-10"
          noValidate
        >
          {/* Name and email stack on mobile and share a row on wider screens. */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">{c.name}</Label>
              <Input
                id="c-name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "c-name-error" : undefined}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="h-11 bg-background"
              />
              {errors.name && (
                <p
                  id="c-name-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">{c.email}</Label>
              <Input
                id="c-email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "c-email-error" : undefined}
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="h-11 bg-background"
              />
              {errors.email && (
                <p
                  id="c-email-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.email}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            {/* Display translated categories while keeping their stable IDs as values. */}
            <Label htmlFor="c-topic">{c.category}</Label>
            <Select value={topic} onValueChange={(v) => setTopic(v as Topic)}>
              <SelectTrigger
                id="c-topic"
                aria-invalid={Boolean(errors.category)}
                aria-describedby={
                  errors.category ? "c-category-error" : undefined
                }
                className="h-11 bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(c.categories) as Topic[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {c.categories[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p
                id="c-category-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.category}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            {/* Invalid submissions keep the message available for correction. */}
            <Label htmlFor="c-message">{c.message}</Label>
            <Textarea
              id="c-message"
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "c-message-error" : undefined}
              rows={6}
              value={form.message}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
              className="bg-background"
            />
            {errors.message && (
              <p
                id="c-message-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.message}
              </p>
            )}
          </div>
          <Button type="submit" size="lg">
            {c.send}
          </Button>
        </form>

        {/* Alternative contact channel plus business details from lib/site.ts. */}
        <aside className="space-y-6">
          <div className="rounded-2xl bg-cocoa p-8 text-cocoa-foreground">
            <MessageCircle className="h-6 w-6 text-gold" />
            <p className="mt-4 font-display text-2xl">{c.whatsapp}</p>
            <p className="mt-2 text-sm text-cocoa-foreground/75">
              {c.whatsappBody}
            </p>
            <Button variant="whatsapp" className="mt-6 w-full" asChild>
              {/* Opens a prefilled chat; it does not automatically send a message. */}
              <a
                href={whatsappLink(waMessage)}
                target="_blank"
                rel="noreferrer"
              >
                {c.whatsapp}
              </a>
            </Button>
          </div>
          <div className="space-y-4 rounded-2xl border border-border p-8">
            <p className="font-display text-xl">{c.visit}</p>
            <p className="flex items-start gap-3 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {ATELIER_ADDRESS}
            </p>
            <p className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
            </p>
            <p className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> {c.hours}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
