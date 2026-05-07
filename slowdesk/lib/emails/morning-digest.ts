export interface MorningDigestData {
  userName: string;
  tasks: Array<{ title: string; project: string; priority?: string }>;
  date: string; // e.g. "Wednesday, May 6"
}

const APP_URL = 'https://slow-desk.vercel.app';

const QUOTES = [
  'Wednesday is a good day to finish what Thursday will thank you for.',
  'Slow is smooth, and smooth is fast.',
  'A gentle morning makes a productive afternoon.',
  'One thing at a time, and that done well.',
  'The quieter you become, the more you can hear.',
  'Begin anywhere. Just begin.',
  'Progress is a series of small, deliberate acts.',
  'Not everything needs to happen today. Some things just need to start.',
  'Clarity comes from doing, not from thinking about doing.',
  'A calm morning is already half the work done.',
  'Finish something today — anything.',
  'The best time to start was yesterday. The second best time is now.',
  'Small steps, taken consistently, move mountains.',
  'You don\'t need more time. You need fewer things on the list.',
  'Rest is not idleness. It is part of the work.',
  'A clear desk follows a clear mind.',
  'Do the hardest thing first. Everything else feels easy after.',
  'Your future self will thank you for what you do right now.',
  'Work gently. The world will still be here when you\'re done.',
  'A good day starts before the first task begins.',
];

function pickQuote(date: string): string {
  // Deterministic per day so everyone gets the same quote on the same day
  let hash = 0;
  for (let i = 0; i < date.length; i++) hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  return QUOTES[hash % QUOTES.length];
}

const dotColor: Record<string, string> = {
  high:   '#c1623f',
  medium: '#c9943a',
  low:    '#7a9e7e',
};
const badgeBg: Record<string, string> = {
  high:   'rgba(193,98,63,0.12)',
  medium: 'rgba(201,148,58,0.12)',
  low:    'rgba(122,158,126,0.12)',
};
const badgeColor: Record<string, string> = {
  high:   '#c1623f',
  medium: '#b8832a',
  low:    '#5f8a63',
};
const badgeLabel: Record<string, string> = {
  high: 'high', medium: 'mid', low: 'low',
};

export function getMorningDigestEmail(data: MorningDigestData): string {
  const { userName, tasks, date } = data;
  const quote = pickQuote(date);

  const taskRows = tasks.length
    ? tasks.map(t => {
        const p = t.priority ?? 'none';
        const dot   = dotColor[p]   ?? '#c0b8ad';
        const bg    = badgeBg[p]    ?? 'rgba(192,184,173,0.12)';
        const color = badgeColor[p] ?? '#9a9082';
        const label = badgeLabel[p] ?? '';
        return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f5f0ea;vertical-align:middle;">
            <table cellpadding="0" cellspacing="0" width="100%"><tr>
              <!-- checkbox -->
              <td width="22" style="vertical-align:middle;padding-right:10px;">
                <span style="display:inline-block;width:18px;height:18px;border-radius:5px;
                  border:1.5px solid #d8cfc5;vertical-align:middle;"></span>
              </td>
              <!-- priority dot -->
              <td width="12" style="vertical-align:middle;padding-right:10px;">
                <span style="display:inline-block;width:7px;height:7px;border-radius:50%;
                  background:${dot};vertical-align:middle;"></span>
              </td>
              <!-- title -->
              <td style="vertical-align:middle;">
                <span style="font-size:14px;color:#2c2416;font-family:Georgia,serif;">${escHtml(t.title)}</span>
                ${t.project ? `<span style="font-size:11px;color:#c0b8ad;margin-left:8px;
                  font-family:'Helvetica Neue',Arial,sans-serif;">${escHtml(t.project)}</span>` : ''}
              </td>
              <!-- badge -->
              ${label ? `<td width="40" align="right" style="vertical-align:middle;">
                <span style="display:inline-block;padding:2px 8px;border-radius:4px;
                  background:${bg};color:${color};
                  font-size:8.5px;letter-spacing:0.08em;text-transform:uppercase;
                  font-family:'Helvetica Neue',Arial,sans-serif;">${label}</span>
              </td>` : '<td></td>'}
            </tr></table>
          </td>
        </tr>`;
      }).join('')
    : `<tr><td style="padding:16px;color:#a89f93;font-size:14px;font-style:italic;
        font-family:Georgia,serif;">No pending tasks — enjoy a peaceful day.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Your morning ritual</title>
</head>
<body style="margin:0;padding:0;background:#ddd5c8;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0"
  style="background:#ddd5c8;padding:32px 16px;">
  <tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0"
    style="max-width:560px;width:100%;border-radius:3px;overflow:hidden;
      border:1px solid #ddd5c5;
      box-shadow:0 2px 8px rgba(0,0,0,0.08),0 12px 40px rgba(0,0,0,0.12);">

    <!-- ── HEADER ── -->
    <tr>
      <td style="background:linear-gradient(135deg,#b8572d 0%,#c1623f 40%,#cd7350 100%);
        padding:32px 32px 28px;position:relative;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <!-- Left: greeting + name -->
          <td style="vertical-align:top;">
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;
              letter-spacing:0.24em;text-transform:uppercase;
              color:rgba(255,255,255,0.6);margin-bottom:10px;">
              a postcard from slowdesk
            </div>
            <div style="font-family:Georgia,serif;font-style:italic;
              font-size:13px;color:rgba(255,255,255,0.75);margin-bottom:2px;">
              Good morning,
            </div>
            <div style="font-family:Georgia,serif;font-size:42px;
              color:white;line-height:1;letter-spacing:-0.02em;margin-bottom:12px;">
              ${escHtml(userName)}.
            </div>
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:9.5px;
              color:rgba(255,255,255,0.55);letter-spacing:0.14em;text-transform:uppercase;">
              ${escHtml(date)} &nbsp;·&nbsp; your 9:30 AM ritual
            </div>
          </td>
          <!-- Right: stamp -->
          <td width="90" style="vertical-align:top;text-align:right;padding-left:16px;">
            <table cellpadding="0" cellspacing="0" align="right">
              <tr><td style="background:#faf7f2;border-radius:2px;padding:6px;
                box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                <table cellpadding="0" cellspacing="0"
                  style="border:1.5px dashed rgba(193,98,63,0.35);width:68px;">
                  <tr><td style="padding:10px 6px;text-align:center;">
                    <div style="font-size:24px;line-height:1;margin-bottom:3px;">☕</div>
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:7px;
                      letter-spacing:0.12em;text-transform:uppercase;color:#c1623f;
                      font-weight:700;">SlowDesk</div>
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:6px;
                      letter-spacing:0.1em;text-transform:uppercase;color:#b89f88;
                      margin-top:1px;">ritual</div>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr></table>
      </td>
    </tr>

    <!-- ── PERFORATION ── -->
    <tr>
      <td height="15" style="background:#faf7f2;
        background-image:radial-gradient(circle,#ddd5c8 3px,transparent 3px);
        background-size:14px 14px;background-position:7px center;
        border-top:1px solid #e5ddd0;border-bottom:1px solid #e5ddd0;">
      </td>
    </tr>

    <!-- ── BODY ── -->
    <tr>
      <td style="background:#faf7f2;padding:28px 32px 24px;">

        <!-- Quote -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:26px;">
          <tr>
            <td style="border-left:3px solid #c1623f;
              background:rgba(193,98,63,0.04);
              padding:13px 16px;border-radius:0 8px 8px 0;">
              <div style="font-family:Georgia,serif;font-style:italic;
                font-size:15px;color:#6a6050;line-height:1.6;">
                &ldquo;${escHtml(quote)}&rdquo;
              </div>
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;
                color:#a89f93;letter-spacing:0.08em;margin-top:6px;">
                — today&rsquo;s slow thought
              </div>
            </td>
          </tr>
        </table>

        <!-- Section label -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;">
          <tr>
            <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;
              letter-spacing:0.22em;text-transform:uppercase;color:#a89f93;
              white-space:nowrap;padding-right:10px;width:1%;">
              pending &nbsp;·&nbsp; ${tasks.length} task${tasks.length !== 1 ? 's' : ''}
            </td>
            <td style="border-top:1px solid #e8dfd0;"></td>
          </tr>
        </table>

        <!-- Task list -->
        <table cellpadding="0" cellspacing="0" width="100%"
          style="background:white;border-radius:10px;border:1px solid #e8dfd0;
            overflow:hidden;margin-bottom:26px;
            box-shadow:0 1px 4px rgba(0,0,0,0.04);">
          <!-- header row -->
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #f0ebe3;
              background:#fdf9f5;">
              <table cellpadding="0" cellspacing="0" width="100%"><tr>
                <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;
                  letter-spacing:0.16em;text-transform:uppercase;color:#a89f93;">
                  Today&rsquo;s intentions
                </td>
                <td align="right" style="font-family:'Helvetica Neue',Arial,sans-serif;
                  font-size:9px;color:#c1623f;letter-spacing:0.08em;">
                  ${tasks.length} waiting
                </td>
              </tr></table>
            </td>
          </tr>
          ${taskRows}
        </table>

        <!-- Address block -->
        <table cellpadding="0" cellspacing="0" width="100%"
          style="background:#fdf9f5;border:1px solid #f0ebe3;
            border-radius:8px;padding:0;margin-bottom:28px;">
          <tr>
            <td style="padding:14px 16px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:8.5px;
                    letter-spacing:0.14em;text-transform:uppercase;color:#a89f93;
                    padding:0 10px 8px 0;border-right:1px solid #e8dfd0;
                    vertical-align:top;white-space:nowrap;width:1%;">To</td>
                  <td style="font-family:Georgia,serif;font-size:13.5px;font-style:italic;
                    color:#4a3f30;padding:0 0 8px 12px;
                    border-bottom:1px solid #ede7dc;">
                    ${escHtml(userName)}
                  </td>
                </tr>
                <tr>
                  <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:8.5px;
                    letter-spacing:0.14em;text-transform:uppercase;color:#a89f93;
                    padding:8px 10px 8px 0;border-right:1px solid #e8dfd0;
                    vertical-align:top;white-space:nowrap;">From</td>
                  <td style="font-family:Georgia,serif;font-size:13.5px;font-style:italic;
                    color:#4a3f30;padding:8px 0 8px 12px;
                    border-bottom:1px solid #ede7dc;">
                    the SlowDesk morning ritual
                  </td>
                </tr>
                <tr>
                  <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:8.5px;
                    letter-spacing:0.14em;text-transform:uppercase;color:#a89f93;
                    padding:8px 10px 0 0;border-right:1px solid #e8dfd0;
                    vertical-align:top;white-space:nowrap;">Re</td>
                  <td style="font-family:Georgia,serif;font-size:13.5px;font-style:italic;
                    color:#4a3f30;padding:8px 0 0 12px;">
                    your ${escHtml(date.split(',')[0] ?? date)} intentions
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding:4px 0 2px;">
              <a href="${APP_URL}"
                style="display:inline-block;padding:13px 36px;background:#c1623f;
                  color:white;border-radius:999px;text-decoration:none;
                  font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;
                  letter-spacing:0.14em;text-transform:uppercase;
                  box-shadow:0 4px 14px rgba(193,98,63,0.3);">
                Open SlowDesk &rarr;
              </a>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- ── FOOTER ── -->
    <tr>
      <td style="background:#f5f0ea;border-top:1px solid #e8dfd0;padding:14px 32px;">
        <table cellpadding="0" cellspacing="0" width="100%"><tr>
          <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;
            letter-spacing:0.18em;text-transform:uppercase;color:#a89f93;">
            slow<span style="color:#c1623f;">desk</span>
            &nbsp;&middot;&nbsp; made gently
          </td>
          <td align="right">
            <a href="${APP_URL}/profile"
              style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;
                color:#c0b8ad;letter-spacing:0.08em;text-decoration:underline;">
              manage preferences
            </a>
          </td>
        </tr></table>
      </td>
    </tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function getMorningDigestWhatsApp(data: MorningDigestData): string {
  const { userName, tasks, date } = data;
  const quote = pickQuote(date);

  const priorityIcon: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };

  const taskLines = tasks.length
    ? tasks.map(t => {
        const icon = priorityIcon[t.priority ?? ''] ?? '⚪';
        return `${icon} ${t.title}${t.project ? ` _(${t.project})_` : ''}`;
      }).join('\n')
    : '_No pending tasks — enjoy a peaceful day._';

  return [
    `☀ *Good morning, ${userName}!*`,
    '',
    `_"${quote}"_`,
    '',
    `*Your day · ${date}*`,
    taskLines,
    '',
    `→ ${APP_URL}`,
  ].join('\n');
}

// Template variables for Twilio approved template
export function getMorningDigestTemplateVars(data: MorningDigestData): Record<string, string> {
  const { userName, tasks, date } = data;
  const quote = pickQuote(date);
  const taskLines = tasks.length
    ? tasks.map(t => `• ${t.title}${t.project ? ` (${t.project})` : ''}`).join('\n')
    : 'No pending tasks today.';

  return { '1': userName, '2': quote, '3': date, '4': taskLines };
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
