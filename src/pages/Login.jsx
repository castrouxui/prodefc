import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { useGroupStore } from '@/store/groupStore'
import { WC2026_LOGO_URL } from '@/config'

const DEMO_GROUP_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

export default function Login() {
  const navigate       = useNavigate()
  const location       = useLocation()
  const user           = useAuthStore(s => s.user)
  const setActiveGroup = useGroupStore(s => s.setActiveGroup)
  const { signInWithEmail } = useAuth()
  const from = location.state?.from ?? '/'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(null) // 'login' | 'demo' | null
  const [error,    setError]    = useState(null)

  if (user) { navigate(from, { replace: true }); return null }

  async function handleLogin(e) {
    e.preventDefault()
    setError(null); setLoading('login')
    try {
      await signInWithEmail(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
      setLoading(null)
    }
  }

  async function handleDemo() {
    setError(null); setLoading('demo')
    try {
      await signInWithEmail('demo@prodefc.app', 'Demo2025!')
      setActiveGroup(DEMO_GROUP_ID)
      navigate('/')
    } catch (err) {
      setError('No se pudo iniciar la sesión demo.')
      setLoading(null)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1, color: 'var(--text-primary)' }}>
          Prode<span style={{ color: 'var(--accent)' }}>FC</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
          <img src={WC2026_LOGO_URL} alt="FIFA World Cup 2026" height={32} style={{ objectFit: 'contain' }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            FIFA World Cup 2026
          </span>
        </div>
      </div>

      <div style={cardStyle}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              style={inputStyle}
              autoComplete="email"
              disabled={loading !== null}
            />
          </Field>

          <Field label="Contraseña">
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                style={{ ...inputStyle, paddingRight: 44 }}
                autoComplete="current-password"
                disabled={loading !== null}
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

          {error && (
            <p style={{ fontSize: 13, color: 'var(--error-text)', background: 'var(--error-bg)', padding: '10px 12px', borderRadius: 8, margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading !== null}
            style={{
              padding: '12px 0', background: 'var(--accent)', color: '#000',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', opacity: loading === 'login' ? 0.6 : 1, marginTop: 4,
            }}
          >
            {loading === 'login' ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 16, marginBottom: 0 }}>
          ¿No tenés cuenta?{' '}
          <Link to="/register" state={{ from }} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Crear cuenta
          </Link>
        </p>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>o</span>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
        </div>

        <button
          onClick={handleDemo}
          disabled={loading !== null}
          style={{
            width: '100%', padding: '11px 0',
            background: 'var(--accent-dim)', border: '0.5px solid var(--accent)',
            borderRadius: 10, fontSize: 14, fontWeight: 600,
            color: 'var(--accent)', cursor: 'pointer',
            opacity: loading !== null ? 0.5 : 1,
          }}
        >
          {loading === 'demo' ? 'Entrando...' : 'Entrar como invitado'}
        </button>
      </div>
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
