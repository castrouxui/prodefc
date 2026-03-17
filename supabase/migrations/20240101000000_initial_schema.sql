-- =============================================================
-- ProdeFC — Schema completo
-- Ejecutar en orden. Compatible con Supabase.
-- =============================================================

-- =============================================================
-- 1. EXTENSIONS
-- =============================================================
create extension if not exists "uuid-ossp";

-- =============================================================
-- 2. PROFILES (extiende auth.users)
-- =============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Auto-crear profile al registrarse
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =============================================================
-- 3. GROUPS
-- =============================================================
create table if not exists groups (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  invite_code   text not null unique,
  entry_amount  numeric(10,2) not null default 0,
  currency      text not null default 'ARS',
  payment_mode  text not null default 'automatic', -- 'automatic' | 'manual' (v2)
  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz default now()
);

create index if not exists groups_invite_code_idx on groups(invite_code);

-- =============================================================
-- 4. GROUP_MEMBERS
-- =============================================================
create table if not exists group_members (
  id              uuid primary key default uuid_generate_v4(),
  group_id        uuid not null references groups(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  payment_status  text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  payment_id      text,
  paid_at         timestamptz,
  joined_at       timestamptz default now(),
  unique(group_id, user_id)
);

create index if not exists group_members_group_idx on group_members(group_id);
create index if not exists group_members_user_idx  on group_members(user_id);

-- =============================================================
-- 5. MATCHES
-- =============================================================
create table if not exists matches (
  id          uuid primary key default uuid_generate_v4(),
  home_team   text not null,
  away_team   text not null,
  home_logo   text,
  away_logo   text,
  match_date  timestamptz not null,
  round       text,
  competition text not null default 'UCL',
  home_score  integer,
  away_score  integer,
  status      text not null default 'scheduled', -- 'scheduled' | 'live' | 'finished'
  api_id      text unique, -- ID externo de API-Football
  created_at  timestamptz default now()
);

create index if not exists matches_status_idx on matches(status);
create index if not exists matches_date_idx   on matches(match_date);

-- =============================================================
-- 6. PREDICTIONS
-- =============================================================
create table if not exists predictions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  match_id    uuid not null references matches(id) on delete cascade,
  group_id    uuid not null references groups(id) on delete cascade,
  home_pred   integer not null check (home_pred >= 0),
  away_pred   integer not null check (away_pred >= 0),
  points      integer not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, match_id, group_id)
);

create index if not exists predictions_group_idx on predictions(group_id);
create index if not exists predictions_user_idx  on predictions(user_id);
create index if not exists predictions_match_idx on predictions(match_id);

-- Auto-actualizar updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists predictions_updated_at on predictions;
create trigger predictions_updated_at
  before update on predictions
  for each row execute procedure update_updated_at();

-- =============================================================
-- 7. PAYMENTS
-- =============================================================
create table if not exists payments (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references profiles(id) on delete cascade,
  group_id            uuid not null references groups(id) on delete cascade,
  mp_payment_id       text,
  mp_preference_id    text,
  amount              numeric(10,2) not null,
  status              text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at          timestamptz default now()
);

create index if not exists payments_user_group_idx on payments(user_id, group_id);

-- =============================================================
-- 8. ROW LEVEL SECURITY
-- =============================================================

alter table profiles      enable row level security;
alter table groups        enable row level security;
alter table group_members enable row level security;
alter table matches       enable row level security;
alter table predictions   enable row level security;
alter table payments      enable row level security;

-- PROFILES
create policy "Perfil propio visible" on profiles
  for select using (auth.uid() = id);

create policy "Perfil propio editable" on profiles
  for update using (auth.uid() = id);

-- Perfiles de miembros del mismo grupo (para mostrar en ranking)
create policy "Ver perfiles de compañeros de grupo" on profiles
  for select using (
    id in (
      select user_id from group_members
      where group_id in (
        select group_id from group_members
        where user_id = auth.uid() and payment_status = 'approved'
      )
    )
  );

-- GROUPS
create policy "Ver grupos en los que participo" on groups
  for select using (
    id in (
      select group_id from group_members where user_id = auth.uid()
    )
  );

create policy "Crear grupos" on groups
  for insert with check (auth.uid() = created_by);

-- GROUP_MEMBERS
create policy "Ver miembros de mis grupos" on group_members
  for select using (
    group_id in (
      select group_id from group_members where user_id = auth.uid()
    )
  );

create policy "Unirse a un grupo" on group_members
  for insert with check (auth.uid() = user_id);

-- MATCHES (lectura pública para todos los autenticados)
create policy "Ver partidos" on matches
  for select using (auth.uid() is not null);

-- PREDICTIONS
create policy "Ver pronósticos de mi grupo" on predictions
  for select using (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid() and payment_status = 'approved'
    )
  );

create policy "Crear pronóstico" on predictions
  for insert with check (
    auth.uid() = user_id
    and group_id in (
      select group_id from group_members
      where user_id = auth.uid() and payment_status = 'approved'
    )
    and match_id in (
      select id from matches where status = 'scheduled' and match_date > now()
    )
  );

create policy "Actualizar pronóstico propio" on predictions
  for update using (
    auth.uid() = user_id
    and match_id in (
      select id from matches where status = 'scheduled' and match_date > now()
    )
  );

-- PAYMENTS
create policy "Ver mis pagos" on payments
  for select using (auth.uid() = user_id);

create policy "Insertar pago propio" on payments
  for insert with check (auth.uid() = user_id);

-- =============================================================
-- 9. DATOS DE PRUEBA (comentar en producción)
-- =============================================================

-- insert into matches (home_team, away_team, match_date, round, status) values
--   ('Arsenal',  'Real Madrid', now() + interval '3 days',  'Cuartos · Ida',   'scheduled'),
--   ('Bayern',   'Lazio',       now() - interval '2 days',  'Octavos · Vuelta','finished'),
--   ('PSG',      'Aston Villa', now() - interval '5 days',  'Octavos · Vuelta','finished'),
--   ('Dortmund', 'Inter',       now() - interval '5 days',  'Octavos · Vuelta','finished');

-- update matches set home_score = 2, away_score = 1 where home_team = 'Bayern';
-- update matches set home_score = 2, away_score = 0 where home_team = 'PSG';
-- update matches set home_score = 1, away_score = 2 where home_team = 'Dortmund';
