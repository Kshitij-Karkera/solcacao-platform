import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Check, BadgeCheck, ShoppingBag, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/PageHeader";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your Account — SolCacao" },
      { name: "description", content: "Manage your SolCacao profile, orders and B2B quote requests." },
      { property: "og:title", content: "Your SolCacao Account" },
      { property: "og:description", content: "Profile, orders and quote requests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Account,
});

function Account() {
  const { t, lang } = useI18n();
  const { user, signOut, setDialogOpen, quotes } = useAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-32 text-center">
        <UserRound aria-hidden="true" className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-3xl">{t.account.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.account.signedOut}</p>
        <Button className="mt-6" onClick={() => setDialogOpen(true)}>
          {t.nav.signIn}
        </Button>
      </div>
    );
  }

  const isB2B = user.type === "b2b";
  const w = t.wholesale;
  const roles = t.auth.roles[user.type];
  const roleLabel = roles.find((r) => r.id === user.role)?.label;
  const TypeIcon = isB2B ? Briefcase : ShoppingBag;

  return (
    <>
      <PageHeader eyebrow={t.account.title} title={t.auth.welcome(user.name)}>
        <div className="mt-6 flex flex-wrap items-center gap-2 animate-rise">
          {roleLabel && (
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              <BadgeCheck className="h-4 w-4" />
              {roleLabel}
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold">
            <TypeIcon className="h-4 w-4" />
            {isB2B ? t.account.accessB2B : t.account.accessD2C}
          </span>
        </div>
      </PageHeader>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <p className="eyebrow text-muted-foreground">{t.account.profile}</p>
          <p className="mt-4 font-display text-2xl">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {user.company && <p className="mt-1 text-sm font-semibold">{user.company}</p>}

          <dl className="mt-6 space-y-4 border-t border-border pt-6 text-sm">
            <div>
              <dt className="eyebrow text-muted-foreground">{t.account.role}</dt>
              <dd className="mt-1 font-semibold">{roleLabel ?? "—"}</dd>
            </div>
            <div>
              <dt className="eyebrow text-muted-foreground">{t.account.access}</dt>
              <dd className="mt-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold">
                  <TypeIcon aria-hidden="true" className="h-3.5 w-3.5" />
                  {isB2B ? t.account.accessB2B : t.account.accessD2C}
                </span>
                <ul className="mt-3 space-y-1.5">
                  {(isB2B ? t.account.accessB2BItems : t.account.accessD2CItems).map((item) => (
                    <li key={item} className="flex items-center gap-2 text-muted-foreground">
                      <Check aria-hidden="true" className="h-3.5 w-3.5 text-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>

          <Button variant="outline" className="mt-8 w-full" onClick={signOut}>
            {t.auth.signOut}
          </Button>
        </aside>

        <div className="space-y-8">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-2xl">{t.account.orders}</h2>
            <p className="mt-4 text-sm text-muted-foreground">{t.account.noOrders}</p>
            <Button variant="link" className="px-0" asChild>
              <Link to="/catalog">{t.cart.emptyCta}</Link>
            </Button>
          </section>

          {isB2B && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-2xl">{t.account.quotes}</h2>
              {quotes.length === 0 ? (
                <>
                  <p className="mt-4 text-sm text-muted-foreground">{t.account.noQuotes}</p>
                  <Button variant="link" className="px-0" asChild>
                    <Link to="/wholesale">{w.cta}</Link>
                  </Button>
                </>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {quotes.map((q) => (
                    <li key={q.ref} className="flex flex-wrap items-center justify-between gap-2 py-4">
                      <div>
                        <p className="font-semibold">{q.ref} · {q.company}</p>
                        <p className="text-sm text-muted-foreground">
                          {w.profiles.find((p) => p.id === q.profile)?.name} ·{" "}
                          {w.packagingTypes.find((p) => p.id === q.packaging)?.name} ·{" "}
                          {q.quantity.toLocaleString(lang)} {w.units}
                        </p>
                      </div>
                      <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold">
                        {t.account.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
