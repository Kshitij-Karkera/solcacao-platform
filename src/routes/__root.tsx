/**
 * __root.tsx: the app shell (owned by Student 2).
 * Every page renders inside this file. It sets up the <html> document, the
 * <head> tags, global providers (data, language, auth, cart), the skip link,
 * header, footer, and the 404 and error screens.
 */

// TanStack Query: caching layer for data fetching, shared by all pages
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Router building blocks used by the root route
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

// '?url' makes Vite return the stylesheet's URL so it can be linked in <head>
import appCss from "../styles.css?url";
// Toast pop-up notifications (e.g. 'Subscribed!')
import { Toaster } from "@/components/ui/sonner";
// EN/ES language context (Student 2)
import { I18nProvider, useI18n } from "@/lib/i18n";
// Providers and components owned by other students (Students 1, 3 and 5)
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
// Site-wide layout pieces
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CartDrawer } from "@/components/site/CartDrawer";
import { AuthDialog } from "@/components/site/AuthDialog";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";

// Shown when no route matches the URL (404 page)
function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Shown when a page throws an error while loading or rendering.
// 'reset' clears the error state so the page can try again.
function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  // Router instance, used to re-run the current route's loaders
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              // Reload route data, then clear the error boundary
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          {/* Plain <a> (not <Link>) forces a full page reload back to home */}
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

// The root route. 'WithContext' lets every route read the shared queryClient
// that router.tsx passes in.
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Tags placed in <head> on every page (SEO, fonts, stylesheet, favicon)
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SolCacao — Artisanal Single-Origin Chocolate" },
      {
        name: "description",
        content: "Organic single-origin cacao for your table and your business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    // preconnect speeds up loading the Google Fonts used by the design system
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Manrope:wght@400;500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  // shellComponent = the <html> document, component = visible page layout
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Outer HTML document. HeadContent prints the head() tags above;
// Scripts loads the client-side JavaScript after the page content.
function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Accessibility: hidden 'Skip to main content' link that appears on keyboard
// focus and jumps past the header to <main id="main">.
function SkipLink() {
  const { t } = useI18n();
  return (
    <a
      href="#main"
      className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      {t.nav.skip}
    </a>
  );
}

// Visible layout wrapped around every page
function RootComponent() {
  // Read the queryClient created in router.tsx
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Provider order matters: inner components can use outer contexts */}
      <I18nProvider>
        <AuthProvider>
          <CartProvider>
            {/* Column layout so the footer stays at the bottom on short pages */}
            <div className="flex min-h-dvh flex-col">
              <SkipLink />
              <SiteHeader />
              {/* tabIndex={-1} lets the skip link move keyboard focus into <main> */}
              <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
                {/* Required: nested routes render here. */}
                <Outlet />
              </main>
              <SiteFooter />
            </div>
            {/* Overlays rendered once for the whole app, outside the page column */}
            <CartDrawer />
            <AuthDialog />
            <WhatsAppFab />
            <Toaster position="top-center" />
          </CartProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
