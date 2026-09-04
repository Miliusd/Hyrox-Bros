# Deploy HyroxBros for five people

The simplest free setup is **Supabase** for the database and sign-in, **GitHub** for the source, and **Vercel** for the Next.js app.

## 1. Create the Supabase project

1. Create a free project at `supabase.com` and save its database password.
2. Open **SQL Editor** in the project dashboard.
3. Run `supabase/migrations/0001_init.sql`.
4. Run `supabase/migrations/0002_workout_result_calories.sql`.
5. Edit `supabase/seed.sql`: replace all five example emails and display names with the real people. Keep one person as `coach`, then run the edited SQL.
6. Open **Project Settings → API** and copy the project URL and anonymous/public key. Never use the service-role key in this app.

The email addresses must match exactly. The database trigger rejects every account that is not on this allowlist.

## 2. Put the project on GitHub

Create a private GitHub repository, then commit and push this folder. Do not commit `.env.local`; it is already ignored.

## 3. Deploy with Vercel

1. Sign in to `vercel.com` using GitHub.
2. Choose **Add New → Project**, select the private repository and keep the detected Next.js settings.
3. Add these environment variables for Production, Preview and Development:

   - `NEXT_PUBLIC_SUPABASE_URL` — the Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the Supabase anonymous/public key
   - `NEXT_PUBLIC_SITE_URL` — the final Vercel URL, such as `https://hyroxbros.vercel.app`

4. Deploy. If Vercel assigned a different URL, update `NEXT_PUBLIC_SITE_URL` and redeploy once.

## 4. Configure magic-link redirects

In Supabase, open **Authentication → URL Configuration**:

- Set **Site URL** to the final Vercel URL.
- Add `https://YOUR-VERCEL-DOMAIN/auth/callback` to **Redirect URLs**.
- Keep `http://localhost:3000/auth/callback` as an additional redirect for local development.

In **Authentication → Providers**, ensure Email is enabled. Passwords are not needed.

## 5. Invite the crew

Share the Vercel URL with the four friends whose addresses are in `allowed_members`. Each person enters that exact email on the login page and uses the magic link. Their profile is created automatically on first sign-in.

## Updating the app later

Push changes to the GitHub repository. Vercel automatically builds and publishes them. Database changes should be added as a new numbered SQL migration and applied in Supabase before publishing code that depends on them.

## Final safety checks

- Confirm a non-allowlisted email cannot create an account.
- Confirm all five people can sign in and see the same crew calendar.
- Confirm an athlete can log their own result and the coach can manage crew results.
- Keep the Supabase service-role key and database password out of GitHub and Vercel client variables.
