"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

const ACCOUNT_DOMAIN = "hyroxbros.local";

function normaliseUsername(value: string) {
  return value.trim().toLowerCase();
}

function accountEmail(username: string) {
  return `${normaliseUsername(username)}@${ACCOUNT_DOMAIN}`;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [createMode, setCreateMode] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanUsername = normaliseUsername(username);
    if (!/^[a-z0-9._-]{3,24}$/.test(cleanUsername)) {
      setMessage("Username must be 3–24 letters, numbers, dots, dashes or underscores.");
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setPending(true);
    setMessage("");
    try {
      const supabase = createBrowserClient();
      if (createMode) {
        const { data, error } = await supabase.auth.signUp({
          email: accountEmail(cleanUsername),
          password,
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("That username may already have an account. Try signing in. If it is new, disable Confirm email in Supabase first.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: accountEmail(cleanUsername),
          password,
        });
        if (error) throw error;
      }
      router.replace("/");
      router.refresh();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Could not sign in.";
      setMessage(detail.toLowerCase().includes("database error")
        ? "This username is not on the crew list, or its account already exists."
        : detail);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-400 text-xl font-black text-ink-950">HB</div>
          <h1 className="mt-5 text-4xl font-black tracking-tight">HYROX<span className="text-brand-400">BROS</span></h1>
          <p className="mt-1 text-ink-400">Five athletes. One plan. No excuses.</p>
        </div>
        <form className="card space-y-4" onSubmit={submit}>
          <div>
            <h2 className="text-xl font-black">{createMode ? "Create your account" : "Sign in"}</h2>
            <p className="mt-1 text-sm text-ink-400">
              {createMode ? "Use the username your crew coach added." : "No email link needed."}
            </p>
          </div>
          <label>
            <span className="label">Username</span>
            <input
              className="input"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="e.g. milius99"
              required
            />
          </label>
          <label>
            <span className="label">Password</span>
            <input
              className="input"
              type="password"
              autoComplete={createMode ? "new-password" : "current-password"}
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </label>
          {message && <p className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">{message}</p>}
          <button className="btn-primary w-full" disabled={pending}>
            {pending ? "Please wait…" : createMode ? "Create account" : "Sign in"}
          </button>
          <button
            type="button"
            className="btn-ghost w-full"
            onClick={() => { setCreateMode(!createMode); setMessage(""); }}
          >
            {createMode ? "Already registered? Sign in" : "First time? Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
