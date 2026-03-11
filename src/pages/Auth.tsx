import { useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
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

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
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
            VaultKey
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
    </div>
  );
}
