-- Einrichtung der Datenbank für die Hängeplan-App.
-- Einmal im Supabase-Dashboard unter „SQL Editor“ ausführen.

create table if not exists public.ausstellungen (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  daten jsonb not null,
  erstellt timestamptz not null default now(),
  geaendert timestamptz not null default now(),
  geaendert_von uuid default auth.uid() references auth.users (id) on delete set null
);

-- Zugriff nur für angemeldete Personen; alle Angemeldeten (das Team) sehen und bearbeiten alle Ausstellungen.
alter table public.ausstellungen enable row level security;

drop policy if exists "Team liest" on public.ausstellungen;
drop policy if exists "Team legt an" on public.ausstellungen;
drop policy if exists "Team ändert" on public.ausstellungen;
drop policy if exists "Team löscht" on public.ausstellungen;

create policy "Team liest" on public.ausstellungen for select to authenticated using (true);
create policy "Team legt an" on public.ausstellungen for insert to authenticated with check (true);
create policy "Team ändert" on public.ausstellungen for update to authenticated using (true) with check (true);
create policy "Team löscht" on public.ausstellungen for delete to authenticated using (true);

-- Zugriffsrechte ausdrücklich setzen: nicht angemeldete Besucher (anon) dürfen nichts.
revoke all on public.ausstellungen from anon;
grant select, insert, update, delete on public.ausstellungen to authenticated;
