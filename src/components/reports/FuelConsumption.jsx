import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function FuelConsumption({ trips, vehicles }) {
  const vehicleMap = {};
  vehicles.forEach(v => { vehicleMap[v.id] = v; });

  const consumption = {};
  trips.forEach(trip => {
    if (!trip.vehicle_id) return;
    if (!consumption[trip.vehicle_id]) {
      consumption[trip.vehicle_id] = { totalFuel: 0, totalKm: 0, totalCost: 0, count: 0 };
    }
    consumption[trip.vehicle_id].totalFuel += trip.fuel_liters || 0;
    consumption[trip.vehicle_id].totalKm += trip.distance_km || 0;
    consumption[trip.vehicle_id].totalCost += trip.cost || 0;
    consumption[trip.vehicle_id].count += 1;
  });

  const rows = Object.entries(consumption).map(([vehicleId, data]) => {
    const vehicle = vehicleMap[vehicleId];
    const avgConsumption = data.totalKm > 0 && data.totalFuel > 0
      ? (data.totalKm / data.totalFuel).toFixed(1) : '—';
    return {
      plate: vehicle?.plate || 'Desconhecido',
      model: vehicle?.model || '',
      ...data,
      avgConsumption,
    };
  });

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Consumo por Veículo</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6">Nenhum dado disponível.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Viagens</TableHead>
                <TableHead>Km Total</TableHead>
                <TableHead>Litros Total</TableHead>
                <TableHead>Km/L</TableHead>
                <TableHead>Custo Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.plate} <span className="text-muted-foreground font-normal">- {r.model}</span></TableCell>
                  <TableCell>{r.count}</TableCell>
                  <TableCell>{r.totalKm.toFixed(1)} km</TableCell>
                  <TableCell>{r.totalFuel.toFixed(1)} L</TableCell>
                  <TableCell className="font-semibold">{r.avgConsumption}</TableCell>
                  <TableCell>R$ {r.totalCost.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
