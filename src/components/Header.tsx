import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Database, Users, Key, Heart, Shield, Clock, Trash2 } from 'lucide-react';
import BackupDialog from '@/components/BackupDialog';
import ExportToPDF from '@/components/ExportToPDF';
import ExportCategoryReport from '@/components/ExportCategoryReport';
import UserManagement from '@/components/UserManagement';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import TrashManager from '@/components/TrashManager';
import { useAtas } from '@/hooks/useAtas';
import { usePedidos } from '@/hooks/usePedidos';

interface HeaderProps {
  onReturnToMain?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReturnToMain }) => {
  const { user, signOut } = useAuth();
  const { data: atas = [] } = useAtas();
  const { data: pedidos = [] } = usePedidos();
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
  };

  const getUserName = () => {
    if (user?.user_metadata?.nome) {
      return user.user_metadata.nome;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuário';
  };

  const getCurrentDateTime = () => {
    return new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Verificar se o usuário atual é o Felipe Rodrigues (administrador)
  const isAdmin = user?.email === 'drfeliperodrigues@outlook.com';

  return (
    <>
      <header className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-2xl overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"></div>
        
        {/* Floating geometric shapes for visual appeal */}
        <div className="absolute top-4 right-20 w-16 h-16 bg-white/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-4 left-20 w-12 h-12 bg-purple-300/10 rounded-full blur-lg animate-pulse delay-1000"></div>
        
        <div className="relative container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Left section - Logo and title */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-white/15 backdrop-blur-sm p-4 rounded-full border border-white/20 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-8 w-8 text-red-300 group-hover:text-red-200 transition-colors duration-300" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 
                  className="text-4xl font-bold tracking-wide bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent drop-shadow-2xl cursor-pointer hover:scale-105 transition-all duration-300 hover:drop-shadow-3xl"
                  onClick={onReturnToMain}
                  title="Clique para voltar ao menu principal"
                >
                  Sisgecon Saúde
                </h1>
                <p className="text-blue-100/90 text-sm font-medium max-w-2xl leading-relaxed">
                  Sistema de Gestão e Contratos - Secretaria Municipal de Saúde de Duque de Caxias
                </p>
                <div className="flex items-center gap-2 text-blue-200/80 text-xs">
                  <Clock className="h-4 w-4" />
                  <span>{getCurrentDateTime()}</span>
                </div>
              </div>
            </div>
            
            {/* Right section - User info and actions */}
            <div className="flex flex-col items-end gap-4">
              {/* User information card */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-5 py-3 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-400 to-purple-400 p-2 rounded-full">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{getUserName()}</p>
                    <p className="text-xs text-blue-100/80 font-medium">{user?.email}</p>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <ExportToPDF atas={atas} pedidos={pedidos} />
                  <ExportCategoryReport atas={atas} pedidos={pedidos} />
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsBackupDialogOpen(true)}
                  className="text-white border-blue-300/80 hover:bg-gradient-to-r hover:from-blue-600/80 hover:to-indigo-600/80 hover:border-blue-200/90 bg-gradient-to-r from-blue-700/90 to-indigo-700/90 backdrop-blur-md font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-lg"
                >
                  <Database className="h-4 w-4 mr-2 text-white" />
                  Backup Sistema
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="text-white border-purple-300/80 hover:bg-gradient-to-r hover:from-purple-600/80 hover:to-pink-600/80 hover:border-purple-200/90 bg-gradient-to-r from-purple-700/90 to-pink-700/90 backdrop-blur-md font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-lg"
                >
                  <Key className="h-4 w-4 mr-2 text-white" />
                  Alterar Senha
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsTrashOpen(true)}
                  className="text-white border-orange-300/80 hover:bg-gradient-to-r hover:from-orange-600/80 hover:to-amber-600/80 hover:border-orange-200/90 bg-gradient-to-r from-orange-700/90 to-amber-700/90 backdrop-blur-md font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-lg"
                >
                  <Trash2 className="h-4 w-4 mr-2 text-white" />
                  Lixeira
                </Button>

                {isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsUserManagementOpen(true)}
                    className="text-white border-emerald-300/80 hover:bg-gradient-to-r hover:from-emerald-600/80 hover:to-teal-600/80 hover:border-emerald-200/90 bg-gradient-to-r from-emerald-700/90 to-teal-700/90 backdrop-blur-md font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-lg"
                  >
                    <Users className="h-4 w-4 mr-2 text-white" />
                    Gerenciar Usuários
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignOut}
                  className="text-white border-red-300/80 hover:bg-gradient-to-r hover:from-red-600/80 hover:to-rose-600/80 hover:border-red-200/90 bg-gradient-to-r from-red-700/90 to-rose-700/90 backdrop-blur-md font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-lg"
                >
                  <LogOut className="h-4 w-4 mr-2 text-white" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <BackupDialog
        isOpen={isBackupDialogOpen}
        onClose={() => setIsBackupDialogOpen(false)}
        atas={atas}
        pedidos={pedidos}
      />

      <UserManagement
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
      />

      <ChangePasswordDialog
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Dialog da Lixeira */}
      {isTrashOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Lixeira</h2>
              <Button
                variant="outline"
                onClick={() => setIsTrashOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <TrashManager />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
