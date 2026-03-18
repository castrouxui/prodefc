import { supabase } from '@/lib/supabase'

// Mapea errores de Supabase Auth a mensajes en español
function authError(error) {
  const msg = error?.message ?? ''
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (msg.includes('Email not confirmed'))       return 'Confirmá tu email antes de ingresar.'
  if (msg.includes('User already registered'))   return 'Ya existe una cuenta con ese email.'
  if (msg.includes('Password should be'))        return 'La contraseña debe tener al menos 6 caracteres.'
  if (msg.includes('Unable to validate'))        return 'Email inválido.'
  if (msg.includes('Email rate limit'))          return 'Demasiados intentos. Esperá unos minutos.'
  return msg || 'Ocurrió un error. Intentá de nuevo.'
}

export function useAuth() {
  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: import.meta.env.VITE_APP_URL,
        data: { full_name: name || email.split('@')[0] },
      },
    })
    if (error) throw new Error(authError(error))
    return data
  }

  async function signInWithEmail(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(authError(error))
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { signUp, signInWithEmail, signOut }
}
