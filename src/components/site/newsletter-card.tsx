// src/components/site/newsletter-card.tsx
// Decorative newsletter signup. No onSubmit, no client interactivity.
// Form submit is suppressed by being a server-rendered <form> with no
// action attribute — the button is type="button" so it doesn't post.

export function NewsletterCard() {
  return (
    <div className="bg-ink text-white rounded-2xl p-6">
      <div className="kicker mb-2 text-lime">Newsletter</div>
      <div className="display text-[26px] leading-[1.05] mb-3">
        The Morning Brief, in your inbox by 7.
      </div>
      <form className="flex gap-2" aria-label="Newsletter signup">
        <input
          type="email"
          placeholder="you@company.com"
          className="flex-1 px-3 py-2 rounded-full text-[13px] text-ink bg-white"
          aria-label="Email address"
        />
        <button
          type="button"
          className="bg-lime text-ink px-4 py-2 rounded-full text-[13px] font-bold"
        >
          Join
        </button>
      </form>
      <div className="text-[11px] mt-3 opacity-70">
        134,000+ operators. No spam.
      </div>
    </div>
  );
}
