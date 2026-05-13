import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Inline the template logic (mirrors weekly-retrospective.ts) ──────────────

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function getPerformanceTier(score, completedCount) {
  if (score >= 90) return { tier: 'Legendary', tierColor: '#f0c040', tierEmoji: '🏆', tierMessage: "You didn't just have a productive week — you had a great one." };
  if (score >= 75) return { tier: 'On Fire',   tierColor: '#e07040', tierEmoji: '🔥', tierMessage: "Strong work. You're building something real." };
  if (score >= 55) return { tier: 'Solid',      tierColor: '#7a9e7e', tierEmoji: '💪', tierMessage: "Good progress. Consistency beats intensity every time." };
  if (score >= 35) return { tier: 'Getting There', tierColor: '#c9943a', tierEmoji: '📈', tierMessage: completedCount > 0 ? "Not your best week — but you showed up. That counts." : "Every week is a chance to reset. Next one starts tomorrow." };
  return { tier: 'Rest Week', tierColor: '#a89f93', tierEmoji: '🌿', tierMessage: "Slow weeks happen. The important thing is you're here." };
}

function getMotivationalQuote(score) {
  const high = [
    { text: "It's not about having time. It's about making time.", author: "Unknown" },
    { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
    { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  ];
  const mid = [
    { text: "Progress, not perfection.", author: "Unknown" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  ];
  const low = [
    { text: "Rest when you're weary. Refresh and renew yourself.", author: "Ralph Marston" },
    { text: "Even the slowest progress is progress.", author: "Unknown" },
    { text: "Each new day is a blank page in the story of your life.", author: "Douglas Pagels" },
  ];
  const pool = score >= 70 ? high : score >= 40 ? mid : low;
  return pool[0];
}

// ── Sample data ───────────────────────────────────────────────────────────────

const data = {
  userName: 'saumya',
  completedTasksCount: 9,
  pendingTasksCount: 3,
  completedTasks: [
    { title: 'Finish Supabase migration',          project: 'SlowDesk' },
    { title: 'Fix three-dot menu z-index bug',     project: 'SlowDesk' },
    { title: 'Add mobile bottom nav bar',          project: 'SlowDesk' },
    { title: 'Set up Vercel preview deployment',   project: 'SlowDesk' },
    { title: 'Design weekly email template',       project: 'SlowDesk' },
    { title: 'Review Q2 OKRs with team',           project: 'Work' },
    { title: 'Pay quarterly tax filing',           project: '' },
    { title: 'Book dentist appointment',           project: '' },
    { title: 'Read Atomic Habits chapter 6–8',     project: 'Learning' },
  ],
  avoidedTasks: [
    { title: 'Refactor authentication middleware' },
    { title: 'Update privacy policy page' },
  ],
  habitStats: [
    { name: 'Morning workout',  completedDays: 6, totalDays: 7, percentage: 86 },
    { name: 'Read 20 minutes',  completedDays: 3, totalDays: 7, percentage: 43 },
    { name: 'No phone after 9', completedDays: 5, totalDays: 7, percentage: 71 },
  ],
  strugglingHabits: [
    { name: 'Read 20 minutes', percentage: 43 },
  ],
  activeProjects: 3,
  insights: ['Solid week! You completed a good number of tasks.'],
  isAllComplete: false,
  weekStart: 'Apr 28',
  weekEnd: 'May 4',
};

// ── Generate ──────────────────────────────────────────────────────────────────

const { userName, completedTasksCount, pendingTasksCount, completedTasks, avoidedTasks, habitStats, strugglingHabits, insights, isAllComplete, weekStart, weekEnd } = data;

const colors = {
  primary: '#c1623f', primaryLight: '#d4735a', success: '#7a9e7e', warning: '#c9943a',
  bg: '#faf7f3', bgCard: '#f5f0ea', white: '#ffffff', text: '#2c2416',
  textMuted: '#7a6f5d', textFaint: '#a89f93', border: '#e8dfd0', borderStrong: '#d4c8b8',
};

const taskCompletionRate = completedTasksCount + pendingTasksCount > 0
  ? Math.round((completedTasksCount / (completedTasksCount + pendingTasksCount)) * 100) : 0;

const habitAvgPct = habitStats.length > 0
  ? Math.round(habitStats.reduce((s, h) => s + h.percentage, 0) / habitStats.length) : 100;

const weekScore = Math.min(100, Math.round((taskCompletionRate * 0.5) + (habitAvgPct * 0.5) + (isAllComplete ? 10 : 0)));

const { tier, tierColor, tierEmoji, tierMessage } = getPerformanceTier(weekScore, completedTasksCount);
const topHabit = [...habitStats].sort((a, b) => b.percentage - a.percentage)[0];
const quote = getMotivationalQuote(weekScore);
const ctaText = weekScore >= 75 ? 'Keep the momentum going →' : weekScore >= 40 ? 'Pick up where you left off →' : 'Start fresh this week →';
const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

const focusIndex = (base) => { const n = base + 1; return n < 10 ? `0${n}` : `${n}`; };
let focusCount = 0;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Preview — SlowDesk Weekly Retrospective</title>
  <style>body{margin:0;padding:0;background:#e8dfd0;}</style>
</head>
<body style="margin:0;padding:0;background-color:${colors.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.bg};">
  <tr>
    <td align="center" style="padding:32px 16px 48px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${colors.white};border-radius:20px;overflow:hidden;border:1px solid ${colors.border};">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#2c2416 0%,#4a3728 60%,#c1623f 100%);padding:40px 36px 32px;text-align:center;">
            <p style="margin:0 0 20px;font-size:12px;font-weight:700;letter-spacing:0.15em;color:rgba(255,255,255,0.5);text-transform:uppercase;">Weekly Retrospective · ${weekStart}–${weekEnd}</p>
            <h1 style="margin:0 0 8px;font-size:32px;font-weight:800;color:#ffffff;line-height:1.15;letter-spacing:-0.5px;">Hey ${escapeHtml(displayName)},</h1>
            <p style="margin:0 0 28px;font-size:17px;color:rgba(255,255,255,0.75);line-height:1.5;">${tierMessage}</p>
            <div style="display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:16px;padding:20px 36px;">
              <div style="font-size:52px;font-weight:900;color:${tierColor};line-height:1;letter-spacing:-2px;">${weekScore}</div>
              <div style="font-size:12px;font-weight:700;letter-spacing:0.1em;color:rgba(255,255,255,0.6);text-transform:uppercase;margin-top:4px;">Week Score / 100</div>
            </div>
            <div style="margin-top:16px;">
              <span style="display:inline-block;background:${tierColor}22;border:1px solid ${tierColor}55;border-radius:20px;padding:6px 16px;font-size:13px;font-weight:700;color:${tierColor};">${tierEmoji} ${tier}</span>
            </div>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:32px 36px 0;">

            <!-- STAT CARDS -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
              <tr>
                <td width="33%" style="padding-right:6px;">
                  <div style="background:${colors.bgCard};border-radius:14px;padding:18px 14px;text-align:center;border:1px solid ${colors.border};">
                    <div style="font-size:28px;font-weight:800;color:${colors.success};line-height:1;">${completedTasksCount}</div>
                    <div style="font-size:11px;font-weight:600;color:${colors.textMuted};margin-top:4px;text-transform:uppercase;letter-spacing:0.06em;">Tasks done</div>
                  </div>
                </td>
                <td width="33%" style="padding:0 3px;">
                  <div style="background:${colors.bgCard};border-radius:14px;padding:18px 14px;text-align:center;border:1px solid ${colors.border};">
                    <div style="font-size:28px;font-weight:800;color:${taskCompletionRate >= 70 ? colors.success : taskCompletionRate >= 40 ? colors.warning : colors.primary};line-height:1;">${taskCompletionRate}%</div>
                    <div style="font-size:11px;font-weight:600;color:${colors.textMuted};margin-top:4px;text-transform:uppercase;letter-spacing:0.06em;">Completion</div>
                  </div>
                </td>
                <td width="33%" style="padding-left:6px;">
                  <div style="background:${colors.bgCard};border-radius:14px;padding:18px 14px;text-align:center;border:1px solid ${colors.border};">
                    <div style="font-size:28px;font-weight:800;color:${colors.warning};line-height:1;">${habitAvgPct}%</div>
                    <div style="font-size:11px;font-weight:600;color:${colors.textMuted};margin-top:4px;text-transform:uppercase;letter-spacing:0.06em;">Habit avg</div>
                  </div>
                </td>
              </tr>
            </table>

            <div style="height:1px;background:${colors.border};margin-bottom:28px;"></div>

            <!-- WINS -->
            <div style="margin-bottom:28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
                <tr>
                  <td><span style="font-size:15px;font-weight:700;color:${colors.text};">✅ What you shipped</span></td>
                  <td align="right"><span style="font-size:12px;color:${colors.textFaint};">${completedTasksCount} tasks</span></td>
                </tr>
              </table>
              <div style="background:${colors.bgCard};border-radius:12px;padding:4px 0;border:1px solid ${colors.border};">
                ${completedTasks.slice(0, 6).map((task, i) => `
                <div style="padding:11px 16px;${i < Math.min(completedTasks.length, 6) - 1 ? `border-bottom:1px solid ${colors.border};` : ''}">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:20px;vertical-align:middle;"><span style="color:${colors.success};font-size:13px;">✓</span></td>
                      <td style="font-size:14px;color:${colors.text};font-weight:500;">${escapeHtml(task.title)}</td>
                      ${task.project ? `<td align="right"><span style="font-size:11px;color:${colors.textFaint};background:${colors.bg};border:1px solid ${colors.border};border-radius:6px;padding:2px 8px;">${escapeHtml(task.project)}</span></td>` : ''}
                    </tr>
                  </table>
                </div>`).join('')}
                ${completedTasks.length > 6 ? `<div style="padding:10px 16px;text-align:center;font-size:12px;color:${colors.textFaint};">+ ${completedTasks.length - 6} more</div>` : ''}
              </div>
            </div>

            <!-- HABITS -->
            <div style="margin-bottom:28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
                <tr>
                  <td><span style="font-size:15px;font-weight:700;color:${colors.text};">🌱 Habit check-in</span></td>
                  ${topHabit && topHabit.percentage >= 70 ? `<td align="right"><span style="font-size:11px;font-weight:600;color:${colors.success};background:${colors.success}15;border-radius:6px;padding:2px 8px;">🔥 ${escapeHtml(topHabit.name)} on a roll</span></td>` : ''}
                </tr>
              </table>
              ${habitStats.map(habit => `
              <div style="margin-bottom:14px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:7px;">
                  <tr>
                    <td style="font-size:14px;font-weight:500;color:${colors.text};">${escapeHtml(habit.name)}</td>
                    <td align="right" style="font-size:13px;font-weight:700;color:${habit.percentage >= 70 ? colors.success : habit.percentage >= 40 ? colors.warning : colors.primary};">${habit.completedDays}/${habit.totalDays} days</td>
                  </tr>
                </table>
                <div style="background:${colors.border};height:8px;border-radius:4px;overflow:hidden;">
                  <div style="background:${habit.percentage >= 70 ? colors.success : habit.percentage >= 40 ? colors.warning : colors.primary};height:100%;width:${habit.percentage}%;border-radius:4px;"></div>
                </div>
              </div>`).join('')}
            </div>

            <!-- OVERDUE -->
            ${avoidedTasks.length > 0 ? `
            <div style="background:linear-gradient(135deg,rgba(201,148,58,0.08) 0%,rgba(201,148,58,0.04) 100%);border:1.5px solid ${colors.warning}55;border-radius:14px;padding:20px 22px;margin-bottom:28px;">
              <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:${colors.text};">⏳ Still on your plate (${avoidedTasks.length})</p>
              <p style="margin:0 0 14px;font-size:13px;color:${colors.textMuted};line-height:1.5;">These have been waiting over a week. Pick one to close — or let it go for good.</p>
              ${avoidedTasks.map(task => `<div style="padding:7px 0;font-size:14px;color:${colors.text};border-bottom:1px solid ${colors.warning}22;"><span style="color:${colors.warning};margin-right:8px;">→</span>${escapeHtml(task.title)}</div>`).join('')}
            </div>` : ''}

            <!-- INSIGHT -->
            ${insights.length > 0 ? `
            <div style="background:linear-gradient(135deg,rgba(193,98,63,0.08) 0%,rgba(201,148,58,0.06) 100%);border-left:3px solid ${colors.primary};border-radius:0 12px 12px 0;padding:18px 20px;margin-bottom:28px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${colors.primary};">Insight</p>
              <p style="margin:0;font-size:14px;color:${colors.text};line-height:1.7;">${escapeHtml(insights[0])}</p>
            </div>` : ''}

            <!-- NEXT WEEK FOCUS -->
            <div style="background:${colors.bgCard};border-radius:14px;padding:22px 24px;margin-bottom:28px;border:1px solid ${colors.border};">
              <p style="margin:0 0 14px;font-size:15px;font-weight:700;color:${colors.text};">🎯 Your focus for next week</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${strugglingHabits.length > 0 ? `<tr><td style="padding:6px 0;vertical-align:top;"><span style="font-size:13px;color:${colors.primary};font-weight:700;margin-right:8px;">0${++focusCount}</span><span style="font-size:14px;color:${colors.text};">Make <strong>${escapeHtml(strugglingHabits[0].name)}</strong> effortless — set a reminder or tie it to another habit.</span></td></tr>` : ''}
                ${avoidedTasks.length > 0 ? `<tr><td style="padding:6px 0;vertical-align:top;"><span style="font-size:13px;color:${colors.primary};font-weight:700;margin-right:8px;">0${++focusCount}</span><span style="font-size:14px;color:${colors.text};">Clear one overdue task — even 20 minutes makes a difference.</span></td></tr>` : ''}
                <tr><td style="padding:6px 0;vertical-align:top;"><span style="font-size:13px;color:${colors.primary};font-weight:700;margin-right:8px;">0${++focusCount}</span><span style="font-size:14px;color:${colors.text};">${completedTasksCount >= 5 ? 'Great momentum — protect your energy, not just your schedule.' : 'Start Monday with one clear intention. One is enough.'}</span></td></tr>
              </table>
            </div>

            <!-- QUOTE -->
            <div style="text-align:center;padding:4px 0 28px;">
              <p style="margin:0;font-size:14px;font-style:italic;color:${colors.textFaint};line-height:1.7;">"${escapeHtml(quote.text)}"</p>
              <p style="margin:6px 0 0;font-size:12px;color:${colors.textFaint};">— ${escapeHtml(quote.author)}</p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;padding-bottom:36px;">
              <a href="https://slowdesk.app" style="display:inline-block;background:${colors.primary};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;">${ctaText}</a>
              <p style="margin:14px 0 0;font-size:12px;color:${colors.textFaint};">Opens in your browser — no download needed</p>
            </div>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:${colors.bgCard};padding:22px 36px;text-align:center;border-top:1px solid ${colors.border};">
            <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${colors.textMuted};">SlowDesk — a calmer way to work</p>
            <p style="margin:0;font-size:12px;color:${colors.textFaint};">You get this every Sunday at 6 PM · <a href="https://slowdesk.app/profile" style="color:${colors.textFaint};">Manage preferences</a></p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

const outPath = join(__dirname, '..', 'email-preview.html');
writeFileSync(outPath, html, 'utf8');
console.log('✓ Preview written to: slowdesk/email-preview.html');
console.log(`  Week score: ${weekScore} — ${tier} ${tierEmoji}`);
console.log(`  Task completion: ${taskCompletionRate}%  |  Habit avg: ${habitAvgPct}%`);
