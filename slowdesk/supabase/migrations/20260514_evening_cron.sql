-- Evening voice call cron job via Supabase pg_cron + pg_net
--
-- HOW TO RUN:
--   1. Go to your Supabase Dashboard → SQL Editor
--   2. Replace YOUR_VERCEL_URL with your actual Vercel deployment URL (e.g. slowdesk.vercel.app)
--   3. Run this script
--
-- PREREQUISITES: pg_net extension must be enabled
--   Supabase Dashboard → Database → Extensions → search "pg_net" → Enable

-- Step 1: Enable pg_net (safe to run even if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Remove existing job if it already exists (safe on first run)
DO $$
BEGIN
  PERFORM cron.unschedule('evening-voice-call');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Step 3: Schedule the evening call at 1:30 PM UTC = 7:00 PM IST
SELECT cron.schedule(
  'evening-voice-call',
  '30 13 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://slow-desk.vercel.app/api/voice/outbound',
      headers := jsonb_build_object(
        'Authorization', 'Bearer daa06f9ed07eb7207368d077907cd774b48e2cb8b2fab1c4f8a7063ec74fc521',
        'Content-Type',  'application/json'
      ),
      body    := '{"type":"evening"}'::jsonb
    );
  $$
);

-- Verify it was created
SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'evening-voice-call';
