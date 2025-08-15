import { useState, useCallback } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  response: string;
  error?: string;
}

export const useKazuChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    message: string, 
    history: ChatMessage[] = []
  ): Promise<ChatResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/kazu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: history.slice(-10) // Últimas 10 mensagens para contexto
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return {
        response: data.response || 'Desculpe, não consegui processar sua mensagem.'
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Erro desconhecido na comunicação';
      setError(errorMessage);
      
      return {
        response: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
    clearError
  };
};