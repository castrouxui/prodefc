import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Returns form (last 5), H2H and win probabilities for a scheduled match.
 * Computes everything from our own DB — zero external API needed.
 * Optionally enriched by The Odds API via Edge Function if the secret is configured.
 */
export function useMatchInsights(match) {
  return useQuery({
    queryKey: ['match-insights', match?.id],
    enabled: !!match?.home_team && match?.status === 'scheduled',
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { home_team, away_team } = match

      // Parallel: H2H + home form + away form
      const [{ data: h2h = [] }, { data: homeMatches = [] }, { data: awayMatches = [] }] =
        await Promise.all([
          supabase
            .from('matches')
            .select('home_team, away_team, home_score, away_score, round, match_date')
            .or(`and(home_team.eq.${home_team},away_team.eq.${away_team}),and(home_team.eq.${away_team},away_team.eq.${home_team})`)
            .eq('status', 'finished')
            .order('match_date', { ascending: false })
            .limit(10),

          supabase
            .from('matches')
            .select('home_team, away_team, home_score, away_score')
            .or(`home_team.eq.${home_team},away_team.eq.${home_team}`)
            .eq('status', 'finished')
            .order('match_date', { ascending: false })
            .limit(5),

          supabase
            .from('matches')
            .select('home_team, away_team, home_score, away_score')
            .or(`home_team.eq.${away_team},away_team.eq.${away_team}`)
            .eq('status', 'finished')
            .order('match_date', { ascending: false })
            .limit(5),
        ])

      const homeForm = homeMatches.map(m => getResult(m, home_team))
      const awayForm = awayMatches.map(m => getResult(m, away_team))
      const probs = calcProbabilities(home_team, away_team, h2h, homeForm, awayForm)

      return { h2h, homeForm, awayForm, ...probs }
    },
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getResult(match, team) {
  const isHome   = match.home_team === team
  const myScore  = isHome ? match.home_score : match.away_score
  const oppScore = isHome ? match.away_score : match.home_score
  if (myScore > oppScore) return 'W'
  if (myScore === oppScore) return 'D'
  return 'L'
}

function formPoints(results) {
  return results.reduce((pts, r) => pts + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0)
}

function calcProbabilities(homeTeam, awayTeam, h2h, homeForm, awayForm) {
  // Base: recent form score (max 15 pts each)
  const homePts = formPoints(homeForm)
  const awayPts = formPoints(awayForm)
  const totalPts = homePts + awayPts || 1

  let homeProb = homePts / totalPts
  let awayProb = awayPts / totalPts
  // Draw: baseline 27% (UCL average), adjusted by form parity
  let drawProb = 0.27 - Math.abs(homeProb - awayProb) * 0.15

  // Blend H2H if we have at least 2 encounters
  if (h2h.length >= 2) {
    const homeH2HWins = h2h.filter(m => getResult(m, homeTeam) === 'W').length
    const awayH2HWins = h2h.filter(m => getResult(m, awayTeam) === 'W').length
    const h2hDraws    = h2h.filter(m => getResult(m, homeTeam) === 'D').length
    const n = h2h.length

    homeProb = homeProb * 0.55 + (homeH2HWins / n) * 0.45
    awayProb = awayProb * 0.55 + (awayH2HWins / n) * 0.45
    drawProb = drawProb * 0.55 + (h2hDraws    / n) * 0.45
  }

  const sum = homeProb + awayProb + drawProb || 1
  return {
    homeWinPct: Math.round((homeProb / sum) * 100),
    drawPct:    Math.round((drawProb  / sum) * 100),
    awayWinPct: Math.round((awayProb  / sum) * 100),
    source:     h2h.length >= 2 ? 'form + H2H' : 'forma reciente',
  }
}
