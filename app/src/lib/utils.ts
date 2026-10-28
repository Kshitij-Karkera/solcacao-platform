// Shared helpers.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// cn(): combine class names. clsx handles conditionals; twMerge removes
// conflicting Tailwind classes so the last one wins (e.g. 'p-2 p-4' -> 'p-4').
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
