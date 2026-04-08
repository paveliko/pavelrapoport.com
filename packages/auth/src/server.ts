import type { Database } from "@repo/db";
import { createAuthServerClient } from "./supabase";
import type { AuthUser, Profile, Role } from "./types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function getSession() {
  const supabase = await createAuthServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !data) return null;

  const profile = data as unknown as ProfileRow;

  return {
    id: user.id,
    email: user.email ?? "",
    profile: {
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      locale: profile.locale,
      role: profile.role as Role,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    },
  };
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  if (user.profile.role !== "admin") {
    throw new Error("Not authorized — admin role required");
  }

  return user;
}

export async function signInWithMagicLink(
  email: string,
  redirectUrl: string
) {
  const supabase = await createAuthServerClient();
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectUrl },
  });
}

export async function exchangeCodeForSession(code: string) {
  const supabase = await createAuthServerClient();
  return supabase.auth.exchangeCodeForSession(code);
}

export async function signOut() {
  const supabase = await createAuthServerClient();
  return supabase.auth.signOut();
}
