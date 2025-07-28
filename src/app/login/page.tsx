"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Building2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toastManager } from "@/lib/utils/toast-manager";
import { authStorage } from "@/lib/utils/auth-storage";

// Enhanced validation schema with security constraints
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email deve ter formato válido")
    .max(320, "Email muito longo")
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .max(128, "Senha muito longa"),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface AuthError {
  code: string;
  message: string;
  field?: keyof LoginFormData;
}

const ERROR_MAPPINGS: Record<string, AuthError> = {
  CredentialsSignin: {
    code: "INVALID_CREDENTIALS",
    message: "Email ou senha incorretos. Verifique suas credenciais.",
    field: "password",
  },
  SessionRequired: {
    code: "SESSION_REQUIRED",
    message: "Por favor, faça login para continuar.",
  },
  AccessDenied: {
    code: "ACCESS_DENIED",
    message: "Acesso negado. Verifique suas permissões.",
  },
  Configuration: {
    code: "CONFIG_ERROR",
    message: "Erro de configuração. Contate o suporte técnico.",
  },
  Verification: {
    code: "EMAIL_NOT_VERIFIED",
    message: "Email não verificado. Verifique sua caixa de entrada.",
  },
};

// Variantes de animação
const containerVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

const floatingVariants = {
  float: {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [loginStep, setLoginStep] = useState<"form" | "loading" | "success">(
    "form"
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useEffect(() => {
    const error = searchParams?.get("error");
    if (error && ERROR_MAPPINGS[error]) {
      setAuthError(ERROR_MAPPINGS[error]);
      // toastManager.error(ERROR_MAPPINGS[error].message);
    }
  }, [searchParams]);

  useEffect(() => {
    const accessToken = authStorage.getAccessToken();
    if (accessToken && authStorage.isTokenExpired(accessToken)) {
      authStorage.clearTokens();
      // toastManager.clear();
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        if (session?.user && session.accessToken) {
          const accessToken = authStorage.getAccessToken();
          if (accessToken && !authStorage.isTokenExpired(accessToken)) {
            const callbackUrl =
              searchParams?.get("callbackUrl") || "/contracts";
            router.replace(callbackUrl);
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
        authStorage.clearTokens();
      }
    };

    checkSession();
  }, [router, searchParams]);

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      setIsLoading(true);
      setLoginStep("loading");
      setAuthError(null);
      clearErrors();

      // toastManager.clear();

      try {
        const requestId = `login_${Date.now()}`;

        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
          redirect: false,
          requestId,
        });

        if (result?.error) {
          const errorConfig = ERROR_MAPPINGS[result.error] || {
            code: "UNKNOWN_ERROR",
            message: "Erro desconhecido durante autenticação.",
          };

          setAuthError(errorConfig);
          setLoginStep("form");

          if (errorConfig.field) {
            setError(errorConfig.field, {
              type: "manual",
              message: errorConfig.message,
            });
          }

          // toastManager.error(errorConfig.message);
          return;
        }

        if (result?.ok) {
          // Aguardar um pouco para a sessão ser criada
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const session = await getSession();

          if (!session?.user) {
            console.log("⚠️ Session not found, but login was successful. Retrying...");
            
            // Tentar novamente após mais tempo
            await new Promise(resolve => setTimeout(resolve, 2000));
            const retrySession = await getSession();
            
            if (!retrySession?.user) {
              throw new Error(
                "Session creation failed after successful authentication"
              );
            }
          }

          setLoginStep("success");
          console.log("✅ Login successful, session created for:", session?.user?.email);

          // Delay for success animation
          setTimeout(() => {
            const callbackUrl =
              searchParams?.get("callbackUrl") || "/contracts";
            router.replace(callbackUrl);
          }, 1500);
        }
      } catch (error) {
        console.error("Login submission error:", error);

        const fallbackError: AuthError = {
          code: "NETWORK_ERROR",
          message: "Erro de conexão. Verifique sua internet e tente novamente.",
        };

        setAuthError(fallbackError);
        setLoginStep("form");
        // toastManager.error(fallbackError.message);
      } finally {
        setIsLoading(false);
      }
    },
    [clearErrors, router, searchParams, setError]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleInputChange = useCallback(() => {
    if (authError) {
      setAuthError(null);
    }
  }, [authError]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-blue-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating geometric shapes */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-xl"
          variants={floatingVariants}
          animate="float"
        />
        <motion.div
          className="absolute top-1/2 right-20 w-48 h-48 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-2xl"
          variants={floatingVariants}
          animate="float"
          transition={{ delay: 1 }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-24 h-24 bg-gradient-to-r from-cyan-400/15 to-blue-400/15 rounded-full blur-xl"
          variants={floatingVariants}
          animate="float"
          transition={{ delay: 2 }}
        />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.02"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Header Section with Enhanced Branding */}
            <motion.div variants={itemVariants} className="text-center">
              {/* Logo with glow effect */}
              <motion.div
                className="relative mx-auto w-20 h-20 mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-white to-blue-100 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Building2 className="w-10 h-10 text-navy-900" />
                </div>
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-lg opacity-30 -z-10"
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                {/* Sparkle effect */}
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </motion.div>
              </motion.div>

              <motion.h1
                className="text-4xl font-bold text-white mb-2"
                variants={itemVariants}
              >
                Sistema Fradema Contratos
              </motion.h1>
              <motion.p
                className="text-navy-200 text-lg flex items-center justify-center gap-2"
                variants={itemVariants}
              >
                <Zap className="w-5 h-5 text-blue-400" />
                Plataforma Empresarial Avançada
              </motion.p>

              {/* Feature badges */}
              <motion.div
                className="flex items-center justify-center gap-3 mt-4"
                variants={itemVariants}
              >
                <div className="flex items-center gap-1 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-white font-medium">Seguro</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-white font-medium">Rápido</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-white font-medium">
                    Confiável
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Login Form Card */}
            <motion.div variants={itemVariants}>
              <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl">
                <CardHeader className="space-y-2 pb-6">
                  <CardTitle className="text-2xl font-bold text-center text-navy-900">
                    Acesso ao Sistema
                  </CardTitle>
                  <CardDescription className="text-center text-navy-600">
                    Digite suas credenciais para acessar a plataforma
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <AnimatePresence mode="wait">
                    {authError && !authError.field && (
                      <motion.div
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-800">
                            Erro de Autenticação
                          </p>
                          <p className="text-sm text-red-700">
                            {authError.message}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {loginStep === "success" ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                      >
                        <motion.div
                          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.6 }}
                        >
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </motion.div>
                        <h3 className="text-xl font-semibold text-navy-900 mb-2">
                          Login realizado com sucesso!
                        </h3>
                        <p className="text-navy-600">
                          Redirecionando para o dashboard...
                        </p>
                        <motion.div className="mt-4 w-32 h-1 bg-green-200 rounded-full mx-auto overflow-hidden">
                          <motion.div
                            className="h-full bg-green-500 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5 }}
                          />
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.form
                        key="form"
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                        noValidate
                        initial={{ opacity: 1 }}
                        animate={{ opacity: loginStep === "loading" ? 0.6 : 1 }}
                      >
                        {/* Email Field */}
                        <motion.div
                          className="space-y-2"
                          variants={itemVariants}
                        >
                          <Label
                            htmlFor="email"
                            className="text-sm font-semibold text-navy-700"
                          >
                            Email
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy-400" />
                            <Input
                              {...register("email")}
                              id="email"
                              type="email"
                              autoComplete="username"
                              placeholder="seu@email.com"
                              className={cn(
                                "pl-10 h-12 border-navy-200 focus:border-navy-500 focus:ring-navy-500/20",
                                "bg-white/50 backdrop-blur-sm transition-all duration-300",
                                errors.email &&
                                  "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                              )}
                              onChange={(e) => {
                                register("email").onChange(e);
                                handleInputChange();
                              }}
                              disabled={isLoading}
                            />
                          </div>
                          <AnimatePresence>
                            {errors.email && (
                              <motion.p
                                className="text-sm text-red-600 flex items-center gap-2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                              >
                                <AlertCircle className="w-4 h-4" />
                                {errors.email.message}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>

                        {/* Password Field */}
                        <motion.div
                          className="space-y-2"
                          variants={itemVariants}
                        >
                          <Label
                            htmlFor="password"
                            className="text-sm font-semibold text-navy-700"
                          >
                            Senha
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy-400" />
                            <Input
                              {...register("password")}
                              id="password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              placeholder="Digite sua senha"
                              className={cn(
                                "pl-10 pr-12 h-12 border-navy-200 focus:border-navy-500 focus:ring-navy-500/20",
                                "bg-white/50 backdrop-blur-sm transition-all duration-300",
                                errors.password &&
                                  "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                              )}
                              onChange={(e) => {
                                register("password").onChange(e);
                                handleInputChange();
                              }}
                              disabled={isLoading}
                            />
                            <motion.button
                              type="button"
                              onClick={togglePasswordVisibility}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-navy-400 hover:text-navy-600 focus:outline-none transition-colors duration-200"
                              disabled={isLoading}
                              whileTap={{ scale: 0.95 }}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </motion.button>
                          </div>
                          <AnimatePresence>
                            {errors.password && (
                              <motion.p
                                className="text-sm text-red-600 flex items-center gap-2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                              >
                                <AlertCircle className="w-4 h-4" />
                                {errors.password.message}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>

                        {/* Remember Me */}
                        <motion.div
                          className="flex items-center space-x-3"
                          variants={itemVariants}
                        >
                          <input
                            {...register("rememberMe")}
                            id="rememberMe"
                            type="checkbox"
                            className="h-4 w-4 text-navy-600 focus:ring-navy-500 border-navy-300 rounded transition-colors duration-200"
                            disabled={isLoading}
                          />
                          <Label
                            htmlFor="rememberMe"
                            className="text-sm text-navy-700 cursor-pointer font-medium"
                          >
                            Lembrar de mim por 30 dias
                          </Label>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div variants={itemVariants}>
                          <Button
                            type="submit"
                            disabled={isLoading || isSubmitting}
                            className="w-full h-12 bg-gradient-to-r from-navy-900 to-navy-800 hover:from-navy-800 hover:to-navy-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            size="lg"
                          >
                            {loginStep === "loading" ? (
                              <motion.div
                                className="flex items-center gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Autenticando...
                              </motion.div>
                            ) : (
                              <motion.div
                                className="flex items-center gap-2"
                                whileHover={{ x: 2 }}
                              >
                                Entrar no Sistema
                                <ArrowRight className="w-5 h-5" />
                              </motion.div>
                            )}
                          </Button>
                        </motion.div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Additional Links */}
                  {loginStep === "form" && (
                    <motion.div
                      className="mt-8 space-y-4"
                      variants={itemVariants}
                    >
                      <div className="text-center">
                        <motion.button
                          type="button"
                          onClick={() => router.push("/auth/forgot-password")}
                          className="text-sm text-navy-600 hover:text-navy-800 font-medium transition-colors duration-200"
                          disabled={isLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Esqueceu sua senha?
                        </motion.button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-navy-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-navy-500 font-medium">
                            Novo no sistema?
                          </span>
                        </div>
                      </div>

                      <div className="text-center">
                        <motion.button
                          type="button"
                          onClick={() => router.push("/auth/register")}
                          className="text-sm text-navy-600 hover:text-navy-800 font-semibold transition-colors duration-200"
                          disabled={isLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Criar uma nova conta
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Security Notice */}
            <motion.div
              className="text-center text-xs text-navy-300 space-y-2"
              variants={itemVariants}
            >
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>
                  Suas informações são protegidas com criptografia de ponta a
                  ponta
                </span>
              </div>
              {/* <p>
                Ao fazer login, você concorda com nossos{" "}
                <button className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200">
                  Termos de Uso
                </button>{" "}
                e{" "}
                <button className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200">
                  Política de Privacidade
                </button>
              </p> */}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-950 to-transparent pointer-events-none" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-blue-900">
          <motion.div
            className="flex items-center gap-3 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg font-medium">Carregando...</span>
          </motion.div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
