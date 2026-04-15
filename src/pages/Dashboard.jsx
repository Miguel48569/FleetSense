// Projeto SENAC 2026 - FleetSense
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck, Users, DollarSign, Route } from "lucide-react";
import { vehiclesApi, driversApi, tripsApi } from "@/lib/api";
import StatCard from "@/components/dashboard/StatCard";
import CostChart from "@/components/dashboard/CostChart";
import FleetStatusChart from "@/components/dashboard/FleetStatusChart";

export default function Dashboard() {
  // ── Buscar dados para o dashboard ───────────────────────
  // Backend: GET /api/vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.list,
  });

  // Backend: GET /api/drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: driversApi.list,
  });

  // Backend: GET /api/trips
  const { data: trips = [] } = useQuery({
    queryKey: ["trips"],
    queryFn: tripsApi.list,
  });

  const totalCost = trips.reduce((sum, t) => sum + (t.cost || 0), 0);
  const totalTrips = trips.length;

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da sua frota</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        <StatCard
          title="Veículos"
          value={vehicles.length}
          icon={Truck}
          color="bg-primary"
          subtitle={`${vehicles.filter((v) => v.status === "ativo").length} ativos`}
        />
        <StatCard
          title="Motoristas"
          value={drivers.length}
          icon={Users}
          color="bg-chart-2"
          subtitle={`${drivers.filter((d) => d.status === "ativo").length} ativos`}
        />
        <StatCard
          title="Custo Total"
          value={`R$ ${totalCost.toFixed(2)}`}
          icon={DollarSign}
          color="bg-chart-3"
          subtitle="Todos os períodos"
        />
        <StatCard
          title="Viagens"
          value={totalTrips}
          icon={Route}
          color="bg-chart-4"
          subtitle="Registradas"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5">
        <CostChart trips={trips} />
        <FleetStatusChart vehicles={vehicles} />
      </div>
    </div>
  );
}
