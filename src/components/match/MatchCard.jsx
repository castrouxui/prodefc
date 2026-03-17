import { useNavigate } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import { formatMatchDate, matchStatusLabel } from '@/lib/dates'

/**
 * @param {{ match: object, prediction?: object }} props
 */
export default function MatchCard({ match, prediction }) {
  const navigate = useNavigate()
  const isFinished  = match.status === 'finished'
  const isScheduled = match.status === 'scheduled'
  const hasPrediction     = prediction != null

  function handleClick() {
    if (isScheduled && !hasPrediction) navigate(`/predict/${match.id}`)
  }

  const statusBorderColor = isFinished ? 'var(--success-text)' : hasPrediction ? 'var(--accent)' : 'var(--border-strong)'

  return (
    <div
      onClick={handleClick}
      style={{
        margin: '0 var(--page-px) 8px',
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
        borderLeft: `3px solid ${statusBorderColor}`,
        cursor: isScheduled && !hasPrediction ? 'pointer' : 'default',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span className="comp-label">{match.round}</span>
        <Badge variant={isFinished ? 'success' : isScheduled ? 'pending' : 'default'}>
          {matchStatusLabel(match.status)}
        </Badge>
      </div>

      {/* Teams + Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Teams column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <TeamRow
            logo={match.home_logo}
            name={match.home_team}
            bold={isFinished && match.home_score > match.away_score}
          />
          <TeamRow
            logo={match.away_logo}
            name={match.away_team}
            bold={isFinished && match.away_score > match.home_score}
          />
        </div>

        {/* Center: time or score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 56 }}>
          {isFinished ? (
            <>
              <ScoreDisplay value={match.home_score} />
              <ScoreDisplay value={match.away_score} />
            </>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textAlign: 'center' }}>
              {formatMatchDate(match.match_date)}
            </span>
          )}
        </div>

        {/* Right: prediction result */}
        <div style={{ minWidth: 64, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {isFinished && hasPrediction && (
            <Badge variant={prediction.points > 0 ? 'success' : 'error'}>
              {prediction.points > 0 ? `+${prediction.points} pts` : '0 pts'}
            </Badge>
          )}
          {isScheduled && !hasPrediction && (
            <Badge variant="pending">Cargar</Badge>
          )}
          {isScheduled && hasPrediction && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {prediction.home_pred} – {prediction.away_pred}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function TeamRow({ logo, name, bold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      {logo
        ? <img src={logo} alt={name} width={20} height={20} style={{ borderRadius: '50%' }} />
        : <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-inset)' }} />
      }
      <span style={{
        fontSize: 13, fontWeight: bold ? 700 : 500,
        color: bold ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}>
        {name}
      </span>
    </div>
  )
}

function ScoreDisplay({ value }) {
  return (
    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
      {value ?? '—'}
    </span>
  )
}
