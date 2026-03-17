import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGroup } from '@/hooks/useGroup'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

export default function Payment() {
  const { groupId } = useParams()
  const navigate    = useNavigate()
  const user        = useAuthStore(s => s.user)
  const { data: group, isLoading } = useGroup(groupId)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // Escuchar cambio de payment_status via Realtime
  useEffect(() => {
    if (!user || !groupId) return

    const channel = supabase
      .channel(`payment-${groupId}-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'group_members',
        filter: `group_id=eq.${groupId}`,
      }, (payload) => {
        if (payload.new.user_id === user.id && payload.new.payment_status === 'approved') {
          navigate('/')
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, groupId, navigate])

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-preference', {
        body: { groupId, userId: user.id },
      })
      if (invokeError) throw invokeError
      if (!data?.init_point) throw new Error('No se pudo generar el link de pago')
      window.location.href = data.init_point
    } catch (err) {
      setError(err.message ?? 'Error al generar el pago')
      setLoading(false)
    }
  }

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Cargando...</div>
  }

  if (!group) return null

  return (
    <div style={{ padding: '2rem var(--page-px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
          Entrada al grupo
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text-primary)' }}>
          {group.name}
        </h1>
      </div>

      {/* Amount card */}
      <div style={{
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Monto de entrada
        </span>
        <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1, color: 'var(--text-primary)' }}>
          ${Number(group.entry_amount).toLocaleString('es-AR')}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          ARS · pago único
        </span>
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          'Pagás una sola vez para unirte al grupo',
          'Se acepta automáticamente al confirmar el pago',
          'El pago se procesa a través de Mercado Pago',
        ].map((text, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginTop: 5, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--error-text)', background: 'var(--error-bg)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={handlePay}
        disabled={loading}
        style={{
          padding: '14px 0', background: 'var(--accent)', color: '#000',
          border: 'none', borderRadius: 'var(--radius-md)',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Redirigiendo a Mercado Pago...' : 'Pagar con Mercado Pago'}
      </button>

      <button
        onClick={() => navigate('/')}
        style={{ padding: '10px 0', background: 'transparent', border: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}
      >
        Volver al inicio
      </button>
    </div>
  )
}
