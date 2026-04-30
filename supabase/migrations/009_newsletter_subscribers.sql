-- 009_newsletter_subscribers.sql
-- Public newsletter signup table. Anon may INSERT only; SELECT/UPDATE/
-- DELETE are blocked for non-service roles. The unique-violation path
-- on email is handled by the API route as a pretend-success to avoid
-- email-enumeration leaks.

CREATE TABLE public.newsletter_subscribers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text UNIQUE NOT NULL,
  source          text NOT NULL DEFAULT 'website',
  subscribed_at   timestamptz NOT NULL DEFAULT now(),
  confirmed       boolean NOT NULL DEFAULT false,
  unsubscribed_at timestamptz,
  user_agent      text,
  CONSTRAINT email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- service_role: full access (default behaviour, but explicit for clarity).
CREATE POLICY newsletter_subscribers_service_role_all
  ON public.newsletter_subscribers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public anon may INSERT only — they post their own email + source.
-- They cannot SELECT (PII), UPDATE, or DELETE.
CREATE POLICY newsletter_subscribers_public_insert
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX idx_newsletter_subscribers_subscribed_at
  ON public.newsletter_subscribers (subscribed_at DESC);
