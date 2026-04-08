"use client";

import { useActionState } from "react";
import { sendMagicLink } from "./actions";

const initialState = { success: false, error: null as string | null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    sendMagicLink,
    initialState
  );

  if (state.success) {
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
    <form action={formAction} className="space-y-4">
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

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Send magic link"}
      </button>
    </form>
  );
}
