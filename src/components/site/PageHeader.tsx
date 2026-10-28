// PageHeader: shared top banner for inner pages (catalog, wholesale, contact...).

import type { ReactNode } from "react";

// eyebrow = small label, title = page heading (the page's single <h1>),
// body = optional intro text, children = optional extra content (buttons, filters)
export function PageHeader({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Decorative golden glow behind the text */}
      <div className="absolute inset-0 bg-sun-glow opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
        <p className="eyebrow text-muted-foreground animate-rise">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl leading-[1.05] md:text-6xl animate-rise">{title}</h1>
        {/* Intro paragraph only renders when body is provided */}
        {body && (
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg animate-rise">
            {body}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
