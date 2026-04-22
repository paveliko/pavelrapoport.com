export type { Role, Profile, AuthUser } from "./types";
export {
  getSession,
  getUser,
  requireAdmin,
  signOut,
  signInWithMagicLink,
  exchangeCodeForSession,
} from "./server";
export { createAuthProxy } from "./proxy";
