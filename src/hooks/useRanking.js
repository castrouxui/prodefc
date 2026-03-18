import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useGroupStore } from '@/store/groupStore'
import { calculateRanking } from '@/lib/scoring'

export function useRanking() {
  const activeGroupId = useGroupStore(s => s.activeGroupId)

  const query = useQuery({
    queryKey: ['ranking', activeGroupId],
    queryFn: async () => {
      const [predsRes, membersRes] = await Promise.all([
        supabase
          .from('predictions')
          .select('user_id, points, profiles(username, avatar_url)')
          .eq('group_id', activeGroupId),
        supabase
          .from('group_members')
          .select('user_id, position, prev_position')
          .eq('group_id', activeGroupId),
      ])
      if (predsRes.error)   throw predsRes.error
      if (membersRes.error) throw membersRes.error

      const ranking  = calculateRanking(predsRes.data)
      const prevByUser = Object.fromEntries(
        (membersRes.data ?? []).map(m => [m.user_id, m.prev_position])
      )

      return ranking.map(entry => ({
        ...entry,
        prev_position: prevByUser[entry.user_id] ?? entry.position,
      }))
    },
    enabled: !!activeGroupId,
  })

  return query
}
