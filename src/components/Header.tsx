import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Database, Users, Key, Heart, Shield, Clock, Trash2, ChevronDown, Settings, FileText, BarChart3, Menu, X } from 'lucide-react';
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <header className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white shadow-2xl border-b border-blue-800/50">
        {/* Modern gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10"></div>
        
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-20">
            
            {/* Left section - Logo and brand */}
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center gap-4 cursor-pointer group"
                onClick={onReturnToMain}
                title="Clique para voltar ao menu principal"
              >
                {/* Modern logo */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Heart className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                {/* Brand text */}
                <div className="hidden md:block">
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                    Sisgecon Saúde
                  </h1>
                  <p className="text-sm text-blue-200/80 font-medium max-w-md">
                    Sistema de Gestão e Contratos
                  </p>
                </div>
              </div>
              
              {/* Time display - hidden on mobile */}
              <div className="hidden lg:flex items-center gap-2 ml-8 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <Clock className="h-4 w-4 text-blue-300" />
                <span className="text-sm text-blue-200/90 font-mono">{getCurrentDateTime()}</span>
              </div>
            </div>
            
            {/* Right section - Actions and user */}
            <div className="flex items-center gap-4">
              
              {/* Action buttons - hidden on mobile, shown in dropdown */}
              <div className="hidden lg:flex items-center gap-2">
                {/* Reports dropdown */}
                <div className="relative group">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Botão Relatórios clicado');
                    }}
                    className="text-white hover:bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-200 rounded-xl cursor-pointer"
                    type="button"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Relatórios
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-3 py-2">
                      <ExportToPDF atas={atas} pedidos={pedidos} />
                    </div>
                    <div className="px-3 py-2">
                      <ExportCategoryReport atas={atas} pedidos={pedidos} />
                    </div>
                  </div>
                </div>
                
                {/* System tools */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsBackupDialogOpen(true)}
                  className="text-white hover:bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-200 rounded-xl"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Backup
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsTrashOpen(true)}
                  className="text-white hover:bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-200 rounded-xl"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Lixeira
                </Button>
              </div>
              
              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl border border-white/20 hover:border-white/30 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-white">{getUserName()}</p>
                      <p className="text-xs text-blue-200/80">{user?.email}</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-blue-200 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                    {/* User info in dropdown */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{getUserName()}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                    
                    {/* Menu items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setIsChangePasswordOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200"
                      >
                        <Key className="h-4 w-4 text-gray-500" />
                        Alterar Senha
                      </button>
                      
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setIsUserManagementOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200"
                        >
                          <Users className="h-4 w-4 text-gray-500" />
                          Gerenciar Usuários
                        </button>
                      )}
                      
                      {/* Mobile-only menu items */}
                      <div className="lg:hidden border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={() => {
                            setIsBackupDialogOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200"
                        >
                          <Database className="h-4 w-4 text-gray-500" />
                          Backup Sistema
                        </button>
                        
                        <button
                          onClick={() => {
                            setIsTrashOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4 text-gray-500" />
                          Lixeira
                        </button>
                        
                        <div className="px-4 py-2">
                          <ExportToPDF atas={atas} pedidos={pedidos} />
                        </div>
                        <div className="px-4 py-2">
                          <ExportCategoryReport atas={atas} pedidos={pedidos} />
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={() => {
                            handleSignOut();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors duration-200"
                        >
                          <LogOut className="h-4 w-4 text-red-500" />
                          Sair do Sistema
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Click outside to close user menu */}
        {isUserMenuOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsUserMenuOpen(false)}
          ></div>
        )}
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
