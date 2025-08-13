
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar logs de auditoria das últimas 24 horas
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!logs || logs.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhuma atividade nas últimas 24 horas" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Gerar relatório em HTML
    const logsList = logs.map(log => 
      `<tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(log.created_at).toLocaleString('pt-BR')}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${log.user_email}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${log.action}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${log.table_name}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${log.justification || '-'}</td>
      </tr>`
    ).join('');

    // Gerar CSV para anexo
    const csvContent = [
      'Data/Hora,Usuário,Ação,Tabela,Justificativa,IP,User Agent',
      ...logs.map(log => 
        `"${new Date(log.created_at).toLocaleString('pt-BR')}","${log.user_email}","${log.action}","${log.table_name}","${log.justification || ''}","${log.ip_address}","${log.user_agent}"`
      )
    ].join('\n');

    const emailResponse = await resend.emails.send({
      from: "Sistema de Contratos <contratos@sistema.com>",
      to: ["drfeliperodrigues@outlook.com"],
      subject: `📊 Relatório de Auditoria - ${new Date().toLocaleDateString('pt-BR')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h2 style="color: #1f2937;">📊 Relatório de Auditoria do Sistema</h2>
          
          <p>Relatório de atividades das últimas 24 horas.</p>
          
          <p><strong>Total de ações registradas:</strong> ${logs.length}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Data/Hora</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Usuário</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Ação</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tabela</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Justificativa</th>
              </tr>
            </thead>
            <tbody>
              ${logsList}
            </tbody>
          </table>
          
          <p>Relatório completo em CSV em anexo.</p>
          
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            Sistema de Contratos - Relatório Automático de Auditoria<br>
            Gerado em: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      `,
      attachments: [{
        filename: `audit_report_${new Date().toISOString().split('T')[0]}.csv`,
        content: Buffer.from(csvContent).toString('base64'),
      }],
    });

    console.log("Relatório de auditoria enviado:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar relatório de auditoria:", error);
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
