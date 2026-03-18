import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePredictions } from '@/hooks/usePredictions'
import { formatMatchDate } from '@/lib/dates'
import Badge from '@/components/ui/Badge'

export default function MyPredictions() {
  const navigate = useNavigate()
  const { data: predictions = [], isLoading } = usePredictions()

  // Sort: live first, then scheduled (ASC date), then finished (DESC date)
  const sorted = useMemo(() => {
    const STATUS_ORDER = { live: 0, scheduled: 1, finished: 2 }
    return [...predictions].sort((a, b) => {
      const ma = a.matches, mb = b.matches
      const sa = STATUS_ORDER[ma?.status] ?? 1
      const sb = STATUS_ORDER[mb?.status] ?? 1
      if (sa !== sb) return sa - sb
      const da = new Date(ma?.match_date ?? 0)
      const db = new Date(mb?.match_date ?? 0)
      const diff = da - db
      return ma?.status === 'finished' ? -diff : diff
    })
  }, [predictions])

  const pending   = sorted.filter(p => p.matches?.status === 'scheduled')
  const live      = sorted.filter(p => p.matches?.status === 'live')
  const finished  = sorted.filter(p => p.matches?.status === 'finished')

  const totalPts   = finished.reduce((acc, p) => acc + (p.points ?? 0), 0)
  const exactCount = finished.filter(p => p.points === 3).length
  const hitCount   = finished.filter(p => p.points > 0).length

  return (
    <div style={{ paddingTop: 12, paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: '0 var(--page-px) 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--accent)', fontSize: 22, lineHeight: 1 }}
          aria-label="Volver"
        >
          ‹
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text-primary)' }}>
          Mis pronósticos
        </h1>
      </div>

      {isLoading ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Cargando...</p>
      ) : predictions.length === 0 ? (
        <div style={{ padding: '3rem var(--page-px)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 8 }}>Todavía no cargaste pronósticos.</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Andá al Fixture para predecir los próximos partidos.</p>
        </div>
      ) : (
        <>
          {/* Stats strip */}
          {finished.length > 0 && (
            <div style={{
              margin: '0 var(--page-px) 20px',
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              background: 'var(--bg-card)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-md)', overflow: 'hidden',
            }}>
              <StatCell label="Puntos" value={totalPts} accent />
              <StatCell label="Aciertos" value={`${hitCount}/${finished.length}`} />
              <StatCell label="Exactos" value={exactCount} />
            </div>
          )}

          {live.length > 0    && <Section title="En vivo" items={live} navigate={navigate} />}
          {pending.length > 0 && <Section title="Próximos" items={pending} navigate={navigate} />}
          {finished.length > 0 && <Section title="Jugados" items={finished} navigate={navigate} />}
        </>
      )}
    </div>
  )
}

function StatCell({ label, value, accent }) {
  return (
    <div style={{ padding: '14px 0', textAlign: 'center', borderRight: '0.5px solid var(--border)' }}>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>
        {value}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>
        {label}
      </div>
    </div>
  )
}

function Section({ title, items, navigate }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ padding: '0 var(--page-px) 8px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {title}
        </span>
      </div>
      {items.map(p => <PredictionRow key={p.id} prediction={p} navigate={navigate} />)}
    </div>
  )
}

function PredictionRow({ prediction, navigate }) {
  const match     = prediction.matches
  if (!match) return null

  const isFinished  = match.status === 'finished'
  const isScheduled = match.status === 'scheduled'
  const pts         = prediction.points ?? 0

  const leftBorder = isFinished
    ? pts === 3 ? 'var(--accent)' : pts > 0 ? 'var(--success-text)' : 'var(--border-strong)'
    : 'var(--border-strong)'

  return (
    <div
      onClick={() => isScheduled && navigate(`/predict/${match.id}`)}
      style={{
        margin: '0 var(--page-px) 8px',
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
        borderLeft: `3px solid ${leftBorder}`,
        cursor: isScheduled ? 'pointer' : 'default',
      }}
    >
      {/* Round + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span className="comp-label">{match.round}</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {formatMatchDate(match.match_date)}
        </span>
      </div>

      {/* Teams + scores */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Teams */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: isFinished && match.home_score > match.away_score ? 700 : 500, color: 'var(--text-primary)', marginBottom: 3 }}>
            {match.home_team}
          </div>
          <div style={{ fontSize: 13, fontWeight: isFinished && match.away_score > match.home_score ? 700 : 500, color: 'var(--text-primary)' }}>
            {match.away_team}
          </div>
        </div>

        {/* Result (if finished) */}
        {isFinished && (
          <div style={{ textAlign: 'center', minWidth: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>{match.home_score}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>{match.away_score}</div>
          </div>
        )}

        {/* My prediction */}
        <div style={{ textAlign: 'center', minWidth: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 }}>
            Yo
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
            {prediction.home_pred}–{prediction.away_pred}
          </div>
        </div>

        {/* Points badge */}
        {isFinished && (
          <div style={{ minWidth: 52, display: 'flex', justifyContent: 'flex-end' }}>
            <Badge variant={pts === 3 ? 'success' : pts > 0 ? 'success' : 'error'}>
              {pts > 0 ? `+${pts} pts` : '0 pts'}
            </Badge>
          </div>
        )}

        {isScheduled && (
          <div style={{ minWidth: 52, display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Editar</span>
          </div>
        )}
      </div>
    </div>
  )
}
