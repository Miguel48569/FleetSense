import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'dd/MM/yyyy');
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return currencyFormatter.format(number);
}

function getVehicleValue(vehicle) {
  return `${vehicle?.id ?? vehicle?.vehicle_id ?? vehicle?.placa ?? vehicle?.plate ?? ''}`.trim();
}

function getDriverValue(driver) {
  return `${driver?.id ?? driver?.driver_id ?? driver?.cpf ?? ''}`.trim();
}

function getTripVehicleString(trip) {
  if (!trip) return '';
  const veiculoObj = trip?.veiculo || trip?.vehicle || {};
  return (
    veiculoObj?.placa || veiculoObj?.plate || trip?.veiculo_placa || trip?.vehicle_plate || trip?.placa || trip?.vehicle_plate || trip?.vehicle_id || trip?.vehicleId || ''
  ).toString();
}

function getTripDriverString(trip) {
  if (!trip) return '';
  const driverObj = trip?.motorista || trip?.driver || {};
  return (
    driverObj?.nome || driverObj?.name || trip?.motorista_nome || trip?.driver_name || trip?.cpf || trip?.driver_id || trip?.driverId || ''
  ).toString();
}

export default function TripTable({ trips, vehicles, drivers, onDelete }) {
  if (trips?.length) {
    console.log("Dados de uma viagem na tabela:", trips[0]);
  }

  const vehicleMap = {};
  vehicles.forEach(v => { vehicleMap[getVehicleValue(v)] = v; });
  const driverMap = {};
  drivers.forEach(d => { driverMap[getDriverValue(d)] = d; });

  const getTripDate = (trip) => trip?.dataInicio || trip?.dataFim || trip?.data || trip?.data_viagem || trip?.date || trip?.created_at || trip?.createdAt || '';
  const getTripVehicle = (trip) => trip?.veiculo?.placa || trip?.veiculo_placa || trip?.placa || trip?.veiculo?.vehicle_plate || trip?.veiculo || trip?.vehicle?.placa || trip?.vehicle?.plate || trip?.vehicle || trip?.vehicle_plate || trip?.vehicle_id || trip?.vehicleId || '';
  const getTripDriver = (trip) => trip?.motorista?.nome || trip?.motorista_nome || trip?.nome_motorista || trip?.motorista?.name || trip?.motorista || trip?.driver?.nome || trip?.driver?.name || trip?.driver || trip?.driver_name || trip?.driver_id || trip?.driverId || '';
  const getTripOrigin = (trip) => trip?.partida || trip?.origem || trip?.ponto_partida || trip?.origin || trip?.start || '';
  const getTripDestination = (trip) => trip?.destination || trip?.destino || trip?.ponto_chegada || trip?.chegada || '';
  const getTripKm = (trip) => trip?.distancia ?? trip?.quilometragem ?? trip?.km ?? trip?.distance_km ?? 0;
  const getTripLiters = (trip) => trip?.qtdCombustivel ?? trip?.combustivel ?? trip?.litros ?? trip?.consumo ?? trip?.fuel_liters ?? 0;
  const getTripCost = (trip) => trip?.cost ?? trip?.custo ?? trip?.valor ?? 0;

  const exportCSV = () => {
    const header = 'Data;Veículo;Motorista;Origem;Destino;Quilometragem;Combustível;Custo\n';
    const rows = trips.map(t => {
      const v = vehicleMap[`${t.vehicle_id ?? t.vehicleId ?? t.veiculo_id ?? t.veiculoId ?? t.placa ?? getTripVehicle(t) ?? ''}`.trim()];
      const d = driverMap[`${t.driver_id ?? t.driverId ?? t.motorista_id ?? t.motoristaId ?? t.cpf ?? getTripDriver(t) ?? ''}`.trim()];
      return [
        formatDate(getTripDate(t)),
        v?.placa || v?.plate || t?.veiculo?.placa || t?.veiculo_placa || t?.placa || t?.veiculo || t?.vehicle?.placa || t?.vehicle?.plate || getTripVehicle(t) || '',
        d?.nome || d?.name || t?.motorista?.nome || t?.motorista_nome || t?.nome_motorista || t?.driver?.nome || t?.driver?.name || getTripDriver(t) || '',
        getTripOrigin(t),
        getTripDestination(t),
        Number(getTripKm(t) || 0).toFixed(1),
        Number(getTripLiters(t) || 0).toFixed(1),
        formatCurrency(getTripCost(t) || 0),
      ].join(';');
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'viagens.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-semibold">Viagens Registradas ({trips.length})</CardTitle>
        {trips.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCSV} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {trips.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6">Nenhuma viagem registrada.</p>
        ) : (
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Km</TableHead>
                <TableHead>Litros</TableHead>
                <TableHead>Custo</TableHead>
                {onDelete && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((t) => {
                const vehicleKey = `${t.vehicle_id ?? t.vehicleId ?? t.veiculo_id ?? t.veiculoId ?? t.placa ?? ''}`.trim();
                const driverKey = `${t.driver_id ?? t.driverId ?? t.motorista_id ?? t.motoristaId ?? t.cpf ?? ''}`.trim();
                const v = vehicleMap[vehicleKey];
                const d = driverMap[driverKey];
                return (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(getTripDate(t))}</TableCell>
                    <TableCell className="font-mono">{getTripVehicleString(t) || '—'}</TableCell>
                    <TableCell>{getTripDriverString(t) || '—'}</TableCell>
                    <TableCell>{getTripOrigin(t) || '—'}</TableCell>
                    <TableCell>{getTripDestination(t) || '—'}</TableCell>
                    <TableCell>{Number(getTripKm(t) || 0).toFixed(1)} km</TableCell>
                    <TableCell>{Number(getTripLiters(t) || 0).toFixed(1)} L</TableCell>
                    <TableCell>{formatCurrency(getTripCost(t) || 0)}</TableCell>
                    {onDelete && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            console.log("Excluir viagem clicada:", { id: t.id, trip: t });
                            onDelete(t.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}