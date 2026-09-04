# HyroxBros

A private, mobile-first Hyrox training planner for five friends. Plan structured sessions, log actual effort, compare station benchmarks and follow fitness, fatigue and form.

## Run locally

1. Copy `.env.example` to `.env.local` and add your Supabase project URL and anonymous key.
2. Apply the numbered files in `supabase/migrations/` in order, then replace the example emails in `supabase/seed.sql` and run it.
3. Run `npm run dev`.

Only emails in `allowed_members` can create a profile. One member should have the `coach` role.

See `DEPLOYMENT.md` for the complete Supabase, GitHub and Vercel setup.
