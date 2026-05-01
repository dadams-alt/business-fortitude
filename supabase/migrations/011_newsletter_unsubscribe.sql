-- 011_newsletter_unsubscribe.sql
-- Adds unsubscribe_token to newsletter_subscribers. The token is
-- generated server-side (48 hex chars / 24 random bytes) so a
-- subscriber can unsubscribe via a signed URL without authenticating.
-- The /api/unsubscribe handler stamps unsubscribed_at when the token
-- matches and the row is still active.

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN unsubscribe_token text UNIQUE;

-- Backfill tokens for any rows already present (none in prod, but
-- safe + idempotent).
UPDATE public.newsletter_subscribers
   SET unsubscribe_token = encode(extensions.gen_random_bytes(24), 'hex')
 WHERE unsubscribe_token IS NULL;

-- Make NOT NULL with a default so future inserts get a token
-- automatically.
ALTER TABLE public.newsletter_subscribers
  ALTER COLUMN unsubscribe_token SET NOT NULL,
  ALTER COLUMN unsubscribe_token SET DEFAULT encode(extensions.gen_random_bytes(24), 'hex');

CREATE INDEX idx_newsletter_unsubscribe_token
  ON public.newsletter_subscribers (unsubscribe_token);
