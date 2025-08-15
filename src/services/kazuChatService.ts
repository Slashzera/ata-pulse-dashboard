// Serviço de Chat do Kazu - Integração com OpenRouter
// Arquivo: src/services/kazuChatService.ts

import { generateSystemPrompt, OPENROUTER_CONFIG, CHAT_CONFIG } from '../config/kazuPrompt';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

interface HistoryMessage {
  content: string;
  role: 'user' | 'assistant';
}

// Configuração do OpenRouter
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const tryWithModel = async (
  model: string,
  messages: ChatMessage[]
): Promise<string> => {
  const requestBody = {
    model: model,
    messages: messages,
    max_tokens: OPENROUTER_CONFIG.maxTokens,
    temperature: OPENROUTER_CONFIG.temperature,
    top_p: OPENROUTER_CONFIG.topP,
    frequency_penalty: OPENROUTER_CONFIG.frequencyPenalty,
    presence_penalty: OPENROUTER_CONFIG.presencePenalty
  };

  console.log(`📤 Tentando com modelo: ${model}`);

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'KazuFlow Chatbot'
    },
    body: JSON.stringify(requestBody)
  });

  console.log(`📥 Status da resposta (${model}):`, response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Erro com modelo ${model}:`, response.status, errorText);
    throw new Error(`Modelo ${model} falhou: ${response.status}`);
  }

  const data: OpenRouterResponse = await response.json();
  console.log(`Resposta do modelo ${model}:`, data);

  if (!data.choices || data.choices.length === 0) {
    throw new Error(`Modelo ${model} retornou resposta sem choices`);
  }

  const assistantMessage = data.choices[0].message?.content;

  if (!assistantMessage || assistantMessage.trim() === '') {
    throw new Error(`Modelo ${model} retornou resposta vazia`);
  }

  console.log(`✅ Sucesso com modelo ${model}:`, assistantMessage.substring(0, 100) + '...');
  return assistantMessage.trim();
};

export const sendChatMessage = async (
  message: string, 
  history: HistoryMessage[] = []
): Promise<string> => {
  // Verificar se a API key está configurada
  if (!OPENROUTER_API_KEY) {
    console.error('VITE_OPENROUTER_API_KEY não configurada');
    throw new Error('Configuração da API não encontrada. Verifique se VITE_OPENROUTER_API_KEY está definida no arquivo .env');
  }

  if (!message || typeof message !== 'string') {
    throw new Error('Mensagem é obrigatória');
  }

  try {
    console.log('🔄 Iniciando requisição para OpenRouter...');
    console.log('Modelo configurado:', OPENROUTER_CONFIG.model);
    console.log('Mensagem do usuário:', message);

    // Preparar mensagens para o OpenRouter
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: generateSystemPrompt()
      }
    ];

    // Adicionar histórico (últimas mensagens para contexto)
    if (history.length > 0) {
      history.slice(-CHAT_CONFIG.maxHistoryMessages).forEach((msg) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Adicionar mensagem atual do usuário
    messages.push({
      role: 'user',
      content: message
    });

    const requestBody = {
      model: OPENROUTER_CONFIG.model,
      messages: messages,
      max_tokens: OPENROUTER_CONFIG.maxTokens,
      temperature: OPENROUTER_CONFIG.temperature,
      top_p: OPENROUTER_CONFIG.topP,
      frequency_penalty: OPENROUTER_CONFIG.frequencyPenalty,
      presence_penalty: OPENROUTER_CONFIG.presencePenalty
    };

    console.log('📤 Enviando requisição:', requestBody);

    // Fazer requisição para OpenRouter
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'KazuFlow Chatbot'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Status da resposta:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro OpenRouter:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Chave da API inválida. Verifique a configuração VITE_OPENROUTER_API_KEY');
      } else if (response.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos');
      } else {
        throw new Error(`Erro na API OpenRouter: ${response.status}`);
      }
    }

    const data: OpenRouterResponse = await response.json();

    console.log('Resposta completa da API:', data);

    if (!data.choices || data.choices.length === 0) {
      console.error('Estrutura da resposta:', data);
      throw new Error('Resposta inválida da API - sem choices');
    }

    const assistantMessage = data.choices[0].message?.content;

    if (!assistantMessage || assistantMessage.trim() === '') {
      console.error('Mensagem vazia ou undefined:', data.choices[0]);
      throw new Error('Resposta vazia da API - conteúdo não encontrado');
    }

    console.log('Mensagem recebida:', assistantMessage);
    return assistantMessage.trim();

  } catch (error: any) {
    console.error('Erro no serviço de chat Kazu:', error);
    
    // Re-throw com mensagem mais específica
    if (error.message.includes('fetch')) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente');
    }
    
    throw error;
  }
};

// Função para testar a configuração da API
export const testApiConfiguration = async (): Promise<boolean> => {
  try {
    await sendChatMessage('Teste de configuração');
    return true;
  } catch (error) {
    console.error('Erro no teste de configuração:', error);
    return false;
  }
};