import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useGroupStore } from '@/store/groupStore'
import { calculateRanking } from '@/lib/scoring'

export function useRanking() {
  const activeGroupId = useGroupStore(s => s.activeGroupId)

  const query = useQuery({
    queryKey: ['ranking', activeGroupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('user_id, points, profiles(username, avatar_url)')
        .eq('group_id', activeGroupId)
      if (error) throw error
      return calculateRanking(data)
    },
    enabled: !!activeGroupId,
  })

  return query
}
