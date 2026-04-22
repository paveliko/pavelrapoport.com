"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useActionState, useState } from "react";

import { sendMagicLink } from "./actions";

const magicLinkInitial = { success: false, error: null as string | null };

export function LoginForm() {
  const [magicState, magicAction, magicPending] = useActionState(
    sendMagicLink,
    magicLinkInitial
  );
  const [googlePending, setGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setGoogleError(null);
    setGooglePending(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });

    if (error) {
      setGoogleError(error.message);
      setGooglePending(false);
    }
  }

  if (magicState.success) {
    return (
      <div className="rounded-lg border border-neutral-200 p-4 text-center">
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-sm text-neutral-500">
          We sent a magic link to your inbox. Click it to sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googlePending}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
        >
          <GoogleLogo />
          {googlePending ? "Redirecting..." : "Continue with Google"}
        </button>
        {googleError && (
          <p className="mt-2 text-sm text-red-600">{googleError}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs uppercase tracking-wide text-neutral-400">
          or
        </span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <form action={magicAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="hello@pavelrapoport.com"
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        {magicState.error && (
          <p className="text-sm text-red-600">{magicState.error}</p>
        )}

        <button
          type="submit"
          disabled={magicPending}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {magicPending ? "Sending..." : "Send magic link"}
        </button>
      </form>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="h-4 w-4"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
