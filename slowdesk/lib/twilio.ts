const TWILIO_API = 'https://api.twilio.com/2010-04-01/Accounts';

function getCredentials() {
  const accountSid  = process.env.TWILIO_ACCOUNT_SID;
  const authToken   = process.env.TWILIO_AUTH_TOKEN;
  const from        = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886
  if (!accountSid || !authToken || !from) {
    throw new Error('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM must be set');
  }
  return { accountSid, authToken, from };
}

export interface WhatsAppPayload {
  to: string;          // international format, no +, e.g. "919876543210"
  body?: string;       // freeform text — works in sandbox and for session messages
  contentSid?: string; // approved template SID, e.g. "HXxxxxx"
  contentVariables?: Record<string, string>; // template variable map {"1":"value","2":"value"}
}

export async function sendWhatsApp(payload: WhatsAppPayload): Promise<{ sid: string; status: string }> {
  const { accountSid, authToken, from } = getCredentials();
  const to = `whatsapp:+${payload.to.replace(/\D/g, '')}`;

  const params = new URLSearchParams();
  params.append('From', from);
  params.append('To', to);

  if (payload.contentSid) {
    // Template message (production — pre-approved by Meta via Twilio)
    params.append('ContentSid', payload.contentSid);
    if (payload.contentVariables) {
      params.append('ContentVariables', JSON.stringify(payload.contentVariables));
    }
  } else if (payload.body) {
    // Freeform text (sandbox / session window)
    params.append('Body', payload.body);
  } else {
    throw new Error('Either body or contentSid must be provided');
  }

  const res = await fetch(`${TWILIO_API}/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Twilio error ${res.status}: ${body.message || res.statusText}`);
  }
  return { sid: body.sid, status: body.status };
}
