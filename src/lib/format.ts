// src/lib/format.ts
// Tiny formatting helpers used by the article cards + meta.

const PRAVATAR_MIN = 1;
const PRAVATAR_MAX = 70; // i.pravatar.cc serves IDs 1..70

// Stable per-slug avatar id. We don't track real photos in the schema yet,
// so each author's slug deterministically picks an i.pravatar image.
export function avatarUrl(authorSlug: string | null, size = 64): string {
  const slug = authorSlug ?? "anon";
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  const id = ((Math.abs(h) % (PRAVATAR_MAX - PRAVATAR_MIN + 1)) + PRAVATAR_MIN);
  return `https://i.pravatar.cc/${size}?img=${id}`;
}

// "Today, 09:14" / "Yesterday, 18:30" / "21 Apr 2026 · 07:10"
export function formatPublishedAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  });
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) return `Today, ${time}`;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (
    d.getDate() === y.getDate() &&
    d.getMonth() === y.getMonth() &&
    d.getFullYear() === y.getFullYear()
  ) {
    return `Yesterday, ${time}`;
  }
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${date} · ${time}`;
}

// Rough read time — 220 wpm, min 2 minutes, rounded.
export function readMinutes(text: string | null): number {
  if (!text) return 2;
  const words = text.trim().split(/\s+/).length;
  return Math.max(2, Math.round(words / 220));
}
