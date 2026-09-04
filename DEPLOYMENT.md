# Deploy HyroxBros for five people

The simplest free setup is **Supabase** for the database and sign-in, **GitHub** for the source, and **Vercel** for the Next.js app.

## 1. Create the Supabase project

1. Create a free project at `supabase.com` and save its database password.
2. Open **SQL Editor** in the project dashboard.
3. Run `supabase/migrations/0001_init.sql`.
4. Run `supabase/migrations/0002_workout_result_calories.sql`.
5. Run `supabase/migrations/0003_authenticated_privileges.sql`.
6. Edit `supabase/seed.sql`: choose one lowercase username for each person, update the five display names, keep one person as `coach`, then run the edited SQL. The stored value must be `username@hyroxbros.local`, as shown in the file.
7. Open **Project Settings → API** and copy the project URL and anonymous/public key. Never use the service-role key in this app.

The internal username addresses must match exactly. The database trigger rejects every account that is not on this allowlist. These are identifiers only; they are not real email addresses and no messages are sent to them.

## 2. Put the project on GitHub

Create a private GitHub repository, then commit and push this folder. Do not commit `.env.local`; it is already ignored.

## 3. Deploy with Vercel

1. Sign in to `vercel.com` using GitHub.
2. Choose **Add New → Project**, select the private repository and keep the detected Next.js settings.
3. Add these environment variables for Production, Preview and Development:

   - `NEXT_PUBLIC_SUPABASE_URL` — the Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the Supabase anonymous/public key

4. Deploy.

## 4. Configure username and password sign-in

In Supabase, open **Authentication → Providers → Email**:

- Keep the Email provider enabled. Supabase uses it internally for password accounts.
- Turn **Confirm email** off. This is essential: it creates the session immediately and prevents confirmation emails and email rate limits.
- Save the provider settings.

No SMTP setup, email template or redirect URL is needed for normal username/password sign-in. Supabase still securely hashes passwords and manages sessions; the app never stores plain-text passwords.

If you previously tested magic-link sign-in, open **Authentication → Users** and delete those old real-email test users before creating the five username accounts. Running the updated seed removes the old real-email entries from `allowed_members`.

## 5. Invite the crew

Share the Vercel URL and each person's username privately. On their first visit, each person selects **First time? Create account**, enters the allowlisted username and chooses a password of at least eight characters. After that, they use **Sign in** with the same username and password. Their profile is created automatically with the name and role from `allowed_members`.

For the supplied seed, the usernames are `milius99`, `vaidmas123`, `kristupas.pole`, `taduskis9` and `pliutikas15`. Change them before running the seed if you prefer different names.

## Updating the app later

Push changes to the GitHub repository. Vercel automatically builds and publishes them. Database changes should be added as a new numbered SQL migration and applied in Supabase before publishing code that depends on them.

## Final safety checks

- Confirm a non-allowlisted username cannot create an account.
- Confirm all five people can sign in and see the same crew calendar.
- Confirm an athlete can log their own result and the coach can manage crew results.
- Keep the Supabase service-role key and database password out of GitHub and Vercel client variables.
