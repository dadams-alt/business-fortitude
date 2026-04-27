// src/components/ui/chip.tsx
// Pill-shaped chip used for category labels, takeaway tags, etc.
// Variants are deliberate; they map to fixed colour pairs from the
// design tokens.

import type { ReactNode } from "react";

export type ChipVariant =
  | "default" // surface bg, ink text
  | "lime"
  | "accent"
  | "ink"
  | "outline";

const VARIANTS: Record<ChipVariant, string> = {
  default: "bg-surface text-ink",
  lime: "bg-lime text-ink",
  accent: "bg-accent text-white",
  ink: "bg-ink text-white",
  outline: "bg-white border border-rule text-ink",
};

export function Chip({
  variant = "default",
  className = "",
  children,
}: {
  variant?: ChipVariant;
  className?: string;
  children: ReactNode;
}) {
  return <span className={`chip ${VARIANTS[variant]} ${className}`}>{children}</span>;
}

// Map BF category slugs → chip variants. Stable choice per category so
// readers can recognise sections at a glance.
export function variantForCategory(category: string): ChipVariant {
  switch (category) {
    case "deals":
      return "accent";
    case "leadership":
      return "ink";
    case "ai":
      return "lime";
    case "regulation":
      return "outline";
    case "opinion":
      return "lime";
    case "markets":
    case "startups":
    default:
      return "default";
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  markets: "Markets",
  deals: "Deals",
  leadership: "Leadership",
  ai: "AI",
  startups: "Startups",
  regulation: "Regulation",
  opinion: "Opinion",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
