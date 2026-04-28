// src/components/article/category-header.tsx
// Header strip for /category/[slug] pages.

export function CategoryHeader({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <div className="border-b border-rule pb-8">
      <p className="kicker text-soft mb-3">Category</p>
      <h1 className="display text-[44px] md:text-[64px] mb-4">{name}</h1>
      <p className="text-[18px] leading-[1.55] text-soft max-w-2xl">
        {description}
      </p>
    </div>
  );
}
