
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userEmail, userName, adminEmail } = await req.json()

    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY não configurada, enviando notificação via console')
      console.log(`Novo usuário pendente: ${userName} (${userEmail})`)
      return new Response(
        JSON.stringify({ success: true, message: 'Notificação registrada no console' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SisCon Caxias <no-reply@siscon-caxias.com>',
        to: [adminEmail],
        subject: 'Novo usuário solicitou acesso ao SisCon Caxias',
        html: `
          <h2>Nova solicitação de acesso</h2>
          <p>Um novo usuário solicitou acesso ao Sistema de Contratos:</p>
          <ul>
            <li><strong>Nome:</strong> ${userName}</li>
            <li><strong>Email:</strong> ${userEmail}</li>
          </ul>
          <p>Acesse o sistema para aprovar ou rejeitar esta solicitação.</p>
        `,
      }),
    })

    if (res.ok) {
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      const error = await res.text()
      throw new Error(error)
    }
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
