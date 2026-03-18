import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useGroupStore } from '@/store/groupStore'

export function usePredictions() {
  const user          = useAuthStore(s => s.user)
  const activeGroupId = useGroupStore(s => s.activeGroupId)

  return useQuery({
    queryKey: ['predictions', user?.id, activeGroupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*, matches(*)')
        .eq('user_id', user.id)
        .eq('group_id', activeGroupId)
      if (error) throw error
      return data
    },
    enabled: !!user && !!activeGroupId,
  })
}

export function usePrediction(matchId) {
  const user          = useAuthStore(s => s.user)
  const activeGroupId = useGroupStore(s => s.activeGroupId)

  return useQuery({
    queryKey: ['prediction', user?.id, matchId, activeGroupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('match_id', matchId)
        .eq('group_id', activeGroupId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user && !!matchId && !!activeGroupId,
  })
}

export function useUpsertPrediction() {
  const queryClient   = useQueryClient()
  const user          = useAuthStore(s => s.user)
  const activeGroupId = useGroupStore(s => s.activeGroupId)

  return useMutation({
    mutationFn: async ({ matchId, homePred, awayPred }) => {
      if (!user?.id)      throw new Error('No estás autenticado.')
      if (!activeGroupId) throw new Error('No tenés un grupo activo.')

      const { data, error } = await supabase
        .from('predictions')
        .upsert({
          user_id:   user.id,
          match_id:  matchId,
          group_id:  activeGroupId,
          home_pred: homePred,
          away_pred: awayPred,
          points:    0,
        }, { onConflict: 'user_id,match_id,group_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: ['prediction', user?.id, matchId, activeGroupId] })
      queryClient.invalidateQueries({ queryKey: ['predictions', user?.id, activeGroupId] })
    },
  })
}
