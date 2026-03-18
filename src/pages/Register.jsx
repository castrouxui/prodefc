import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const user     = useAuthStore(s => s.user)
  const { signUp } = useAuth()

  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [emailSent, setEmailSent] = useState(false)

  if (user) { navigate('/', { replace: true }); return null }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6)  { setError('La contraseña debe tener al menos 6 caracteres.'); return }

    setLoading(true)
    try {
      const data = await signUp(email, password, name)
      if (data.session) {
        // Email confirmation desactivado — sesión inmediata
        // Pequeña espera para que onAuthStateChange actualice el store antes de navegar
        setTimeout(() => navigate('/'), 100)
      } else {
        // Requiere confirmación de email
        setEmailSent(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Email enviado ────────────────────────────────────────────
  if (emailSent) {
    return (
      <div style={pageStyle}>
        <Logo />
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Revisá tu email
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Te enviamos un link de confirmación a <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 8, lineHeight: 1.5 }}>
              Hacé clic en el link del mail para activar tu cuenta. Revisá también la carpeta de spam.
            </p>
          </div>
          <Link to="/login" style={primaryButtonStyle}>
            Ir al login
          </Link>
        </div>
      </div>
    )
  }

  // ── Formulario ───────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <Logo />

      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, textAlign: 'center' }}>
          Crear cuenta
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Nombre">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              style={inputStyle}
              autoComplete="name"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              style={inputStyle}
              autoComplete="email"
            />
          </Field>

          <Field label="Contraseña">
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                style={{ ...inputStyle, paddingRight: 44 }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-tertiary)' }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </Field>

          <Field label="Repetir contraseña">
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repetí la contraseña"
              required
              style={inputStyle}
              autoComplete="new-password"
            />
          </Field>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--error-text)', background: 'var(--error-bg)', padding: '10px 12px', borderRadius: 8, margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ ...primaryButtonStyle, opacity: loading ? 0.6 : 1, marginTop: 4, border: 'none', cursor: 'pointer' }}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 16 }}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1, color: 'var(--text-primary)' }}>
        Prode<span style={{ color: 'var(--accent)' }}>FC</span>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
        Champions League 2025/26
      </p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: 'var(--bg-app)', padding: '2rem 1.5rem',
}

const cardStyle = {
  width: '100%', maxWidth: 340,
  background: 'var(--bg-card)', border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-lg)', padding: '1.75rem 1.5rem',
}

const inputStyle = {
  padding: '11px 14px',
  background: 'var(--bg-inset)', border: '0.5px solid var(--border-strong)',
  borderRadius: 10, fontSize: 15, color: 'var(--text-primary)',
  outline: 'none', width: '100%', boxSizing: 'border-box',
}

const primaryButtonStyle = {
  display: 'block', width: '100%', padding: '12px 0',
  background: 'var(--accent)', color: '#000',
  borderRadius: 10, fontSize: 15, fontWeight: 700,
  textAlign: 'center', textDecoration: 'none',
}
