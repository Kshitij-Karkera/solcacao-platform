import { useEffect, useRef, useState } from "react";
import { Check, FileUp, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, api } from "@/lib/api";
import { isPartner, useAuth } from "@/lib/auth";
import { DICTS, useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/products";
import { cn } from "@/lib/utils";

export function isValidQuoteFile(file: File) {
  return /\.(pdf|ai|svg|eps)$/i.test(file.name) && file.size <= 20 * 1024 * 1024;
}

const UNIT_PRICE: Record<string, number> = { giftbox: 4.5, sleeve: 2.2, pillow: 0.9, tin: 6 };

/** Rough per-unit estimate shown in the review step (prototype only). */
export function estimateQuote(packaging: string, quantity: number, finishes: number) {
  const unit = (UNIT_PRICE[packaging] ?? 3) + finishes * 0.3;
  const total = unit * quantity;
  return [Math.round(total * 0.85), Math.round(total * 1.15)] as const;
}

/**
 * Build the multipart body for POST /api/b2b/quote. Finishes are sent by their
 * English names so stored quotes read the same whatever language was used.
 */
export function buildQuoteForm(q: {
  company: string;
  contactName: string;
  contactEmail: string;
  profile: string;
  packaging: string;
  quantity: number;
  finishes: number[];
  deadline: string;
  notes: string;
  file: File | null;
}) {
  const form = new FormData();
  form.append("company", q.company.trim());
  form.append("contactName", q.contactName.trim());
  form.append("contactEmail", q.contactEmail.trim());
  form.append("profile", q.profile);
  form.append("packaging", q.packaging);
  form.append("quantity", String(q.quantity));
  const names = q.finishes
    .map((i) => DICTS.en.wholesale.finishes[i])
    .filter((n): n is string => Boolean(n));
  if (names.length) form.append("finishes", names.join(","));
  if (q.deadline) form.append("deadline", q.deadline);
  if (q.notes.trim()) form.append("notes", q.notes.trim());
  if (q.file) form.append("brandFile", q.file);
  return form;
}

/** 4-step B2B custom order wizard, submitted to POST /api/b2b/quote (multipart). */
export function QuoteWizard() {
  const { t, lang } = useI18n();
  const w = t.wholesale;
  const { user, setDialogOpen, refreshQuotes } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [packaging, setPackaging] = useState<string>("");
  const [quantity, setQuantity] = useState(1000);
  const [finishes, setFinishes] = useState<number[]>([]);
  const [contact, setContact] = useState({
    company: user?.company ?? "",
    name: user?.name ?? "",
    email: user?.email ?? "",
    deadline: "",
    notes: "",
  });
  useEffect(() => {
    if (user)
      setContact((c) => ({
        ...c,
        company: c.company || user.company || "",
        name: c.name || user.name,
        email: c.email || user.email,
      }));
  }, [user]);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const canContinue =
    (step === 0 && profile) ||
    step === 1 ||
    (step === 2 && packaging) ||
    (step === 3 &&
      contact.company.trim() &&
      contact.name.trim() &&
      z.string().email().safeParse(contact.email.trim()).success);

  const next = async () => {
    if (!canContinue) {
      toast.error(w.required);
      return;
    }
    if (step < 3) return setStep(step + 1);
    if (sending) return;
    // Only signed-in business partners may submit (the API checks this too).
    if (!user) {
      toast.error(w.signInRequired);
      setDialogOpen(true);
      return;
    }
    if (!isPartner(user)) {
      toast.error(w.b2bOnly);
      return;
    }
    setSending(true);
    try {
      const res = await api<{ ref: string }>("/api/b2b/quote", {
        body: buildQuoteForm({
          company: contact.company,
          contactName: contact.name,
          contactEmail: contact.email,
          profile,
          packaging,
          quantity,
          finishes,
          deadline: contact.deadline,
          notes: contact.notes,
          file,
        }),
      });
      setSubmitted(res.ref);
      void refreshQuotes();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error(t.common.sessionExpired);
        setDialogOpen(true);
      } else if (err instanceof ApiError && err.status === 403) toast.error(w.b2bOnly);
      else if (err instanceof ApiError && err.status === 0) toast.error(t.common.offline);
      else toast.error(w.submitFailed);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setStep(0);
    setProfile("");
    setFile(null);
    setPackaging("");
    setQuantity(1000);
    setFinishes([]);
    setSubmitted(null);
  };

  const [lo, hi] = estimateQuote(packaging, quantity, finishes.length);
  const profileName = w.profiles.find((p) => p.id === profile)?.name;
  const packagingName = w.packagingTypes.find((p) => p.id === packaging)?.name;

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-soft md:p-16">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-gold-foreground">
          <PartyPopper className="h-6 w-6" />
        </span>
        <h3 className="mt-6 text-3xl">{w.successTitle}</h3>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">{w.successBody(submitted)}</p>
        <Button variant="outline" className="mt-8" onClick={reset}>
          {w.newRequest}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      {/* Horizontal stepper */}
      <ol className="grid grid-cols-4 border-b border-border">
        {w.steps.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label}>
              <button
                type="button"
                aria-label={label}
                aria-current={active ? "step" : undefined}
                disabled={i > step}
                onClick={() => setStep(i)}
                className={cn(
                  "flex w-full flex-col items-center gap-2 px-2 py-5 text-center transition-colors md:flex-row md:justify-center md:gap-3",
                  active && "bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && "border-gold bg-gold text-gold-foreground",
                    !done && !active && "border-border text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-xs font-semibold sm:block md:text-sm",
                    !active && !done && "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="p-6 md:p-10">
        {step === 0 && (
          <StepBody title={w.profileTitle}>
            <div className="grid gap-3 sm:grid-cols-2">
              {w.profiles.map((p) => (
                <OptionCard
                  key={p.id}
                  selected={profile === p.id}
                  onClick={() => setProfile(p.id)}
                  title={p.name}
                  desc={p.desc}
                />
              ))}
            </div>
          </StepBody>
        )}

        {step === 1 && (
          <StepBody title={w.uploadTitle}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-background p-10 text-center transition-colors hover:border-gold"
            >
              <FileUp className="h-8 w-8 text-muted-foreground" />
              <span className="font-semibold">{file ? file.name : w.uploadCta}</span>
              <span className="text-xs text-muted-foreground">{w.uploadHint}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.ai,.svg,.eps"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (!selected) return;
                if (!isValidQuoteFile(selected)) {
                  toast.error(w.invalidFile);
                  e.target.value = "";
                  setFile(null);
                  return;
                }
                setFile(selected);
              }}
            />
            <p className="mt-3 text-sm text-muted-foreground">{w.uploadSkip}</p>
          </StepBody>
        )}

        {step === 2 && (
          <StepBody title={w.packagingTitle}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {w.packagingTypes.map((p) => (
                <OptionCard
                  key={p.id}
                  selected={packaging === p.id}
                  onClick={() => setPackaging(p.id)}
                  title={p.name}
                  desc={p.desc}
                />
              ))}
            </div>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <div className="flex items-baseline justify-between">
                  <Label>{w.quantity}</Label>
                  <span className="font-display text-2xl">
                    {quantity.toLocaleString(lang)} <span className="text-sm">{w.units}</span>
                  </span>
                </div>
                <Slider
                  className="mt-4"
                  aria-label={w.quantity}
                  min={500}
                  max={10000}
                  step={250}
                  value={[quantity]}
                  onValueChange={(v) => setQuantity(v[0] ?? 500)}
                />
              </div>
              <div>
                <Label>{w.finish}</Label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {w.finishes.map((f, i) => (
                    <label key={f} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={finishes.includes(i)}
                        onCheckedChange={() =>
                          setFinishes((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]))
                        }
                      />
                      {f}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </StepBody>
        )}

        {step === 3 && (
          <StepBody title={w.reviewTitle}>
            <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["company", w.company, "text"],
                    ["name", w.contactName, "text"],
                    ["email", w.email, "email"],
                    ["deadline", w.deadline, "date"],
                  ] as const
                ).map(([k, label, type]) => (
                  <div key={k} className="space-y-1.5">
                    <Label htmlFor={`q-${k}`}>{label}</Label>
                    <Input
                      id={`q-${k}`}
                      type={type}
                      value={contact[k]}
                      onChange={(e) => setContact((c) => ({ ...c, [k]: e.target.value }))}
                      className="h-11 bg-background"
                    />
                  </div>
                ))}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="q-notes">{w.notes}</Label>
                  <Textarea
                    id="q-notes"
                    rows={4}
                    value={contact.notes}
                    onChange={(e) => setContact((c) => ({ ...c, notes: e.target.value }))}
                    className="bg-background"
                  />
                </div>
              </div>
              <aside className="rounded-xl bg-cocoa p-6 text-cocoa-foreground">
                <dl className="space-y-4 text-sm">
                  <SummaryRow label={w.summaryProfile} value={profileName} />
                  <SummaryRow label={w.summaryFile} value={file?.name ?? w.uploadNone} />
                  <SummaryRow
                    label={w.summaryPackaging}
                    value={`${packagingName} · ${quantity.toLocaleString(lang)} ${w.units}`}
                  />
                </dl>
                <div className="mt-6 border-t border-cocoa-foreground/15 pt-4">
                  <p className="eyebrow text-gold">{w.estimate}</p>
                  <p className="mt-1 font-display text-2xl">
                    {formatPrice(lo, lang)} – {formatPrice(hi, lang)}
                  </p>
                </div>
              </aside>
            </div>
          </StepBody>
        )}

        <div className="mt-10 flex items-center justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
            {w.back}
          </Button>
          <Button
            size="lg"
            variant={step === 3 ? "gold" : "default"}
            onClick={() => void next()}
            disabled={sending}
          >
            {step === 3 ? (sending ? w.sending : w.submit) : w.next}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepBody({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="animate-rise">
      <h3 className="mb-6 text-2xl md:text-3xl">{title}</h3>
      {children}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "relative rounded-xl border p-5 text-left transition-all",
        selected
          ? "border-primary bg-secondary shadow-soft"
          : "border-border bg-background hover:border-primary/40",
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </span>
      )}
      <p className="font-display text-lg">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string | undefined }) {
  return (
    <div>
      <dt className="eyebrow text-cocoa-foreground/60">{label}</dt>
      <dd className="mt-1 font-semibold">{value ?? "—"}</dd>
    </div>
  );
}