// SiteHeader: sticky top navigation (Student 2). Contains the logo, page links,
// search dialog, language toggle, account button, cart button with item count,
// and a slide-out menu for mobile.

import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
// Cart and auth contexts come from other students
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";
import { LanguageToggle } from "./LanguageToggle";

export function SiteHeader() {
  const { t } = useI18n();
  // Number of items in the cart, and a function to open the cart drawer
  const { count, setOpen: setCartOpen } = useCart();
  // Logged-in user (or null), and a function to open the sign-in dialog
  const { user, setDialogOpen } = useAuth();
  const navigate = useNavigate();
  // Open/closed state for the mobile menu, search dialog and search text
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Main navigation, built once and reused by desktop and mobile menus.
  // 'as const' keeps the exact route paths so <Link to> is type-checked.
  const links = [
    { to: "/catalog", label: t.nav.shop },
    { to: "/wholesale", label: t.nav.wholesale },
    { to: "/sampler", label: t.nav.sampler },
    { to: "/contact", label: t.nav.contact },
  ] as const;

  // Close the dialog and go to the catalog with the search text as ?q=...
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate({ to: "/catalog", search: { q: query || undefined } });
  };

  // Signed in: icon links to /account. Signed out: icon opens the sign-in dialog.
  const accountButton = user ? (
    <Button variant="ghost" size="icon" asChild aria-label={t.nav.account}>
      <Link to="/account">
        <User />
      </Link>
    </Button>
  ) : (
    <Button variant="ghost" size="icon" aria-label={t.nav.signIn} onClick={() => setDialogOpen(true)}>
      <User />
    </Button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      {/* sticky + backdrop-blur keep the bar visible and readable while scrolling */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={t.nav.menu}
          onClick={() => setMenuOpen(true)}
        >
          <Menu />
        </Button>
        <Logo />
        {/* Desktop links (hidden below the lg breakpoint) */}
        <nav className="ml-8 hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              // Highlights the link for the page you are on
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {/* Right-hand actions: search, language, account, cart */}
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label={t.nav.search} onClick={() => setSearchOpen(true)}>
            <Search />
          </Button>
          <LanguageToggle className="mx-1 hidden sm:inline-flex" />
          {accountButton}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={t.cart.title}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag />
            {/* Badge only appears when the cart has items */}
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                {count}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile slide-out menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="flex flex-col gap-8 bg-background">
          <SheetTitle className="sr-only">{t.nav.menu}</SheetTitle>
          <Logo />
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                // Close the menu after choosing a page
                onClick={() => setMenuOpen(false)}
                className="border-b border-border py-3 font-display text-2xl"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <LanguageToggle className="self-start" />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="top-[20%] translate-y-0 bg-card">
          <DialogTitle className="font-display text-2xl">{t.nav.search}</DialogTitle>
          <form onSubmit={submitSearch} className="flex gap-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.nav.searchPlaceholder}
              className="h-11"
            />
            <Button type="submit" size="icon" className="h-11 w-11" aria-label={t.nav.search}>
              <Search />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
