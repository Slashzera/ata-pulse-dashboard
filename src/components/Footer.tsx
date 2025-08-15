import React from 'react';
import { Crown, Copyright } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center space-y-3">
          {/* Logo e Nome */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg shadow-lg">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              KazuFlow Tecnologia
            </span>
          </div>

          {/* Mensagem de Patente */}
          <div className="text-center max-w-4xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-amber-400" />
              <Copyright className="h-4 w-4 text-amber-400" />
              <span className="text-amber-400 font-semibold text-sm">SISTEMA PATENTEADO</span>
              <Crown className="h-4 w-4 text-amber-400" />
            </div>
            
            <p className="text-gray-300 text-sm leading-relaxed">
              <span className="font-semibold text-white">Sistema desenvolvido e patenteado pela KazuFlow Tecnologia.</span>
              <br />
              <span className="text-red-300 font-medium">Uso não autorizado é proibido, sob as penalidades da Lei nº 9.279/1996.</span>
            </p>
          </div>

          {/* Informações Adicionais */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-gray-400 border-t border-gray-800 pt-4 w-full justify-center">
            <div className="flex items-center gap-1">
              <span>©</span>
              <span>{new Date().getFullYear()} KazuFlow Tecnologia</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-gray-600 rounded-full"></div>
            <span>Todos os direitos reservados</span>
            <div className="hidden sm:block w-1 h-1 bg-gray-600 rounded-full"></div>
            <span>Patente registrada</span>
          </div>
        </div>
      </div>
    </footer>
  );
};