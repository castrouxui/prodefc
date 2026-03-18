import { useState } from 'react'
import { useMatchInsights } from '@/hooks/useMatchInsights'

/**
 * Panel de análisis y sugerencia de pronóstico.
 * Se muestra en la pantalla /predict/:matchId.
 */
export default function MatchInsights({ match }) {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useMatchInsights(match)

  return (
    <div style={{ margin: '0 var(--page-px) 16px' }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '11px 14px',
          background: 'var(--accent-dim)', border: '0.5px solid var(--accent)',
          borderRadius: open ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📊</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
            Ver análisis y sugerencia
          </span>
        </div>
        <span style={{
          fontSize: 11, color: 'var(--accent)',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s', display: 'inline-block',
        }}>▼</span>
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderTop: 'none',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          padding: '16px 14px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {isLoading
            ? <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>Calculando...</p>
            : <>
                <ProbabilitySection data={data} match={match} />
                <FormSection label={match.home_team} form={data.homeForm} logo={match.home_logo} />
                <FormSection label={match.away_team} form={data.awayForm} logo={match.away_logo} />
                {data.h2h?.length > 0 && <H2HSection h2h={data.h2h} homeTeam={match.home_team} />}
                <SuggestionBubble data={data} match={match} />
              </>
          }
        </div>
      )}
    </div>
  )
}

// ─── Secciones ───────────────────────────────────────────────────────────────

function ProbabilitySection({ data, match }) {
  const bars = [
    { label: match.home_team.split(' ').slice(-1)[0], pct: data.homeWinPct, color: 'var(--accent)' },
    { label: 'Empate',                                pct: data.drawPct,    color: 'var(--text-tertiary)' },
    { label: match.away_team.split(' ').slice(-1)[0], pct: data.awayWinPct, color: 'var(--pending-text)' },
  ]

  return (
    <div>
      <SectionLabel>Probabilidades · {data.source}</SectionLabel>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {bars.map(b => (
          <div key={b.label} style={{ flex: b.pct, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%', height: 6,
              background: b.color, borderRadius: 99,
              opacity: b.pct < 15 ? 0.4 : 1,
            }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: b.color }}>{b.pct}%</span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FormSection({ label, form, logo }) {
  if (!form?.length) return null

  const colors = { W: 'var(--success-text)', D: 'var(--text-tertiary)', L: 'var(--error-text)' }
  const bg     = { W: 'var(--success-bg)',   D: 'var(--bg-inset)',      L: 'var(--error-bg)'   }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
        {logo && <img src={logo} alt="" width={14} height={14} style={{ objectFit: 'contain' }} />}
        <SectionLabel style={{ margin: 0 }}>{label} · últimos {form.length}</SectionLabel>
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {form.map((r, i) => (
          <div key={i} style={{
            width: 28, height: 28, borderRadius: 'var(--radius-sm)',
            background: bg[r], display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors[r] }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function H2HSection({ h2h, homeTeam }) {
  const homeWins = h2h.filter(m => resultFor(m, homeTeam) === 'W').length
  const draws    = h2h.filter(m => resultFor(m, homeTeam) === 'D').length
  const awayWins = h2h.length - homeWins - draws

  return (
    <div>
      <SectionLabel>Historial directo · {h2h.length} partidos</SectionLabel>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <StatPill value={homeWins} label="Victorias local" color="var(--accent)" />
        <StatPill value={draws}    label="Empates"         color="var(--text-tertiary)" />
        <StatPill value={awayWins} label="Victorias visit" color="var(--pending-text)" />
      </div>
    </div>
  )
}

function SuggestionBubble({ data, match }) {
  const best = data.homeWinPct >= data.awayWinPct && data.homeWinPct >= data.drawPct
    ? { outcome: `${match.home_team}`, pct: data.homeWinPct, label: 'local' }
    : data.awayWinPct >= data.drawPct
    ? { outcome: `${match.away_team}`, pct: data.awayWinPct, label: 'visitante' }
    : { outcome: 'Empate', pct: data.drawPct, label: null }

  const noData = data.homeForm?.length === 0 && data.awayForm?.length === 0

  return (
    <div style={{
      background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)',
      padding: '10px 12px',
      borderLeft: '3px solid var(--accent)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
        Estadística sugiere
      </p>
      {noData
        ? <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>
            Sin datos históricos suficientes aún.
          </p>
        : <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            Basado en {data.source}, <strong>{best.outcome}</strong>{best.label ? ` (${best.label})` : ''} tiene más chances estadísticas ({best.pct}%). Recordá que en el fútbol siempre puede pasar cualquier cosa.
          </p>
      }
    </div>
  )
}

// ─── Primitivos ──────────────────────────────────────────────────────────────

function SectionLabel({ children, style }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0, ...style }}>
      {children}
    </p>
  )
}

function StatPill({ value, label, color }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)', padding: '8px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function resultFor(match, team) {
  const isHome = match.home_team === team
  const my = isHome ? match.home_score : match.away_score
  const op = isHome ? match.away_score : match.home_score
  if (my > op) return 'W'
  if (my === op) return 'D'
  return 'L'
}
