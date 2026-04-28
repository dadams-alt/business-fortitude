"use client";

// src/components/article/search-form.tsx
// Native form GET to /search?q=... — the page reads searchParams server-side.
// Client component only because we want a controlled input with autoFocus.

import { useState } from "react";

export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  return (
    <form action="/search" method="get" className="flex gap-3 max-w-2xl">
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search articles by title…"
        className="flex-1 px-5 py-3 rounded-full border border-rule bg-white text-[15px] focus:outline-none focus:border-accent"
        autoFocus
      />
      <button type="submit" className="btn-primary text-[14px]">
        Search
      </button>
    </form>
  );
}
