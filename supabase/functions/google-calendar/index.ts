import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { googleFetch, validateUserId } from "../_shared/google-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

function findAvailableSlots(
  busySlots: any[],
  startDate: Date,
  endDate: Date,
  duration: number,
  opts: { startHour: number; endHour: number; tzOffsetMinutes: number }
) {
  const slots: { start: string; end: string }[] = [];

  // We receive tzOffsetMinutes from the client (Date.getTimezoneOffset())
  // which is minutes behind UTC (e.g. PST winter: 480).
  // Convert a UTC date into "local" by subtracting the offset.
  const toLocal = (d: Date) => new Date(d.getTime() - opts.tzOffsetMinutes * 60000);
  const toUtcFromLocal = (local: Date) => new Date(local.getTime() + opts.tzOffsetMinutes * 60000);

  // Start scanning from the next 30-min boundary.
  let cursorUtc = new Date(startDate);
  cursorUtc.setSeconds(0, 0);
  cursorUtc.setMinutes(cursorUtc.getMinutes() - (cursorUtc.getMinutes() % 30));

  while (cursorUtc < endDate && slots.length < 12) {
    const cursorLocal = toLocal(cursorUtc);
    const hour = cursorLocal.getHours();

    // Only suggest slots within requested working hours.
    if (hour >= opts.startHour && hour < opts.endHour) {
      const slotEndUtc = new Date(cursorUtc.getTime() + duration * 60000);

      // Ensure end time also stays within working hours.
      const slotEndLocal = toLocal(slotEndUtc);
      if (slotEndLocal.getHours() <= opts.endHour) {
        const isBusy = busySlots.some((busy) => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          return cursorUtc < busyEnd && slotEndUtc > busyStart;
        });

        if (!isBusy) {
          slots.push({ start: cursorUtc.toISOString(), end: slotEndUtc.toISOString() });
        }
      }
    }

    // Step 30 minutes.
    cursorUtc = new Date(cursorUtc.getTime() + 30 * 60000);
  }

  return slots;
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
    if (req.method === 'GET' && path === 'events') {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const response = await googleFetch(
        userId,
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${endDate.toISOString()}&maxResults=20&singleEvents=true&orderBy=startTime`
      );
      const data = await response.json();

      const events = (data.items || []).map((event: any) => ({
        id: event.id,
        title: event.summary,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        attendees: event.attendees?.length || 0,
        description: event.description,
      }));

      return new Response(JSON.stringify({ events }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST' && path === 'find-slots') {
      const {
        duration = 60,
        days = 7,
        startHour = 4,
        endHour = 21,
        tzOffsetMinutes = 0,
      } = await req.json();

      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const response = await googleFetch(
        userId,
        'https://www.googleapis.com/calendar/v3/freeBusy',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timeMin: now.toISOString(),
            timeMax: endDate.toISOString(),
            items: [{ id: 'primary' }],
          }),
        }
      );
      const data = await response.json();

      const busySlots = data.calendars?.primary?.busy || [];
      const availableSlots = findAvailableSlots(busySlots, now, endDate, duration, {
        startHour,
        endHour,
        tzOffsetMinutes,
      });

      return new Response(JSON.stringify({ availableSlots }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST' && path === 'create-event') {
      const { title, start, end, description, location } = await req.json();

      if (!title || !start || !end) {
        return new Response(JSON.stringify({ error: 'Title, start, and end are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const eventBody: any = {
        summary: title,
        start: { dateTime: start, timeZone: 'UTC' },
        end: { dateTime: end, timeZone: 'UTC' },
      };

      if (description) eventBody.description = description;
      if (location) eventBody.location = location;

      const response = await googleFetch(
        userId,
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody),
        }
      );
      const event = await response.json();

      return new Response(JSON.stringify({ 
        event: {
          id: event.id,
          title: event.summary,
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          location: event.location,
          description: event.description,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Calendar error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const status = msg.includes('Session expired') ? 401 : 500;
    return new Response(JSON.stringify({ error: msg.includes('Session expired') ? 'Session expired. Please reconnect.' : 'Failed to process calendar request' }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
