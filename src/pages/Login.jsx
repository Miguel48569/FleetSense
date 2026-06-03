// Projeto SENAC 2026 - FleetSense
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck, Truck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const isBackendMode = Boolean(import.meta.env.VITE_API_URL);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      const message = "Informe e-mail e senha.";
      setSubmitError(message);
      toast({ title: "Campos obrigatórios", description: message, variant: "destructive" });
      return;
    }

    try {
      setSubmitError("");
      setIsSubmitting(true);
      // Envia payload estrito esperado pelo backend: { email, senha }
      await login({ email: formData.email, senha: formData.password });
      toast({ title: "Login realizado", description: "Bem-vindo ao FleetSense." });
      navigate("/", { replace: true });
    } catch (error) {
      const message = error?.message || "Não foi possível entrar no sistema.";
      setSubmitError(message);
      toast({ title: "Erro ao entrar", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:py-10">
        <div className="hidden lg:flex lg:items-center lg:justify-center">
          <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 p-10 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-md">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.08),rgba(99,102,241,0.06),transparent)]" />
            <div className="pointer-events-none absolute -right-10 top-10 h-32 w-32 rounded-full border border-blue-200/60 bg-white/40 blur-[2px]" />
            <div className="relative space-y-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100/70">
                <Truck className="h-7 w-7" />
              </div>

              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  FleetSense Secure Access
                </div>
                <h1 className="max-w-md text-4xl font-bold tracking-tight text-slate-900">
                  Gestão de frota com padrão SaaS premium.
                </h1>
                <p className="max-w-lg text-base leading-7 text-slate-600">
                  Acesso controlado, experiência sofisticada e integração direta com o backend para operação segura e consistente.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Permissões</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">Acesso por cargo</p>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sessão</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">Token Bearer salvo</p>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Backend</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">Integração em nuvem</p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 text-sm text-slate-600 shadow-sm">
                <p className="font-medium text-slate-900">Acesso controlado</p>
                <p>
                  Novos usuários só podem ser criados por administradores via sistema interno. Contate o administrador para solicitar uma conta.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Card className="w-full max-w-xl rounded-[2.25rem] border border-white/70 bg-white/85 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <CardHeader className="space-y-6 p-6 pb-0 sm:p-8 sm:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100/70">
                    <Truck className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Secure portal
                    </div>
                    <CardTitle className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Entrar no FleetSense
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-slate-500">
                      Use sua conta para acessar a gestão da frota.
                    </CardDescription>
                  </div>
                </div>
                <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right sm:block">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Ambiente</p>
                  <p className="mt-1 text-xs font-medium text-slate-900">Cloud secured</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-6 sm:p-8 sm:pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {submitError ? (
                  <Alert variant="destructive" className="border-red-200 bg-red-50/80 text-red-900">
                    <AlertTitle>Falha no login</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@empresa.com"
                    value={formData.email}
                    onChange={handleChange("email")}
                    autoComplete="email"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={handleChange("password")}
                    autoComplete="current-password"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-blue-600 font-medium text-white shadow-sm shadow-blue-500/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
                  disabled={isSubmitting}
                >
                  <LogIn className="h-4 w-4" />
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-600 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-slate-500" />
                  <p className="font-medium">Acesso controlado</p>
                </div>
                <p className="mt-2 leading-6">
                  Novos usuários só podem ser criados por administradores via sistema interno. Contate o administrador para solicitar uma conta.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 text-xs text-slate-500">
                <span>Protegido por autenticação via backend</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Token Bearer
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
