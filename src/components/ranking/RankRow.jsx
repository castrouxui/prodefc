import { useAuthStore } from '@/store/authStore'
import Avatar from '@/components/ui/Avatar'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function RankRow({ entry }) {
  const user  = useAuthStore(s => s.user)
  const isMe  = entry.user_id === user?.id
  const isTop = entry.position <= 3
  const medal = MEDALS[entry.position]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px',
      background: isMe ? 'var(--accent-dim)' : 'transparent',
      borderBottom: '0.5px solid var(--border)',
    }}>
      <span style={{
        fontSize: medal ? 16 : 13, fontWeight: 700, width: 18, textAlign: 'center',
        color: isTop && !medal ? 'var(--accent)' : 'var(--text-tertiary)',
      }}>
        {medal ?? entry.position}
      </span>

      <Avatar src={entry.avatar_url} name={entry.username} size={30} />

      <span style={{
        flex: 1, fontSize: 13,
        fontWeight: isMe ? 700 : 500,
        color: 'var(--text-primary)',
      }}>
        {isMe ? `Vos · ${entry.username}` : entry.username}
      </span>

      <span>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
          {entry.total}
        </span>
        <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 2 }}>
          pts
        </span>
      </span>
    </div>
  )
}
