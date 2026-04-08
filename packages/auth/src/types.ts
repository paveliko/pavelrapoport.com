export type Role = "admin" | "user";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  locale: string;
  role: Role;
  created_at: string;
  updated_at: string;
};

export type AuthUser = {
  id: string;
  email: string;
  profile: Profile;
};
