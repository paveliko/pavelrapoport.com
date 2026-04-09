-- Enable moddatetime extension
create extension if not exists moddatetime with schema extensions;

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text default 'en',
  role text default 'user' check (role in ('admin', 'user')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Admin can read all profiles"
  on public.profiles for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure extensions.moddatetime(updated_at);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'en'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Canvas Sessions
create table public.canvas_sessions (
  id uuid primary key default gen_random_uuid(),
  lead_name text,
  lead_email text,
  lead_company text,
  language text default 'en',
  source text default 'direct',
  domain_graph jsonb not null default '{"entities":[],"relationships":[],"notes":[]}',
  messages jsonb not null default '[]',
  summary text,
  fit_score int check (fit_score between 1 and 10),
  fit_reason text,
  status text default 'active' check (status in ('active','completed','reviewed','accepted','declined')),
  tokens_used int default 0,
  cost_usd numeric(8,4) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.canvas_sessions enable row level security;

create policy "Anyone can create a canvas session"
  on public.canvas_sessions for insert
  to anon, authenticated
  with check (true);

create policy "Admin can read all canvas sessions"
  on public.canvas_sessions for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin can update canvas sessions"
  on public.canvas_sessions for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create trigger handle_canvas_sessions_updated_at
  before update on public.canvas_sessions
  for each row execute procedure extensions.moddatetime(updated_at);

-- Clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  canvas_session_id uuid references public.canvas_sessions(id),
  name text not null,
  email text,
  company text,
  source text default 'direct',
  status text default 'lead' check (status in ('lead','active','completed','returning','declined')),
  fit_score int,
  budget_range text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clients enable row level security;

create policy "Admin can do everything with clients"
  on public.clients for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create trigger handle_clients_updated_at
  before update on public.clients
  for each row execute procedure extensions.moddatetime(updated_at);
