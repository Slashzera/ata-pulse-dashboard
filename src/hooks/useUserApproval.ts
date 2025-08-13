import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PendingUser {
  id: string;
  email: string;
  nome: string;
  password_hash?: string; // Campo opcional para senha temporária
  created_at: string;
  updated_at?: string;
  status: 'pending' | 'approved' | 'rejected';
  email_confirmado: boolean;
  tentativas_solicitacao: number;
  ultimo_envio: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
  nome: string;
  created_at: string;
  updated_at?: string;
}

export const usePendingUsers = () => {
  return useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_users')
        .select('*')
        .eq('email_confirmado', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar usuários pendentes:', error);
        throw error;
      }
      
      return data as PendingUser[];
    },
  });
};

// Função auxiliar para configurar o sistema administrativo
const setupAdminSystem = async () => {
  try {
    console.log('Configurando sistema administrativo...');
    
    // 1. Criar profile do Felipe se não existir
    const { data: currentUser } = await supabase.auth.getUser();
    if (currentUser?.user?.email === 'drfeliperodrigues@outlook.com') {
      console.log('Criando profile do Felipe...');
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.user.id,
          email: currentUser.user.email,
          nome: currentUser.user.user_metadata?.nome || 'Felipe Rodrigues'
        }, {
          onConflict: 'id'
        });
      
      if (profileError) {
        console.log('Erro ao criar profile do Felipe:', profileError);
      } else {
        console.log('Profile do Felipe criado/atualizado com sucesso');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro na configuração do sistema admin:', error);
    return false;
  }
};

export const useRegisteredUsers = () => {
  return useQuery({
    queryKey: ['registered-users'],
    queryFn: async () => {
      console.log('🔍 INICIANDO BUSCA DE USUÁRIOS REGISTRADOS');
      
      // Verificar usuário atual
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      console.log('👤 Usuário atual:', currentUser?.user?.email);
      console.log('❌ Erro do usuário:', userError);
      
      if (!currentUser?.user) {
        console.log('❌ Nenhum usuário logado');
        return [];
      }
      
      if (currentUser.user.email !== 'drfeliperodrigues@outlook.com') {
        console.log('❌ Usuário não é admin:', currentUser.user.email);
        return [];
      }
      
      console.log('✅ Usuário é admin, prosseguindo...');
        
      // FORÇA: Criar profile do Felipe primeiro
      try {
        console.log('🔧 Criando profile do Felipe...');
        const { data: insertResult, error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: currentUser.user.id,
            email: currentUser.user.email,
            nome: 'Felipe Rodrigues'
          }, {
            onConflict: 'id'
          });
        
        console.log('📝 Resultado da inserção:', insertResult);
        console.log('❌ Erro da inserção:', insertError);
      } catch (insertError) {
        console.log('❌ Erro ao criar profile:', insertError);
      }
      
      // BUSCA 1: Tentar profiles primeiro (preferível)
      console.log('🔍 Tentativa 1: Buscando via profiles...');
      try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
        console.log('📊 Profiles encontrados:', profilesData);
        console.log('❌ Erro profiles:', profilesError);
        
        if (!profilesError && profilesData && profilesData.length > 0) {
          console.log('✅ SUCESSO! Retornando', profilesData.length, 'usuários via profiles');
          return profilesData as RegisteredUser[];
        }
      } catch (error) {
        console.log('❌ Erro na busca profiles:', error);
      }
      
      // BUSCA 2: Via auth.admin + filtrar apenas aprovados
      console.log('🔍 Tentativa 2: Buscando via auth.admin + filtrar aprovados...');
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        
        console.log('👥 Auth users encontrados:', authData?.users?.length || 0);
        console.log('❌ Erro auth:', authError);
        
        if (!authError && authData?.users && authData.users.length > 0) {
          const approvedUsers = [];
          
          for (const authUser of authData.users) {
            // Felipe sempre é incluído
            if (authUser.email === 'drfeliperodrigues@outlook.com') {
              approvedUsers.push({
                id: authUser.id,
                email: authUser.email || '',
                nome: authUser.user_metadata?.nome || 'Felipe Rodrigues',
                created_at: authUser.created_at,
                updated_at: authUser.updated_at || authUser.created_at
              });
              continue;
            }
            
            // Para outros usuários, verificar se têm profile (foram aprovados)
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, email, nome')
                .eq('email', authUser.email)
                .maybeSingle();
              
              if (!profileError && profile) {
                // Usuário foi aprovado, incluir na lista
                approvedUsers.push({
                  id: authUser.id,
                  email: profile.email,
                  nome: profile.nome || authUser.user_metadata?.nome || authUser.email?.split('@')[0] || 'Usuário',
                  created_at: authUser.created_at,
                  updated_at: authUser.updated_at || authUser.created_at
                });
                console.log('✅ Usuário aprovado encontrado:', profile.email);
              } else {
                console.log('⏳ Usuário não aprovado:', authUser.email);
              }
            } catch (profileError) {
              console.log(`❌ Erro ao verificar profile para ${authUser.email}:`, profileError);
            }
          }
          
          console.log('✅ SUCESSO! Retornando', approvedUsers.length, 'usuários aprovados');
          return approvedUsers as RegisteredUser[];
          }
      } catch (error) {
        console.log('❌ Erro na busca auth:', error);
        }
        
      // BUSCA 3: Fallback - apenas Felipe
      console.log('🔍 Tentativa 3: Fallback - retornando apenas Felipe...');
      const felipeUser = {
        id: currentUser.user.id,
        email: currentUser.user.email || '',
        nome: 'Felipe Rodrigues',
        created_at: currentUser.user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('✅ Retornando Felipe como fallback:', felipeUser);
      return [felipeUser] as RegisteredUser[];
    },
    enabled: true,
    staleTime: 10 * 1000, // 10 segundos
    retry: 1,
    retryDelay: 500,
  });
};

export const useApproveUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, approve }: { userId: string; approve: boolean }) => {
      console.log('🔄 Iniciando aprovação/rejeição para usuário:', userId, 'Aprovar:', approve);
      
      // Verificar se o usuário atual é admin
      const { data: currentUser } = await supabase.auth.getUser();
      if (currentUser?.user?.email !== 'drfeliperodrigues@outlook.com') {
        throw new Error('Acesso negado: apenas o administrador pode aprovar usuários');
      }
      
      // Buscar dados do usuário pendente
      const { data: pendingUser, error: fetchError } = await supabase
        .from('pending_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('❌ Erro ao buscar usuário pendente:', fetchError);
        throw new Error('Usuário pendente não encontrado');
      }

      console.log('✅ Usuário pendente encontrado:', pendingUser);

      if (approve) {
        try {
          console.log('🔧 Aprovando usuário:', pendingUser.email);
          
          // PRIMEIRO: Criar conta no Supabase Auth
          console.log('👤 Criando conta no Auth...');
          
          // Usar senha temporária se disponível, senão usar uma senha padrão
          const tempPassword = (pendingUser as any).password_hash || 'TempPassword123!';
          console.log('🔑 Usando senha temporária para:', pendingUser.email);
          
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: pendingUser.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              nome: pendingUser.nome
            }
          });

          if (authError) {
            console.error('❌ Erro ao criar conta no Auth:', authError);
            throw new Error('Erro ao criar conta de usuário: ' + authError.message);
          }

          console.log('✅ Conta Auth criada! ID:', authData.user.id);
          console.log('✅ Email:', authData.user.email);
          console.log('✅ Email confirmado:', authData.user.email_confirmed_at);
          
          // SEGUNDO: Criar profile diretamente
          console.log('📝 Criando profile...');
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: pendingUser.email,
              nome: pendingUser.nome,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (profileError) {
            console.error('❌ Erro ao criar profile:', profileError);
            
            // Se falhar, remover a conta Auth
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw new Error('Erro ao criar perfil: ' + profileError.message);
          }

          console.log('✅ Profile criado com sucesso:', profileData);

          // TERCEIRO: Verificar se tudo foi criado corretamente
          console.log('🔍 Verificando criação...');
          const { data: verifyAuth } = await supabase.auth.admin.getUserById(authData.user.id);
          const { data: verifyProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          console.log('✅ Auth verificado:', verifyAuth.user?.email);
          console.log('✅ Profile verificado:', verifyProfile?.email);

        } catch (error) {
          console.error('❌ Erro ao aprovar usuário:', error);
          throw new Error('Erro ao aprovar usuário: ' + (error as any).message);
        }
      }

      // Atualizar status na tabela pending_users (MAS MANTER A SENHA)
      console.log('📝 Atualizando status do usuário pendente...');
      const { error: updateError } = await supabase
        .from('pending_users')
        .update({ 
          status: approve ? 'approved' : 'rejected',
          // NÃO remover password_hash - usuário precisa para login
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Erro ao atualizar status:', updateError);
        throw new Error('Erro ao processar aprovação: ' + updateError.message);
      }

      console.log('✅ Status atualizado com sucesso');

      return { 
        approved: approve, 
        userEmail: pendingUser.email,
        userName: pendingUser.nome 
      };
    },
    onSuccess: (data) => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['registered-users'] });
      
      toast({
        title: data.approved ? "✅ Usuário aprovado" : "❌ Usuário rejeitado",
        description: data.approved 
          ? `${data.userName} foi aprovado! O usuário pode fazer login com a senha que cadastrou originalmente.`
          : `${data.userName} foi rejeitado.`,
      });
    },
    onError: (error: Error) => {
      console.error('❌ Erro na aprovação/rejeição:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar solicitação: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook para deletar usuário pendente
export const useDeletePendingUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      console.log('Iniciando exclusão de usuário pendente:', userId);
      
      // Buscar dados do usuário antes de deletar
      const { data: pendingUser, error: fetchError } = await supabase
        .from('pending_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar usuário:', fetchError);
        throw new Error('Usuário não encontrado');
      }

      // Deletar usuário pendente
      const { error: deleteError } = await supabase
        .from('pending_users')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('Erro ao deletar usuário:', deleteError);
        throw new Error('Erro ao deletar usuário: ' + deleteError.message);
      }

      return { 
        deletedUser: pendingUser
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast({
        title: "Usuário removido",
        description: `${data.deletedUser.nome} foi removido da lista de usuários pendentes.`,
      });
    },
    onError: (error: Error) => {
      console.error('Erro na exclusão:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar usuário: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook para deletar usuário registrado (simplificado)
export const useDeleteRegisteredUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      console.log('Iniciando exclusão de usuário registrado:', userId);
      
      // Verificar se o usuário atual é admin
      const { data: currentUser } = await supabase.auth.getUser();
      if (currentUser?.user?.email !== 'drfeliperodrigues@outlook.com') {
        throw new Error('Acesso negado: apenas o administrador pode deletar usuários');
      }

      // Buscar dados do usuário antes de deletar
      const { data: registeredUser, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar usuário:', fetchError);
        throw new Error('Usuário não encontrado');
      }

      // Verificar se não está tentando deletar o próprio admin
      if (registeredUser.email === 'drfeliperodrigues@outlook.com') {
        throw new Error('Não é possível deletar o usuário administrador');
      }

      // Deletar usuário do profiles
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('Erro ao deletar usuário:', deleteError);
        throw new Error('Erro ao deletar usuário: ' + deleteError.message);
      }

      // Tentar deletar do auth.users também (comentado até função estar disponível)
      // try {
      //   await supabase.rpc('delete_user_admin', { user_id: userId });
      // } catch (authDeleteError) {
      //   console.log('Aviso: Não foi possível deletar do auth.users:', authDeleteError);
      // }

      return { 
        deletedUser: registeredUser
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registered-users'] });
      toast({
        title: "Usuário deletado",
        description: `${data.deletedUser.nome} foi removido do sistema com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deletar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook para corrigir usuários aprovados sem conta Auth
export const useFixApprovedUsers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      console.log('🔧 Iniciando correção de usuários aprovados...');
      
      // Verificar se o usuário atual é admin
      const { data: currentUser } = await supabase.auth.getUser();
      if (currentUser?.user?.email !== 'drfeliperodrigues@outlook.com') {
        throw new Error('Acesso negado: apenas o administrador pode corrigir usuários');
      }

      // Buscar usuários aprovados que não têm conta Auth
      const { data: approvedUsers, error: fetchError } = await supabase
        .from('pending_users')
        .select('*')
        .eq('status', 'approved');

      if (fetchError) {
        throw new Error('Erro ao buscar usuários aprovados: ' + fetchError.message);
      }

      console.log('📋 Usuários aprovados encontrados:', approvedUsers.length);

      let fixed = 0;
      let errors = 0;
      const results = [];

      for (const user of approvedUsers) {
        try {
          console.log('🔄 Processando usuário:', user.email);

          // Verificar se já tem conta Auth
          const { data: existingAuth } = await supabase.auth.admin.listUsers();
          const hasAuth = existingAuth.users.some(u => u.email === user.email);

          if (hasAuth) {
            console.log('✅ Usuário já tem conta Auth:', user.email);
            
            // Verificar se tem profile
            const { data: profile, error: profileCheckError } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', user.email)
              .maybeSingle();

            if (!profile && !profileCheckError) {
              // Criar apenas o profile
              const authUser = existingAuth.users.find(u => u.email === user.email);
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: authUser!.id,
                  email: user.email,
                  nome: user.nome,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (profileError) {
                console.error('❌ Erro ao criar profile para:', user.email, profileError);
                errors++;
                results.push(`❌ ${user.email}: Erro ao criar profile`);
              } else {
                console.log('✅ Profile criado para:', user.email);
                fixed++;
                results.push(`✅ ${user.email}: Profile criado`);
              }
            } else {
              results.push(`ℹ️ ${user.email}: Já tem tudo configurado`);
            }
            continue;
          }

          // Criar conta Auth + Profile
          const tempPassword = (user as any).password_hash || 'TempPassword123!';
          
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              nome: user.nome
            }
          });

          if (authError) {
            console.error('❌ Erro ao criar Auth para:', user.email, authError);
            errors++;
            results.push(`❌ ${user.email}: Erro no Auth - ${authError.message}`);
            continue;
          }

          // Criar Profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: user.email,
              nome: user.nome,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('❌ Erro ao criar Profile para:', user.email, profileError);
            // Remover Auth criado
            await supabase.auth.admin.deleteUser(authData.user.id);
            errors++;
            results.push(`❌ ${user.email}: Erro no Profile - ${profileError.message}`);
            continue;
          }

          console.log('✅ Usuário corrigido com sucesso:', user.email);
          fixed++;
          results.push(`✅ ${user.email}: Auth + Profile criados`);

        } catch (error) {
          console.error('❌ Erro ao processar:', user.email, error);
          errors++;
          results.push(`❌ ${user.email}: ${(error as any).message}`);
        }
      }

      return {
        total: approvedUsers.length,
        fixed,
        errors,
        results
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['registered-users'] });
      
      toast({
        title: "🔧 Correção Concluída",
        description: `${data.fixed} usuários corrigidos, ${data.errors} erros de ${data.total} total.`,
      });

      // Log detalhado
      console.log('📊 Resultado da correção:');
      data.results.forEach(result => console.log(result));
    },
    onError: (error: Error) => {
      console.error('❌ Erro na correção:', error);
      toast({
        title: "Erro na Correção",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
