import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAtas } from '@/hooks/useAtas';
import { usePedidos } from '@/hooks/usePedidos';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import ExpirationAlerts from '@/components/ExpirationAlerts';
import { Footer } from '@/components/Footer';
import { KazuChatButton } from '@/components/KazuChatButton';
import CreateAdesaoDialog from '@/components/CreateAdesaoDialog';
import CreateAquisicaoGlobalDialog from '@/components/CreateAquisicaoGlobalDialog';
import CreateContratoAntigoDialog from '@/components/CreateContratoAntigoDialog';
import CreateATADialog from '@/components/CreateATADialog';
import CreateTACDialog from '@/components/CreateTACDialog';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';
import { Plus, FileText, Globe, UserPlus, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCreateTac } from '@/hooks/useTacs';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

const Index = () => {
  const { user, loading } = useAuth();
  const { data: atas = [], isLoading: isLoadingAtas } = useAtas();
  const { data: pedidos = [], isLoading: isLoadingPedidos } = usePedidos();
  const [isAdesaoDialogOpen, setIsAdesaoDialogOpen] = useState(false);
  const [isAquisicaoGlobalDialogOpen, setIsAquisicaoGlobalDialogOpen] = useState(false);
  const [isContratoAntigoDialogOpen, setIsContratoAntigoDialogOpen] = useState(false);
  const [isCreateATADialogOpen, setIsCreateATADialogOpen] = useState(false);
  const [showTACDialog, setShowTACDialog] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  // Debug logs para os estados dos diálogos
  React.useEffect(() => {
    console.log('Estados dos diálogos:', {
      isCreateATADialogOpen,
      isAdesaoDialogOpen,
      isContratoAntigoDialogOpen,
      isAquisicaoGlobalDialogOpen,
      currentView
    });
  }, [isCreateATADialogOpen, isAdesaoDialogOpen, isContratoAntigoDialogOpen, isAquisicaoGlobalDialogOpen, currentView]);
  const [processoSearch, setProcessoSearch] = useState('');
  const createTacMutation = useCreateTac();

  // Efeito para ouvir o evento de abertura do modal do TAC
  React.useEffect(() => {
    const handleOpenTACModal = () => {
      console.log('EVENTO TAC RECEBIDO - ABRINDO MODAL');
      setShowTACDialog(true);
    };

    window.addEventListener('openTACModal', handleOpenTACModal);
    return () => {
      window.removeEventListener('openTACModal', handleOpenTACModal);
    };
  }, []);

  const handleReturnToMain = () => {
    setCurrentView('dashboard');
  };

  const handleTACSubmit = async (tacData: {
    nomeEmpresa: string;
    numeroProcesso: string;
    dataEntrada: string;
    assuntoObjeto: string;
    nNotas: string;
    valor: number;
    unidadeBeneficiada: string;
    arquivo: File;
    additionalFiles?: File[];
  }) => {
    try {
      await createTacMutation.mutateAsync({
        nomeEmpresa: tacData.nomeEmpresa,
        numeroProcesso: tacData.numeroProcesso,
        dataEntrada: tacData.dataEntrada,
        assuntoObjeto: tacData.assuntoObjeto,
        nNotas: parseInt(tacData.nNotas) || 0,
        valor: tacData.valor,
        unidadeBeneficiada: tacData.unidadeBeneficiada,
        file: tacData.arquivo,
        additionalFiles: tacData.additionalFiles
      });
      const totalFiles = 1 + (tacData.additionalFiles?.length || 0);
      toast.success(`TAC criado com sucesso! ${totalFiles} arquivo(s) anexado(s).`);
      setShowTACDialog(false);
    } catch (error) {
      console.error('Erro ao salvar o TAC:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      toast.error(`Erro ao salvar o TAC: ${errorMessage}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoadingAtas || isLoadingPedidos) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onReturnToMain={handleReturnToMain} />
        <div className="flex justify-center items-center h-96">
          <div>Carregando dados...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster richColors position="top-right" />
      <Header onReturnToMain={handleReturnToMain} />
      <div className="container mx-auto px-6 py-8">
        <ExpirationAlerts atas={atas} />
        
        {/* Botões de criação - visíveis apenas na dashboard principal */}
        {currentView === 'dashboard' && (
          <div className="flex gap-3 mb-6">
            <Button 
              onClick={() => {
                console.log('Botão Nova ATA clicado');
                setIsCreateATADialogOpen(true);
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
            >
              <Plus className="h-4 w-4 mr-2 drop-shadow-sm" />
              Nova ATA
            </Button>
            
            <Button 
              onClick={() => {
                console.log('Botão Nova Adesão clicado');
                setIsAdesaoDialogOpen(true);
              }}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
            >
              <UserPlus className="h-4 w-4 mr-2 drop-shadow-sm" />
              Nova Adesão
            </Button>
            
            <Button 
              onClick={() => {
                console.log('Botão Novo Saldo de Atas clicado');
                setIsContratoAntigoDialogOpen(true);
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
            >
              <FileText className="h-4 w-4 mr-2 drop-shadow-sm" />
              Novo Saldo de Atas (Contratos Antigos)
            </Button>
            
            <Button 
              onClick={() => {
                console.log('Botão Nova Aquisição Global clicado');
                setIsAquisicaoGlobalDialogOpen(true);
              }}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
            >
              <Globe className="h-4 w-4 mr-2 drop-shadow-sm" />
              Nova Aquisição Global
            </Button>
          </div>
        )}
        
        {/* Fale com Kazu - IA Virtual */}
        <div className="mb-6">
          <KazuChatButton />
        </div>
        
        <Dashboard 
          atas={atas} 
          pedidos={pedidos} 
          currentView={currentView} 
          onViewChange={setCurrentView} 
        />
      </div>

      <CreateTACDialog 
        isOpen={showTACDialog}
        onClose={() => setShowTACDialog(false)}
        onSubmit={handleTACSubmit}
      />

      <CreateATADialog
        isOpen={isCreateATADialogOpen}
        onClose={() => setIsCreateATADialogOpen(false)}
      />

      <CreateAdesaoDialog
        isOpen={isAdesaoDialogOpen}
        onClose={() => setIsAdesaoDialogOpen(false)}
      />

      <CreateAquisicaoGlobalDialog
        isOpen={isAquisicaoGlobalDialogOpen}
        onClose={() => setIsAquisicaoGlobalDialogOpen(false)}
      />

      <CreateContratoAntigoDialog
        isOpen={isContratoAntigoDialogOpen}
        onClose={() => setIsContratoAntigoDialogOpen(false)}
      />

      {/* Footer com informações de patente */}
      <Footer />
    </div>
  );
};

export default Index;
