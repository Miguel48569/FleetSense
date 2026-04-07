import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

export default function TripTable({ trips, vehicles, drivers, onDelete }) {
  const vehicleMap = {};
  vehicles.forEach(v => { vehicleMap[v.id] = v; });
  const driverMap = {};
  drivers.forEach(d => { driverMap[d.id] = d; });

  const exportCSV = () => {
    const header = 'Data,Veículo,Motorista,Origem,Destino,Km,Litros,Custo\n';
    const rows = trips.map(t => {
      const v = vehicleMap[t.vehicle_id];
      const d = driverMap[t.driver_id];
      return `${t.date},${v?.plate || ''},${d?.name || ''},${t.origin},${t.destination},${t.distance_km || ''},${t.fuel_liters || ''},${t.cost || ''}`;
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Viagens Registradas ({trips.length})</CardTitle>
        {trips.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {trips.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6">Nenhuma viagem registrada.</p>
        ) : (
          <Table>
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
                const v = vehicleMap[t.vehicle_id];
                const d = driverMap[t.driver_id];
                return (
                  <TableRow key={t.id}>
                    <TableCell>{t.date ? format(new Date(t.date), 'dd/MM/yyyy') : '—'}</TableCell>
                    <TableCell className="font-mono">{v?.plate || '—'}</TableCell>
                    <TableCell>{d?.name || '—'}</TableCell>
                    <TableCell>{t.origin}</TableCell>
                    <TableCell>{t.destination}</TableCell>
                    <TableCell>{t.distance_km || '—'}</TableCell>
                    <TableCell>{t.fuel_liters || '—'}</TableCell>
                    <TableCell>R$ {(t.cost || 0).toFixed(2)}</TableCell>
                    {onDelete && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            onDelete(t.id);
                            toast({ title: 'Viagem removida', description: 'Viagem excluída com sucesso.' });
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