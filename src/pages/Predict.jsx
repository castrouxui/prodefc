import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { useMatch } from '@/hooks/useMatches'
import { usePrediction } from '@/hooks/usePredictions'
import { useGroupStore } from '@/store/groupStore'
import { isMatchLocked, formatMatchDate } from '@/lib/dates'
import PredictForm from '@/components/match/PredictForm'
import MatchInsights from '@/components/match/MatchInsights'
import Badge from '@/components/ui/Badge'

export default function Predict() {
  const { matchId }   = useParams()
  const navigate      = useNavigate()
  const activeGroupId = useGroupStore(s => s.activeGroupId)

  const { data: match,      isLoading: mLoading } = useMatch(matchId)
  const { data: prediction, isLoading: pLoading } = usePrediction(matchId)

  if (mLoading || pLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Cargando...</div>
  }

  if (!match) return <Navigate to="/" replace />

  const locked = isMatchLocked(match.match_date) || match.status !== 'scheduled'
  if (locked) return <Navigate to="/" replace />

  // Sin grupo activo no se puede predecir
  if (!activeGroupId) {
    return (
      <div style={{ padding: '2rem var(--page-px)', textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Necesitás estar en un grupo para pronosticar.
        </p>
        <button
          onClick={() => navigate('/join/nuevo')}
          style={{
            padding: '12px 24px', background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Unirme a un grupo
        </button>
      </div>
    )
  }

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
