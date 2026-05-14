// Projeto SENAC 2026 - FleetSense
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tripsApi, vehiclesApi, driversApi } from "@/lib/api";
import TripForm from "@/components/reports/TripForm";
import TripTable from "@/components/reports/TripTable";
import FuelConsumption from "@/components/reports/FuelConsumption";
import { toast } from "@/components/ui/use-toast";

export default function Reports() {
  const queryClient = useQueryClient();

  // ── Buscar lista de viagens ──────────────────────────────
  // Backend: GET /api/viagens
  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: tripsApi.list,
  });

  // ── Buscar lista de veículos ─────────────────────────────
  // Backend: GET /api/veiculos
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.list,
  });

  // ── Buscar lista de motoristas ───────────────────────────
  // Backend: GET /api/motoristas
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: driversApi.list,
  });

  // ── Registrar viagem ─────────────────────────────────────
  // Backend: POST /api/viagens
  const createMutation = useMutation({
    mutationFn: tripsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast({ title: "Viagem registrada", description: "Viagem adicionada com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  // ── Deletar viagem ───────────────────────────────────────
  // Backend: DELETE /api/viagens/:id
  const deleteMutation = useMutation({
    mutationFn: tripsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (err) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Relatórios</h1>
        <p className="text-muted-foreground mt-1">
          Viagens, consumo e custos da frota
        </p>
      </div>
      <TripForm
        onSubmit={(data) => createMutation.mutate(data)}
        vehicles={vehicles}
        drivers={drivers}
        isLoading={createMutation.isPending}
      />
      <FuelConsumption trips={trips} vehicles={vehicles} />
      <TripTable
        trips={trips}
        vehicles={vehicles}
        drivers={drivers}
        isLoading={tripsLoading}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}
