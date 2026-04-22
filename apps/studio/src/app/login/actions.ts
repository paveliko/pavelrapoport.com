"use server";

import { signInWithGoogle, signInWithMagicLink } from "@repo/auth/server";

type MagicLinkState = { success: boolean; error: string | null };
type GoogleState = { url: string | null; error: string | null };

export async function sendMagicLink(
  _prevState: MagicLinkState,
  formData: FormData
): Promise<MagicLinkState> {
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false, error: "Email is required" };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  const { error } = await signInWithMagicLink(
    email,
    `${siteUrl}/auth/callback`
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function signInWithGoogleAction(
  _prevState: GoogleState,
  _formData: FormData
): Promise<GoogleState> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  const { data, error } = await signInWithGoogle(`${siteUrl}/auth/callback`);

  if (error) {
    return { url: null, error: error.message };
  }

  return { url: data.url ?? null, error: null };
}
