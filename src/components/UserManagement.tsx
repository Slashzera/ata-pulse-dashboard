import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Check, X, User, Users, Eye, RefreshCw, Trash2, UserX } from 'lucide-react';
import { usePendingUsers, useApproveUser, useRegisteredUsers, useDeletePendingUser, useDeleteRegisteredUser, useFixApprovedUsers } from '@/hooks/useUserApproval';
import { useAuth } from '@/hooks/useAuth';
import { useCreateAuditLog } from '@/hooks/useAuditLogs';
import AuditLogViewer from '@/components/AuditLogViewer';
import { supabase } from '@/integrations/supabase/client';

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { data: pendingUsers = [], isLoading } = usePendingUsers();
  const { data: registeredUsers = [], isLoading: isLoadingRegistered, refetch: refetchRegisteredUsers } = useRegisteredUsers();
  const approveUserMutation = useApproveUser();
  const deletePendingUserMutation = useDeletePendingUser();
  const deleteRegisteredUserMutation = useDeleteRegisteredUser();
  const fixApprovedUsersMutation = useFixApprovedUsers();
  const createAuditLog = useCreateAuditLog();
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; type: 'pending' | 'registered' } | null>(null);

  // Verificar se o usuário atual é o Felipe Rodrigues (administrador)
  const isAdmin = user?.email === 'drfeliperodrigues@outlook.com';

  // Debug logs
  console.log('=== UserManagement Debug ===');
  console.log('User:', user?.email);
  console.log('IsAdmin:', isAdmin);
  console.log('Registered Users:', registeredUsers);
  console.log('Registered Users Length:', registeredUsers.length);
  console.log('IsLoadingRegistered:', isLoadingRegistered);
  console.log('Pending Users:', pendingUsers);
  console.log('=============================');

  if (!isAdmin) {
    return null;
  }

  const handleApproveUser = async (userId: string, approve: boolean) => {
    const userToUpdate = pendingUsers.find(u => u.id === userId);
    if (userToUpdate) {
      console.log('Processando aprovação para:', userToUpdate);
      
      try {
        await approveUserMutation.mutateAsync({ userId, approve });
        
        // Criar log de auditoria
        createAuditLog.mutate({
          action: approve ? 'APPROVE_USER' : 'REJECT_USER',
          table_name: 'pending_users',
          record_id: userId,
          old_data: userToUpdate,
          new_data: { ...userToUpdate, status: approve ? 'approved' : 'rejected' },
          justification: approve ? 'Usuário aprovado pelo administrador Felipe Rodrigues' : 'Usuário rejeitado pelo administrador Felipe Rodrigues'
        });
      } catch (error) {
        console.error('Erro ao processar aprovação:', error);
      }
    }
  };

  const handleDeletePendingUser = async (userId: string) => {
    try {
      await deletePendingUserMutation.mutateAsync(userId);
      setUserToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar usuário pendente:', error);
    }
  };

  const handleDeleteRegisteredUser = async (userId: string) => {
    try {
      await deleteRegisteredUserMutation.mutateAsync(userId);
      setUserToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar usuário registrado:', error);
    }
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    
    if (userToDelete.type === 'pending') {
      handleDeletePendingUser(userToDelete.id);
    } else {
      handleDeleteRegisteredUser(userToDelete.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserDisplayName = (registeredUser: any) => {
    if (registeredUser.nome && registeredUser.nome.trim()) {
      return registeredUser.nome;
    }
    if (registeredUser.email) {
      return registeredUser.email.split('@')[0];
    }
    return 'Usuário sem nome';
  };

  const pendingCount = pendingUsers.filter(user => user.status === 'pending').length;
  const approvedUsers = pendingUsers.filter(user => user.status === 'approved');
  const rejectedUsers = pendingUsers.filter(user => user.status === 'rejected');

  const handleRefreshData = async () => {
    console.log('Forçando refresh dos dados...');
    try {
      await refetchRegisteredUsers();
      console.log('Dados atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }
  };

  const handleTestSupabase = async () => {
    console.log('🧪 TESTE DIRETO DO SUPABASE');
    
    try {
      // Teste 1: Verificar conexão
      console.log('1️⃣ Testando conexão...');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('Usuário logado:', userData?.user?.email);
      console.log('Erro usuário:', userError);
      
      // Teste 2: Testar inserção direta
      console.log('2️⃣ Testando inserção direta...');
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .upsert({
          id: userData?.user?.id,
          email: userData?.user?.email,
          nome: 'Felipe Rodrigues (Teste)'
        }, { onConflict: 'id' });
      console.log('Resultado inserção:', insertData);
      console.log('Erro inserção:', insertError);
      
      // Teste 3: Testar busca direta
      console.log('3️⃣ Testando busca direta...');
      const { data: selectData, error: selectError } = await supabase
        .from('profiles')
        .select('*');
      console.log('Dados encontrados:', selectData);
      console.log('Erro busca:', selectError);
      
      // Teste 4: Testar auth.admin
      console.log('4️⃣ Testando auth.admin...');
      const { data: adminData, error: adminError } = await supabase.auth.admin.listUsers();
      console.log('Auth users:', adminData?.users?.length);
      console.log('Erro admin:', adminError);
      
      alert('Teste concluído! Verifique o console para detalhes.');
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      alert('Erro no teste: ' + error);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Gerenciar Usuários do Sistema
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => fixApprovedUsersMutation.mutate()}
                  variant="outline"
                  size="sm"
                  className="bg-green-50 hover:bg-green-100 border-green-300"
                  disabled={fixApprovedUsersMutation.isPending}
                >
                  🔧 {fixApprovedUsersMutation.isPending ? 'Corrigindo...' : 'Corrigir Usuários'}
                </Button>
                <Button
                  onClick={handleTestSupabase}
                  variant="outline"
                  size="sm"
                  className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
                >
                  🧪 Teste Debug
                </Button>
                <Button
                  onClick={() => setShowAuditLogs(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Auditoria
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                Pendentes ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Aprovados ({approvedUsers.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejeitados ({rejectedUsers.length})
              </TabsTrigger>
              <TabsTrigger value="registered">
                <Users className="h-4 w-4 mr-1" />
                Cadastrados ({registeredUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Usuários Pendentes de Aprovação</span>
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                      {pendingCount} pendentes
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-center py-4">Carregando usuários...</p>
                  ) : pendingUsers.filter(pendingUser => pendingUser.status === 'pending').length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-2">Nenhum usuário pendente de aprovação.</p>
                      <p className="text-sm text-gray-400">
                        Usuários devem confirmar o email antes de aparecer aqui.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingUsers
                        .filter(pendingUser => pendingUser.status === 'pending')
                        .map((pendingUser) => (
                        <div key={pendingUser.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{pendingUser.nome}</h4>
                            <p className="text-gray-600">{pendingUser.email}</p>
                            <div className="flex gap-4 text-sm text-gray-500 mt-1">
                              <span>Solicitado em: {formatDate(pendingUser.created_at)}</span>
                              <span>Email confirmado: ✅</span>
                              <span>Tentativas: {pendingUser.tentativas_solicitacao}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveUser(pendingUser.id, true)}
                              className="bg-green-600 hover:bg-green-700"
                              disabled={approveUserMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproveUser(pendingUser.id, false)}
                              disabled={approveUserMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setUserToDelete({ id: pendingUser.id, name: pendingUser.nome, type: 'pending' })}
                              disabled={deletePendingUserMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Aprovados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {approvedUsers.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Nenhum usuário aprovado ainda.</p>
                    ) : (
                      approvedUsers.map((approvedUser) => (
                        <div key={approvedUser.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{approvedUser.nome}</h4>
                            <p className="text-gray-600">{approvedUser.email}</p>
                            <p className="text-sm text-gray-500">
                              Aprovado em: {approvedUser.updated_at ? formatDate(approvedUser.updated_at) : 'Data não disponível'}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Aprovado
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Rejeitados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {rejectedUsers.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Nenhum usuário rejeitado.</p>
                    ) : (
                      rejectedUsers.map((rejectedUser) => (
                        <div key={rejectedUser.id} className="flex items-center justify-between p-3 border rounded bg-red-50">
                          <div className="flex-1">
                            <h4 className="font-medium">{rejectedUser.nome}</h4>
                            <p className="text-sm text-gray-600">{rejectedUser.email}</p>
                            <p className="text-xs text-gray-500">
                              Rejeitado em: {rejectedUser.updated_at ? formatDate(rejectedUser.updated_at) : 'Data não disponível'}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            Rejeitado
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registered" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Usuários Cadastrados no Sistema
                    </div>
                    <Button
                      onClick={() => refetchRegisteredUsers()}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Atualizar
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingRegistered ? (
                    <p className="text-center py-4">Carregando usuários cadastrados...</p>
                  ) : (
                    <div className="space-y-3">
                      {registeredUsers.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-2">Nenhum usuário cadastrado encontrado.</p>
                          <p className="text-sm text-gray-400">
                            Isso pode indicar um problema na consulta ao banco de dados.
                          </p>
                          <Button
                            onClick={() => refetchRegisteredUsers()}
                            className="mt-4"
                            variant="outline"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Tentar Novamente
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
                            <p className="text-sm text-teal-700 font-medium">
                              <strong>Total de usuários encontrados:</strong> {registeredUsers.length}
                            </p>
                          </div>
                          
                          {registeredUsers.map((registeredUser) => (
                            <div key={registeredUser.id} className="flex items-center justify-between p-4 border rounded-lg bg-teal-50 border-teal-200 hover:bg-teal-100 transition-colors">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg text-teal-900">{getUserDisplayName(registeredUser)}</h4>
                                <p className="text-teal-700">{registeredUser.email}</p>
                                <div className="flex gap-4 text-sm text-teal-600 mt-1">
                                  <span>ID: {registeredUser.id}</span>
                                  <span>Cadastrado em: {formatDate(registeredUser.created_at)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium border border-teal-300">
                                  Ativo
                                </span>
                                {registeredUser.email !== 'drfeliperodrigues@outlook.com' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setUserToDelete({ id: registeredUser.id, name: getUserDisplayName(registeredUser), type: 'registered' })}
                                    disabled={deleteRegisteredUserMutation.isPending}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              Confirmar Exclusão de Usuário
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Tem certeza que deseja deletar o usuário <strong>{userToDelete?.name}</strong>?
              </p>
              <p className="text-red-600 font-medium">
                ⚠️ Esta ação é irreversível e o usuário perderá acesso ao sistema.
              </p>
              {userToDelete?.type === 'registered' && (
                <p className="text-orange-600 text-sm">
                  Nota: O usuário será removido do sistema, mas pode solicitar acesso novamente.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar Usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AuditLogViewer
        isOpen={showAuditLogs}
        onClose={() => setShowAuditLogs(false)}
      />
    </>
  );
};

export default UserManagement;
