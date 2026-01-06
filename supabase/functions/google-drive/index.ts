import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { googleFetch, validateUserId } from "../_shared/google-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

function getMimeTypeLabel(mimeType: string): string {
  const types: Record<string, string> = {
    'application/vnd.google-apps.document': 'document',
    'application/vnd.google-apps.spreadsheet': 'spreadsheet',
    'application/vnd.google-apps.presentation': 'presentation',
    'application/pdf': 'pdf',
  };
  
  for (const [key, label] of Object.entries(types)) {
    if (mimeType.includes(key)) return label;
  }
  if (mimeType.includes('image/')) return 'image';
  return 'file';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Sanitize search query using whitelist approach to prevent injection
function sanitizeSearchQuery(query: string): string {
  // Whitelist: only allow letters, numbers, spaces, hyphens, underscores, periods
  // This prevents any Drive query syntax injection (quotes, backslashes, operators)
  const sanitized = query
    .replace(/[^a-zA-Z0-9\s\-_.]/g, '') // Whitelist safe characters only
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
    .substring(0, 100); // Limit length
  
  // Log rejected queries for monitoring (only if significantly different)
  if (query.length > 0 && sanitized.length === 0) {
    console.warn('Drive search query fully sanitized (possible attack):', query.substring(0, 50));
  }
  
  return sanitized;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const userId = req.headers.get('x-user-id');
  if (!userId || !validateUserId(userId)) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const rawQuery = url.searchParams.get('query') || '';

  try {
    const sanitizedQuery = sanitizeSearchQuery(rawQuery);
    const searchQuery = sanitizedQuery 
      ? `name contains '${sanitizedQuery}' and trashed=false` 
      : 'trashed=false';

    const response = await googleFetch(
      userId,
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&pageSize=20&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)&orderBy=modifiedTime desc`
    );
    const data = await response.json();

    const files = (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      type: getMimeTypeLabel(file.mimeType),
      modified: file.modifiedTime,
      size: file.size ? formatBytes(parseInt(file.size)) : 'N/A',
      link: file.webViewLink,
    }));

    return new Response(JSON.stringify({ files }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Drive error:', error);
    return new Response(JSON.stringify({ error: 'Failed to search files' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
