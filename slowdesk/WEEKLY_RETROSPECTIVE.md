# Weekly Retrospective Feature

## Overview

Every Sunday at 6 PM, SlowDesk automatically sends a weekly retrospective email to all users. The email includes:

- ✅ Tasks completed this week
- 📊 Task completion rate
- 🌱 Habit tracking progress with visual charts
- ⏰ Tasks that have been pending for a while
- 💡 Personalized insights and suggestions
- 🎯 Recommendations for next week

If a user completed all tasks and maintained all habits, they receive a special appreciation email celebrating their achievement.

## Setup Instructions

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (starts with `re_`)

### 2. Configure Environment Variables

Add these to your `.env.local` (local dev) and Vercel Environment Variables (production):

```bash
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cron Job Security (generate with: openssl rand -base64 32)
CRON_SECRET=your-random-secret-here
```

### 3. Configure Vercel Cron

The `vercel.json` file already contains the cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/retrospective",
      "schedule": "0 18 * * 0"
    }
  ]
}
```

This runs every Sunday at 6 PM (18:00) UTC.

**To adjust the timezone:**
- The schedule uses standard cron format: `minute hour day month day-of-week`
- `0 18 * * 0` = Every Sunday at 6 PM UTC
- To change time: modify the hour (0-23)
- To change day: modify day-of-week (0=Sunday, 6=Saturday)

### 4. Verify Domain in Resend

Before sending emails in production:

1. Go to Resend dashboard > Domains
2. Add and verify your domain (e.g., `slowdesk.app`)
3. Update the `from` address in `/app/api/retrospective/route.ts`:
   ```typescript
   from: 'SlowDesk <weekly@slowdesk.app>'
   ```

For testing, you can use Resend's test domain: `onboarding@resend.dev`

## How It Works

### 1. Data Collection

The cron job runs every Sunday and:
- Fetches all registered users from Supabase Auth
- For each user, analyzes the past 7 days of data:
  - Tasks completed vs pending
  - Habit completion rates
  - Old pending tasks (created >7 days ago)
  - Active projects count

### 2. Email Generation

Based on the data, the system:
- Generates personalized insights
- Creates visual progress bars for habits
- Highlights accomplishments
- Identifies struggling areas
- Provides actionable suggestions

### 3. Email Delivery

- Uses Resend API to send HTML emails
- Different subject lines for high achievers vs regular reports
- Beautiful, responsive email design with charts
- Fun and encouraging tone

## Testing Locally

You can't trigger Vercel Cron locally, but you can test the endpoint:

```bash
# Generate a CRON_SECRET
openssl rand -base64 32

# Add to .env.local
CRON_SECRET=your-generated-secret
RESEND_API_KEY=re_your-resend-key

# Test the endpoint with curl or Postman
curl -X GET http://localhost:3000/api/retrospective \
  -H "Authorization: Bearer your-cron-secret-from-env"
```

## Monitoring

After deployment:
1. Check Vercel Dashboard > Deployments > Cron Logs
2. Verify emails are being sent in Resend Dashboard > Logs
3. Check for any errors in Vercel Function Logs

## Customization

### Change Email Content

Edit `/lib/emails/weekly-retrospective.ts` to modify:
- Email design and colors
- Insights logic
- Suggestions for next week

### Change Schedule

Edit `vercel.json` cron schedule:
```json
"schedule": "0 18 * * 0"  // Every Sunday at 6 PM
```

### Add Opt-Out Feature

Currently, all users receive the email. To add opt-out:

1. Add a `preferences` column to user_metadata in Supabase
2. Update `/app/api/retrospective/route.ts` to check preferences
3. Add a toggle in user settings UI

## Cost Estimate

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day

**Example:**
- 100 users = 400 emails/month (4 Sundays × 100 users)
- Well within free tier ✅

For more than 750 users, consider the paid plan ($20/month for 50,000 emails).

## Troubleshooting

### Emails Not Sending

1. Check Resend API key is correct
2. Verify domain is verified in Resend
3. Check Vercel Function Logs for errors
4. Ensure CRON_SECRET matches in environment

### Wrong Time

- Vercel Cron uses UTC time
- Convert your local time to UTC for the schedule
- Example: 6 PM EST = 11 PM UTC (23:00)

### Users Not Getting Emails

1. Check if users have verified email addresses
2. Look at Resend logs for bounce/delivery failures
3. Test with `resend.emails.send()` manually

## Future Enhancements

- Add user opt-in/opt-out preferences
- Include monthly retrospectives
- Add more visual charts (e.g., streak calendars)
- Personalized goal suggestions based on patterns
- Achievement badges for milestones
