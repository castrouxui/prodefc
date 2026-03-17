-- =============================================================
-- ProdeFC — Tabla de competencias
-- =============================================================

create table if not exists competitions (
  id          uuid primary key default uuid_generate_v4(),
  key         text not null unique,          -- 'UCL' | 'WC2026'
  name        text not null,
  logo_url    text,
  season      text,
  status      text not null default 'active', -- 'active' | 'coming_soon' | 'finished'
  api_id      integer,                        -- API-Football league ID (2=UCL, 1=World Cup)
  created_at  timestamptz default now()
);

alter table competitions enable row level security;

create policy "Ver competencias" on competitions
  for select using (auth.uid() is not null);

-- Seed inicial
insert into competitions (key, name, logo_url, season, status, api_id) values
  (
    'UCL',
    'UEFA Champions League',
    'https://media.api-sports.io/football/leagues/2.png',
    '2024/25',
    'active',
    2
  ),
  (
    'WC2026',
    'FIFA World Cup 2026',
    'https://media.api-sports.io/football/leagues/1.png',
    '2026',
    'coming_soon',
    1
  )
on conflict (key) do nothing;
