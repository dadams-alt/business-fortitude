"use client";

// src/components/article/progress-bar.tsx
// Scroll progress indicator. Mockup article-01.html L95 + L398–404.
// Lives at the top of the page; width grows as the document scrolls.

import { useEffect, useRef } from "react";

export function ProgressBar() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function update() {
      const el = ref.current;
      if (!el) return;
      const h = document.documentElement;
      const range = h.scrollHeight - h.clientHeight;
      const pct = range > 0 ? (h.scrollTop / range) * 100 : 0;
      el.style.width = pct + "%";
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return <div ref={ref} className="progress" aria-hidden="true" />;
}
