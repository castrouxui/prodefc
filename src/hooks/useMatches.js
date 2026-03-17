import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useMatches({ status, limit } = {}) {
  return useQuery({
    queryKey: ['matches', status, limit],
    queryFn: async () => {
      let query = supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true })

      if (status) query = query.eq('status', status)
      if (limit)  query = query.limit(limit)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useMatch(matchId) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!matchId,
  })
}
