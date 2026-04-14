-- WhatsApp message persistence for Digital Pavel agent (AI-38)

create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  sender_name text,
  direction text not null check (direction in ('incoming', 'outgoing')),
  message_type text not null default 'text' check (message_type in ('text', 'audio', 'image')),
  content text not null,
  raw_transcription text,
  agent_action text,
  agent_metadata jsonb,
  wa_message_id text,
  tokens_used int,
  latency_ms int,
  created_at timestamptz not null default now()
);

alter table public.whatsapp_messages enable row level security;

create policy "Admin can read whatsapp messages"
  on public.whatsapp_messages for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create index idx_whatsapp_messages_phone on public.whatsapp_messages (phone_number);
create index idx_whatsapp_messages_created_at on public.whatsapp_messages (created_at desc);
create unique index idx_whatsapp_messages_wa_id on public.whatsapp_messages (wa_message_id) where wa_message_id is not null;
