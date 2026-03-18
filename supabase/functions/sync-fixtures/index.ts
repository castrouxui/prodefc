// supabase/functions/sync-fixtures/index.ts
// Sincroniza fixtures UCL 2025/26 desde football-data.org (gratis, temporada actual).
//
// Invocar via POST:
//   { "competition": "CL", "season": 2025 }  → UCL 2025/26 (default)
//
// El apiKey se pasa en el body (viene del Vault via cron) o como env FOOTBALL_DATA_KEY.
// Registrar key gratis en: https://www.football-data.org/client/register

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeo de stage de football-data.org a nuestro formato de ronda
const STAGE_LABEL: Record<string, string> = {
  'LEAGUE_PHASE':          'Fase de Liga',
  'KNOCKOUT_PHASE_PLAY_OFFS': 'Playoff',
  'ROUND_OF_16':           'Octavos',
  'QUARTER_FINALS':        'Cuartos',
  'SEMI_FINALS':           'Semifinal',
  'FINAL':                 'Final',
}

function mapStatus(status: string): string {
  if (status === 'FINISHED' || status === 'AWARDED') return 'finished'
  if (['IN_PLAY', 'PAUSED', 'LIVE', 'SUSPENDED'].includes(status)) return 'live'
  return 'scheduled'
}

function roundLabel(stage: string, matchday: number | null): string {
  return STAGE_LABEL[stage] ?? stage
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))

    // La key llega desde el body (cron la saca del Vault) o desde env
    const apiKey = body.apiKey ?? Deno.env.get('FOOTBALL_DATA_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'FOOTBALL_DATA_KEY no configurada' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const competition = body.competition ?? 'CL'   // Champions League
    const season      = body.season      ?? 2025   // 2025 = temporada 2025/26

    // Llamada a football-data.org
    const apiRes = await fetch(
      `https://api.football-data.org/v4/competitions/${competition}/matches?season=${season}`,
      { headers: { 'X-Auth-Token': apiKey } }
    )

    if (!apiRes.ok) {
      const errText = await apiRes.text()
      console.error('football-data.org error:', errText)
      return new Response(JSON.stringify({ error: 'Error al consultar football-data.org', detail: errText }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiData = await apiRes.json()
    const fixtures = apiData.matches ?? []

    // Transformar al schema de matches
    const matches = fixtures.map((f: any) => ({
      home_team:  f.homeTeam.name,
      away_team:  f.awayTeam.name,
      home_logo:  f.homeTeam.crest ?? null,
      away_logo:  f.awayTeam.crest ?? null,
      match_date: f.utcDate,
      round:      roundLabel(f.stage, f.matchday),
      competition: 'UCL',
      home_score: f.score?.fullTime?.home ?? null,
      away_score: f.score?.fullTime?.away ?? null,
      status:     mapStatus(f.status),
      api_id:     `fd-${f.id}`,   // prefijo 'fd-' para distinguir de API-Football IDs
    }))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: upsertError } = await supabase
      .from('matches')
      .upsert(matches, { onConflict: 'api_id' })

    if (upsertError) {
      console.error('Upsert error:', upsertError)
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ synced: matches.length, competition, season }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('sync-fixtures error:', err)
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
