// Projeto SENAC 2026 - FleetSense
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, UserPlus, UserRound } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "", matricula: "", cargo: "" });

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCargoChange = (value) => {
    setFormData((prev) => ({ ...prev, cargo: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.matricula || !formData.cargo) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: "Senha muito curta", description: "Use ao menos 6 caracteres.", variant: "destructive" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Senhas diferentes", description: "A confirmação da senha nao confere.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        matricula: formData.matricula,
        cargo: formData.cargo,
      });
      toast({ title: "Conta criada", description: "Seu cadastro foi concluido com sucesso." });
      navigate("/", { replace: true });
    } catch (error) {
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--chart-2)/0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute -right-20 top-16 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-8 h-64 w-64 rounded-full bg-chart-4/20 blur-3xl" />

      <Card className="relative z-10 w-full max-w-lg border-border/70 shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Criar conta</CardTitle>
              <CardDescription>Cadastre-se para acessar os paineis da frota.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nome completo"
                  value={formData.name}
                  onChange={handleChange("name")}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
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

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="matricula">Matricula</Label>
                <Input
                  id="matricula"
                  type="text"
                  placeholder="ADM2024001 ou MOT2024001"
                  value={formData.matricula}
                  onChange={handleChange("matricula")}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select value={formData.cargo} onValueChange={handleCargoChange}>
                  <SelectTrigger id="cargo">
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="motorista">Motorista</SelectItem>
                    <SelectItem value="assistente">Assistente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange("password")}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a senha"
                  value={formData.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            O cadastro e enviado para o backend em nuvem.
            <br />
            Ja possui conta?{" "}
            <Link to="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              Entrar agora
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
