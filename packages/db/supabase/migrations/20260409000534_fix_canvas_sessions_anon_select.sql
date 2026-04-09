-- AI-29: Allow anon to read canvas sessions
--
-- The Supabase JS client uses RETURNING * (PostgREST Prefer: return=representation)
-- on INSERT by default. Without a SELECT policy for anon, the insert succeeds but
-- the implicit RETURNING fails RLS, surfacing as:
--   "new row violates row-level security policy for table canvas_sessions"
--
-- The canvas flow requires anon users to read back the session they created
-- (to get the session ID and continue the conversation).

create policy "Anon can read canvas sessions"
  on public.canvas_sessions for select
  to anon
  using (true);
