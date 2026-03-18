-- =============================================================
-- ProdeFC — Sync automático de fixtures via cron
-- Requiere: pg_cron, pg_net, supabase_vault
-- =============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Función interna que llama al Edge Function sync-fixtures.
-- Lee el service role key desde Vault (nunca hardcodeado).
create or replace function sync_ucl_fixtures()
returns void language plpgsql security definer as $$
declare
  v_key text;
begin
  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'SUPABASE_SERVICE_ROLE_KEY'
  limit 1;

  perform net.http_post(
    url     := 'https://tkotodbqtwkwxvkqdidz.supabase.co/functions/v1/sync-fixtures',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := '{"leagueId": 2, "season": 2025}'::jsonb
  );
end;
$$;

-- Cron 1: miércoles y jueves 23:45 UTC — después de partidos UCL
select cron.schedule(
  'sync-ucl-match-nights',
  '45 23 * * 2,3',
  'select sync_ucl_fixtures()'
);

-- Cron 2: lunes 08:00 UTC — limpieza semanal
select cron.schedule(
  'sync-ucl-weekly-cleanup',
  '0 8 * * 1',
  'select sync_ucl_fixtures()'
);

-- =============================================================
-- Para activar el sync real, configurar el secreto:
--   supabase secrets set API_FOOTBALL_KEY=<tu-key-de-api-football>
--   supabase functions deploy sync-fixtures
--
-- Obtener key gratis (100 req/día) en:
--   https://dashboard.api-football.com/register
-- =============================================================
