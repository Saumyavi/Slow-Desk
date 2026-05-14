import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runAgentTurn } from '@/lib/voice-agent';

export const runtime = 'nodejs';

function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

function esc(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function POST(request: NextRequest) {
  const formData    = await request.formData();
  const callSid     = formData.get('CallSid') as string;
  const speechResult = ((formData.get('SpeechResult') as string) ?? '').trim();

  if (!callSid) {
    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: session } = await supabase
    .from('voice_sessions')
    .select('*')
    .eq('call_sid', callSid)
    .eq('status', 'active')
    .single();

  if (!session) {
    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, I lost track of our conversation. Have a great day!</Say>
  <Hangup/>
</Response>`);
  }

  // No speech captured — end politely
  if (!speechResult) {
    await supabase
      .from('voice_sessions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('call_sid', callSid);

    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">I didn't catch that. Have a wonderful day!</Say>
  <Hangup/>
</Response>`);
  }

  try {
    const { response, shouldHangUp, updatedMessages } = await runAgentTurn(
      {
        userId:   session.user_id,
        type:     session.type,
        messages: session.messages ?? [],
        tasks:    session.tasks ?? [],
      },
      speechResult,
    );

    await supabase
      .from('voice_sessions')
      .update({
        messages:   updatedMessages,
        status:     shouldHangUp ? 'completed' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('call_sid', callSid);

    const spokenText = esc(response);
    const actionUrl  = esc(new URL(request.url).toString());

    if (shouldHangUp) {
      return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${spokenText}</Say>
  <Hangup/>
</Response>`);
    }

    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${spokenText}</Say>
  <Gather input="speech" action="${actionUrl}" method="POST" timeout="6" speechTimeout="auto" language="en-IN">
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. Have a wonderful day!</Say>
  <Hangup/>
</Response>`);

  } catch (err) {
    console.error('Voice agent error:', err);
    await supabase
      .from('voice_sessions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('call_sid', callSid);

    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, I ran into a problem. Have a great day!</Say>
  <Hangup/>
</Response>`);
  }
}
