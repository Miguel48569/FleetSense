// Projeto SENAC 2026 - FleetSense
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { usersApi } from "@/lib/api";
import { Loader2, Pencil, Plus, RefreshCcw, Search, Trash2, UserRound, Users as UsersIcon } from "lucide-react";

const emptyForm = {
  matricula: "",
  email: "",
  senha: "",
  cargo: "assistente",
};

const roleLabelMap = {
  administrador: "Administrador",
  motorista: "Motorista",
  assistente: "Assistente",
};

function UserFormDialog({ open, onOpenChange, mode, initialValue, onSubmit, isSaving }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(
        initialValue
          ? {
              matricula: initialValue.matricula || "",
              email: initialValue.email || "",
              senha: "",
              cargo: initialValue.cargo || "assistente",
            }
          : emptyForm
      );
    }
  }, [open, initialValue]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo Usuário" : "Editar Usuário"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Cadastre um novo usuário interno com cargo e matrícula."
              : "Atualize os dados do usuário selecionado."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                value={form.matricula}
                onChange={handleChange("matricula")}
                placeholder="Ex: ADM2024001"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cargo">Cargo</Label>
              <Select value={form.cargo} onValueChange={(value) => setForm((prev) => ({ ...prev, cargo: value }))}>
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

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="usuario@empresa.com"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="senha">
                Senha {mode === "edit" && <span className="text-xs text-muted-foreground">(deixe em branco para manter a atual)</span>}
              </Label>
              <Input
                id="senha"
                type="password"
                value={form.senha}
                onChange={handleChange("senha")}
                placeholder={mode === "create" ? "Senha inicial" : "Nova senha"}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Salvar Usuário" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Users() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cargoFilter, setCargoFilter] = useState("todos");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
  });

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matricula = `${user.matricula || ""}`.toLowerCase();
      const email = `${user.email || ""}`.toLowerCase();
      const cargo = `${user.cargo || ""}`.toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        matricula.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        cargo.includes(normalizedSearch);
      const matchesCargo = cargoFilter === "todos" || cargo === cargoFilter;

      return matchesSearch && matchesCargo;
    });
  }, [users, searchTerm, cargoFilter]);

  const hasActiveFilters = searchTerm.trim() || cargoFilter !== "todos";

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsCreateOpen(false);
      toast({ title: "Usuário criado", description: "O usuário foi salvo com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ idUsuario, data }) => usersApi.update(idUsuario, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
      toast({ title: "Usuário atualizado", description: "As alterações foram salvas com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar usuário", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteTarget(null);
      toast({ title: "Usuário excluído", description: "O registro foi removido com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir usuário", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = (form) => {
    if (!form.matricula || !form.email || !form.senha || !form.cargo) {
      toast({ title: "Campos obrigatórios", description: "Preencha matrícula, e-mail, senha e cargo.", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  };

  const handleUpdate = (form) => {
    if (!editingUser) return;
    if (!form.matricula || !form.email || !form.cargo) {
      toast({ title: "Campos obrigatórios", description: "Preencha matrícula, e-mail e cargo.", variant: "destructive" });
      return;
    }

    updateMutation.mutate({
      idUsuario: editingUser.idUsuario,
      data: {
        ...form,
        senha: form.senha?.trim() || undefined,
      },
    });
  };

  const selectedUserId = useMemo(() => deleteTarget?.idUsuario || deleteTarget?.id || null, [deleteTarget]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
            <UsersIcon className="h-3.5 w-3.5" />
            Acesso restrito ao administrador
          </div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Gerenciamento de Usuários</h1>
          <p className="mt-1 text-muted-foreground">Crie, edite e remova usuários internos da plataforma.</p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="sm:self-start">
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid gap-3 lg:grid-cols-[1.6fr_0.8fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="user-search" className="text-sm font-medium">
                Buscar usuário
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="user-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Pesquise por matrícula, e-mail ou cargo"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo-filter" className="text-sm font-medium">
                Filtrar por cargo
              </Label>
              <Select value={cargoFilter} onValueChange={setCargoFilter}>
                <SelectTrigger id="cargo-filter">
                  <SelectValue placeholder="Todos os cargos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os cargos</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="motorista">Motorista</SelectItem>
                  <SelectItem value="assistente">Assistente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setCargoFilter("todos");
              }}
              disabled={!hasActiveFilters}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{filteredUsers.length} usuário(s) encontrado(s)</span>
            {hasActiveFilters ? (
              <Badge variant="outline" className="gap-1">
                Filtros ativos
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando usuários...
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="h-16 rounded-lg bg-muted/50 animate-pulse" />
                <div className="h-16 rounded-lg bg-muted/50 animate-pulse" />
                <div className="h-16 rounded-lg bg-muted/50 animate-pulse" />
                <div className="h-16 rounded-lg bg-muted/50 animate-pulse" />
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <UserRound className="mb-3 h-10 w-10 opacity-60" />
              <p className="font-medium text-foreground">Nenhum usuário encontrado</p>
              <p className="mt-1 max-w-md text-sm">Clique em &quot;Novo Usuário&quot; para cadastrar o primeiro acesso interno.</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Search className="mb-3 h-10 w-10 opacity-60" />
              <p className="font-medium text-foreground">Nenhum resultado para os filtros atuais</p>
              <p className="mt-1 max-w-md text-sm">Altere a busca ou limpe os filtros para visualizar outros usuários.</p>
              <Button type="button" variant="outline" className="mt-4" onClick={() => {
                setSearchTerm("");
                setCargoFilter("todos");
              }}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const idUsuario = user.idUsuario || user.id || user.usuarioId;
                    const cargo = user.cargo || "—";
                    return (
                      <TableRow key={idUsuario || `${user.matricula}-${user.email}`}>
                        <TableCell className="font-medium font-mono">{user.matricula || "—"}</TableCell>
                        <TableCell>{user.email || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {roleLabelMap[cargo] || cargo || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUser({ ...user, idUsuario })}
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => setDeleteTarget({ ...user, idUsuario })}
                              aria-label="Excluir usuário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        mode="create"
        onSubmit={handleCreate}
        isSaving={createMutation.isPending}
      />

      <UserFormDialog
        open={Boolean(editingUser)}
        onOpenChange={(open) => !open && setEditingUser(null)}
        mode="edit"
        initialValue={editingUser}
        onSubmit={handleUpdate}
        isSaving={updateMutation.isPending}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => selectedUserId && deleteMutation.mutate(selectedUserId)}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Confirmar Exclusão"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
