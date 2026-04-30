"use client";

// src/components/site/newsletter-card.tsx
// Live newsletter signup. POSTs to /api/subscribe which inserts into
// newsletter_subscribers via the anon-only RLS policy. The 23505
// unique-violation path is handled server-side as a pretend-success
// to prevent email-enumeration.
//
// `source` lets each render site tag its own signups so we can see
// which surface converts (homepage hero, article rail, footer).

import { useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function NewsletterCard({ source = "website" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "submitting") return;
    setState("submitting");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = (await res.json()) as { ok?: boolean };
      setState(data.ok ? "success" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="bg-ink text-white rounded-2xl p-6">
      <div className="kicker mb-2 text-lime">Newsletter</div>
      <div className="display text-[26px] leading-[1.05] mb-3">
        The Morning Brief, in your inbox by 7.
      </div>
      {state === "success" ? (
        <p className="text-[14px] opacity-90">
          Thanks — you&rsquo;re on the list.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex gap-2"
          aria-label="Newsletter signup"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="flex-1 px-3 py-2 rounded-full text-[13px] text-ink bg-white disabled:opacity-60"
            aria-label="Email address"
            disabled={state === "submitting"}
            maxLength={254}
          />
          <button
            type="submit"
            className="bg-lime text-ink px-4 py-2 rounded-full text-[13px] font-bold disabled:opacity-60"
            disabled={state === "submitting"}
          >
            {state === "submitting" ? "…" : "Join"}
          </button>
        </form>
      )}
      {state === "error" && (
        <p className="text-[12px] mt-2 opacity-80">
          Something went wrong. Try again in a moment.
        </p>
      )}
      <div className="text-[11px] mt-3 opacity-70">
        No spam. Unsubscribe anytime (manually for now — automated soon).
      </div>
    </div>
  );
}
