import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useMyGroups } from '@/hooks/useGroup'
import { useGroupStore } from '@/store/groupStore'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

export default function Profile() {
  const navigate      = useNavigate()
  const user          = useAuthStore(s => s.user)
  const activeGroupId = useGroupStore(s => s.activeGroupId)
  const setActive     = useGroupStore(s => s.setActiveGroup)
  const { signOut }   = useAuth()
  const { data: myGroups = [] } = useMyGroups()

  const { theme, toggle: toggleTheme } = useTheme()
  const name = user?.user_metadata?.full_name ?? user?.email ?? 'Usuario'

  const [copiedId, setCopiedId] = useState(null)
  function copyCode(code, groupId) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(groupId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={{ padding: '1.5rem var(--page-px)' }}>
      {/* User info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '2rem' }}>
        <Avatar src={user?.user_metadata?.avatar_url} name={name} size={56} />
        <div>
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{name}</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.email}</p>
        </div>
      </div>

      {/* Mis grupos */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>
          Mis grupos
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {myGroups.map(({ groups: group, payment_status }) => (
            <div
              key={group.id}
              style={{
                background: activeGroupId === group.id ? 'var(--accent-dim)' : 'var(--bg-card)',
                border: `0.5px solid ${activeGroupId === group.id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)', overflow: 'hidden',
              }}
            >
              {/* Top row — tap to activate */}
              <button
                onClick={() => { setActive(group.id); navigate('/') }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', width: '100%',
                  background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{group.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    ${Number(group.entry_amount).toLocaleString('es-AR')} ARS
                  </p>
                </div>
                <Badge variant={payment_status === 'approved' ? 'success' : 'pending'}>
                  {payment_status === 'approved' ? 'Activo' : 'Pendiente'}
                </Badge>
              </button>

              {/* Bottom row — invite code + copy */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 14px 10px',
                borderTop: '0.5px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Código:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: 'var(--text-primary)' }}>
                    {group.invite_code}
                  </span>
                </div>
                <button
                  onClick={() => copyCode(group.invite_code, group.id)}
                  style={{
                    padding: '4px 10px',
                    background: copiedId === group.id ? 'var(--success-bg)' : 'var(--bg-inset)',
                    border: 'none',
                    borderRadius: 9999,
                    fontSize: 11, fontWeight: 600,
                    color: copiedId === group.id ? 'var(--success-text)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {copiedId === group.id ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => navigate('/join/nuevo')}
            style={{
              padding: '12px 14px', background: 'transparent',
              border: '0.5px dashed var(--border-strong)',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: 'var(--accent)', textAlign: 'left',
            }}
          >
            + Unirme a otro grupo
          </button>
        </div>
      </div>

      {/* Apariencia */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>
          Apariencia
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-md)',
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
            {theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}
          </span>
          <button
            onClick={toggleTheme}
            style={{
              width: 48, height: 28,
              borderRadius: 14,
              background: theme === 'dark' ? 'var(--accent)' : 'var(--bg-inset)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: theme === 'dark' ? 23 : 3,
              width: 22, height: 22, borderRadius: '50%',
              background: theme === 'dark' ? '#000' : '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'left 0.2s',
              display: 'block',
            }} />
          </button>
        </div>
      </div>

      {/* My predictions */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/my-predictions')}
          style={{
            width: '100%', padding: '12px 14px',
            background: 'var(--bg-card)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Mis pronósticos
          </span>
          <span style={{ fontSize: 18, color: 'var(--text-tertiary)' }}>›</span>
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        style={{
          width: '100%', padding: '12px 0',
          background: 'var(--error-bg)', border: 'none',
          borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
          color: 'var(--error-text)', cursor: 'pointer',
        }}
      >
        Cerrar sesión
      </button>
    </div>
  )
}
