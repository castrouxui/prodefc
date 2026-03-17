import { useAuthStore } from '@/store/authStore'
import { useGroupStore } from '@/store/groupStore'
import { useGroup } from '@/hooks/useGroup'
import Avatar from '@/components/ui/Avatar'

export default function TopBar() {
  const user          = useAuthStore(s => s.user)
  const activeGroupId = useGroupStore(s => s.activeGroupId)
  const { data: group } = useGroup(activeGroupId)

  return (
    <header style={{ background: 'var(--bg-app)' }} className="flex items-center justify-between px-4 pt-4 pb-3">
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
        Prode<span style={{ color: 'var(--accent)' }}>FC</span>
      </div>

      <div className="flex items-center gap-2">
        {group && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-card)', border: '0.5px solid var(--border)',
            borderRadius: 20, padding: '5px 12px',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {group.name}
            </span>
          </div>
        )}
        <Avatar
          src={user?.user_metadata?.avatar_url}
          name={user?.user_metadata?.full_name ?? user?.email ?? '?'}
          size={34}
        />
      </div>
    </header>
  )
}
