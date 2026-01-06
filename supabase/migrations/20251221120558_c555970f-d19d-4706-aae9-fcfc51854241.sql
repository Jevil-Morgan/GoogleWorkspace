-- Create spotify_tokens table for storing Spotify OAuth tokens
CREATE TABLE public.spotify_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spotify_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies - only the edge function (service role) should access this
-- No user-facing policies needed since access is via service role key
CREATE POLICY "Service role only" ON public.spotify_tokens FOR ALL USING (false);

-- Trigger for updated_at
CREATE TRIGGER update_spotify_tokens_updated_at
BEFORE UPDATE ON public.spotify_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();