// supabase/functions/create-preference/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { groupId, userId } = await req.json()

    if (!groupId || !userId) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros: groupId y userId son requeridos' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cliente Supabase con service role (acceso total)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Obtener datos del grupo
    const { data: group, error: gErr } = await supabase
      .from('groups')
      .select('id, name, entry_amount')
      .eq('id', groupId)
      .single()

    if (gErr || !group) {
      return new Response(JSON.stringify({ error: 'Grupo no encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verificar que el usuario es miembro pendiente
    const { data: member } = await supabase
      .from('group_members')
      .select('payment_status')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (member?.payment_status === 'approved') {
      return new Response(JSON.stringify({ error: 'Ya sos miembro activo de este grupo' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173'
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')!

    // Crear preferencia en Mercado Pago
    const preference = {
      items: [{
        id: `prodefc-group-${groupId}`,
        title: `ProdeFC — Entrada al grupo "${group.name}"`,
        quantity: 1,
        unit_price: Number(group.entry_amount),
        currency_id: 'ARS',
      }],
      metadata: {
        group_id: groupId,
        user_id:  userId,
        source:   'prodefc',
      },
      back_urls: {
        success: `${appUrl}/payment/${groupId}?status=success`,
        failure: `${appUrl}/payment/${groupId}?status=failure`,
        pending: `${appUrl}/payment/${groupId}?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
      statement_descriptor: 'ProdeFC',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24hs
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type':  'application/json',
        'X-Idempotency-Key': `prodefc-${groupId}-${userId}-${Date.now()}`,
      },
      body: JSON.stringify(preference),
    })

    if (!mpRes.ok) {
      const mpError = await mpRes.text()
      console.error('MP error:', mpError)
      return new Response(JSON.stringify({ error: 'Error al crear preferencia en Mercado Pago' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const mpData = await mpRes.json()

    // Registrar el intento de pago
    await supabase.from('payments').insert({
      user_id:           userId,
      group_id:          groupId,
      mp_preference_id:  mpData.id,
      amount:            group.entry_amount,
      status:            'pending',
    })

    return new Response(
      JSON.stringify({ init_point: mpData.init_point, preference_id: mpData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('create-preference error:', err)
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
