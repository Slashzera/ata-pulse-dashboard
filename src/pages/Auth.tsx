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
import { Heart, Mail, Lock, Eye, EyeOff, Shield, Building2, ArrowRight, Loader2 } from 'lucide-react';

const Auth = () => {
  const { user, signIn, signUp, pendingApproval } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', nome: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
      {/* Background com imagem do hospital */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `
            url('/lovable-uploads/hospital-sao-jose-background.jpg'),
            url('/lovable-uploads/1a5507c1-31ce-49b2-b5b1-3a1e8960d42a.png')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Overlay azul */}
      <div 
        className="fixed inset-0 z-10"
        style={{
          background: `linear-gradient(135deg, 
            rgba(30, 64, 175, 0.75) 0%, 
            rgba(59, 130, 246, 0.65) 25%, 
            rgba(96, 165, 250, 0.55) 50%, 
            rgba(147, 197, 253, 0.45) 75%, 
            rgba(219, 234, 254, 0.35) 100%
          )`
        }}
      />
      
      <div className="min-h-screen flex items-center justify-center p-4 relative z-20 overflow-hidden">
        {/* Elementos decorativos de fundo sutis */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-500"></div>
          
          {/* Overlay adicional para melhor contraste */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-blue-800/20"></div>
        </div>

        <div className="flex flex-col items-center w-full max-w-md relative z-10">
          {/* Card Principal de Login com Glassmorphism */}
          <Card className="w-full bg-white/98 backdrop-blur-2xl border border-white/30 shadow-2xl rounded-3xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700 ring-1 ring-white/20">
            <CardHeader className="text-center relative px-8 pt-8 pb-6">
              {/* Logo e Título Modernos */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 hover:scale-110 transition-transform duration-300"
                  style={{
                    animation: 'pulse 3s ease-in-out infinite'
                  }}
                >
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">
                  Sisgecon Saúde
                </CardTitle>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">
                  Sistema de Gestão e Contratos
                </p>
                <p className="text-xs text-white/90 leading-relaxed">
                  Secretaria Municipal de Saúde de Duque de Caxias
                </p>
                <div className="inline-block bg-white/20 text-white px-4 py-2 rounded-full text-xs font-semibold mt-3 border border-white/30 shadow-sm backdrop-blur-sm">
                  {getCurrentDateTime()}
                </div>
              </div>
              
              {isReset && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Verifique seu email para redefinir sua senha
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <Tabs defaultValue="login" className="w-full">
                {/* Tabs Modernas */}
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-2xl mb-6">
                  <TabsTrigger 
                    value="login" 
                    className="rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Cadastrar
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-6">
                  <form onSubmit={handleSignIn} className="space-y-6">
                    {/* Campo Email Moderno */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-white">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 transition-all duration-300" />
                        <Input
                          id="email"
                          type="email"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className="pl-12 h-12 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-0 bg-blue-50/30 focus:bg-white transition-all duration-300 hover:shadow-md"
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                    </div>

                    {/* Campo Senha Moderno */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-white">
                        Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 transition-all duration-300" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="pl-12 pr-12 h-12 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-0 bg-blue-50/30 focus:bg-white transition-all duration-300 hover:shadow-md"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 transition-all duration-300 hover:scale-110"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Checkbox Lembrar-me */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-2 border-blue-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-300 hover:scale-110"
                        />
                        <span className="text-sm text-white font-medium">Lembrar-me</span>
                      </label>
                    </div>

                    {/* Botão Principal Moderno */}
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Entrando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>Entrar</span>
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      )}
                    </Button>

                    {/* Links Secundários Modernos */}
                    <div className="flex flex-col space-y-3 pt-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full text-sm text-white hover:text-blue-200 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 font-medium" 
                        onClick={() => setIsForgotPasswordOpen(true)}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Esqueceu sua senha?
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full text-sm text-white hover:text-blue-200 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 font-medium" 
                        onClick={() => setIsChangePasswordOpen(true)}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Alterar senha
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-6">
                  <form onSubmit={handleSignUp} className="space-y-6">
                    {/* Campo Nome */}
                    <div className="space-y-2">
                      <Label htmlFor="nome" className="text-sm font-semibold text-white">
                        Nome Completo
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5 transition-all duration-300" />
                        <Input
                          id="nome"
                          type="text"
                          value={signupData.nome}
                          onChange={(e) => setSignupData({ ...signupData, nome: e.target.value })}
                          className="pl-12 h-12 border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-0 bg-green-50/30 focus:bg-white transition-all duration-300 hover:shadow-md"
                          placeholder="Seu nome completo"
                          required
                        />
                      </div>
                    </div>

                    {/* Campo Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email-signup" className="text-sm font-semibold text-white">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5 transition-all duration-300" />
                        <Input
                          id="email-signup"
                          type="email"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          className="pl-12 h-12 border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-0 bg-green-50/30 focus:bg-white transition-all duration-300 hover:shadow-md"
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                    </div>

                    {/* Campo Senha */}
                    <div className="space-y-2">
                      <Label htmlFor="password-signup" className="text-sm font-semibold text-white">
                        Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5 transition-all duration-300" />
                        <Input
                          id="password-signup"
                          type={showSignupPassword ? "text" : "password"}
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          className="pl-12 pr-12 h-12 border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-0 bg-green-50/30 focus:bg-white transition-all duration-300 hover:shadow-md"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-700 transition-all duration-300 hover:scale-110"
                        >
                          {showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Botão Cadastrar */}
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:via-green-800 hover:to-green-900 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Cadastrando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>Cadastrar</span>
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Footer Moderno com informações */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center max-w-md px-4">
          <div className="text-white text-xs bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl px-6 py-4 shadow-2xl hover:bg-white/20 transition-all duration-300">
            <div className="space-y-2">
              <p className="font-bold text-white">Alameda James Franco, 03 – Jardim Primavera</p>
              <p className="font-semibold text-white/95">Duque de Caxias – RJ – CEP: 25215-265</p>
              <a 
                href="https://www.duquedecaxias.rj.gov.br" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-white hover:text-blue-200 border-b border-white/50 hover:border-blue-200 transition-all duration-300 font-medium"
              >
                <span>www.duquedecaxias.rj.gov.br</span>
              </a>
            </div>
            
            {/* Badges de Segurança */}
            <div className="flex justify-center space-x-4 mt-4 pt-3 border-t border-white/30">
              <div className="flex items-center space-x-1 text-xs bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition-all duration-300">
                <Shield className="w-3 h-3" />
                <span className="font-semibold">Conexão Segura</span>
              </div>
              <div className="flex items-center space-x-1 text-xs bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition-all duration-300">
                <Building2 className="w-3 h-3" />
                <span className="font-semibold">Governo Municipal</span>
              </div>
            </div>
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
