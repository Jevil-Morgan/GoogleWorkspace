import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { googleFetch, validateUserId } from "../_shared/google-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function callLovableAI(prompt: string, model: string = 'google/gemini-2.5-flash'): Promise<string> {
  console.log('Calling Lovable AI with model:', model);

  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    throw new Error('AI service not configured');
  }

  // Robust retry with exponential backoff for rate limits
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }

      const errorText = await response.text();
      console.error(`Lovable AI error (attempt ${attempt}):`, response.status, errorText);

      if (response.status === 402) {
        throw new Error('AI credits exhausted');
      }

      if (response.status === 429) {
        if (attempt < maxAttempts) {
          const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
          console.log(`Rate limited, backing off ${backoff}ms...`);
          await sleep(backoff);
          continue;
        }
        throw new Error('AI rate limited - please wait a moment and try again');
      }

      throw new Error('AI service error');
    } catch (err) {
      if (err instanceof Error && (err.message.includes('credits') || err.message.includes('rate limited'))) {
        throw err;
      }
      if (attempt === maxAttempts) throw err;
      await sleep(500 * attempt);
    }
  }

  return '';
}

async function categorizeEmail(subject: string, body: string): Promise<string> {
  try {
    const prompt = `Categorize this email into one of: urgent, action, fyi, later

Subject: ${subject}
Body: ${body.substring(0, 300)}

Respond with ONLY one word: urgent, action, fyi, or later

Rules:
- urgent: Requires immediate attention, deadlines, approvals needed
- action: Requires response or action but not urgent
- fyi: Informational only, no action needed
- later: Low priority, can be reviewed later`;

    const result = await callLovableAI(prompt, 'google/gemini-2.5-flash-lite');
    const category = result.trim().toLowerCase();
    return ['urgent', 'action', 'fyi', 'later'].includes(category) ? category : 'later';
  } catch (error) {
    console.error('Categorization error:', error);
    // Don't propagate rate limit errors for categorization - just default
    return 'later';
  }
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
  const path = url.pathname.split('/').pop();

  try {
    if (req.method === 'GET' && path === 'google-emails') {
      const listResponse = await googleFetch(
        userId,
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=in:inbox'
      );
      const listData = await listResponse.json();

      if (!listData.messages) {
        return new Response(JSON.stringify({ emails: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const emails: any[] = [];

      // Process emails sequentially to avoid rate limit spikes
      for (const message of listData.messages.slice(0, 10)) {
        try {
          const emailResponse = await googleFetch(
            userId,
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`
          );
          const email = await emailResponse.json();

          const headers = email.payload?.headers || [];
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';

          const decodeB64Url = (data: string) => atob(data.replace(/-/g, '+').replace(/_/g, '/'));

          const findPart = (part: any, mimeType: string): any => {
            if (!part) return null;
            if (part.mimeType === mimeType && part.body?.data) return part;
            if (Array.isArray(part.parts)) {
              for (const child of part.parts) {
                const found = findPart(child, mimeType);
                if (found) return found;
              }
            }
            return null;
          };

          let bodyText = '';
          let bodyHtml: string | null = null;

          const textPart = findPart(email.payload, 'text/plain');
          const htmlPart = findPart(email.payload, 'text/html');

          if (textPart?.body?.data) {
            bodyText = decodeB64Url(textPart.body.data);
          }

          if (htmlPart?.body?.data) {
            bodyHtml = decodeB64Url(htmlPart.body.data);
            if (!bodyText) {
              bodyText = bodyHtml
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            }
          }

          if (!bodyText && email.payload?.body?.data) {
            const raw = decodeB64Url(email.payload.body.data);
            if (raw.includes('<html') || raw.includes('<!doctype') || raw.includes('<body')) {
              bodyHtml = raw;
              bodyText = raw
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            } else {
              bodyText = raw;
            }
          }

          // Categorize with graceful fallback
          const category = await categorizeEmail(subject, bodyText);

          emails.push({
            id: email.id,
            threadId: email.threadId,
            from,
            subject,
            snippet: email.snippet,
            body: bodyText.substring(0, 20000),
            bodyText: bodyText.substring(0, 50000),
            bodyHtml: bodyHtml ? bodyHtml.substring(0, 80000) : null,
            date,
            unread: email.labelIds?.includes('UNREAD'),
            hasAttachment: email.payload?.parts?.some((p: any) => p.filename),
            category,
          });
        } catch (emailErr) {
          console.error('Error processing single email:', emailErr);
          // Continue with other emails
        }
      }

      return new Response(JSON.stringify({ emails }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST' && path === 'generate-reply') {
      const { subject, body, from } = await req.json();

      const prompt = `Generate a professional email reply.

Original Email:
From: ${from}
Subject: ${subject}
Body: ${body}

Generate a concise, professional reply that:
1. Acknowledges the main points
2. Provides relevant response
3. Uses appropriate tone
4. Is 3-5 sentences max

Reply:`;

      const reply = await callLovableAI(prompt, 'google/gemini-2.5-flash');

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST' && path === 'extract-actions') {
      const { subject, body } = await req.json();

      const prompt = `Extract action items from this email. Return as JSON array.

Subject: ${subject}
Body: ${body}

Extract clear, specific action items. Format as JSON:
["action 1", "action 2", ...]

If no action items, return empty array [].`;

      const result = await callLovableAI(prompt, 'google/gemini-2.5-flash-lite');
      let actionItems: string[] = [];
      
      try {
        const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
        actionItems = JSON.parse(cleaned);
      } catch (e) {
        actionItems = [];
      }

      return new Response(JSON.stringify({ actionItems }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST' && path === 'send') {
      const { to, subject, body, threadId } = await req.json();

      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\n');

      const encodedMessage = btoa(message)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const sendBody: any = { raw: encodedMessage };
      if (threadId) {
        sendBody.threadId = threadId;
      }

      await googleFetch(
        userId,
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sendBody),
        }
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Email error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to process email request';

    if (msg.includes('Session expired')) {
      return new Response(JSON.stringify({ error: 'Session expired. Please reconnect.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (msg.includes('rate limited')) {
      return new Response(JSON.stringify({ error: msg }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (msg.includes('credits exhausted')) {
      return new Response(JSON.stringify({ error: msg }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
