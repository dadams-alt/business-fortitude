// src/components/entity/alphabetical-list.tsx
// Groups items by first letter, renders A-Z anchor nav + grouped
// sections. Used for /companies and /people indexes.

import Link from "next/link";

export interface AlphabeticalItem {
  id: string;
  name: string;
  slug: string;
  subtitle?: string;
  href: string;
}

export function AlphabeticalList({
  items,
  emptyLabel,
}: {
  items: AlphabeticalItem[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-soft py-12">{emptyLabel}</p>;
  }
  const groups = new Map<string, AlphabeticalItem[]>();
  for (const item of items) {
    const first = item.name[0] ?? "#";
    const letter = first.toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : "#";
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  const letters = [...groups.keys()].sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });

  return (
    <div>
      <nav className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-rule">
        {letters.map((l) => (
          <a key={l} href={`#letter-${l}`} className="chip bg-surface">
            {l}
          </a>
        ))}
      </nav>
      {letters.map((l) => (
        <section key={l} id={`letter-${l}`} className="mb-10 scroll-mt-20">
          <h2 className="display text-[28px] mb-4">{l}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.get(l)!.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block p-4 rounded-xl border border-rule hover:border-accent transition"
                >
                  <div className="font-bold text-[15px]">{item.name}</div>
                  {item.subtitle && (
                    <div className="text-[12px] text-soft mt-1">
                      {item.subtitle}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
