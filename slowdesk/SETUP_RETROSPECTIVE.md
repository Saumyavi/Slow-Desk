# Quick Setup: Weekly Retrospective

## 1. Get Resend API Key

1. Sign up at https://resend.com (free - 3,000 emails/month)
2. Create API key
3. Copy the key (starts with `re_`)

## 2. Add Environment Variables

### Local Development (.env.local)

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CRON_SECRET=generate-with-openssl-rand-base64-32
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase
```

### Vercel Production

Go to your Vercel project > Settings > Environment Variables and add:

- `RESEND_API_KEY` = your Resend API key
- `CRON_SECRET` = same secret you generated
- `SUPABASE_SERVICE_ROLE_KEY` = from Supabase Dashboard > Settings > API

## 3. Verify Your Domain in Resend (Production Only)

1. Go to Resend Dashboard > Domains
2. Add `slowdesk.app` (or your domain)
3. Follow DNS verification steps
4. Once verified, update the `from` address in the code:

Edit `/app/api/retrospective/route.ts` line ~30:
```typescript
from: 'SlowDesk <weekly@slowdesk.app>',  // Use your verified domain
```

For testing, you can use: `onboarding@resend.dev`

## 4. Deploy to Vercel

```bash
git add .
git commit -m "Add weekly retrospective feature"
git push
```

Vercel will automatically:
- Deploy your changes
- Set up the cron job (runs every Sunday at 6 PM UTC)
- Start sending emails on the next Sunday

## 5. Test Before Production

Test the endpoint locally:

```bash
curl -X GET http://localhost:3000/api/retrospective \
  -H "Authorization: Bearer your-cron-secret"
```

Or use Postman/Insomnia to test the endpoint.

## What Happens Next

Every Sunday at 6 PM UTC:
1. Vercel cron triggers the `/api/retrospective` endpoint
2. System fetches all users and their weekly data
3. Generates personalized retrospective emails
4. Sends via Resend to each user

Users receive beautiful emails with:
- ✅ Tasks completed
- 📊 Completion rate
- 🌱 Habit progress with visual charts
- 💡 Personalized insights
- 🎯 Suggestions for next week
- 🎉 Special appreciation if they had a perfect week

## Monitoring

- **Vercel**: Dashboard > Deployments > Cron Logs
- **Resend**: Dashboard > Logs (see all sent emails)
- **Errors**: Vercel Functions > Logs

## Done! 🎉

Your weekly retrospective is now live. Users will start receiving emails next Sunday.
