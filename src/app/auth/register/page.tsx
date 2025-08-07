// src/app/auth/register/page.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/api/auth";
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
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

// Simplified registration validation
const registerSchema = z
  .object({
    nomeCompleto: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome muito longo"),
    email: z
      .string()
      .min(1, "Email é obrigatório")
      .email("Email deve ter formato válido")
      .max(320, "Email muito longo"),
    password: z.string().min(1, "Senha é obrigatória"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
    acceptTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsAlert, setShowTermsAlert] = useState(false);
  const [showPasswordLengthAlert, setShowPasswordLengthAlert] = useState(false);
  const [showPasswordMismatchAlert, setShowPasswordMismatchAlert] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
    clearErrors,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit", // Change to onSubmit to avoid premature validation
  });

  const watchPassword = watch("password", "");
  const watchConfirmPassword = watch("confirmPassword", "");
  const watchAcceptTerms = watch("acceptTerms", false);

  // Limpar alerta quando aceitar os termos
  useEffect(() => {
    if (watchAcceptTerms && showTermsAlert) {
      setShowTermsAlert(false);
    }
  }, [watchAcceptTerms, showTermsAlert]);

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    const labels = ["Muito Fraca", "Fraca", "Regular", "Boa", "Muito Boa"];

    return {
      score: strength,
      label: labels[Math.min(strength, labels.length - 1)] || "Muito Fraca",
    };
  };

  const passwordStrength = getPasswordStrength(watchPassword);

  // Watch password for real-time validation
  useEffect(() => {
    if (watchPassword && watchPassword.length > 0) {
      // Verificar todos os requisitos de senha
      const hasMinLength = watchPassword.length >= 8;
      const hasUppercase = /[A-Z]/.test(watchPassword);
      const hasNumber = /\d/.test(watchPassword);
      const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(watchPassword);

      if (!hasMinLength || !hasUppercase || !hasNumber || !hasSymbol) {
        setShowPasswordLengthAlert(true);
      } else {
        setShowPasswordLengthAlert(false);
      }
    } else if (watchPassword.length === 0) {
      setShowPasswordLengthAlert(false);
    }
  }, [watchPassword]);

  // Watch password confirmation for real-time validation
  useEffect(() => {
    if (watchPassword && watchConfirmPassword) {
      if (watchPassword !== watchConfirmPassword) {
        setShowPasswordMismatchAlert(true);
      } else {
        setShowPasswordMismatchAlert(false);
      }
    } else if (!watchConfirmPassword) {
      setShowPasswordMismatchAlert(false);
    }
  }, [watchPassword, watchConfirmPassword]);

  const onSubmit = useCallback(
    async (data: RegisterFormData) => {
      // Debug: Log dos dados recebidos
      console.log("Form data:", {
        ...data,
        password: "[REDACTED]",
        confirmPassword: "[REDACTED]",
      });

      // Validação manual dos campos obrigatórios
      if (
        !data.email ||
        !data.password ||
        !data.confirmPassword ||
        !data.nomeCompleto
      ) {
        toast.error("Todos os campos são obrigatórios");
        return;
      }

      // Verificar todos os requisitos de senha
      if (data.password.length < 8) {
        toast.error("Senha deve ter pelo menos 8 caracteres");
        return;
      }

      if (!/[A-Z]/.test(data.password)) {
        toast.error("Senha deve conter pelo menos uma letra maiúscula");
        return;
      }

      if (!/\d/.test(data.password)) {
        toast.error("Senha deve conter pelo menos um número");
        return;
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(data.password)) {
        toast.error(
          'Senha deve conter pelo menos um símbolo (!@#$%^&*(),.?":{}|<>)'
        );
        return;
      }

      // Verificar se as senhas coincidem
      if (data.password !== data.confirmPassword) {
        toast.error("Senhas não coincidem");
        return;
      }

      // Limpar e formatar os dados
      const cleanData = {
        ...data,
        email: data.email.toLowerCase().trim(),
        nomeCompleto: data.nomeCompleto.trim().replace(/\s+/g, " "),
        password: data.password.trim(),
        confirmPassword: data.confirmPassword.trim(),
      };

      console.log("Clean data:", {
        ...cleanData,
        password: "[REDACTED]",
        confirmPassword: "[REDACTED]",
      });

      // Verificar se os termos foram aceitos
      if (!cleanData.acceptTerms) {
        setShowTermsAlert(true);
        toast.error("Você deve aceitar os termos de uso para prosseguir");
        return;
      }

      setIsLoading(true);

      try {
        await authApi.register({
          email: cleanData.email,
          password: cleanData.password,
          confirmPassword: cleanData.confirmPassword,
          nomeCompleto: cleanData.nomeCompleto,
          acceptTerms: cleanData.acceptTerms,
        });

        toast.success(
          "Conta criada com sucesso! Verifique seu email para ativação."
        );

        // Redirect to login with success message
        router.push("/login?message=registration_success");
      } catch (error: any) {
        console.error("Registration error:", error);

        const errorMessage =
          error.response?.data?.message ||
          "Erro ao criar conta. Tente novamente.";

        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Criar Conta</h1>
          <p className="text-gray-600 mt-2">Registre-se no Sistema Fradema</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">
              Nova Conta
            </CardTitle>
            <CardDescription className="text-center">
              Preencha os dados para criar sua conta
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              {/* Nome Completo */}
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...register("nomeCompleto")}
                    id="nomeCompleto"
                    type="text"
                    placeholder="Seu nome completo"
                    className={cn(
                      "pl-10",
                      errors.nomeCompleto && "border-red-300"
                    )}
                    disabled={isLoading}
                  />
                </div>
                {errors.nomeCompleto && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.nomeCompleto.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...register("email")}
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className={cn("pl-10", errors.email && "border-red-300")}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password with Strength Indicator */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="text-xs text-gray-600 mb-2">
                  Sua senha deve conter: 8+ caracteres, letra maiúscula, número
                  e símbolo
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...register("password")}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    className={cn(
                      "pl-10 pr-10",
                      errors.password && "border-red-300",
                      showPasswordLengthAlert &&
                        "border-yellow-400 focus:border-yellow-500"
                    )}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Requisitos de senha */}
                {watchPassword && (
                  <div className="space-y-2">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-3 h-3 rounded-full flex items-center justify-center",
                            watchPassword.length >= 8
                              ? "bg-green-500 text-white"
                              : "bg-gray-300"
                          )}
                        >
                          {watchPassword.length >= 8 ? "✓" : ""}
                        </span>
                        <span
                          className={cn(
                            watchPassword.length >= 8
                              ? "text-green-600"
                              : "text-gray-500"
                          )}
                        >
                          Pelo menos 8 caracteres ({watchPassword.length}/8)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-3 h-3 rounded-full flex items-center justify-center",
                            /[A-Z]/.test(watchPassword)
                              ? "bg-green-500 text-white"
                              : "bg-gray-300"
                          )}
                        >
                          {/[A-Z]/.test(watchPassword) ? "✓" : ""}
                        </span>
                        <span
                          className={cn(
                            /[A-Z]/.test(watchPassword)
                              ? "text-green-600"
                              : "text-gray-500"
                          )}
                        >
                          Uma letra maiúscula (A-Z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-3 h-3 rounded-full flex items-center justify-center",
                            /\d/.test(watchPassword)
                              ? "bg-green-500 text-white"
                              : "bg-gray-300"
                          )}
                        >
                          {/\d/.test(watchPassword) ? "✓" : ""}
                        </span>
                        <span
                          className={cn(
                            /\d/.test(watchPassword)
                              ? "text-green-600"
                              : "text-gray-500"
                          )}
                        >
                          Um número (0-9)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-3 h-3 rounded-full flex items-center justify-center",
                            /[!@#$%^&*(),.?":{}|<>]/.test(watchPassword)
                              ? "bg-green-500 text-white"
                              : "bg-gray-300"
                          )}
                        >
                          {/[!@#$%^&*(),.?":{}|<>]/.test(watchPassword)
                            ? "✓"
                            : ""}
                        </span>
                        <span
                          className={cn(
                            /[!@#$%^&*(),.?":{}|<>]/.test(watchPassword)
                              ? "text-green-600"
                              : "text-gray-500"
                          )}
                        >
                          Um símbolo (!@#$%^&*(),.?":{}|{`<`}
                          {">"})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Strength Indicator */}
                {watchPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            passwordStrength.score <= 1 && "bg-red-500",
                            passwordStrength.score === 2 && "bg-orange-500",
                            passwordStrength.score === 3 && "bg-yellow-500",
                            passwordStrength.score === 4 && "bg-blue-500",
                            passwordStrength.score >= 5 && "bg-green-500"
                          )}
                          style={{
                            width: `${(passwordStrength.score / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}

                {/* Alerta específico para requisitos da senha */}
                {showPasswordLengthAlert && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Senha deve ter pelo menos 8 caracteres, uma letra
                      maiúscula, um número e um símbolo
                    </p>
                  </div>
                )}

                {errors.password && !showPasswordLengthAlert && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...register("confirmPassword")}
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    className={cn(
                      "pl-10 pr-10",
                      errors.confirmPassword && "border-red-300",
                      showPasswordMismatchAlert &&
                        "border-red-400 focus:border-red-500"
                    )}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {/* Alerta para senhas que não coincidem */}
                {showPasswordMismatchAlert && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Senhas não coincidem
                    </p>
                  </div>
                )}

                {errors.confirmPassword && !showPasswordMismatchAlert && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Terms Acceptance */}
              <div className="flex items-center space-x-2">
                <input
                  {...register("acceptTerms")}
                  id="acceptTerms"
                  type="checkbox"
                  className={cn(
                    "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded",
                    showTermsAlert && "border-red-400 focus:ring-red-500"
                  )}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="acceptTerms"
                  className={cn(
                    "text-sm cursor-pointer",
                    showTermsAlert ? "text-red-700" : "text-gray-700"
                  )}
                >
                  Aceito os{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                  >
                    Termos de Uso
                  </button>{" "}
                  e{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                  >
                    Política de Privacidade
                  </button>
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.acceptTerms.message}
                </p>
              )}

              {/* Alerta visual quando tentar submeter sem aceitar termos */}
              {showTermsAlert && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Você deve aceitar os termos de uso para prosseguir
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full",
                  showTermsAlert && "border-red-300 bg-red-50 hover:bg-red-100"
                )}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Já tem uma conta?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-blue-600 hover:text-blue-800 font-medium"
                disabled={isLoading}
              >
                Fazer login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
