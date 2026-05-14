const TWILIO_API = 'https://api.twilio.com/2010-04-01/Accounts';

function getCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const from       = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !from) {
    throw new Error('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER must be set');
  }
  return { accountSid, authToken, from };
}

export async function placeCall(
  to: string,
  twimlUrl: string,
): Promise<{ sid: string; status: string }> {
  const { accountSid, authToken, from } = getCredentials();

  const params = new URLSearchParams();
  params.append('To',     `+${to.replace(/\D/g, '')}`);
  params.append('From',   from);
  params.append('Url',    twimlUrl);
  params.append('Method', 'GET');

  const res = await fetch(`${TWILIO_API}/${accountSid}/Calls.json`, {
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
