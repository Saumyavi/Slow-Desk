export function getWeeklyRetrospectiveEmail(data: {
  userName: string;
  completedTasksCount: number;
  pendingTasksCount: number;
  completedTasks: any[];
  avoidedTasks: any[];
  habitStats: Array<{ name: string; completedDays: number; totalDays: number; percentage: number }>;
  strugglingHabits: Array<{ name: string; percentage: number }>;
  activeProjects: number;
  insights: string[];
  isAllComplete: boolean;
  weekStart: string;
  weekEnd: string;
}) {
  const {
    completedTasksCount,
    pendingTasksCount,
    completedTasks,
    avoidedTasks,
    habitStats,
    strugglingHabits,
    insights,
    isAllComplete,
    weekStart,
    weekEnd,
  } = data;

  // Color palette
  const colors = {
    primary: '#c1623f',
    success: '#7a9e7e',
    warning: '#c9943a',
    bg: '#faf7f3',
    text: '#2c2416',
    textMuted: '#7a6f5d',
    border: '#e8dfd0',
  };

  const taskCompletionRate = completedTasksCount + pendingTasksCount > 0
    ? Math.round((completedTasksCount / (completedTasksCount + pendingTasksCount)) * 100)
    : 0;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Retrospective</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${colors.bg};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.warning} 100%); padding: 40px 32px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">${isAllComplete ? '🎉' : '📊'}</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; line-height: 1.3;">
                ${isAllComplete ? 'You Crushed It!' : 'Your Week in Review'}
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                ${weekStart} - ${weekEnd}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">

              ${isAllComplete ? `
                <!-- All Complete Message -->
                <div style="background-color: ${colors.bg}; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                  <div style="font-size: 64px; margin-bottom: 12px;">🏆</div>
                  <h2 style="margin: 0 0 8px; color: ${colors.text}; font-size: 22px; font-weight: 600;">
                    Perfect Week!
                  </h2>
                  <p style="margin: 0; color: ${colors.textMuted}; font-size: 15px; line-height: 1.6;">
                    You completed all your tasks and stayed consistent with your habits. This is what excellence looks like!
                  </p>
                </div>
              ` : ''}

              <!-- Stats Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td width="50%" style="padding-right: 8px;">
                    <div style="background-color: ${colors.bg}; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid ${colors.border};">
                      <div style="font-size: 36px; font-weight: 700; color: ${colors.success}; margin-bottom: 4px;">
                        ${completedTasksCount}
                      </div>
                      <div style="font-size: 14px; color: ${colors.textMuted}; font-weight: 500;">
                        Tasks Completed ✅
                      </div>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 8px;">
                    <div style="background-color: ${colors.bg}; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid ${colors.border};">
                      <div style="font-size: 36px; font-weight: 700; color: ${colors.warning}; margin-bottom: 4px;">
                        ${taskCompletionRate}%
                      </div>
                      <div style="font-size: 14px; color: ${colors.textMuted}; font-weight: 500;">
                        Completion Rate 📈
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Completed Tasks -->
              ${completedTasks.length > 0 ? `
                <div style="margin-bottom: 32px;">
                  <h3 style="margin: 0 0 16px; color: ${colors.text}; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">✅</span> What You Accomplished
                  </h3>
                  <div style="background-color: ${colors.bg}; border-radius: 12px; padding: 16px;">
                    ${completedTasks.slice(0, 5).map(task => `
                      <div style="padding: 8px 0; border-bottom: 1px solid ${colors.border};">
                        <div style="color: ${colors.text}; font-size: 15px; font-weight: 500;">
                          ${escapeHtml(task.title)}
                        </div>
                        ${task.project ? `
                          <div style="color: ${colors.textMuted}; font-size: 13px; margin-top: 4px;">
                            📁 ${escapeHtml(task.project)}
                          </div>
                        ` : ''}
                      </div>
                    `).join('')}
                    ${completedTasks.length > 5 ? `
                      <div style="padding: 12px 0 4px; color: ${colors.textMuted}; font-size: 13px; text-align: center;">
                        + ${completedTasks.length - 5} more tasks completed
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}

              <!-- Habits Progress -->
              ${habitStats.length > 0 ? `
                <div style="margin-bottom: 32px;">
                  <h3 style="margin: 0 0 16px; color: ${colors.text}; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">🌱</span> Your Habits This Week
                  </h3>
                  ${habitStats.map(habit => `
                    <div style="margin-bottom: 16px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="color: ${colors.text}; font-size: 15px; font-weight: 500;">
                          ${escapeHtml(habit.name)}
                        </span>
                        <span style="color: ${colors.textMuted}; font-size: 14px; font-weight: 600;">
                          ${habit.completedDays}/${habit.totalDays} days
                        </span>
                      </div>
                      <div style="background-color: ${colors.border}; height: 10px; border-radius: 5px; overflow: hidden;">
                        <div style="background-color: ${habit.percentage >= 70 ? colors.success : habit.percentage >= 40 ? colors.warning : colors.primary}; height: 100%; width: ${habit.percentage}%; transition: width 0.3s;"></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <!-- Avoided Tasks -->
              ${avoidedTasks.length > 0 ? `
                <div style="margin-bottom: 32px;">
                  <h3 style="margin: 0 0 16px; color: ${colors.text}; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">⏰</span> Tasks Waiting for Attention
                  </h3>
                  <div style="background-color: rgba(201, 148, 58, 0.1); border-left: 4px solid ${colors.warning}; border-radius: 8px; padding: 16px;">
                    ${avoidedTasks.map(task => `
                      <div style="padding: 6px 0; color: ${colors.text}; font-size: 14px;">
                        • ${escapeHtml(task.title)}
                      </div>
                    `).join('')}
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${colors.border}; color: ${colors.textMuted}; font-size: 13px; font-style: italic;">
                      💡 These have been pending for a while. Break them into smaller steps or consider if they're still needed.
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- Insights -->
              ${insights.length > 0 ? `
                <div style="margin-bottom: 32px;">
                  <h3 style="margin: 0 0 16px; color: ${colors.text}; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">💡</span> Insights & Suggestions
                  </h3>
                  <div style="background-color: ${colors.bg}; border-radius: 12px; padding: 20px;">
                    ${insights.map(insight => `
                      <div style="padding: 10px 0; color: ${colors.text}; font-size: 15px; line-height: 1.6; border-bottom: 1px solid ${colors.border};">
                        ${escapeHtml(insight)}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Suggestions for Next Week -->
              <div style="background: linear-gradient(135deg, rgba(193, 98, 63, 0.1) 0%, rgba(201, 148, 58, 0.1) 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; color: ${colors.text}; font-size: 18px; font-weight: 600;">
                  🎯 For Next Week
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: ${colors.text}; font-size: 14px; line-height: 1.8;">
                  ${strugglingHabits.length > 0 ? `
                    <li>Focus on making <strong>${escapeHtml(strugglingHabits[0].name)}</strong> easier to maintain</li>
                  ` : ''}
                  ${avoidedTasks.length > 0 ? `
                    <li>Tackle at least one of your pending tasks</li>
                  ` : ''}
                  ${completedTasksCount > 5 ? `
                    <li>Great momentum! Keep the streak going</li>
                  ` : `
                    <li>Set small, achievable daily goals to build consistency</li>
                  `}
                  <li>Remember: slow and steady wins the race 🐢</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 32px;">
                <a href="https://slowdesk.app" style="display: inline-block; background-color: ${colors.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Open SlowDesk
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${colors.bg}; padding: 24px 32px; text-align: center; border-top: 1px solid ${colors.border};">
              <p style="margin: 0 0 8px; color: ${colors.textMuted}; font-size: 13px; line-height: 1.6;">
                Sent with care from <strong>SlowDesk</strong>
              </p>
              <p style="margin: 0; color: ${colors.textMuted}; font-size: 12px;">
                You receive this weekly on Sundays at 6 PM
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
