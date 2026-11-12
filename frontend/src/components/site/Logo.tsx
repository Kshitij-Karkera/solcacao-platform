// Logo: SolCacao wordmark with a sun icon; always links to the home page.

import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/** Wordmark with a small sun emblem. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("group inline-flex items-center gap-2", className)}>
      {/* Decorative sun: hidden from screen readers since the text names the brand */}
      <svg viewBox="0 0 32 32" className="h-7 w-7 text-gold" aria-hidden>
        {/* Sun core; currentColor picks up text-gold */}
        <circle cx="16" cy="16" r="6" fill="currentColor" />
        {/* 12 rays, each rotated 30 degrees around the centre */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="16"
            y1="3"
            x2="16"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            transform={`rotate(${i * 30} 16 16)`}
          />
        ))}
      </svg>
      {/* Wordmark: 'Sol' upright, 'Cacao' in italic */}
      <span className="font-display text-xl font-semibold tracking-tight">
        Sol<span className="italic font-normal">Cacao</span>
      </span>
    </Link>
  );
}
