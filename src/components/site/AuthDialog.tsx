import { useState } from "react";
import { Briefcase, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type AccountType } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AuthDialog() {
  const { dialogOpen, setDialogOpen, signIn } = useAuth();
  const { count } = useCart();
  const { t } = useI18n();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [type, setTypeState] = useState<AccountType>("retail");
  const [role, setRole] = useState<string>(t.auth.roles.retail[0]!.id);
  const [form, setForm] = useState({ name: "", company: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setType = (next: AccountType) => {
    setTypeState(next);
    setRole(t.auth.roles[next][0]!.id);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      email: z.string().trim().email(t.auth.errors.email),
      password: z.string().min(6, t.auth.errors.password),
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
    const name = data.name.trim() || (data.email.split("@")[0] ?? data.email);
    signIn({
      name,
      email: data.email.toLowerCase(),
      type,
      role,
      company: type === "b2b" ? data.company.trim() || undefined : undefined,
    });
    setForm({ name: "", company: "", email: "", password: "" });
    setDialogOpen(false);
    toast.success(t.auth.welcome(name), {
      description: count > 0 ? t.cart.synced : undefined,
    });
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

          {mode === "register" && field("name", t.auth.name)}
          {mode === "register" && type === "b2b" && field("company", t.auth.company)}
          {field("email", t.auth.email, "email")}
          {field("password", t.auth.password, "password")}

          <Button type="submit" size="lg" className="w-full">
            {mode === "signin" ? t.auth.submitSignIn : t.auth.submitRegister}
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
