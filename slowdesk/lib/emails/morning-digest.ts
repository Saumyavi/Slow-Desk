export interface MorningDigestData {
  userName: string;
  tasks: Array<{ title: string; project: string; priority?: string }>;
  date: string; // e.g. "Wednesday, May 6"
}

export function getMorningDigestEmail(data: MorningDigestData): string {
  const { userName, tasks, date } = data;

  const colors = {
    primary: '#c1623f',
    bg: '#faf7f3',
    bgCard: '#f5f0ea',
    white: '#ffffff',
    text: '#2c2416',
    textMuted: '#7a6f5d',
    textFaint: '#a89f93',
    border: '#e8dfd0',
  };

  const taskRows = tasks.length
    ? tasks.map((t, i) => `
        <tr>
          <td style="padding: 10px 16px; border-bottom: 1px solid ${colors.border};">
            <span style="display: inline-block; width: 22px; height: 22px; border-radius: 6px;
              border: 1.5px solid ${colors.border}; vertical-align: middle; margin-right: 10px;"></span>
            <span style="font-size: 14px; color: ${colors.text}; vertical-align: middle;">${escHtml(t.title)}</span>
            ${t.project ? `<span style="font-size: 12px; color: ${colors.textFaint}; margin-left: 8px;">${escHtml(t.project)}</span>` : ''}
          </td>
        </tr>`).join('')
    : `<tr><td style="padding: 14px 16px; color: ${colors.textFaint}; font-size: 14px; font-style: italic;">
        No pending tasks — enjoy a peaceful day!
      </td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your morning ritual</title>
</head>
<body style="margin:0;padding:0;background:${colors.bg};font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${colors.bg};padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding:0 0 24px;text-align:center;">
            <div style="font-size:13px;color:${colors.textFaint};letter-spacing:0.12em;
              text-transform:uppercase;font-family:'Helvetica Neue',sans-serif;margin-bottom:8px;">
              slowdesk
            </div>
            <h1 style="margin:0;font-size:26px;font-weight:700;color:${colors.text};line-height:1.2;">
              Good morning, ${escHtml(userName)} ☕
            </h1>
            <p style="margin:8px 0 0;font-size:14px;color:${colors.textMuted};">
              ${escHtml(date)} &nbsp;·&nbsp; here's your day at a glance
            </p>
          </td>
        </tr>

        <!-- Task list -->
        <tr>
          <td style="background:${colors.white};border-radius:14px;
            border:1px solid ${colors.border};overflow:hidden;margin-bottom:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:14px 16px 10px;border-bottom:1px solid ${colors.border};">
                  <span style="font-size:11px;font-weight:700;letter-spacing:0.1em;
                    text-transform:uppercase;color:${colors.textFaint};
                    font-family:'Helvetica Neue',sans-serif;">
                    Today's tasks
                  </span>
                  <span style="font-size:12px;color:${colors.textFaint};float:right;">
                    ${tasks.length} pending
                  </span>
                </td>
              </tr>
              ${taskRows}
            </table>
          </td>
        </tr>

        <!-- Spacer -->
        <tr><td style="height:20px;"></td></tr>

        <!-- CTA -->
        <tr>
          <td style="text-align:center;padding:0 0 32px;">
            <a href="https://slowdesk.app"
              style="display:inline-block;padding:12px 28px;border-radius:999px;
                background:${colors.primary};color:#fff;font-size:14px;font-weight:600;
                text-decoration:none;font-family:'Helvetica Neue',sans-serif;">
              Open SlowDesk →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="text-align:center;padding:0 0 16px;">
            <p style="font-size:12px;color:${colors.textFaint};margin:0;font-family:'Helvetica Neue',sans-serif;">
              You're receiving this because you opted in to morning rituals.<br/>
              <a href="https://slowdesk.app/profile"
                style="color:${colors.textFaint};text-decoration:underline;">Manage preferences</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Freeform text — for sandbox / testing
export function getMorningDigestWhatsApp(data: MorningDigestData): string {
  const { userName, tasks, date } = data;
  const taskLines = tasks.length
    ? tasks.map((t, i) => `  ${i + 1}. ${t.title}${t.project ? ` (${t.project})` : ''}`).join('\n')
    : '  No pending tasks today!';

  return `☕ *Good morning, ${userName}!*\n\n*${date}* — here's your day:\n\n${taskLines}\n\n_Open SlowDesk → slowdesk.app_`;
}

// Template variables — for production (Twilio approved template)
// Template body (submit this to Twilio Content API):
//   ☕ Good morning, {{1}}!
//   {{2}} — here's your day:
//   {{3}}
//   Open SlowDesk → slowdesk.app
export function getMorningDigestTemplateVars(data: MorningDigestData): Record<string, string> {
  const { userName, tasks, date } = data;
  const taskLines = tasks.length
    ? tasks.map((t, i) => `${i + 1}. ${t.title}${t.project ? ` (${t.project})` : ''}`).join('\n')
    : 'No pending tasks today!';

  return { '1': userName, '2': date, '3': taskLines };
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
