// Projeto SENAC 2026 - FleetSense
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { driversApi } from "@/lib/api";
import DriverForm from "@/components/drivers/DriverForm";
import DriverTable from "@/components/drivers/DriverTable";
import { toast } from "@/components/ui/use-toast";

export default function Drivers() {
  const queryClient = useQueryClient();

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
    },
    onError: (err) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Motoristas</h1>
        <p className="text-muted-foreground mt-1">
          Cadastre motoristas e associe a veículos
        </p>
      </div>
      <DriverForm
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
      <DriverTable
        drivers={drivers}
        isLoading={isLoading}
        onDelete={(cpfOrId) => deleteMutation.mutate(cpfOrId)}
      />
    </div>
  );
}
