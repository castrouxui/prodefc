import { useState, useMemo } from 'react'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { useActiveCompetition } from '@/hooks/useCompetitions'
import MatchCard from '@/components/match/MatchCard'

const FILTERS = [
  { key: 'upcoming', label: 'Próximos' },
  { key: 'live',     label: 'En vivo'  },
  { key: 'finished', label: 'Jugados'  },
]

export default function Fixture() {
  const [activeFilter, setActiveFilter] = useState('upcoming')

  const { data: matches     = [], isLoading: matchesLoading     } = useMatches()
  const { data: predictions = [], isLoading: predictionsLoading } = usePredictions()
  const activeComp = useActiveCompetition()

  const predictionsByMatchId = useMemo(
    () => Object.fromEntries(predictions.map(p => [p.match_id, p])),
    [predictions],
  )

  const filteredMatches = useMemo(() => {
    if (activeFilter === 'live')     return matches.filter(m => m.status === 'live')
    if (activeFilter === 'finished') return matches.filter(m => m.status === 'finished')
    return matches.filter(m => m.status === 'scheduled' || m.status === 'live')
  }, [matches, activeFilter])

  // Group by round
  const matchesByRound = useMemo(() =>
    filteredMatches.reduce((acc, match) => {
      const round = match.round ?? 'Sin ronda'
      if (!acc[round]) acc[round] = []
      acc[round].push(match)
      return acc
    }, {}),
  [filteredMatches])

  const liveCount = useMemo(() => matches.filter(m => m.status === 'live').length, [matches])

  return (
    <div style={{ paddingTop: 12 }}>
      {/* Header */}
      <div style={{ padding: '0 var(--page-px) 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {activeComp.logo_url && (
          <img
            src={activeComp.logo_url}
            alt={activeComp.name}
            width={28}
            height={28}
            style={{ objectFit: 'contain' }}
          />
        )}
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text-primary)' }}>
          {activeComp.name}
        </h1>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '0 var(--page-px) 14px', display: 'flex', gap: 8 }}>
        {FILTERS.map(f => {
          const isActive = activeFilter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: isActive ? 'none' : '0.5px solid var(--border)',
                background: isActive ? 'var(--accent)' : 'var(--bg-card)',
                color: isActive ? '#000' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {f.label}
              {f.key === 'live' && liveCount > 0 && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isActive ? '#000' : '#ef4444',
                  display: 'inline-block',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {matchesLoading || predictionsLoading ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Cargando...</p>
      ) : filteredMatches.length === 0 ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
          {activeFilter === 'live' ? 'No hay partidos en vivo ahora.' : 'No hay partidos en esta categoría.'}
        </p>
      ) : (
        Object.entries(matchesByRound).map(([round, roundMatches]) => (
          <div key={round} style={{ marginBottom: 20 }}>
            <div style={{ padding: '0 var(--page-px) 8px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                borderRadius: 9999, padding: '5px 12px', width: 'fit-content',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
                <span className="comp-label">{round}</span>
              </div>
            </div>
            {roundMatches.map(match => (
              <MatchCard key={match.id} match={match} prediction={predictionsByMatchId[match.id]} />
            ))}
          </div>
        ))
      )}
    </div>
  )
}
