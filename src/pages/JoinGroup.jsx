import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useJoinGroup, useCreateGroup } from '@/hooks/useGroup'
import { useGroupStore } from '@/store/groupStore'

export default function JoinGroup() {
  const { inviteCode: paramCode } = useParams()
  const isCreate = paramCode === 'crear'
  const navigate = useNavigate()
  const setActive = useGroupStore(s => s.setActiveGroup)

  const [code,         setCode]         = useState(paramCode !== 'nuevo' && !isCreate ? paramCode : '')
  const [name,         setName]         = useState('')
  const [amount,       setAmount]       = useState('')
  const [error,        setError]        = useState(null)
  const [createdGroup, setCreatedGroup] = useState(null)
  const [copied,       setCopied]       = useState(false)

  const { mutateAsync: joinGroup,   isPending: joinPending }   = useJoinGroup()
  const { mutateAsync: createGroup, isPending: createPending } = useCreateGroup()

  async function handleJoin(e) {
    e.preventDefault()
    setError(null)
    try {
      const group = await joinGroup(code)
      setActive(group.id)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)
    try {
      const group = await createGroup({ name, entryAmount: parseFloat(amount) || 0 })
      setCreatedGroup(group)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Success screen after creating a group ────────────────────
  if (createdGroup) {
    const joinUrl   = `${import.meta.env.VITE_APP_URL}/join/${createdGroup.invite_code}`
    const shareText = `Unite a mi prode de Champions League 2025/26 🏆\n${joinUrl}`
    const canShare  = typeof navigator.share === 'function'

    return (
      <div style={{ padding: '2rem var(--page-px)', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text-primary)', marginBottom: 6 }}>
            ¡Grupo creado!
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {createdGroup.name}
          </p>
        </div>

        {/* Invite code */}
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1.5rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Código de invitación
          </p>
          <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: 8, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
            {createdGroup.invite_code}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Compartí este código con tus amigos para que se unan
          </p>
        </div>

        {/* Share actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {canShare && (
            <button
              onClick={() => navigator.share({ title: 'ProdeFC', text: shareText, url: joinUrl })}
              style={{
                padding: '13px 0', background: 'var(--accent)', color: '#000',
                border: 'none', borderRadius: 'var(--radius-md)',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Compartir invitación
            </button>
          )}
          <button
            onClick={() => handleCopy(joinUrl)}
            style={{
              padding: '13px 0',
              background: copied ? 'var(--success-bg)' : 'var(--bg-card)',
              color: copied ? 'var(--success-text)' : 'var(--accent)',
              border: `0.5px solid ${copied ? 'var(--success-text)' : 'var(--accent)'}`,
              borderRadius: 'var(--radius-md)',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {copied ? '¡Copiado!' : 'Copiar link'}
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '13px 0', background: 'transparent', border: 'none',
              fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────
  return (
    <div style={{ padding: '1.5rem var(--page-px)' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        {isCreate ? 'Crear grupo' : 'Unirme a un grupo'}
      </h1>

      <form onSubmit={isCreate ? handleCreate : handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isCreate ? (
          <>
            <Field label="Nombre del grupo">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Los pibes del trabajo"
                required
                style={inputStyle}
              />
            </Field>
            <Field label="Monto de entrada (ARS)">
              <input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                type="number"
                min="0"
                placeholder="0 = gratis"
                style={inputStyle}
              />
            </Field>
          </>
        ) : (
          <Field label="Código de invitación">
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              required
              style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: 3, fontSize: 18, fontWeight: 700 }}
            />
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
