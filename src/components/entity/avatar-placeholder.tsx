// src/components/entity/avatar-placeholder.tsx
// Initials-in-circle fallback when companies.logo_url or
// executives.photo_url is NULL. Colour is derived deterministically
// from the slug so the same entity always gets the same avatar.

const PALETTE: readonly string[] = [
  "bg-accent text-white",
  "bg-ink text-white",
  "bg-lime text-ink",
  "bg-surface text-ink",
  "bg-[#059669] text-white",
  "bg-[#dc2626] text-white",
];

function hashToIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => (p[0] ? p[0].toUpperCase() : ""))
    .join("");
}

export function AvatarPlaceholder({
  name,
  slug,
  size = 80,
}: {
  name: string;
  slug: string;
  size?: number;
}) {
  const initials = initialsFromName(name) || "?";
  const colourClass = PALETTE[hashToIndex(slug, PALETTE.length)];
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold ${colourClass}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
