import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';
const PHONE_NUMBER_PATTERN = /^\+[1-9]\d{7,14}$/;

const normalizePhoneNumber = (value: string) => {
  const trimmed = value.replace(/[\s()-]/g, '');

  if (trimmed.startsWith('09') && trimmed.length === 11) {
    return `+63${trimmed.slice(1)}`;
  }

  if (trimmed.startsWith('63') && trimmed.length === 12) {
    return `+${trimmed}`;
  }

  if (trimmed.startsWith('+')) {
    return trimmed;
  }

  return trimmed;
};

const isValidE164 = (value: string | null | undefined) => {
  if (!value) return false;
  return PHONE_NUMBER_PATTERN.test(normalizePhoneNumber(value));
};

const fetchAvailableFromNumber = async (lovableApiKey: string, twilioApiKey: string) => {
  const numRes = await fetch(`${GATEWAY_URL}/IncomingPhoneNumbers.json`, {
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': twilioApiKey,
    },
  });

  const numData = await numRes.json();

  if (!numRes.ok) {
    throw new Error(`Twilio number lookup failed [${numRes.status}]: ${JSON.stringify(numData)}`);
  }

  return numData.incoming_phone_numbers?.[0]?.phone_number ?? null;
};

const sendMessage = async (lovableApiKey: string, twilioApiKey: string, to: string, from: string, message: string) => {
  const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': twilioApiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: message }),
  });

  const data = await response.json();
  return { response, data };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
  if (!TWILIO_API_KEY) {
    return new Response(JSON.stringify({ error: 'TWILIO_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return new Response(JSON.stringify({ error: 'Missing "to" or "message"' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const phone = normalizePhoneNumber(to);
    if (!isValidE164(phone)) {
      return new Response(JSON.stringify({ error: 'Recipient phone number must be a valid E.164 or Philippine mobile number.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const configuredFromNumber = Deno.env.get('TWILIO_FROM_NUMBER');
    let from = isValidE164(configuredFromNumber)
      ? normalizePhoneNumber(configuredFromNumber as string)
      : await fetchAvailableFromNumber(LOVABLE_API_KEY, TWILIO_API_KEY);

    if (!from) {
      return new Response(JSON.stringify({ error: 'No valid Twilio phone number is available. Set TWILIO_FROM_NUMBER to a Twilio number in E.164 format.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let { response, data } = await sendMessage(LOVABLE_API_KEY, TWILIO_API_KEY, phone, from, message);

    if (!response.ok && data?.code === 21212) {
      const fallbackFrom = await fetchAvailableFromNumber(LOVABLE_API_KEY, TWILIO_API_KEY);

      if (fallbackFrom && fallbackFrom !== from) {
        from = fallbackFrom;
        ({ response, data } = await sendMessage(LOVABLE_API_KEY, TWILIO_API_KEY, phone, from, message));
      }
    }

    if (!response.ok) {
      throw new Error(`Twilio API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, sid: data.sid, from }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error("SMS send error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
