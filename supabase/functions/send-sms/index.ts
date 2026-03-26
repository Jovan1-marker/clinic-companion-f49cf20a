import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Convert Philippine format (09...) to E.164 (+639...)
    let phone = to.replace(/\s+/g, '');
    if (phone.startsWith('09')) {
      phone = '+63' + phone.substring(1);
    } else if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }

    // Get Twilio phone number from env or use first available
    const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER');

    // If no FROM number configured, try to list available numbers
    let from = fromNumber;
    if (!from) {
      const numRes = await fetch(`${GATEWAY_URL}/IncomingPhoneNumbers.json`, {
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TWILIO_API_KEY,
        },
      });
      const numData = await numRes.json();
      if (numData.incoming_phone_numbers?.length > 0) {
        from = numData.incoming_phone_numbers[0].phone_number;
      } else {
        return new Response(JSON.stringify({ error: 'No Twilio phone number available. Please configure TWILIO_FROM_NUMBER secret.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TWILIO_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, From: from, Body: message }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Twilio API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, sid: data.sid }), {
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
