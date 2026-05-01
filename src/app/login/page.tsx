"use client";

// src/app/login/page.tsx
// Magic-link sign-in. Submits to Supabase Auth's signInWithOtp,
// Supabase emails the link, the user clicks it and lands on
// /auth/callback which exchanges the code for a session.

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type SubmitState = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setErrorMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErrorMsg(error.message);
      setState("error");
    } else {
      setState("sent");
    }
  }

  return (
    <main className="max-w-[440px] mx-auto px-6 py-20">
      <h1 className="display text-[40px] mb-2">Sign in</h1>
      <p className="text-soft text-[14px] mb-8">
        We&rsquo;ll email you a one-click sign-in link. No password.
      </p>
      {state === "sent" ? (
        <div className="bg-surface rounded-2xl p-6">
          <p className="text-[15px] mb-2">
            <strong>Check your email.</strong>
          </p>
          <p className="text-soft text-[13px]">
            A sign-in link has been sent to <strong>{email}</strong>. Click
            the link in your inbox to sign in.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={state === "sending"}
            className="w-full px-4 py-3 rounded-full border border-rule text-[15px] focus:outline-none focus:border-accent disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="btn-primary w-full disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
          {state === "error" && errorMsg && (
            <p className="text-[13px]" style={{ color: "#dc2626" }}>
              {errorMsg}
            </p>
          )}
        </form>
      )}
    </main>
  );
}
