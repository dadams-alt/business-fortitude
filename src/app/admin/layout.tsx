// src/app/admin/layout.tsx
// Admin shell — sidebar nav, user identity, sign-out. The middleware
// has already gated the route, but layout double-checks via
// supabase.auth.getUser() before render so the page itself can
// trust user is authenticated.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Pipeline", href: "/admin/pipeline" },
  { label: "Candidates", href: "/admin/candidates" },
  { label: "Articles", href: "/admin/articles" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex bg-white">
      <aside className="w-60 bg-ink text-white p-6 flex flex-col shrink-0">
        <h1 className="display text-[20px] mb-8">
          BF <span className="text-accent">Admin</span>
        </h1>
        <nav className="flex flex-col gap-3 text-[14px]">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-lime">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto text-[12px] opacity-70">
          <div className="break-all">{user.email}</div>
          <form action="/auth/signout" method="post" className="mt-2">
            <button
              type="submit"
              className="text-[12px] underline opacity-90 hover:opacity-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-10 overflow-x-auto">{children}</main>
    </div>
  );
}
