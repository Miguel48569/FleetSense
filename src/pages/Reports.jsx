// Projeto SENAC 2026 - FleetSense
import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tripsApi, relacoesApi, vehiclesApi, driversApi } from "@/lib/api";
import TripForm from "@/components/reports/TripForm";
import TripTable from "@/components/reports/TripTable";
import FuelConsumption from "@/components/reports/FuelConsumption";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

function getTripErrorMessage(error) {
  if (error?.status === 400) {
    const details = error?.raw?.errors && typeof error.raw.errors === "object"
      ? Object.entries(error.raw.errors)
          .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join(" | ")
      : error?.raw?.message || error?.message || "Falha de validação";
    return `Verifique os campos informados. ${details}`;
  }

  return error?.message || "Não foi possível concluir esta operação no momento.";
}

function getMutationErrorMessage(error, stepLabel) {
  const baseMessage = getTripErrorMessage(error);
  return stepLabel ? `${stepLabel}: ${baseMessage}` : baseMessage;
}

function DeleteTripDialog({ open, trip, isDeleting, onClose, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir viagem</DialogTitle>
          <DialogDescription>
            Deseja realmente excluir este registro de viagem?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-800">
          <p className="font-semibold text-red-900">Ação permanente</p>
          <p className="mt-1 leading-6">
            {trip?.origin && trip?.destination ? `${trip.origin} para ${trip.destination}` : "Registro selecionado para exclusão."}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
            className="rounded-xl bg-red-600 font-medium text-white shadow-sm shadow-red-500/20 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.98]"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Reports() {
  const queryClient = useQueryClient();
  const [tripToDelete, setTripToDelete] = useState(null);

  const getSelectedVehicle = (vehicleId) => {
    const text = `${vehicleId ?? ""}`.trim();
    return vehicles.find((vehicle) => {
      const values = [
        vehicle?.id,
        vehicle?.vehicle_id,
        vehicle?.placa,
        vehicle?.plate,
      ].map((value) => `${value ?? ""}`.trim());
      return values.includes(text);
    });
  };

  const getSelectedDriver = (driverId) => {
    const text = `${driverId ?? ""}`.trim();
    return drivers.find((driver) => {
      const values = [
        driver?.id,
        driver?.driver_id,
        driver?.cpf,
      ].map((value) => `${value ?? ""}`.trim());
      return values.includes(text);
    });
  };

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: tripsApi.list,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.list,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: driversApi.list,
  });

  const { data: relacoes = [] } = useQuery({
    queryKey: ["relacoes"],
    queryFn: relacoesApi.list,
    enabled: true,
  });

  useEffect(() => {
    if (relacoes.length > 0) {
      console.log("Dados retornados em /relacoes:", relacoes);
    }
  }, [relacoes]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const selectedVehicle = getSelectedVehicle(data?.vehicle_id);
      const selectedDriver = getSelectedDriver(data?.driver_id);

      let createdTrip;
      try {
        createdTrip = await tripsApi.create({
          partida: data?.origin ?? data?.partida ?? "",
          destino: data?.destination ?? data?.destino ?? "",
          distancia: data?.quilometragem ?? data?.distancia ?? 0,
          qtdCombustivel: data?.fuel_liters ?? data?.qtdCombustivel ?? 0,
          custo: data?.cost ?? data?.custo ?? 0,
          dataInicio: data?.date ?? data?.dataInicio ?? "",
          dataFim: data?.date ?? data?.dataFim ?? data?.date ?? "",
          status: data?.status ?? "Pendente",
        });
      } catch (error) {
        error.step = 1;
        throw error;
      }

      const tripId = createdTrip?.data?.id ?? createdTrip?.data?.data?.id ?? createdTrip?.id ?? createdTrip?.data?.idViagem ?? createdTrip?.data?.viagem_id ?? null;

      if (!tripId) {
        const error = new Error("Não foi possível identificar o ID da viagem criada.");
        error.step = 1;
        throw error;
      }

      const motoristaCpf = `${selectedDriver?.cpf ?? selectedDriver?.id ?? selectedDriver?.driver_id ?? data?.driver_id ?? ""}`.replace(/\D/g, "");
      const veiculoPlaca = selectedVehicle?.placa ?? selectedVehicle?.plate ?? selectedVehicle?.id ?? selectedVehicle?.vehicle_id ?? data?.vehicle_id ?? "";

      console.log("Payload limpo enviado para /relacoes:", {
        motorista_cpf: motoristaCpf,
        veiculo_placa: veiculoPlaca,
        viagem_id: tripId,
      });

      console.log("Status do veículo usado na relação:", {
        placa: selectedVehicle?.placa ?? selectedVehicle?.plate ?? selectedVehicle?.id ?? selectedVehicle?.vehicle_id ?? "",
        status: selectedVehicle?.status ?? "",
        status_original: selectedVehicle?.status_original ?? "",
      });

      try {
        await relacoesApi.create({
          motorista_cpf: motoristaCpf,
          veiculo_placa: veiculoPlaca,
          viagem_id: tripId,
        });
      } catch (error) {
        error.step = 2;
        throw error;
      }

      return createdTrip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["relacoes"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: "Viagem registrada", description: "O novo registro foi salvo e vinculado com sucesso." });
    },
    onError: (err) => {
      const stepLabel = err?.step === 1 ? "Falha ao salvar a viagem" : err?.step === 2 ? "Falha ao vincular a viagem" : "Não foi possível registrar";
      const stepDescription = err?.step === 1 ? "Etapa 1" : err?.step === 2 ? "Etapa 2" : "";
      toast({ title: stepLabel, description: getMutationErrorMessage(err, stepDescription), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tripsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setTripToDelete(null);
      toast({ title: "Viagem excluída", description: "O registro foi removido com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Não foi possível excluir", description: getTripErrorMessage(err), variant: "destructive" });
    },
  });

  const handleCreateTrip = async (data) => {
    await createMutation.mutateAsync(data);
  };

  const handleConfirmDelete = async () => {
    if (!tripToDelete) return;
    await deleteMutation.mutateAsync(tripToDelete.id);
  };

  const handleDeleteTrip = (tripId) => {
    const selectedTrip = trips.find((trip) => `${trip.id}` === `${tripId}`);
    setTripToDelete(selectedTrip || { id: tripId });
  };

  const visibleTrips = useMemo(() => {
    if (relacoes.length > 0) return relacoes;
    return trips;
  }, [relacoes, trips]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Relatórios</h1>
        <p className="text-muted-foreground mt-1">
          Viagens, consumo e custos da frota
        </p>
      </div>
      <TripForm
        onSubmit={handleCreateTrip}
        vehicles={vehicles}
        drivers={drivers}
        isLoading={createMutation.isPending}
      />
      <FuelConsumption trips={visibleTrips} vehicles={vehicles} />
      <TripTable
        trips={visibleTrips}
        vehicles={vehicles}
        drivers={drivers}
        isLoading={tripsLoading}
        onDelete={handleDeleteTrip}
      />

      <DeleteTripDialog
        open={Boolean(tripToDelete)}
        trip={tripToDelete}
        isDeleting={deleteMutation.isPending}
        onClose={() => setTripToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
