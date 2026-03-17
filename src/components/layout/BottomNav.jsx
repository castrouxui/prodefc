import { NavLink } from 'react-router-dom'

const tabs = [
  {
    to: '/', label: 'Inicio',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="2" fill={active ? 'var(--accent)' : 'var(--text-tertiary)'} />
        <rect x="11" y="2" width="7" height="7" rx="2" fill="var(--text-tertiary)" opacity={active ? '0.4' : '0.3'} />
        <rect x="2" y="11" width="7" height="7" rx="2" fill="var(--text-tertiary)" opacity={active ? '0.4' : '0.3'} />
        <rect x="11" y="11" width="7" height="7" rx="2" fill="var(--text-tertiary)" opacity={active ? '0.4' : '0.3'} />
      </svg>
    ),
  },
  {
    to: '/fixture', label: 'Fixture',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.5" />
        <path d="M10 6v4l3 2" stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/ranking', label: 'Ranking',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 15l4-4 3 3 5-6" stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/profile', label: 'Perfil',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3" stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.5" />
        <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'var(--bg-card)', borderTop: '0.5px solid var(--border)',
      display: 'flex', justifyContent: 'space-around',
      padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
    }}>
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', minWidth: 48 }}
        >
          {({ isActive }) => (
            <>
              {tab.icon(isActive)}
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
              }}>
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
