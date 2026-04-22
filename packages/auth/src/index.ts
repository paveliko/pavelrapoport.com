export type { Role, Profile, AuthUser } from "./types";
export {
  getSession,
  getUser,
  requireAdmin,
  signOut,
  signInWithMagicLink,
  signInWithGoogle,
  exchangeCodeForSession,
} from "./server";
export { createAuthProxy } from "./proxy";
