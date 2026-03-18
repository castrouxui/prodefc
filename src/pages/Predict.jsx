import { useParams, Navigate } from 'react-router-dom'
import { useMatch } from '@/hooks/useMatches'
import { usePrediction } from '@/hooks/usePredictions'
import { isMatchLocked, formatMatchDate } from '@/lib/dates'
import PredictForm from '@/components/match/PredictForm'
import MatchInsights from '@/components/match/MatchInsights'
import Badge from '@/components/ui/Badge'

export default function Predict() {
  const { matchId } = useParams()
  const { data: match,      isLoading: mLoading } = useMatch(matchId)
  const { data: prediction, isLoading: pLoading } = usePrediction(matchId)

  if (mLoading || pLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Cargando...</div>
  }

  if (!match) return <Navigate to="/" replace />

  const locked = isMatchLocked(match.match_date) || match.status !== 'scheduled'

  if (locked) return <Navigate to="/" replace />

  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ padding: '0 var(--page-px) 16px' }}>
        <Badge variant="pending">{match.round}</Badge>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3, color: 'var(--text-primary)', marginTop: 8 }}>
          {match.home_team} vs {match.away_team}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          {formatMatchDate(match.match_date)}
        </p>
      </div>

      <PredictForm match={match} existingPrediction={prediction} />
      <MatchInsights match={match} />
    </div>
  )
}
