import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const STATUS_ORDER = { live: 0, scheduled: 1, finished: 2 }

export function useMatches({ status, limit } = {}) {
  return useQuery({
    queryKey: ['matches', status, limit],
    queryFn: async () => {
      let query = supabase
        .from('matches')
        .select('*')

      if (status) query = query.eq('status', status)

      const { data, error } = await query
      if (error) throw error

      // Próximos y en vivo primero (fecha ASC), terminados al final (fecha DESC)
      const sorted = (data ?? []).sort((a, b) => {
        const sa = STATUS_ORDER[a.status] ?? 1
        const sb = STATUS_ORDER[b.status] ?? 1
        if (sa !== sb) return sa - sb
        const diff = new Date(a.match_date) - new Date(b.match_date)
        return a.status === 'finished' ? -diff : diff
      })

      return limit ? sorted.slice(0, limit) : sorted
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
