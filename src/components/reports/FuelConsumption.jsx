import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function getVehicleValue(vehicle) {
  return `${vehicle?.id ?? vehicle?.vehicle_id ?? vehicle?.placa ?? vehicle?.plate ?? ''}`.trim();
}

function formatKmL(value) {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(1)} Km/L`;
}

export default function FuelConsumption({ trips, vehicles }) {
  const vehicleMap = {};
  vehicles.forEach(v => { vehicleMap[getVehicleValue(v)] = v; });

  const getTripKm = (trip) => trip?.quilometragem ?? trip?.distance_km ?? 0;

  const consumption = {};
  trips.forEach(trip => {
    const vehicleKey = `${trip.vehicle_id ?? trip.vehicleId ?? trip.veiculo_id ?? trip.veiculoId ?? trip.placa ?? ''}`.trim();
    if (!vehicleKey) return;
    if (!consumption[vehicleKey]) {
      consumption[vehicleKey] = { totalFuel: 0, totalKm: 0, totalCost: 0, count: 0 };
    }
    consumption[vehicleKey].totalFuel += Number(trip.fuel_liters || 0);
    consumption[vehicleKey].totalKm += Number(getTripKm(trip) || 0);
    consumption[vehicleKey].totalCost += Number(trip.cost || 0);
    consumption[vehicleKey].count += 1;
  });

  const rows = Object.entries(consumption).map(([vehicleId, data]) => {
    const vehicle = vehicleMap[vehicleId];
    const avgConsumption = data.totalKm > 0 && data.totalFuel > 0
      ? data.totalKm / data.totalFuel : Number.NaN;
    return {
      plate: vehicle?.placa || vehicle?.plate || 'Veículo não identificado',
      model: vehicle?.modelo || vehicle?.model || '',
      ...data,
      avgConsumption,
    };
  });

  rows.sort((a, b) => {
    const aScore = Number.isFinite(a.avgConsumption) ? a.avgConsumption : -1;
    const bScore = Number.isFinite(b.avgConsumption) ? b.avgConsumption : -1;
    return bScore - aScore;
  });

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Consumo por Veículo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6">Nenhum dado disponível.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => (
              <div key={`${r.plate}-${r.model}`} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.plate}</p>
                    {r.model ? <p className="mt-0.5 text-xs text-slate-500">{r.model}</p> : null}
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {formatKmL(r.avgConsumption)}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="rounded-xl bg-white/80 p-3">
                    <p className="text-xs uppercase tracking-wider text-slate-400">Viagens</p>
                    <p className="mt-1 font-semibold text-slate-900">{r.count}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-3">
                    <p className="text-xs uppercase tracking-wider text-slate-400">Custo total</p>
                    <p className="mt-1 font-semibold text-slate-900">R$ {r.totalCost.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-3">
                    <p className="text-xs uppercase tracking-wider text-slate-400">Quilometragem</p>
                    <p className="mt-1 font-semibold text-slate-900">{r.totalKm.toFixed(1)} km</p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-3">
                    <p className="text-xs uppercase tracking-wider text-slate-400">Combustível</p>
                    <p className="mt-1 font-semibold text-slate-900">{r.totalFuel.toFixed(1)} L</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-600">Média operacional de <span className="font-semibold text-slate-900">{formatKmL(r.avgConsumption)}</span>.</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
