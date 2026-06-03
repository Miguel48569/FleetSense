// Projeto SENAC 2026 - FleetSense
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api";
import VehicleForm from "@/components/vehicles/VehicleForm";
import VehicleTable from "@/components/vehicles/VehicleTable";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const statusLabelMap = {
  disponivel: "Disponivel",
  inativo: "Inativo",
  "em manutenção": "Em manutenção",
  em_manutencao: "Em manutenção",
  manutencao: "Em manutenção",
};

function VehicleField({ label, value }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="rounded-md border bg-background px-3 py-2 text-sm">{value || "—"}</div>
    </div>
  );
}

export default function Vehicles() {
  const queryClient = useQueryClient();
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // ── Buscar lista de veículos ─────────────────────────────
  // Backend: GET /api/veiculos
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.list,
  });

  // ── Criar veículo ────────────────────────────────────────
  // Backend: POST /api/veiculos
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
  // Backend: DELETE /api/veiculos/:id
  const deleteMutation = useMutation({
    mutationFn: vehiclesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (err) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => vehiclesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setSelectedVehicle(null);
      toast({ title: "Veículo atualizado", description: "As informações foram salvas com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    },
  });

  const selectedVehicleId = selectedVehicle?.id || selectedVehicle?.placa || selectedVehicle?.plate;
  const selectedStatusRaw = `${selectedVehicle?.status || ""}`.trim().toLowerCase();
  const selectedStatusLabel = statusLabelMap[selectedStatusRaw] || "Disponivel";

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Veículos</h1>
        <p className="text-muted-foreground mt-1">
          Cadastre e gerencie os veículos da frota
        </p>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold">Novo Veículo</h2>
              <p className="text-sm text-muted-foreground">Preencha os dados abaixo para cadastrar um veículo.</p>
            </div>
          </div>
          <VehicleForm
            onSubmit={(data) => createMutation.mutate(data)}
            submitLabel={createMutation.isPending ? "Salvando..." : "Salvar"}
          />
        </CardContent>
      </Card>
      <VehicleTable
        vehicles={vehicles}
        isLoading={isLoading}
        onDelete={(id) => deleteMutation.mutate(id)}
        onSelectVehicle={(vehicle) => setSelectedVehicle(vehicle)}
      />

      <Dialog open={Boolean(selectedVehicle)} onOpenChange={(open) => !open && setSelectedVehicle(null)}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Detalhes do veículo</DialogTitle>
            <DialogDescription>
              Clique fora do modal para fechar ou atualize os campos abaixo e salve.
            </DialogDescription>
          </DialogHeader>

          {selectedVehicle && (
            <div className="space-y-5">
              <Card className="border-dashed">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Veículo selecionado</p>
                      <h3 className="text-lg font-semibold font-mono">{selectedVehicle?.placa || selectedVehicle?.plate || "—"}</h3>
                    </div>
                    <Badge variant="outline">{selectedStatusLabel}</Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <VehicleField label="Placa" value={selectedVehicle?.placa || selectedVehicle?.plate} />
                    <VehicleField label="Modelo" value={selectedVehicle?.modelo || selectedVehicle?.model} />
                    <VehicleField label="Fabricante" value={selectedVehicle?.fabricante || selectedVehicle?.manufacturer} />
                    <VehicleField label="Cor" value={selectedVehicle?.cor || selectedVehicle?.color} />
                    <VehicleField label="Ano" value={selectedVehicle?.ano || selectedVehicle?.year} />
                    <VehicleField label="Quilometragem" value={selectedVehicle?.quilometragem ?? selectedVehicle?.mileage} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
                    <div>
                      <h4 className="text-base font-semibold">Editar veículo</h4>
                      <p className="text-sm text-muted-foreground">Os campos já vêm preenchidos com os dados atuais.</p>
                    </div>
                  </div>
                  <VehicleForm
                    initialVehicle={selectedVehicle}
                    submitLabel={updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
                    onSubmit={(data) => updateMutation.mutate({ id: selectedVehicleId, data })}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
