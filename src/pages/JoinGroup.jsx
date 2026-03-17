import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useJoinGroup, useCreateGroup } from '@/hooks/useGroup'
import { useGroupStore } from '@/store/groupStore'

export default function JoinGroup() {
  const { inviteCode: paramCode } = useParams()
  const isCreate = paramCode === 'crear'
  const navigate = useNavigate()
  const setActive = useGroupStore(s => s.setActiveGroup)

  const [code,   setCode]   = useState(paramCode !== 'nuevo' && !isCreate ? paramCode : '')
  const [name,   setName]   = useState('')
  const [amount, setAmount] = useState('')
  const [error,  setError]  = useState(null)

  const { mutateAsync: joinGroup,   isPending: joinPending }   = useJoinGroup()
  const { mutateAsync: createGroup, isPending: createPending } = useCreateGroup()

  async function handleJoin(e) {
    e.preventDefault()
    setError(null)
    try {
      const group = await joinGroup(code)
      setActive(group.id)
      // Si tiene entry_amount, ir a pagar
      if (group.entry_amount > 0) {
        navigate(`/payment/${group.id}`)
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)
    try {
      await createGroup({ name, entryAmount: parseFloat(amount) || 0 })
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ padding: '1.5rem var(--page-px)' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        {isCreate ? 'Crear grupo' : 'Unirme a un grupo'}
      </h1>

      <form onSubmit={isCreate ? handleCreate : handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isCreate ? (
          <>
            <Field label="Nombre del grupo">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Los pibes del trabajo" required style={inputStyle} />
            </Field>
            <Field label="Monto de entrada (ARS)">
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" placeholder="0 = gratis" style={inputStyle} />
            </Field>
          </>
        ) : (
          <Field label="Código de invitación">
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="XXXXXX" maxLength={6} required style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: 3, fontSize: 18, fontWeight: 700 }} />
          </Field>
        )}

        {error && (
          <p style={{ fontSize: 13, color: 'var(--error-text)', background: 'var(--error-bg)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={joinPending || createPending}
          style={{
            padding: '12px 0', background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            opacity: (joinPending || createPending) ? 0.6 : 1, marginTop: 8,
          }}
        >
          {isCreate ? 'Crear grupo' : 'Continuar'}
        </button>

        <button
          type="button"
          onClick={() => navigate(isCreate ? '/join/nuevo' : '/join/crear')}
          style={{ padding: '10px 0', background: 'transparent', border: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          {isCreate ? 'Mejor me uno a uno existente' : 'Crear un grupo nuevo'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  padding: '12px 14px',
  background: 'var(--bg-card)', border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 500,
  color: 'var(--text-primary)', outline: 'none', width: '100%',
}
