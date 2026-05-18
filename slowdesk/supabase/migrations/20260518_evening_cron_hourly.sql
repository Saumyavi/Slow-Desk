-- Evening voice call cron — re-schedule to fire HOURLY so the route can
-- filter by each user's chosen local time (notification_call_evening_time).
--
-- HOW TO RUN:
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Replace YOUR_VERCEL_URL with your actual Vercel deployment URL
--   3. Replace YOUR_CRON_SECRET with the same CRON_SECRET set in Vercel env vars
--   4. Run this script

-- Step 1: ensure pg_net is available
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: remove the existing daily job if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('evening-voice-call');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Step 3: schedule hourly at minute 0
SELECT cron.schedule(
  'evening-voice-call',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://YOUR_VERCEL_URL/api/voice/outbound',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_CRON_SECRET',
        'Content-Type',  'application/json'
      ),
      body    := '{"type":"evening"}'::jsonb
    );
  $$
);

SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'evening-voice-call';
