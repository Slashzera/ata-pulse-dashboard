import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const InactivityManager = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Tempo de inatividade: 60 minutos (3600000 ms)
  const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 60 minutos
  const WARNING_TIME = 55 * 60 * 1000; // 55 minutos (aviso 5 min antes)

  const resetInactivityTimer = () => {
    lastActivityRef.current = Date.now();
    
    // Limpar timers existentes
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    // Timer de aviso (55 minutos)
    warningTimerRef.current = setTimeout(() => {
      if (user) {
        toast({
          title: "⚠️ Sessão expirando",
          description: "Sua sessão expirará em 5 minutos por inatividade. Mova o mouse para continuar.",
          duration: 10000,
        });
      }
    }, WARNING_TIME);

    // Timer de logout (60 minutos)
    inactivityTimerRef.current = setTimeout(() => {
      if (user) {
        toast({
          title: "🔒 Sessão expirada",
          description: "Você foi desconectado por inatividade (60 minutos).",
          variant: "destructive",
        });
        signOut();
      }
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    if (!user) return;

    // Eventos que indicam atividade do usuário
    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Função para detectar atividade
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Iniciar timer quando usuário faz login
    resetInactivityTimer();

    // Adicionar listeners de atividade
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user, signOut, toast]);

  // Adicionar listener para fechamento do navegador
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Limpar dados de sessão quando fechar o navegador
      sessionStorage.clear();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null;
};

export default InactivityManager;