// Projeto SENAC 2026 - FleetSense
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { driversApi } from "@/lib/api";
import DriverForm from "@/components/drivers/DriverForm";
import DriverTable from "@/components/drivers/DriverTable";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Drivers() {
  const queryClient = useQueryClient();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ── Buscar lista de motoristas ───────────────────────────
  // Backend: GET /api/motoristas
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: driversApi.list,
  });

  // ── Criar motorista ──────────────────────────────────────
  // Backend: POST /api/motoristas
  const createMutation = useMutation({
    mutationFn: driversApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: "Motorista cadastrado", description: "Motorista adicionado com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  // ── Deletar motorista ────────────────────────────────────
  // Backend: DELETE /api/motoristas/:id
  const deleteMutation = useMutation({
    mutationFn: driversApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setIsDeleteModalOpen(false);
      setDriverToDelete(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ cpf, data }) => driversApi.update(cpf, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setIsEditModalOpen(false);
      setSelectedDriver(null);
      toast({ title: "Motorista atualizado", description: "As informações foram salvas com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    },
  });

  const handleEditDriver = (driver) => {
    setSelectedDriver(driver);
    setIsEditModalOpen(true);
  };

  const handleRequestDelete = (cpfOrId) => {
    const foundDriver = drivers.find((driver) => `${driver.cpf ?? driver.id ?? ""}` === `${cpfOrId}`);
    setDriverToDelete(foundDriver || { cpf: cpfOrId });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteDriver = () => {
    if (!driverToDelete) return;
    deleteMutation.mutate(driverToDelete.cpf || driverToDelete.id);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Motoristas</h1>
        <p className="text-muted-foreground mt-1">
          Cadastre motoristas e associe a veículos
        </p>
      </div>
      <DriverForm
        onSubmit={(data) => createMutation.mutateAsync(data)}
        isLoading={createMutation.isPending}
      />
      <DriverTable
        drivers={drivers}
        isLoading={isLoading}
        onEdit={handleEditDriver}
        onDelete={handleRequestDelete}
      />

      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && setIsEditModalOpen(false)}>
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar motorista</DialogTitle>
            <DialogDescription>
              Atualize os dados do condutor e confirme para salvar as alterações.
            </DialogDescription>
          </DialogHeader>
          <DriverForm
            initialDriver={selectedDriver}
            onSubmit={(data) => updateMutation.mutateAsync({ cpf: selectedDriver?.cpf || selectedDriver?.id, data })}
            isLoading={updateMutation.isPending}
            submitLabel={updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !open && setIsDeleteModalOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir motorista</DialogTitle>
            <DialogDescription>
              Deseja realmente excluir este motorista? Esta ação é permanente.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-800">
            <p className="font-semibold text-red-900">Ação irreversível</p>
            <p className="mt-1 leading-6">
              {driverToDelete?.nome || driverToDelete?.name ? `${driverToDelete.nome || driverToDelete.name} - ${driverToDelete.cpf || driverToDelete.id || ""}` : "O motorista selecionado será removido do sistema."}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={confirmDeleteDriver}
              className="rounded-xl bg-red-600 font-medium text-white shadow-sm shadow-red-500/20 hover:bg-red-700"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
