/**
 * Mock product catalog. In the real app this comes from GET /api/products.
 */
import darkBar from "@/assets/p-dark-bar.jpg";
import milkBar from "@/assets/p-milk-bar.jpg";
import truffles from "@/assets/p-truffles.jpg";
import spicedBar from "@/assets/p-spiced-bar.jpg";
import bonbons from "@/assets/p-bonbons.jpg";
import pureCacao from "@/assets/p-pure-cacao.jpg";

export type Lang = "en" | "es";
export type Localized = Record<Lang, string>;

export type Category = "bars" | "truffles" | "bonbons" | "seasonal";

export interface Product {
  id: string;
  name: Localized;
  description: Localized;
  notes: Localized;
  origin: string;
  cacaoPct: number;
  price: number;
  weight: string;
  category: Category;
  image: string;
  seasonal?: boolean;
  stock: number;
}

export const ORIGINS = [
  "Colombia",
  "Ecuador",
  "Peru",
  "Venezuela",
  "Mexico",
  "Dominican Republic",
] as const;

export const CATEGORIES: Category[] = ["bars", "truffles", "bonbons", "seasonal"];

export const PRODUCTS: Product[] = [
  {
    id: "sierra-nevada-85",
    name: { en: "Sierra Nevada 85%", es: "Sierra Nevada 85%" },
    description: {
      en: "An intense single-origin bar from the slopes of the Sierra Nevada de Santa Marta.",
      es: "Una barra intensa de origen único de las laderas de la Sierra Nevada de Santa Marta.",
    },
    notes: { en: "Black cherry · roasted coffee · cedar", es: "Cereza negra · café tostado · cedro" },
    origin: "Colombia",
    cacaoPct: 85,
    price: 9.5,
    weight: "80 g",
    category: "bars",
    image: darkBar,
    stock: 42,
  },
  {
    id: "esmeraldas-70",
    name: { en: "Esmeraldas 70%", es: "Esmeraldas 70%" },
    description: {
      en: "Fine-flavor Arriba Nacional cacao with a famously floral finish.",
      es: "Cacao fino de aroma Arriba Nacional con un final floral inconfundible.",
    },
    notes: { en: "Jasmine · banana · honey", es: "Jazmín · banano · miel" },
    origin: "Ecuador",
    cacaoPct: 70,
    price: 8.5,
    weight: "80 g",
    category: "bars",
    image: darkBar,
    stock: 60,
  },
  {
    id: "chuao-75",
    name: { en: "Chuao Reserve 75%", es: "Reserva Chuao 75%" },
    description: {
      en: "Rare criollo beans from a village reachable only by sea.",
      es: "Granos criollos raros de un pueblo al que solo se llega por mar.",
    },
    notes: { en: "Red berries · almond · molasses", es: "Frutos rojos · almendra · melaza" },
    origin: "Venezuela",
    cacaoPct: 75,
    price: 14,
    weight: "70 g",
    category: "bars",
    image: pureCacao,
    stock: 12,
  },
  {
    id: "hazelnut-sea-salt-45",
    name: { en: "Hazelnut & Sea Salt 45%", es: "Avellana y Sal Marina 45%" },
    description: {
      en: "Creamy milk chocolate studded with toasted hazelnuts and Pacific sea salt.",
      es: "Chocolate con leche cremoso con avellanas tostadas y sal del Pacífico.",
    },
    notes: { en: "Caramel · toasted nut · salt", es: "Caramelo · nuez tostada · sal" },
    origin: "Ecuador",
    cacaoPct: 45,
    price: 8,
    weight: "90 g",
    category: "bars",
    image: milkBar,
    stock: 80,
  },
  {
    id: "pure-cacao-100",
    name: { en: "Pure Cacao 100%", es: "Cacao Puro 100%" },
    description: {
      en: "Nothing but stone-ground Peruvian cacao. No sugar, no compromise.",
      es: "Solo cacao peruano molido en piedra. Sin azúcar, sin concesiones.",
    },
    notes: { en: "Earth · tobacco · dark plum", es: "Tierra · tabaco · ciruela oscura" },
    origin: "Peru",
    cacaoPct: 100,
    price: 10,
    weight: "75 g",
    category: "bars",
    image: pureCacao,
    stock: 30,
  },
  {
    id: "classic-truffles-9",
    name: { en: "Classic Truffle Collection", es: "Colección de Trufas Clásicas" },
    description: {
      en: "Nine hand-rolled ganache truffles dusted in raw cacao powder.",
      es: "Nueve trufas de ganache enrolladas a mano y espolvoreadas con cacao crudo.",
    },
    notes: { en: "Velvet ganache · cocoa dust", es: "Ganache aterciopelada · polvo de cacao" },
    origin: "Peru",
    cacaoPct: 64,
    price: 24,
    weight: "9 pcs",
    category: "truffles",
    image: truffles,
    stock: 25,
  },
  {
    id: "painted-bonbons-5",
    name: { en: "Hand-Painted Bonbons", es: "Bombones Pintados a Mano" },
    description: {
      en: "Five glossy shells with passion fruit, mezcal, and salted caramel centers.",
      es: "Cinco bombones brillantes rellenos de maracuyá, mezcal y caramelo salado.",
    },
    notes: { en: "Tropical · smoky · buttery", es: "Tropical · ahumado · mantequilla" },
    origin: "Mexico",
    cacaoPct: 66,
    price: 18,
    weight: "5 pcs",
    category: "bonbons",
    image: bonbons,
    stock: 18,
  },
  {
    id: "spiced-orange-72",
    name: { en: "Spiced Orange 72%", es: "Naranja Especiada 72%" },
    description: {
      en: "Our autumn bar: Oaxacan cacao with candied orange, cinnamon and chile.",
      es: "Nuestra barra de otoño: cacao oaxaqueño con naranja confitada, canela y chile.",
    },
    notes: { en: "Citrus · cinnamon · gentle heat", es: "Cítrico · canela · picor suave" },
    origin: "Mexico",
    cacaoPct: 72,
    price: 11,
    weight: "85 g",
    category: "seasonal",
    image: spicedBar,
    seasonal: true,
    stock: 35,
  },
  {
    id: "holiday-truffles-16",
    name: { en: "Holiday Truffle Box", es: "Caja de Trufas Navideñas" },
    description: {
      en: "Sixteen limited-edition truffles: gingerbread, eggnog, and dark cherry.",
      es: "Dieciséis trufas de edición limitada: jengibre, rompope y cereza oscura.",
    },
    notes: { en: "Warm spice · festive", es: "Especias cálidas · festivo" },
    origin: "Colombia",
    cacaoPct: 68,
    price: 38,
    weight: "16 pcs",
    category: "seasonal",
    image: truffles,
    seasonal: true,
    stock: 20,
  },
  {
    id: "hispaniola-62",
    name: { en: "Hispaniola 62%", es: "La Española 62%" },
    description: {
      en: "A gentle, approachable dark from organic Dominican cooperatives.",
      es: "Un oscuro suave y amable de cooperativas orgánicas dominicanas.",
    },
    notes: { en: "Brown sugar · raisin · vanilla", es: "Panela · pasas · vainilla" },
    origin: "Dominican Republic",
    cacaoPct: 62,
    price: 7.5,
    weight: "80 g",
    category: "bars",
    image: darkBar,
    stock: 55,
  },
];

export function getProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "cacao-desc";

export interface ProductFilters {
  search?: string | undefined;
  origins?: string[];
  categories?: Category[];
  cacaoRange?: [number, number];
  priceRange?: [number, number];
  sort?: SortKey;
}

/** Multi-criteria filter, mirrors the server-side query in GET /api/products. */
export function filterProducts(list: Product[], f: ProductFilters): Product[] {
  const q = f.search?.trim().toLowerCase();
  const out = list.filter((p) => {
    if (q && !`${p.name.en} ${p.name.es} ${p.origin}`.toLowerCase().includes(q)) return false;
    if (f.origins?.length && !f.origins.includes(p.origin)) return false;
    if (f.categories?.length && !f.categories.includes(p.category)) return false;
    if (f.cacaoRange && (p.cacaoPct < f.cacaoRange[0] || p.cacaoPct > f.cacaoRange[1]))
      return false;
    if (f.priceRange && (p.price < f.priceRange[0] || p.price > f.priceRange[1])) return false;
    return true;
  });
  switch (f.sort) {
    case "price-asc":
      return [...out].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...out].sort((a, b) => b.price - a.price);
    case "cacao-desc":
      return [...out].sort((a, b) => b.cacaoPct - a.cacaoPct);
    default:
      return out;
  }
}

export function formatPrice(n: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "es" ? "es-MX" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}
