import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('Client_id')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('Client_Secret')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Generate a cryptographically secure session token
function generateSecureSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return 'session_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    if (path === 'url') {
      // Parse request body to get origin
      let origin = 'https://alahnoarwhjczamkuexk.lovableproject.com';
      try {
        const body = await req.json();
        if (body.origin) {
          origin = body.origin;
        }
      } catch (e) {
        // No body or invalid JSON, use default
      }
      
      const redirectUri = `https://alahnoarwhjczamkuexk.supabase.co/functions/v1/google-auth/callback`;
      
      const scopes = [
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/calendar',
        // Needed for exporting + copying/deleting temp OCR docs
        'https://www.googleapis.com/auth/drive',
        // Needed to read text content from the OCR-converted Google Doc
        'https://www.googleapis.com/auth/documents.readonly',
        'https://www.googleapis.com/auth/tasks',
      ];

       // Encode origin in state parameter so callback can redirect correctly
       // URL-safe encode since OAuth providers may reject special chars
       const state = encodeURIComponent(btoa(JSON.stringify({ origin })));

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes.join(' '));
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', state);

      return new Response(JSON.stringify({ url: authUrl.toString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === 'callback') {
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      
      // Support both preview and custom domains - check state parameter or use default
      const stateParam = url.searchParams.get('state');
      let frontendUrl = 'https://alahnoarwhjczamkuexk.lovableproject.com';
      
      // If a custom domain is set via env, use it
      const customDomain = Deno.env.get('FRONTEND_URL');
      if (customDomain) {
        frontendUrl = customDomain;
       } else if (stateParam) {
         try {
           const state = JSON.parse(atob(decodeURIComponent(stateParam)));
           if (state.origin) {
             frontendUrl = state.origin;
           }
         } catch (e) {
           console.log('Could not parse state, using default frontend URL');
         }
       }
      
      console.log('Redirecting to:', frontendUrl);

      if (error) {
        return Response.redirect(`${frontendUrl}?auth=failed`);
      }

      if (!code) {
        return Response.redirect(`${frontendUrl}?auth=failed`);
      }

      const redirectUri = `https://alahnoarwhjczamkuexk.supabase.co/functions/v1/google-auth/callback`;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        console.error('Token exchange failed');
        return Response.redirect(`${frontendUrl}?auth=failed`);
      }

      // Generate a cryptographically secure session ID
      const sessionId = generateSecureSessionId();

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const { error: dbError } = await supabase
        .from('oauth_tokens')
        .upsert({
          user_id: sessionId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: Date.now() + (tokens.expires_in * 1000),
        });

      if (dbError) {
        console.error('Database storage failed');
        return Response.redirect(`${frontendUrl}?auth=failed`);
      }

      return Response.redirect(`${frontendUrl}?userId=${sessionId}&auth=success`);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
