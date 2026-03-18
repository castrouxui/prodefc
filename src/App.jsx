import { BrowserRouter } from 'react-router-dom'
import { useEffect } from 'react'
import AppRouter from './router'
import { useAuthStore } from './store/authStore'
import { supabase } from './lib/supabase'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const setUser = useAuthStore(s => s.setUser)
  const setLoading = useAuthStore(s => s.setLoading)

  // Inicializa el tema desde localStorage o preferencia del sistema
  useTheme()

  // Sync auth state from Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setLoading])

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}
