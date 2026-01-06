-- Enable RLS (safe if already enabled)
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Keep existing restrictive "deny all" policy as a safety net.
-- Add PERMISSIVE policies for authenticated users scoped to their own rows.

DO $$
BEGIN
  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'oauth_tokens'
      AND policyname = 'OAuth tokens: users can read own'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "OAuth tokens: users can read own"
      ON public.oauth_tokens
      AS PERMISSIVE
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid()::text)
    $sql$;
  END IF;

  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'oauth_tokens'
      AND policyname = 'OAuth tokens: users can insert own'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "OAuth tokens: users can insert own"
      ON public.oauth_tokens
      AS PERMISSIVE
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid()::text)
    $sql$;
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'oauth_tokens'
      AND policyname = 'OAuth tokens: users can update own'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "OAuth tokens: users can update own"
      ON public.oauth_tokens
      AS PERMISSIVE
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid()::text)
      WITH CHECK (user_id = auth.uid()::text)
    $sql$;
  END IF;

  -- DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'oauth_tokens'
      AND policyname = 'OAuth tokens: users can delete own'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "OAuth tokens: users can delete own"
      ON public.oauth_tokens
      AS PERMISSIVE
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid()::text)
    $sql$;
  END IF;
END $$;
