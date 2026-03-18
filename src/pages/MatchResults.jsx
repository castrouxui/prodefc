import { useParams, useNavigate } from 'react-router-dom'
import { useMatchPredictions } from '@/hooks/usePredictions'
import { useMatch } from '@/hooks/useMatches'
import { formatMatchDate } from '@/lib/dates'
import { useAuthStore } from '@/store/authStore'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

export default function MatchResults() {
  const { matchId } = useParams()
  const navigate    = useNavigate()
  const user        = useAuthStore(s => s.user)

  const { data: predictions = [], isLoading } = useMatchPredictions(matchId)
  const { data: match }                       = useMatch(matchId)

  const isFinished = match?.status === 'finished'
  const isLive     = match?.status === 'live'

  // Sort: my prediction first, then by points desc
  const sorted = [...predictions].sort((a, b) => {
    if (a.user_id === user?.id) return -1
    if (b.user_id === user?.id) return  1
    return (b.points ?? 0) - (a.points ?? 0)
  })

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: '12px var(--page-px) 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--accent)', fontSize: 22, lineHeight: 1 }}
          aria-label="Volver"
        >
          ‹
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, color: 'var(--text-primary)' }}>
          Pronósticos del grupo
        </h1>
      </div>

      {/* Match summary */}
      {match && (
        <div style={{
          margin: '16px var(--page-px)',
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {match.round}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {formatMatchDate(match.match_date)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{match.home_team}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{match.away_team}</p>
            </div>
            {isFinished && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{match.home_score}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{match.away_score}</p>
              </div>
            )}
            {isLive && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--success-text)', lineHeight: 1.2 }}>{match.home_score ?? '—'}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--success-text)', lineHeight: 1.2 }}>{match.away_score ?? '—'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Predictions list */}
      {isLoading ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Cargando...</p>
      ) : predictions.length === 0 ? (
        <div style={{ padding: '3rem var(--page-px)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Nadie del grupo pronosticó este partido.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 var(--page-px)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
            {sorted.length} pronóstico{sorted.length !== 1 ? 's' : ''}
          </p>
          {sorted.map(p => (
            <PredictionRow
              key={p.id}
              prediction={p}
              isMe={p.user_id === user?.id}
              isFinished={isFinished}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PredictionRow({ prediction, isMe, isFinished }) {
  const name   = prediction.profiles?.username ?? 'Usuario'
  const avatar = prediction.profiles?.avatar_url
  const pts    = prediction.points ?? 0

  const leftBorder = isFinished
    ? pts === 3 ? 'var(--accent)' : pts > 0 ? 'var(--success-text)' : 'var(--border-strong)'
    : 'var(--border-strong)'

  return (
    <div style={{
      background: isMe ? 'var(--accent-dim)' : 'var(--bg-card)',
      border: `0.5px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)',
      borderLeft: `3px solid ${leftBorder}`,
      padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <Avatar src={avatar} name={name} size={32} />

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: isMe ? 700 : 500, color: 'var(--text-primary)' }}>
          {name}{isMe && <span style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 6, fontWeight: 600 }}>Vos</span>}
        </p>
      </div>

      {/* Prediction score */}
      <div style={{ textAlign: 'center', minWidth: 40 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
          {prediction.home_pred} – {prediction.away_pred}
        </p>
      </div>

      {/* Points badge (only when finished) */}
      {isFinished && (
        <div style={{ minWidth: 52, display: 'flex', justifyContent: 'flex-end' }}>
          <Badge variant={pts === 3 ? 'success' : pts > 0 ? 'success' : 'error'}>
            {pts > 0 ? `+${pts} pts` : '0 pts'}
          </Badge>
        </div>
      )}
    </div>
  )
}
