import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { useRanking } from '@/hooks/useRanking'
import { useGroupStore } from '@/store/groupStore'
import { useActiveCompetition, useComingSoonCompetitions } from '@/hooks/useCompetitions'
import MatchCard from '@/components/match/MatchCard'
import RankingTable from '@/components/ranking/RankingTable'
import {
  COMPETITION_STATUS_LABEL,
  HOME_MATCHES_LIMIT,
  HOME_RANKING_LIMIT,
} from '@/config'

export default function Home() {
  const activeGroupId  = useGroupStore(s => s.activeGroupId)
  const activeComp     = useActiveCompetition()
  const comingSoon     = useComingSoonCompetitions()

  const { data: matches     = [], isLoading: matchesLoading     } = useMatches({ limit: HOME_MATCHES_LIMIT })
  const { data: predictions = [], isLoading: predictionsLoading } = usePredictions()
  const { data: ranking     = [], isLoading: rankingLoading      } = useRanking()

  const predictionsByMatchId = useMemo(
    () => Object.fromEntries(predictions.map(p => [p.match_id, p])),
    [predictions],
  )

  if (!activeGroupId) return <NoGroupPrompt />

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Competition indicator */}
      <div style={{ padding: '0 var(--page-px) 12px' }}>
        <CompetitionPill
          label={`${activeComp.name} · ${COMPETITION_STATUS_LABEL}`}
          logoUrl={activeComp.logo_url}
        />
      </div>

      {/* Upcoming matches */}
      <section style={{ marginBottom: 16 }}>
        <div className="section-header">
          <span className="section-title">Partidos</span>
          <Link to="/fixture" className="section-link">Ver todos</Link>
        </div>

        {matchesLoading || predictionsLoading
          ? <SkeletonRows count={3} />
          : matches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictionsByMatchId[match.id]}
              />
            ))
        }
      </section>

      {/* Group ranking preview */}
      <section style={{ padding: '0 var(--page-px)', marginBottom: 16 }}>
        <div className="section-header" style={{ padding: 0, marginBottom: 8 }}>
          <span className="section-title">Ranking</span>
          <Link to="/ranking" className="section-link">Ver completo</Link>
        </div>

        {rankingLoading
          ? <SkeletonRows count={HOME_RANKING_LIMIT} />
          : <RankingTable entries={ranking} limit={HOME_RANKING_LIMIT} />
        }
      </section>

      {/* Coming soon competitions */}
      {comingSoon.length > 0 && (
        <section style={{ padding: '0 var(--page-px) 24px' }}>
          <div className="section-header" style={{ padding: 0, marginBottom: 8 }}>
            <span className="section-title">Próximamente</span>
          </div>
          {comingSoon.map(comp => (
            <ComingSoonCard key={comp.key} competition={comp} />
          ))}
        </section>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Small pill that shows which competition is active. */
function CompetitionPill({ label, logoUrl }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-full)', padding: '5px 12px',
    }}>
      {logoUrl
        ? <img src={logoUrl} alt="" width={16} height={16} style={{ objectFit: 'contain' }} />
        : <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
      }
      <span className="comp-label">{label}</span>
    </div>
  )
}

/** Card for a competition that hasn't started yet. */
function ComingSoonCard({ competition }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      {competition.logo_url && (
        <img
          src={competition.logo_url}
          alt={competition.name}
          width={40}
          height={40}
          style={{ objectFit: 'contain', flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
          {competition.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {competition.season}
        </div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--accent)',
        background: 'var(--accent-dim)',
        borderRadius: 'var(--radius-full)',
        padding: '4px 10px',
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        Próximamente
      </div>
    </div>
  )
}

/** Shown when the user hasn't joined or created a group yet. */
function NoGroupPrompt() {
  return (
    <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: '1.5rem' }}>
        No estás en ningún grupo todavía.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 280, margin: '0 auto' }}>
        <Link to="/join/nuevo" style={primaryButtonStyle}>Unirme con código</Link>
        <Link to="/join/crear" style={secondaryButtonStyle}>Crear grupo</Link>
      </div>
    </div>
  )
}

/** Placeholder rows displayed while data is loading. */
function SkeletonRows({ count }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} style={{
      margin: '0 var(--page-px) 8px', height: 72,
      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-md)', opacity: 0.5,
    }} />
  ))
}

// ─── Button styles ───────────────────────────────────────────────────────────

const sharedButtonStyle = {
  padding: '12px 0',
  borderRadius: 'var(--radius-md)',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
  textAlign: 'center',
}

const primaryButtonStyle = {
  ...sharedButtonStyle,
  background: 'var(--accent)',
  border: 'none',
  color: '#000',
}

const secondaryButtonStyle = {
  ...sharedButtonStyle,
  background: 'transparent',
  border: '0.5px solid var(--accent)',
  color: 'var(--accent)',
}
