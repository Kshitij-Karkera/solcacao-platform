import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/site/PageHeader";
import { ProductCard } from "@/components/site/ProductCard";
import { useI18n } from "@/lib/i18n";
import {
  CATEGORIES,
  ORIGINS,
  PRODUCTS,
  filterProducts,
  formatPrice,
  type Category,
  type SortKey,
} from "@/lib/products";

export const Route = createFileRoute("/catalog")({
  validateSearch: (search: Record<string, unknown>): { q?: string | undefined } => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Chocolate — SolCacao Catalog" },
      {
        name: "description",
        content:
          "Filter single-origin bars, truffles and seasonal chocolates by cacao %, origin and price.",
      },
      { property: "og:title", content: "Shop Chocolate — SolCacao" },
      {
        property: "og:description",
        content:
          "Single-origin bars, truffles and seasonal releases from six Latin American origins.",
      },
    ],
  }),
  component: Catalog,
});

const PRICE_MAX = 40;

function Catalog() {
  const { t, lang } = useI18n();
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [origins, setOrigins] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cacaoRange, setCacaoRange] = useState<[number, number]>([40, 100]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, PRICE_MAX]);
  const [sort, setSort] = useState<SortKey>("featured");
  const [mobileOpen, setMobileOpen] = useState(false);

  const results = useMemo(
    () =>
      filterProducts(PRODUCTS, { search: q, origins, categories, cacaoRange, priceRange, sort }),
    [q, origins, categories, cacaoRange, priceRange, sort],
  );

  const toggle = <T,>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const clear = () => {
    setOrigins([]);
    setCategories([]);
    setCacaoRange([40, 100]);
    setPriceRange([0, PRICE_MAX]);
    navigate({ search: {} });
  };

  const filters = (
    <div className="space-y-8">
      <FilterGroup title={t.catalog.category}>
        {CATEGORIES.map((c) => (
          <label key={c} className="flex cursor-pointer items-center gap-3 text-sm">
            <Checkbox
              checked={categories.includes(c)}
              onCheckedChange={() => setCategories((l) => toggle(l, c))}
            />
            {t.catalog.categories[c]}
          </label>
        ))}
      </FilterGroup>
      <FilterGroup title={t.catalog.cacao}>
        <Slider
          aria-label={t.catalog.cacao}
          min={0}
          max={100}
          step={5}
          value={cacaoRange}
          onValueChange={(v) => setCacaoRange([v[0] ?? 0, v[1] ?? 100])}
          className="mt-2"
        />
        <div className="mt-3 flex justify-between text-xs font-semibold text-muted-foreground">
          <span>{cacaoRange[0]}%</span>
          <span>{cacaoRange[1]}%</span>
        </div>
      </FilterGroup>
      <FilterGroup title={t.catalog.price}>
        <Slider
          aria-label={t.catalog.price}
          min={0}
          max={PRICE_MAX}
          step={1}
          value={priceRange}
          onValueChange={(v) => setPriceRange([v[0] ?? 0, v[1] ?? PRICE_MAX])}
          className="mt-2"
        />
        <div className="mt-3 flex justify-between text-xs font-semibold text-muted-foreground">
          <span>{formatPrice(priceRange[0], lang)}</span>
          <span>{formatPrice(priceRange[1], lang)}</span>
        </div>
      </FilterGroup>
      <FilterGroup title={t.catalog.origin}>
        {ORIGINS.map((o) => (
          <label key={o} className="flex cursor-pointer items-center gap-3 text-sm">
            <Checkbox
              checked={origins.includes(o)}
              onCheckedChange={() => setOrigins((l) => toggle(l, o))}
            />
            {o}
          </label>
        ))}
      </FilterGroup>
      <Button variant="outline" className="w-full" onClick={clear}>
        {t.catalog.clear}
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader eyebrow={t.catalog.eyebrow} title={t.catalog.title} />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{filters}</div>
        </aside>

        <div>
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <Button variant="outline" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <SlidersHorizontal /> {t.catalog.filters}
            </Button>
            <Input
              aria-label={t.nav.search}
              value={q ?? ""}
              onChange={(e) =>
                navigate({ search: { q: e.target.value || undefined }, replace: true })
              }
              placeholder={t.nav.searchPlaceholder}
              className="h-10 max-w-xs bg-card"
            />
            {q && (
              <button
                onClick={() => navigate({ search: {} })}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold"
              >
                “{q}” <X className="h-3 w-3" />
              </button>
            )}
            <span className="text-sm text-muted-foreground">
              {t.catalog.results(results.length)}
            </span>
            <div className="ml-auto w-52">
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="h-10 bg-card" aria-label={t.catalog.sort}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(t.catalog.sortOptions) as SortKey[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {t.catalog.sortOptions[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-16 text-center">
              <p className="text-muted-foreground">{t.catalog.empty}</p>
              <Button variant="link" onClick={clear}>
                {t.catalog.clear}
              </Button>
            </div>
          ) : (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="overflow-y-auto bg-background">
          <SheetTitle className="mb-6 font-display text-2xl">{t.catalog.filters}</SheetTitle>
          {filters}
          <Button className="mt-4 w-full" onClick={() => setMobileOpen(false)}>
            {t.catalog.showResults} ({results.length})
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-4 text-muted-foreground">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
