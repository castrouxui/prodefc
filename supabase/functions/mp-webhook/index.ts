// supabase/functions/mp-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Validar firma de Mercado Pago
    const signature  = req.headers.get('x-signature')
    const requestId  = req.headers.get('x-request-id')
    const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET')!

    if (!signature || !webhookSecret) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.text()

    // Verificar HMAC-SHA256
    const url      = new URL(req.url)
    const dataId   = url.searchParams.get('data.id') ?? ''
    const manifest = `id:${dataId};request-id:${requestId};ts:${signature.split(';ts=')[1] ?? ''};`

    const sigParts = Object.fromEntries(signature.split(';').map(p => p.split('=')))
    const expected = createHmac('sha256', webhookSecret).update(manifest).digest('hex')

    if (expected !== sigParts['v1']) {
      console.error('Firma inválida', { expected, received: sigParts['v1'] })
      return new Response('Forbidden', { status: 403 })
    }

    const notification = JSON.parse(body)

    // Solo procesar notificaciones de pagos aprobados
    if (notification.type !== 'payment') {
      return new Response('OK', { status: 200 })
    }

    const paymentId = notification.data?.id
    if (!paymentId) return new Response('OK', { status: 200 })

    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')!

    // Consultar el pago en MP para verificar el estado
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${mpAccessToken}` },
    })

    if (!paymentRes.ok) {
      console.error('Error al consultar pago MP:', await paymentRes.text())
      return new Response('Error', { status: 500 })
    }

    const payment = await paymentRes.json()

    if (payment.status !== 'approved') {
      console.log(`Pago ${paymentId} no aprobado: ${payment.status}`)
      return new Response('OK', { status: 200 })
    }

    const groupId = payment.metadata?.group_id
    const userId  = payment.metadata?.user_id

    if (!groupId || !userId) {
      console.error('Faltan metadata en el pago:', payment.metadata)
      return new Response('Bad metadata', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verificar monto pagado contra el monto del grupo (anti-fraude)
    const { data: group } = await supabase
      .from('groups')
      .select('entry_amount')
      .eq('id', groupId)
      .single()

    if (!group || payment.transaction_amount < group.entry_amount) {
      console.error('Monto incorrecto', { paid: payment.transaction_amount, required: group?.entry_amount })
      return new Response('Amount mismatch', { status: 400 })
    }

    // Activar miembro en el grupo
    const { error: memberErr } = await supabase
      .from('group_members')
      .update({
        payment_status: 'approved',
        payment_id:     String(paymentId),
        paid_at:        new Date().toISOString(),
      })
      .eq('group_id', groupId)
      .eq('user_id', userId)

    if (memberErr) {
      console.error('Error activando miembro:', memberErr)
      return new Response('DB error', { status: 500 })
    }

    // Registrar pago en tabla payments
    await supabase
      .from('payments')
      .update({
        mp_payment_id: String(paymentId),
        status:        'approved',
      })
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('status', 'pending')

    console.log(`Pago aprobado: user ${userId} → grupo ${groupId}`)
    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('mp-webhook error:', err)
    return new Response('Internal error', { status: 500 })
  }
})
