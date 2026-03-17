import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import MatchCard from '@/components/match/MatchCard'

export default function Fixture() {
  const { data: matches = [],     isLoading: matchesLoading } = useMatches()
  const { data: predictions = [], isLoading: predictionsLoading } = usePredictions()

  const predictionsByMatchId = Object.fromEntries(predictions.map(p => [p.match_id, p]))

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round ?? 'Sin ronda'
    if (!acc[round]) acc[round] = []
    acc[round].push(match)
    return acc
  }, {})

  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ padding: '0 var(--page-px) 12px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text-primary)' }}>
          Fixture UCL
        </h1>
      </div>

      {matchesLoading || predictionsLoading
        ? <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Cargando...</p>
        : Object.entries(matchesByRound).map(([round, roundMatches]) => (
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
      }
    </div>
  )
}
