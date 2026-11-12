import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/products";

export function CartDrawer() {
  const { items, open, setOpen, dispatch, subtotal } = useCart();
  const { t, lang } = useI18n();
  const { user, setDialogOpen } = useAuth();

  const checkout = () => {
    dispatch({ type: "CLEAR" });
    setOpen(false);
    toast.success(t.cart.checkoutDone);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 bg-background p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="font-display text-2xl">{t.cart.title}</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">{t.cart.empty}</p>
            <Button asChild onClick={() => setOpen(false)}>
              <Link to="/catalog">{t.cart.emptyCta}</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-5">
                  <img
                    src={item.image}
                    alt=""
                    className="h-20 w-20 rounded-md object-cover"
                    loading="lazy"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-base leading-tight">{item.name[lang]}</p>
                        {item.detail && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {item.detail[lang]}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => dispatch({ type: "REMOVE", key: item.key })}
                        aria-label={t.cart.remove}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button
                          className="p-1.5"
                          aria-label="-"
                          onClick={() =>
                            dispatch({ type: "UPDATE", key: item.key, qty: item.qty - 1 })
                          }
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                        <button
                          className="p-1.5"
                          aria-label="+"
                          onClick={() =>
                            dispatch({ type: "UPDATE", key: item.key, qty: item.qty + 1 })
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatPrice(item.price * item.qty, lang)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-border bg-card px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t.cart.subtotal}</span>
                <span className="font-display text-xl">{formatPrice(subtotal, lang)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.cart.shipping}</p>
              {!user && (
                <button
                  onClick={() => {
                    setOpen(false);
                    setDialogOpen(true);
                  }}
                  className="w-full rounded-md bg-secondary px-3 py-2 text-left text-xs text-secondary-foreground underline-offset-2 hover:underline"
                >
                  {t.cart.guest}
                </button>
              )}
              <Button className="w-full" size="lg" onClick={checkout}>
                {t.cart.checkout}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
