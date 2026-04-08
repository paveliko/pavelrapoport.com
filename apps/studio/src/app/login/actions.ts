"use server";

import { signInWithMagicLink } from "@repo/auth/server";

export async function sendMagicLink(
  _prevState: { success: boolean; error: string | null },
  formData: FormData
) {
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
