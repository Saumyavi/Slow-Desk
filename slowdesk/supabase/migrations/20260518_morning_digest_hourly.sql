-- Morning digest cron — schedule via Supabase pg_cron so we can run HOURLY
-- without needing a Vercel Pro plan. The route filters per-user by local time
-- (notification_time + notification_timezone).
--
-- HOW TO RUN:
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Replace YOUR_VERCEL_URL with your actual Vercel deployment URL
--   3. Replace YOUR_CRON_SECRET with the same CRON_SECRET set in Vercel env vars
--   4. Run this script

-- Step 1: ensure pg_net is available
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: remove any existing job with the same name
DO $$
BEGIN
  PERFORM cron.unschedule('morning-digest');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Step 3: schedule hourly at minute 0
SELECT cron.schedule(
  'morning-digest',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://YOUR_VERCEL_URL/api/notifications/morning-digest',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_CRON_SECRET',
        'Content-Type',  'application/json'
      ),
      body    := '{}'::jsonb
    );
  $$
);

SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'morning-digest';
