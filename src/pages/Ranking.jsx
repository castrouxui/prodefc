import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useRanking } from '@/hooks/useRanking'
import { useGroupStore } from '@/store/groupStore'
import RankingTable from '@/components/ranking/RankingTable'

export default function Ranking() {
  const queryClient   = useQueryClient()
  const activeGroupId = useGroupStore(s => s.activeGroupId)
  const { data: ranking = [], isLoading } = useRanking()

  // Realtime: invalidar ranking cuando cambia una prediction del grupo
  useEffect(() => {
    if (!activeGroupId) return

    const channel = supabase
      .channel(`ranking-${activeGroupId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'predictions',
        filter: `group_id=eq.${activeGroupId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['ranking', activeGroupId] })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [activeGroupId, queryClient])

  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ padding: '0 var(--page-px) 16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text-primary)' }}>
          Ranking del grupo
        </h1>
      </div>

      <div style={{ padding: '0 var(--page-px)' }}>
        {isLoading
          ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, padding: '2rem 0' }}>Cargando...</p>
          : <RankingTable entries={ranking} />
        }
      </div>
    </div>
  )
}
