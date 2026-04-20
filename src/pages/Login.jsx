// Projeto SENAC 2026 - FleetSense
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck, Truck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
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

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      toast({ title: "Campos obrigatórios", description: "Informe e-mail e senha.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await login(formData);
      toast({ title: "Login realizado", description: "Bem-vindo ao FleetSense." });
      navigate("/", { replace: true });
    } catch (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-20 top-20 h-48 w-48 rounded-full bg-chart-2/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-8 h-64 w-64 rounded-full bg-chart-3/20 blur-3xl" />

      <Card className="relative z-10 w-full max-w-md border-border/70 shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Entrar no FleetSense</CardTitle>
              <CardDescription>Use sua conta para acessar a gestão da frota.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@empresa.com"
                value={formData.email}
                onChange={handleChange("email")}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={formData.password}
                onChange={handleChange("password")}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <LogIn className="h-4 w-4" />
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-1 font-medium text-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Acesso local para ambiente de desenvolvimento
            </p>
            <p className="mt-1">Ainda não tem conta? Crie em poucos segundos.</p>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Nao possui conta?{" "}
            <Link to="/cadastro" className="font-medium text-primary hover:underline">
              Criar cadastro
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
