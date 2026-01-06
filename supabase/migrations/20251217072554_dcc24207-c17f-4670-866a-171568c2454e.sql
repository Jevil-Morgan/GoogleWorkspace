-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage tokens" ON public.oauth_tokens;

-- Create restrictive policy - no public access, only service role can access
-- Service role bypasses RLS by default, so we just need to block all public access
CREATE POLICY "No public access to tokens" 
ON public.oauth_tokens 
FOR ALL 
USING (false)
WITH CHECK (false);