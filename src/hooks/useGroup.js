import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { generateInviteCode } from '@/config'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useGroupStore } from '@/store/groupStore'

export function useGroup(groupId) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*, group_members(count)')
        .eq('id', groupId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!groupId,
  })
}

export function useMyGroups() {
  const user = useAuthStore(s => s.user)

  return useQuery({
    queryKey: ['my-groups', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('groups(*), payment_status')
        .eq('user_id', user.id)
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  const user        = useAuthStore(s => s.user)
  const setActive   = useGroupStore(s => s.setActiveGroup)

  return useMutation({
    mutationFn: async ({ name, entryAmount }) => {
      const inviteCode = generateInviteCode()

      const { data: group, error: gErr } = await supabase
        .from('groups')
        .insert({ name, entry_amount: entryAmount, invite_code: inviteCode, created_by: user.id })
        .select()
        .single()
      if (gErr) throw gErr

      // Admin entra directo sin pagar
      const { error: mErr } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, payment_status: 'approved' })
      if (mErr) throw mErr

      return group
    },
    onSuccess: (group) => {
      setActive(group.id)
      queryClient.invalidateQueries({ queryKey: ['my-groups', user?.id] })
    },
  })
}

export function useJoinGroup() {
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async (inviteCode) => {
      const { data: group, error: gErr } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()
      if (gErr) throw new Error('Código de grupo inválido')

      // Verificar si ya es miembro
      const { data: existing } = await supabase
        .from('group_members')
        .select('id, payment_status')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing?.payment_status === 'approved') throw new Error('Ya sos miembro de este grupo')

      // Crear membresía aprobada (pago se gestiona fuera de la app por ahora)
      if (!existing) {
        const { error: mErr } = await supabase
          .from('group_members')
          .insert({ group_id: group.id, user_id: user.id, payment_status: 'approved' })
        if (mErr) throw mErr
      }

      return group
    },
  })
}
