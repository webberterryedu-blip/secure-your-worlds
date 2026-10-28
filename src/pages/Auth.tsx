import { useState, useMemo } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Seo from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Lock, Eye, EyeOff, ArrowLeft, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { evaluatePasswordStrength } from "@/lib/crypto";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";


export default function Auth() {
  const { t } = useTranslation();
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Same-origin relative redirect target (e.g. OAuth consent return)
  const nextParam = searchParams.get("next");
  const nextPath = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

  // Calculate password strength
  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password]);
  
  // Check if passwords match
  const passwordsMatch = useMemo(() => {
    if (!confirmPassword || !password) return true;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  // Validation for signup
  const isSignupValid = useMemo(() => {
    if (isLogin) return true;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    return password.length >= 8 && 
           password === confirmPassword &&
           hasUpper && hasLower && hasNumber && hasSpecial;
  }, [isLogin, password, confirmPassword]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Shield className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (user) {
    // After an OAuth return, restore the intended destination (e.g. MCP consent)
    const storedNext = sessionStorage.getItem("vk_oauth_next");
    if (storedNext) sessionStorage.removeItem("vk_oauth_next");
    return <Navigate to={nextPath ?? storedNext ?? "/dashboard"} replace />;
  }

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      if (nextPath) sessionStorage.setItem("vk_oauth_next", nextPath);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Erro ao iniciar login com Google");
        setSubmitting(false);
        return;
      }
      if (result.redirected) return; // browser goes to Google
      navigate(nextPath ?? "/dashboard", { replace: true });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao iniciar login com Google";
      toast.error(errorMessage);
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Login realizado com sucesso!");
        // O servidor decide se a sessão ainda precisa passar pelo 2FA
        const { data: cfg } = await supabase.functions.invoke("two-factor", {
          body: { action: "status" },
        });
        if (cfg?.enabled && !cfg?.verified) {
          navigate("/auth/2fa-verify", { replace: true });
          return;
        }
        navigate(nextPath ?? "/dashboard", { replace: true });
      } else {
        await signUp(email, password, displayName);
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao autenticar";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Seo
        title="Entrar ou criar conta — VaultKey"
        description="Acesse seu cofre VaultKey ou crie uma conta gratuita para guardar senhas e chaves de API com criptografia no navegador."
        path="/auth"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="absolute -top-12 left-0 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('auth.back') || 'Voltar'}
        </Button>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
            VaultKey <span className="sr-only">— Acesse seu cofre de senhas</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('auth.vault_subtitle')}
          </p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">
              {isLogin ? "Entrar" : "Criar conta"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Acesse seu cofre de senhas"
                : "Crie sua conta para começar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                    required={!isLogin}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password_label')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.password_placeholder')}
                    required
                    minLength={8}
                    aria-describedby="password-strength"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && !isLogin && (
                  <div className="space-y-2" id="password-strength">
                    <div className="flex gap-1">
                      <div className={`h-1 flex-1 rounded ${passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      <div className={`h-1 flex-1 rounded ${passwordStrength === 'medium' || passwordStrength === 'strong' ? (passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-muted'}`} />
                      <div className={`h-1 flex-1 rounded ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-muted'}`} />
                    </div>
                    <p className={`text-xs ${passwordStrength === 'weak' ? 'text-red-500' : passwordStrength === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                      {t(`auth.password_strength.${passwordStrength}`)}
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-500' : ''}`}>
                        {password.length >= 8 ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {t('auth.password_hint.min_length')}
                      </li>
                      <li className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-500' : ''}`}>
                        {/[A-Z]/.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {t('auth.password_hint.uppercase')}
                      </li>
                      <li className={`flex items-center gap-1 ${/[a-z]/.test(password) ? 'text-green-500' : ''}`}>
                        {/[a-z]/.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {t('auth.password_hint.lowercase')}
                      </li>
                      <li className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-green-500' : ''}`}>
                        {/[0-9]/.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {t('auth.password_hint.number')}
                      </li>
                      <li className={`flex items-center gap-1 ${/[^a-zA-Z0-9]/.test(password) ? 'text-green-500' : ''}`}>
                        {/[^a-zA-Z0-9]/.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {t('auth.password_hint.special')}
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirm_password')}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('auth.confirm_password_placeholder')}
                      required={!isLogin}
                      minLength={8}
                      aria-invalid={!passwordsMatch}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? t('auth.hide_password') : t('auth.show_password')}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-500" role="alert">
                      {t('auth.password_mismatch')}
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting || (!isLogin && !isSignupValid)}>
                {submitting ? (
                  <Lock className="h-4 w-4 animate-pulse" />
                ) : isLogin ? (
                  "Entrar"
                ) : (
                  "Criar conta"
                )}
              </Button>
            </form>

            {/* Google sign-in */}
            <div className="mt-4">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
                disabled={submitting}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.09 9.14 5.38 12 5.38z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09L2.18 7.07C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.86-3c-1.02.68-2.33 1.08-3.42 1.08-2.86 0-5.29-1.71-6.16-4.53l-3.66 2.84C3.99 20.53 7.7 23 12 23z" />
                </svg>
                Continuar com Google
              </Button>
            </div>

            {isLogin && (
              <div className="mt-4 text-center">
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            )}
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Criar conta" : "Fazer login"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
