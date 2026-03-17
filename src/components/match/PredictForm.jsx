import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUpsertPrediction } from '@/hooks/usePredictions'

export default function PredictForm({ match, existingPrediction }) {
  const navigate = useNavigate()
  const { mutateAsync, isPending } = useUpsertPrediction()

  const [homeGoals, setHomeGoals] = useState(existingPrediction?.home_pred ?? 0)
  const [awayGoals, setAwayGoals] = useState(existingPrediction?.away_pred ?? 0)

  async function handleSubmit(e) {
    e.preventDefault()
    await mutateAsync({ matchId: match.id, homePred: homeGoals, awayPred: awayGoals })
    navigate('/')
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '1.5rem var(--page-px)' }}>
      {/* Teams */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <TeamInput
          name={match.home_team}
          logo={match.home_logo}
          value={homeGoals}
          onChange={setHomeGoals}
        />
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-tertiary)' }}>—</span>
        <TeamInput
          name={match.away_team}
          logo={match.away_logo}
          value={awayGoals}
          onChange={setAwayGoals}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        style={{
          width: '100%', padding: '12px 0',
          background: 'var(--accent)', color: '#000',
          border: 'none', borderRadius: 'var(--radius-md)',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Guardando...' : existingPrediction ? 'Actualizar pronóstico' : 'Guardar pronóstico'}
      </button>
    </form>
  )
}

function TeamInput({ name, logo, value, onChange }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {logo
        ? <img src={logo} alt={name} width={44} height={44} style={{ borderRadius: '50%' }} />
        : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-inset)' }} />
      }
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>{name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} style={counterButtonStyle}>−</button>
        <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', minWidth: 32, textAlign: 'center' }}>
          {value}
        </span>
        <button type="button" onClick={() => onChange(value + 1)} style={counterButtonStyle}>+</button>
      </div>
    </div>
  )
}

const counterButtonStyle = {
  width: 36, height: 36, borderRadius: '50%',
  background: 'var(--bg-inset)', border: '0.5px solid var(--border)',
  fontSize: 18, fontWeight: 600, color: 'var(--text-primary)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
