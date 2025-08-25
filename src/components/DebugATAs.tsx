import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Search, Database } from 'lucide-react';

const DebugATAs: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const forceRefreshATAs = () => {
    // Invalidar e forçar refetch das ATAs
    queryClient.invalidateQueries({ queryKey: ['atas'] });
    queryClient.refetchQueries({ queryKey: ['atas'] });
    
    toast({
      title: "🔄 Atualizando ATAs",
      description: "Forçando atualização da lista de ATAs...",
    });
  };

  const searchATA085 = async () => {
    try {
      const { data, error } = await supabase
        .from('atas')
        .select('*')
        .eq('n_ata', '085/2025');
      
      if (error) {
        console.error('Erro ao buscar ATA 085/2025:', error);
        toast({
          title: "❌ Erro",
          description: `Erro ao buscar ATA: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Resultado da busca ATA 085/2025:', data);
      
      if (data && data.length > 0) {
        const ata = data[0];
        toast({
          title: "✅ ATA 085/2025 Encontrada!",
          description: `Status: ${ata.is_deleted ? 'Deletada' : 'Ativa'} | Favorecido: ${ata.favorecido}`,
        });
      } else {
        toast({
          title: "⚠️ ATA 085/2025 Não Encontrada",
          description: "A ATA não existe no banco de dados",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao executar busca",
        variant: "destructive",
      });
    }
  };

  const restoreATA085 = async () => {
    try {
      const { data, error } = await supabase
        .from('atas')
        .update({ is_deleted: false })
        .eq('n_ata', '085/2025')
        .select();
      
      if (error) {
        console.error('Erro ao restaurar ATA 085/2025:', error);
        toast({
          title: "❌ Erro",
          description: `Erro ao restaurar ATA: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        toast({
          title: "✅ ATA 085/2025 Restaurada!",
          description: "A ATA foi restaurada e deve aparecer na lista",
        });
        
        // Forçar refresh após restaurar
        forceRefreshATAs();
      } else {
        toast({
          title: "⚠️ Nenhuma ATA Restaurada",
          description: "ATA 085/2025 não foi encontrada para restaurar",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro na restauração:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao executar restauração",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Database className="h-5 w-5" />
          Debug ATAs - Ferramenta Temporária
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={forceRefreshATAs}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Forçar Atualização
          </Button>
          
          <Button
            onClick={searchATA085}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Buscar ATA 085/2025
          </Button>
          
          <Button
            onClick={restoreATA085}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <RefreshCw className="h-4 w-4" />
            Restaurar ATA 085/2025
          </Button>
        </div>
        
        <p className="text-sm text-orange-700 mt-3">
          Use estes botões para diagnosticar e corrigir o problema da ATA 085/2025 que não aparece na lista.
        </p>
      </CardContent>
    </Card>
  );
};

export default DebugATAs;