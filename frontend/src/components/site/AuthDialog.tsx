import { useState } from "react";
import { Briefcase, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { useAuth, type AccountType } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AuthDialog() {
  const { dialogOpen, setDialogOpen, login, register } = useAuth();
  const { count } = useCart();
  const { t, lang } = useI18n();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [type, setTypeState] = useState<AccountType>("retail");
  const [role, setRole] = useState<string>(t.auth.roles.retail[0]!.id);
  const [form, setForm] = useState({ name: "", company: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const setType = (next: AccountType) => {
    setTypeState(next);
    setRole(t.auth.roles[next][0]!.id);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const schema = z.object({
      email: z.string().trim().email(t.auth.errors.email),
      // The API requires at least 8 characters for new passwords.
      password:
        mode === "register"
          ? z.string().min(8, t.auth.errors.password).max(128)
          : z.string().min(1, t.auth.errors.password),
      name: mode === "register" ? z.string().trim().min(1, t.auth.errors.name) : z.string(),
      company:
        mode === "register" && type === "b2b"
          ? z.string().trim().min(1, t.auth.errors.company)
          : z.string(),
    });
    const result = schema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    const data = result.data;
    const email = data.email.trim().toLowerCase();
    setBusy(true);
    try {
      const user =
        mode === "register"
          ? await register({
            name: data.name.trim(),
            email,
            password: data.password,
            accountType: type,
            role,
            company: type === "b2b" ? data.company.trim() : undefined,
            lang,
          })
          : await login(email, data.password);
      setForm({ name: "", company: "", email: "", password: "" });
      setDialogOpen(false);
      toast.success(t.auth.welcome(user.name), {
        description: count > 0 ? t.cart.synced : undefined,
      });
    } catch (err) {
      setErrors({ form: authErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  /** Turn an API failure into a message the user can act on. */
  const authErrorMessage = (err: unknown) => {
    if (!(err instanceof ApiError) || err.status === 0) return t.common.offline;
    if (err.status === 401) return t.auth.errors.badLogin;
    if (err.status === 409) return t.auth.errors.exists;
    if (err.status === 429) return t.auth.errors.tooMany;
    if (err.status === 400 && err.details?.["password"]) return t.auth.errors.password;
    if (err.status === 400 && err.details?.["email"]) return t.auth.errors.email;
    if (err.status === 400 && err.details?.["company"]) return t.auth.errors.company;
    return t.common.offline;
  };

  const field = (k: keyof typeof form, label: string, inputType = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`auth-${k}`}>{label}</Label>
      <Input id={`auth-${k}`} type={inputType} value={form[k]} onChange={set(k)} className="h-11" />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-md bg-card">
        <DialogTitle className="font-display text-3xl">
          {mode === "signin" ? t.auth.signInTitle : t.auth.registerTitle}
        </DialogTitle>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="text-sm text-muted-foreground">{t.auth.demo}</p>
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label>{t.auth.accountType}</Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: "retail",
                      icon: ShoppingBag,
                      label: t.auth.retail,
                      hint: t.auth.retailHint,
                    },
                    { id: "b2b", icon: Briefcase, label: t.auth.b2b, hint: t.auth.b2bHint },
                  ] as const
                ).map((o) => (
                  <button
                    type="button"
                    key={o.id}
                    onClick={() => setType(o.id)}
                    aria-pressed={type === o.id}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-all",
                      type === o.id
                        ? "border-primary bg-secondary shadow-soft"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <o.icon className="mb-2 h-4 w-4" />
                    <p className="text-sm font-bold">{o.label}</p>
                    <p className="text-xs text-muted-foreground">{o.hint}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-1.5">
              <Label>{t.auth.role}</Label>
              <div className="flex flex-wrap gap-2">
                {t.auth.roles[type].map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    aria-pressed={role === r.id}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                      role === r.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "register" && field("name", t.auth.name)}
          {mode === "register" && type === "b2b" && field("company", t.auth.company)}
          {field("email", t.auth.email, "email")}
          {field("password", t.auth.password, "password")}

          {errors["form"] && (
            <p role="alert" className="text-sm text-destructive">
              {errors["form"]}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy
              ? t.auth.working
              : mode === "signin"
                ? t.auth.submitSignIn
                : t.auth.submitRegister}
          </Button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "register" : "signin");
              setErrors({});
            }}
            className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {mode === "signin" ? t.auth.toRegister : t.auth.toSignIn}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}