// supabase/functions/sync-fixtures/index.ts
// Sincroniza partidos desde API-Football hacia la tabla matches.
// Incluye logos de equipos y metadatos de ronda.
//
// Invocar via POST con body JSON:
//   { "leagueId": 2, "season": 2025 }  → UCL 2025/26  ← default
//   { "leagueId": 1, "season": 2026 }  → World Cup 2026
//
// Secrets requeridos (supabase secrets set ...):
//   API_FOOTBALL_KEY     → x-apisports-key header
//   SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_URL          → inyectado automáticamente por Supabase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeo de league ID de API-Football a competition key en nuestra DB
const COMPETITION_KEY: Record<number, string> = {
  2: 'UCL',
  1: 'WC2026',
}

// Status mapping de API-Football a nuestro schema
function mapStatus(shortStatus: string): string {
  if (shortStatus === 'FT' || shortStatus === 'AET' || shortStatus === 'PEN') return 'finished'
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'].includes(shortStatus)) return 'live'
  return 'scheduled'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const apiKey = Deno.env.get('API_FOOTBALL_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API_FOOTBALL_KEY no configurada' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const leagueId: number = body.leagueId ?? 2
    const season: number   = body.season   ?? 2025   // 2025 = temporada 2025/26

    const competition = COMPETITION_KEY[leagueId]
    if (!competition) {
      return new Response(JSON.stringify({ error: `leagueId ${leagueId} no soportado` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Llamada a API-Football
    const apiRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}`,
      { headers: { 'x-apisports-key': apiKey } }
    )

    if (!apiRes.ok) {
      const errText = await apiRes.text()
      console.error('API-Football error:', errText)
      return new Response(JSON.stringify({ error: 'Error al consultar API-Football' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiData = await apiRes.json()

    if (apiData.errors && Object.keys(apiData.errors).length > 0) {
      return new Response(JSON.stringify({ error: apiData.errors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const fixtures = apiData.response ?? []

    // Transformar al schema de matches
    const matches = fixtures.map((f: any) => ({
      home_team:  f.teams.home.name,
      away_team:  f.teams.away.name,
      home_logo:  f.teams.home.logo ?? null,
      away_logo:  f.teams.away.logo ?? null,
      match_date: f.fixture.date,
      round:      f.league.round ?? null,
      competition,
      home_score: f.goals.home ?? null,
      away_score: f.goals.away ?? null,
      status:     mapStatus(f.fixture.status.short),
      api_id:     String(f.fixture.id),
    }))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Upsert — api_id es el campo de conflicto
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
      JSON.stringify({ synced: matches.length, competition, leagueId, season }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('sync-fixtures error:', err)
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
