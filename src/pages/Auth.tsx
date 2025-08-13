import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useSearchParams } from 'react-router-dom';
import ForgotPasswordDialog from '@/components/ForgotPasswordDialog';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import PendingApproval from '@/components/PendingApproval';
import { Heart } from 'lucide-react';

const Auth = () => {
  const { user, signIn, signUp, pendingApproval } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', nome: '' });
  const isReset = searchParams.get('reset') === 'true';

  // Redirecionar se já estiver logado
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Mostrar tela de aguardando aprovação se necessário
  if (pendingApproval) {
    return <PendingApproval />;
  }

  const getCurrentDateTime = () => {
    return new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(loginData.email, loginData.password);
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp(signupData.email, signupData.password, signupData.nome);
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-6 relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 123, 191, 0.7), rgba(0, 123, 191, 0.7)), url('/lovable-uploads/1a5507c1-31ce-49b2-b5b1-3a1e8960d42a.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="flex flex-col items-center w-full max-w-4xl">
          {/* Card Principal de Login */}
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl mb-6">
            <CardHeader className="text-center relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="h-6 w-6 text-red-500" />
                <CardTitle className="text-xl font-bold text-gray-800">
                  Sisgecon Saúde
                </CardTitle>
              </div>
              <p className="text-sm font-medium text-blue-600 mb-2">
                Sistema de Gestão e Contratos - Secretaria Municipal de Saúde de Duque de Caxias
              </p>
              <p className="text-xs text-gray-600">
                {getCurrentDateTime()}
              </p>
              {isReset && (
                <p className="text-sm text-green-600 mt-2">
                  Verifique seu email para redefinir sua senha
                </p>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                    <div className="flex flex-col gap-2">
                      <Button 
                        type="button" 
                        variant="link" 
                        className="w-full text-sm" 
                        onClick={() => setIsForgotPasswordOpen(true)}
                      >
                        Esqueceu sua senha?
                      </Button>
                      <Button 
                        type="button" 
                        variant="link" 
                        className="w-full text-sm" 
                        onClick={() => setIsChangePasswordOpen(true)}
                      >
                        Alterar senha
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        type="text"
                        value={signupData.nome}
                        onChange={(e) => setSignupData({ ...signupData, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email-signup">Email</Label>
                      <Input
                        id="email-signup"
                        type="email"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password-signup">Senha</Label>
                      <Input
                        id="password-signup"
                        type="password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Footer com informações */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-white text-xs bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 max-w-sm">
            <p className="font-medium">Alameda James Franco, 03 – Jardim Primavera</p>
            <p>Duque de Caxias – RJ – CEP: 25215-265</p>
            <a 
              href="https://www.duquedecaxias.rj.gov.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-200 hover:text-blue-100 underline cursor-pointer"
            >
              www.duquedecaxias.rj.gov.br
            </a>
          </div>
        </div>

        <ForgotPasswordDialog
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
        />

        <ChangePasswordDialog
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />
      </div>
    </>
  );
};

export default Auth;
