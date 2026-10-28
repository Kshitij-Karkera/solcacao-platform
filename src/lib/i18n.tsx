/**
 * Client-side localization. In production the dictionaries are served by the
 * localization API; here they are bundled so the prototype works offline.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Lang } from "./products";

// English dictionary: the master copy. Its shape defines the Dict type below,
// so every key added here must also be added to the Spanish dictionary.
const en = {
  // Header navigation, search and skip-link text
  nav: {
    shop: "Shop",
    wholesale: "Wholesale",
    sampler: "Build a Sampler",
    contact: "Contact",
    account: "Account",
    signIn: "Sign in",
    search: "Search chocolates",
    searchPlaceholder: "Search by name or origin…",
    skip: "Skip to main content",
    menu: "Menu",
  },
  // Home page: hero slides and sections
  home: {
    slides: [
      {
        eyebrow: "Single-origin · Organic",
        title: "Cacao that tastes of where it grew.",
        body: "Small-batch bars crafted from six Latin American origins, from bean to bar under one sun.",
        cta: "Shop the collection",
      },
      {
        eyebrow: "For hotels, events & brands",
        title: "Your brand, cast in chocolate.",
        body: "Custom molds, luxury packaging and white-label production for partners worldwide.",
        cta: "Explore wholesale",
      },
    ],
    channelsEyebrow: "Two ways to taste SolCacao",
    retailTitle: "For your table",
    retailBody:
      "Single-origin bars, truffle collections and seasonal releases, shipped fresh.",
    retailCta: "Browse the catalog",
    b2bTitle: "For your business",
    b2bBody:
      "Corporate gifting, hotel amenities and private-label confections at scale.",
    b2bCta: "Request a quote",
    seasonalEyebrow: "Limited release",
    seasonalTitle: "This season's harvest",
    viewAll: "View all",
    originsEyebrow: "Our origins",
    originsTitle: "Six countries. One sun.",
    originsBody:
      "We partner directly with organic growers, paying above fair-trade prices and fermenting on site.",
    samplerTitle: "Build your own sampler",
    samplerBody: "Choose 6 or 12 pieces and we'll pack them in a keepsake box.",
    samplerCta: "Start building",
  },
  // Catalog page: filters, sorting, empty states
  catalog: {
    eyebrow: "The collection",
    title: "Gourmet catalog",
    filters: "Filters",
    clear: "Clear all",
    origin: "Origin",
    category: "Category",
    cacao: "Cacao %",
    price: "Price",
    sort: "Sort",
    sortOptions: {
      featured: "Featured",
      "price-asc": "Price: low to high",
      "price-desc": "Price: high to low",
      "cacao-desc": "Cacao: highest first",
    },
    results: (n: number) => `${n} ${n === 1 ? "product" : "products"}`,
    empty: "No chocolates match those filters.",
    categories: {
      bars: "Bars",
      truffles: "Truffles",
      bonbons: "Bonbons",
      seasonal: "Seasonal",
    },
    showResults: "Show results",
  },
  // Product detail page
  product: {
    add: "Add to cart",
    added: "Added to cart",
    origin: "Origin",
    cacao: "Cacao",
    weight: "Weight",
    notes: "Tasting notes",
    inStock: (n: number) => `${n} in stock`,
    back: "Back to catalog",
    related: "You may also like",
    seasonal: "Seasonal",
    notFound: "We couldn't find that chocolate.",
  },
  // Cart drawer
  cart: {
    title: "Your cart",
    empty: "Your cart is empty.",
    emptyCta: "Discover chocolates",
    subtotal: "Subtotal",
    shipping: "Shipping calculated at checkout.",
    checkout: "Checkout",
    guest: "Checking out as guest. Sign in to save your cart.",
    synced: "Cart synced to your account",
    remove: "Remove",
    checkoutDone: "Order placed! (prototype — no payment taken)",
  },
  // Sign-in / sign-up dialog
  auth: {
    signInTitle: "Welcome back",
    registerTitle: "Create your account",
    email: "Email",
    password: "Password",
    name: "Full name",
    company: "Company name",
    accountType: "Account type",
    retail: "Retail",
    retailHint: "Shop for yourself",
    b2b: "Business partner",
    b2bHint: "Wholesale & custom orders",
    role: "I am a…",
    roles: {
      retail: [
        { id: "chocolate-lover", label: "Chocolate lover" },
        { id: "gift-shopper", label: "Gift shopper" },
      ],
      b2b: [
        { id: "pastry-chef", label: "Pastry chef" },
        { id: "chocolatier", label: "Chocolatier" },
        { id: "hotel-restaurant", label: "Hotel / restaurant" },
        { id: "retailer", label: "Retailer / boutique" },
        { id: "event-planner", label: "Event planner" },
        { id: "corporate-gifting", label: "Corporate gifting" },
      ],
    },
    submitSignIn: "Sign in",
    submitRegister: "Create account",
    toRegister: "New here? Create an account",
    toSignIn: "Already have an account? Sign in",
    welcome: (n: string) => `Welcome, ${n}`,
    signOut: "Sign out",
    errors: {
      email: "Enter a valid email",
      password: "At least 6 characters",
      name: "Enter your name",
      company: "Enter your company name",
    },
  },
  // Account page
  account: {
    title: "Your account",
    profile: "Profile",
    type: "Account type",
    orders: "Recent orders",
    noOrders: "No orders yet.",
    quotes: "Quote requests",
    noQuotes: "No quote requests yet.",
    signedOut: "Sign in to see your profile, orders and quotes.",
    status: "Under review",
    role: "Role",
    access: "Access",
    accessD2C: "D2C · Retail shop",
    accessB2B: "B2B · Wholesale & custom orders",
    accessD2CItems: [
      "Shop the full catalog",
      "Build a sampler box",
      "Track your orders",
    ],
    accessB2BItems: [
      "Wholesale pricing",
      "Custom molds & luxury packaging",
      "Request and track quotes",
    ],
  },
  // B2B wholesale page and quote wizard
  wholesale: {
    eyebrow: "SolCacao for business",
    title: "Confections made to your brief.",
    body: "From boutique hotels to global events, we design, mold and package chocolate that carries your name.",
    cta: "Start a custom order",
    services: [
      {
        title: "Custom corporate molds",
        body: "Your logo or emblem cast into single-origin chocolate, from 3D model to finished piece.",
      },
      {
        title: "Luxury packaging design",
        body: "Foil-stamped boxes, embossed sleeves and keepsake tins designed in-house.",
      },
      {
        title: "White-label branding",
        body: "Our recipes, your label. Fully compliant private-label production.",
      },
    ],
    stats: [
      { value: "500", label: "Minimum units" },
      { value: "4–6 wks", label: "Typical lead time" },
      { value: "120+", label: "Hotel partners" },
    ],
    wizardEyebrow: "Custom order wizard",
    wizardTitle: "Request a manufacturing quote",
    steps: ["Cacao profile", "Brand files", "Packaging", "Review & submit"],
    profileTitle: "Choose your cacao profile",
    profiles: [
      {
        id: "bold",
        name: "Bold dark",
        desc: "80–85% · Colombia · roasted, intense",
      },
      {
        id: "floral",
        name: "Floral dark",
        desc: "70% · Ecuador · jasmine, honey",
      },
      {
        id: "fruity",
        name: "Fruity dark",
        desc: "72% · Mexico · citrus, spice",
      },
      {
        id: "creamy",
        name: "Creamy milk",
        desc: "45% · Ecuador · caramel, nut",
      },
    ],
    uploadTitle: "Upload your brand vectors or tech pack",
    uploadHint: "PDF, AI, SVG or EPS · up to 20 MB",
    uploadCta: "Choose file",
    uploadNone: "No file selected",
    uploadSkip: "You can also send files later by email.",
    packagingTitle: "Designate your packaging",
    packagingTypes: [
      { id: "giftbox", name: "Gift box", desc: "Rigid box, foil stamp" },
      { id: "sleeve", name: "Bar sleeve", desc: "Printed wrapper + foil" },
      { id: "pillow", name: "Pillow pack", desc: "Single-piece amenity" },
      { id: "tin", name: "Keepsake tin", desc: "Embossed metal tin" },
    ],
    quantity: "Quantity",
    units: "units",
    finish: "Finishes",
    finishes: ["Gold foil", "Embossing", "Ribbon", "Recycled board"],
    reviewTitle: "Review & contact details",
    company: "Company",
    contactName: "Contact name",
    email: "Work email",
    deadline: "Needed by",
    notes: "Notes for our team",
    estimate: "Estimated range",
    back: "Back",
    next: "Continue",
    submit: "Submit quote request",
    successTitle: "Quote request received",
    successBody: (ref: string) =>
      `Reference ${ref}. Our partnerships team will reply within 2 business days.`,
    newRequest: "Start another request",
    required: "Please complete this step to continue.",
    summaryProfile: "Profile",
    summaryFile: "Brand file",
    summaryPackaging: "Packaging",
  },
  // Sampler builder page
  sampler: {
    eyebrow: "Personalize",
    title: "Build your sampler",
    body: "Pick your box size, then fill each slot with the chocolates you love.",
    size: "Box size",
    pieces: (n: number) => `${n} pieces`,
    choose: "Choose flavors",
    filled: (a: number, b: number) => `${a} of ${b} filled`,
    clear: "Empty box",
    add: "Add sampler to cart",
    full: "Your box is full",
    gift: "Gift message (optional)",
    name: (n: number) => `Custom sampler · ${n} pcs`,
  },
  // Contact page
  contact: {
    eyebrow: "Get in touch",
    title: "We'd love to hear from you",
    body: "Questions about an order, wholesale or a custom sample request? Send us a note.",
    name: "Name",
    email: "Email",
    category: "Topic",
    categories: {
      retail: "Retail order",
      wholesale: "Wholesale inquiry",
      sample: "B2B sample request",
      support: "Support",
    },
    message: "Message",
    send: "Send message",
    sent: "Demo message validated. No message was sent.",
    whatsapp: "Chat on WhatsApp",
    whatsappBody: "Prefer to chat? Our team answers on WhatsApp, Mon–Sat.",
    visit: "Visit the atelier",
    hours: "Mon–Sat · 9:00–18:00",
    errors: {
      name: "Enter your name",
      email: "Enter a valid email",
      message: "Message must be at least 10 characters",
      category: "Choose a valid topic",
      nameLong: "Name must be at most 100 characters",
      emailLong: "Email must be at most 255 characters",
      messageLong: "Message must be at most 2000 characters",
    },
  },
  // Site footer
  footer: {
    tagline: "Organic single-origin cacao, crafted under one sun.",
    shop: "Shop",
    company: "Company",
    newsletter: "Join our tasting notes",
    newsletterCta: "Subscribe",
    subscribed: "Subscribed!",
    rights: "Prototype for demonstration purposes.",
  },
  common: { language: "Language", close: "Close" },
};

// The dictionary type is inferred from 'en', so TypeScript reports any key
// missing from (or misspelled in) the Spanish dictionary.
export type Dict = typeof en;

// Spanish dictionary: must match the English shape exactly
const es: Dict = {
  nav: {
    shop: "Tienda",
    wholesale: "Mayoreo",
    sampler: "Arma tu Surtido",
    contact: "Contacto",
    account: "Cuenta",
    signIn: "Iniciar sesión",
    search: "Buscar chocolates",
    searchPlaceholder: "Busca por nombre u origen…",
    skip: "Saltar al contenido principal",
    menu: "Menú",
  },
  home: {
    slides: [
      {
        eyebrow: "Origen único · Orgánico",
        title: "Cacao que sabe a su tierra.",
        body: "Barras artesanales de seis orígenes latinoamericanos, del grano a la barra bajo un mismo sol.",
        cta: "Ver la colección",
      },
      {
        eyebrow: "Para hoteles, eventos y marcas",
        title: "Tu marca, moldeada en chocolate.",
        body: "Moldes personalizados, empaques de lujo y producción de marca blanca para socios en todo el mundo.",
        cta: "Explorar mayoreo",
      },
    ],
    channelsEyebrow: "Dos formas de disfrutar SolCacao",
    retailTitle: "Para tu mesa",
    retailBody:
      "Barras de origen único, colecciones de trufas y ediciones de temporada, enviadas frescas.",
    retailCta: "Ver el catálogo",
    b2bTitle: "Para tu negocio",
    b2bBody:
      "Regalos corporativos, amenidades de hotel y confitería de marca propia a gran escala.",
    b2bCta: "Solicitar cotización",
    seasonalEyebrow: "Edición limitada",
    seasonalTitle: "La cosecha de esta temporada",
    viewAll: "Ver todo",
    originsEyebrow: "Nuestros orígenes",
    originsTitle: "Seis países. Un sol.",
    originsBody:
      "Trabajamos directamente con productores orgánicos, pagando por encima del comercio justo y fermentando en origen.",
    samplerTitle: "Arma tu propio surtido",
    samplerBody: "Elige 6 o 12 piezas y las empacamos en una caja de recuerdo.",
    samplerCta: "Empezar",
  },
  catalog: {
    eyebrow: "La colección",
    title: "Catálogo gourmet",
    filters: "Filtros",
    clear: "Limpiar todo",
    origin: "Origen",
    category: "Categoría",
    cacao: "% de cacao",
    price: "Precio",
    sort: "Ordenar",
    sortOptions: {
      featured: "Destacados",
      "price-asc": "Precio: menor a mayor",
      "price-desc": "Precio: mayor a menor",
      "cacao-desc": "Cacao: mayor primero",
    },
    results: (n: number) => `${n} ${n === 1 ? "producto" : "productos"}`,
    empty: "Ningún chocolate coincide con esos filtros.",
    categories: {
      bars: "Barras",
      truffles: "Trufas",
      bonbons: "Bombones",
      seasonal: "Temporada",
    },
    showResults: "Ver resultados",
  },
  product: {
    add: "Agregar al carrito",
    added: "Agregado al carrito",
    origin: "Origen",
    cacao: "Cacao",
    weight: "Peso",
    notes: "Notas de cata",
    inStock: (n: number) => `${n} disponibles`,
    back: "Volver al catálogo",
    related: "También te puede gustar",
    seasonal: "Temporada",
    notFound: "No encontramos ese chocolate.",
  },
  cart: {
    title: "Tu carrito",
    empty: "Tu carrito está vacío.",
    emptyCta: "Descubrir chocolates",
    subtotal: "Subtotal",
    shipping: "El envío se calcula al pagar.",
    checkout: "Pagar",
    guest: "Comprando como invitado. Inicia sesión para guardar tu carrito.",
    synced: "Carrito sincronizado con tu cuenta",
    remove: "Quitar",
    checkoutDone: "¡Pedido realizado! (prototipo — sin cobro)",
  },
  auth: {
    signInTitle: "Bienvenido de nuevo",
    registerTitle: "Crea tu cuenta",
    email: "Correo electrónico",
    password: "Contraseña",
    name: "Nombre completo",
    company: "Nombre de la empresa",
    accountType: "Tipo de cuenta",
    retail: "Minorista",
    retailHint: "Compra para ti",
    b2b: "Socio comercial",
    b2bHint: "Mayoreo y pedidos personalizados",
    role: "Soy…",
    roles: {
      retail: [
        { id: "chocolate-lover", label: "Amante del chocolate" },
        { id: "gift-shopper", label: "Comprador de regalos" },
      ],
      b2b: [
        { id: "pastry-chef", label: "Chef pastelero" },
        { id: "chocolatier", label: "Chocolatero" },
        { id: "hotel-restaurant", label: "Hotel / restaurante" },
        { id: "retailer", label: "Tienda / boutique" },
        { id: "event-planner", label: "Organizador de eventos" },
        { id: "corporate-gifting", label: "Regalos corporativos" },
      ],
    },
    submitSignIn: "Iniciar sesión",
    submitRegister: "Crear cuenta",
    toRegister: "¿Eres nuevo? Crea una cuenta",
    toSignIn: "¿Ya tienes cuenta? Inicia sesión",
    welcome: (n: string) => `Bienvenido, ${n}`,
    signOut: "Cerrar sesión",
    errors: {
      email: "Ingresa un correo válido",
      password: "Mínimo 6 caracteres",
      name: "Ingresa tu nombre",
      company: "Ingresa el nombre de tu empresa",
    },
  },
  account: {
    title: "Tu cuenta",
    profile: "Perfil",
    type: "Tipo de cuenta",
    orders: "Pedidos recientes",
    noOrders: "Aún no tienes pedidos.",
    quotes: "Solicitudes de cotización",
    noQuotes: "Aún no hay solicitudes.",
    signedOut: "Inicia sesión para ver tu perfil, pedidos y cotizaciones.",
    status: "En revisión",
    role: "Rol",
    access: "Acceso",
    accessD2C: "D2C · Tienda minorista",
    accessB2B: "B2B · Mayoreo y pedidos personalizados",
    accessD2CItems: [
      "Compra todo el catálogo",
      "Arma una caja de muestras",
      "Sigue tus pedidos",
    ],
    accessB2BItems: [
      "Precios de mayoreo",
      "Moldes personalizados y empaque de lujo",
      "Solicita y sigue cotizaciones",
    ],
  },
  wholesale: {
    eyebrow: "SolCacao para empresas",
    title: "Confitería hecha a tu medida.",
    body: "De hoteles boutique a eventos globales, diseñamos, moldeamos y empacamos chocolate con tu nombre.",
    cta: "Iniciar pedido personalizado",
    services: [
      {
        title: "Moldes corporativos",
        body: "Tu logo o emblema en chocolate de origen único, del modelo 3D a la pieza terminada.",
      },
      {
        title: "Diseño de empaque de lujo",
        body: "Cajas con estampado en oro, fundas grabadas y latas de recuerdo diseñadas en casa.",
      },
      {
        title: "Marca blanca",
        body: "Nuestras recetas, tu etiqueta. Producción de marca propia con todas las normas.",
      },
    ],
    stats: [
      { value: "500", label: "Unidades mínimas" },
      { value: "4–6 sem", label: "Tiempo de entrega" },
      { value: "120+", label: "Hoteles socios" },
    ],
    wizardEyebrow: "Asistente de pedido",
    wizardTitle: "Solicita una cotización de fabricación",
    steps: [
      "Perfil de cacao",
      "Archivos de marca",
      "Empaque",
      "Revisar y enviar",
    ],
    profileTitle: "Elige tu perfil de cacao",
    profiles: [
      {
        id: "bold",
        name: "Oscuro intenso",
        desc: "80–85% · Colombia · tostado, intenso",
      },
      {
        id: "floral",
        name: "Oscuro floral",
        desc: "70% · Ecuador · jazmín, miel",
      },
      {
        id: "fruity",
        name: "Oscuro frutal",
        desc: "72% · México · cítrico, especias",
      },
      {
        id: "creamy",
        name: "Leche cremoso",
        desc: "45% · Ecuador · caramelo, nuez",
      },
    ],
    uploadTitle: "Sube tus vectores de marca o ficha técnica",
    uploadHint: "PDF, AI, SVG o EPS · hasta 20 MB",
    uploadCta: "Elegir archivo",
    uploadNone: "Ningún archivo seleccionado",
    uploadSkip: "También puedes enviar los archivos después por correo.",
    packagingTitle: "Define tu empaque",
    packagingTypes: [
      { id: "giftbox", name: "Caja de regalo", desc: "Caja rígida, estampado" },
      {
        id: "sleeve",
        name: "Funda de barra",
        desc: "Envoltura impresa + foil",
      },
      { id: "pillow", name: "Empaque individual", desc: "Pieza de amenidad" },
      { id: "tin", name: "Lata de recuerdo", desc: "Lata metálica grabada" },
    ],
    quantity: "Cantidad",
    units: "unidades",
    finish: "Acabados",
    finishes: ["Foil dorado", "Grabado", "Listón", "Cartón reciclado"],
    reviewTitle: "Revisión y datos de contacto",
    company: "Empresa",
    contactName: "Nombre de contacto",
    email: "Correo de trabajo",
    deadline: "Fecha requerida",
    notes: "Notas para nuestro equipo",
    estimate: "Rango estimado",
    back: "Atrás",
    next: "Continuar",
    submit: "Enviar solicitud",
    successTitle: "Solicitud recibida",
    successBody: (ref: string) =>
      `Referencia ${ref}. Nuestro equipo responderá en un máximo de 2 días hábiles.`,
    newRequest: "Nueva solicitud",
    required: "Completa este paso para continuar.",
    summaryProfile: "Perfil",
    summaryFile: "Archivo de marca",
    summaryPackaging: "Empaque",
  },
  sampler: {
    eyebrow: "Personaliza",
    title: "Arma tu surtido",
    body: "Elige el tamaño de tu caja y llena cada espacio con tus chocolates favoritos.",
    size: "Tamaño de caja",
    pieces: (n: number) => `${n} piezas`,
    choose: "Elige sabores",
    filled: (a: number, b: number) => `${a} de ${b} llenos`,
    clear: "Vaciar caja",
    add: "Agregar surtido al carrito",
    full: "Tu caja está llena",
    gift: "Mensaje de regalo (opcional)",
    name: (n: number) => `Surtido personalizado · ${n} pzs`,
  },
  contact: {
    eyebrow: "Contáctanos",
    title: "Nos encantaría saber de ti",
    body: "¿Dudas sobre un pedido, mayoreo o una muestra personalizada? Escríbenos.",
    name: "Nombre",
    email: "Correo",
    category: "Tema",
    categories: {
      retail: "Pedido minorista",
      wholesale: "Consulta de mayoreo",
      sample: "Solicitud de muestra B2B",
      support: "Soporte",
    },
    message: "Mensaje",
    send: "Enviar mensaje",
    sent: "Mensaje de prueba validado. No se envió ningún mensaje.",
    whatsapp: "Chatear por WhatsApp",
    whatsappBody:
      "¿Prefieres chatear? Nuestro equipo responde por WhatsApp, lun–sáb.",
    visit: "Visita el taller",
    hours: "Lun–Sáb · 9:00–18:00",
    errors: {
      name: "Ingresa tu nombre",
      email: "Ingresa un correo válido",
      message: "El mensaje debe tener al menos 10 caracteres",
      category: "Elige un tema válido",
      nameLong: "El nombre debe tener como máximo 100 caracteres",
      emailLong: "El correo debe tener como máximo 255 caracteres",
      messageLong: "El mensaje debe tener como máximo 2000 caracteres",
    },
  },
  footer: {
    tagline: "Cacao orgánico de origen único, hecho bajo un mismo sol.",
    shop: "Tienda",
    company: "Empresa",
    newsletter: "Recibe nuestras notas de cata",
    newsletterCta: "Suscribirme",
    subscribed: "¡Suscrito!",
    rights: "Prototipo con fines de demostración.",
  },
  common: { language: "Idioma", close: "Cerrar" },
};

// Lookup table: language code -> dictionary
// Student 5 needs both languages for sampler names saved in the shared cart.
export const DICTS: Record<Lang, Dict> = { en, es };
// localStorage key that remembers the chosen language
const STORAGE_KEY = "solcacao.lang";

// What useI18n() returns
interface I18nValue {
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
}

// null default lets useI18n() detect use outside the provider
const I18nContext = createContext<I18nValue | null>(null);

// Wraps the app (in __root.tsx) and supplies the current language to all components
export function I18nProvider({ children }: { children: ReactNode }) {
  // Always start in English so server and client HTML match
  const [lang, setLangState] = useState<Lang>("en");

  // Read saved preference after hydration to avoid SSR mismatches.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "es") setLangState(saved);
  }, []);

  useEffect(() => {
    // Keep <html lang> in sync for screen readers and SEO
    document.documentElement.lang = lang;
  }, [lang]);

  // Change language and remember the choice
  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <I18nContext.Provider value={{ lang, t: DICTS[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook used by components: const { t, lang, setLang } = useI18n();
// Throws a clear error if used outside I18nProvider.
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
