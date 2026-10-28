import { describe, expect, it } from "vitest";
import { PRODUCTS, filterProducts } from "./products";

describe("catalog filtering", () => {
  it("keeps only bars within the cacao % range", () => {
    const ids = filterProducts(PRODUCTS, { cacaoRange: [80, 100] }).map((p) => p.id);
    expect(ids).toEqual(["sierra-nevada-85", "pure-cacao-100"]);
  });

  it("combines origin and price filters", () => {
    const ids = filterProducts(PRODUCTS, { origins: ["Mexico"], priceRange: [0, 12] }).map(
      (p) => p.id,
    );
    expect(ids).toEqual(["spiced-orange-72"]);
  });

  it("sorts by price ascending", () => {
    const prices = filterProducts(PRODUCTS, { sort: "price-asc" }).map((p) => p.price);
    expect(prices[0]).toBe(7.5);
    expect(prices.at(-1)).toBe(38);
  });
});
