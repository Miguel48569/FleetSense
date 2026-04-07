// Projeto SENAC 2026 - FleetSense
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api";
import VehicleForm from "@/components/vehicles/VehicleForm";
import VehicleTable from "@/components/vehicles/VehicleTable";
import { toast } from "@/components/ui/use-toast";

export default function Vehicles() {
  const queryClient = useQueryClient();

  // ── Buscar lista de veículos ─────────────────────────────
  // Backend: GET /api/vehicles
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.list,
  });

  // ── Criar veículo ────────────────────────────────────────
  // Backend: POST /api/vehicles
  const createMutation = useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({ title: "Veículo cadastrado", description: "Veículo adicionado com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  // ── Deletar veículo ──────────────────────────────────────
  // Backend: DELETE /api/vehicles/:id
  const deleteMutation = useMutation({
    mutationFn: vehiclesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (err) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Veículos</h1>
        <p className="text-muted-foreground mt-1">
          Cadastre e gerencie os veículos da frota
        </p>
      </div>
      <VehicleForm
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
      <VehicleTable
        vehicles={vehicles}
        isLoading={isLoading}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}
