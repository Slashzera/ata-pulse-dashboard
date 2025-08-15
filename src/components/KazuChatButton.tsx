import React, { useState } from 'react';
import { MessageCircle, Crown, Sparkles, Bot } from 'lucide-react';
import { KazuChatbot } from './KazuChatbot';

export const KazuChatButton: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Botão para abrir o chat */}
      <div className="relative">
        <button
          onClick={() => setIsChatOpen(true)}
          className="group flex items-center gap-3 w-full px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border border-violet-200 hover:border-violet-300 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
        >
          {/* Ícone animado */}
          <div className="relative">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
              <Crown className="h-5 w-5 text-white" />
            </div>
            {/* Efeito de brilho */}
            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="h-3 w-3 text-yellow-400 animate-pulse" />
            </div>
          </div>

          {/* Texto */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-violet-700 group-hover:text-violet-800">
                Fale com Kazu
              </span>
              <Bot className="h-4 w-4 text-violet-500" />
            </div>
            <p className="text-sm text-violet-600 group-hover:text-violet-700">
              Sua IA Virtual da KazuFlow Tecnologia
            </p>
          </div>

          {/* Indicador de chat */}
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-violet-500 group-hover:text-violet-600" />
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </button>

        {/* Badge "Novo" */}
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
          NOVO
        </div>
      </div>

      {/* Modal do Chatbot */}
      <KazuChatbot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  );
};