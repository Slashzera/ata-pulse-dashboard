
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExpirationAlertRequest {
  userEmail: string;
  userName: string;
  expiringAtas: Array<{
    n_ata: string;
    vencimento: string;
    favorecido: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, expiringAtas }: ExpirationAlertRequest = await req.json();

    const atasList = expiringAtas.map(ata => 
      `• ATA ${ata.n_ata} - ${ata.favorecido} (Vence em: ${new Date(ata.vencimento).toLocaleDateString('pt-BR')})`
    ).join('\n');

    const emailResponse = await resend.emails.send({
      from: "Sistema de Contratos <contratos@sistema.com>",
      to: [userEmail],
      subject: "⚠️ Alerta de Vencimento de ATAs",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">⚠️ Alerta de Vencimento de ATAs</h2>
          
          <p>Olá ${userName},</p>
          
          <p>Este é um lembrete automático de que as seguintes ATAs estão próximas do vencimento:</p>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <pre style="margin: 0; font-family: Arial, sans-serif;">${atasList}</pre>
          </div>
          
          <p>Por favor, tome as medidas necessárias para renovar ou finalizar estes contratos antes do vencimento.</p>
          
          <p>Este e-mail foi enviado automaticamente pelo Sistema de Contratos.</p>
          
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            Sistema de Contratos - Registro de Contratos de Fornecimento<br>
            ATA de Registro de Preços
          </p>
        </div>
      `,
    });

    console.log("Email de alerta enviado:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email de alerta:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
