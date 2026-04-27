// supabase/functions/_shared/auth.ts
// Service-role JWT bearer check shared by every pipeline edge function.
// We don't verify the JWT signature here — Supabase's platform-level
// verify_jwt has already validated it before our handler runs. We only
// inspect the payload to confirm role=service_role.

export function isServiceRoleBearer(header: string | null): boolean {
  if (!header) return false;
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  const token = m[1].trim();
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(b64urlDecode(parts[1]));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

export function b64urlDecode(s: string): string {
  const pad = s.length % 4;
  const padded = pad ? s + '='.repeat(4 - pad) : s;
  const b64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  // Deno has atob globally.
  return new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
}
