import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useGroupStore = create(
  persist(
    (set) => ({
      activeGroupId: null,
      setActiveGroup: (id) => set({ activeGroupId: id }),
    }),
    { name: 'prodefc-group' }
  )
)
