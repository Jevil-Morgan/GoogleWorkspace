-- Drop conflicting RESTRICTIVE policies on oauth_tokens
DROP POLICY IF EXISTS "No public access to tokens" ON public.oauth_tokens;
DROP POLICY IF EXISTS "OAuth tokens: users can delete own" ON public.oauth_tokens;
DROP POLICY IF EXISTS "OAuth tokens: users can insert own" ON public.oauth_tokens;
DROP POLICY IF EXISTS "OAuth tokens: users can read own" ON public.oauth_tokens;
DROP POLICY IF EXISTS "OAuth tokens: users can update own" ON public.oauth_tokens;

-- Create a single restrictive policy that blocks all client access
-- Edge functions use service role which bypasses RLS
CREATE POLICY "Service role only" ON public.oauth_tokens
FOR ALL
USING (false)
WITH CHECK (false);