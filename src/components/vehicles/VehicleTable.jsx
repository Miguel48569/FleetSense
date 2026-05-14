import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const statusMap = {
  ativo: { label: 'Ativo', variant: 'default' },
  disponível: { label: 'Disponível', variant: 'default' },
  disponivel: { label: 'Disponível', variant: 'default' },
  inativo: { label: 'Inativo', variant: 'secondary' },
  'em manutenção': { label: 'Em manutenção', variant: 'outline' },
  em_manutencao: { label: 'Em manutenção', variant: 'outline' },
  manutencao: { label: 'Manutenção', variant: 'outline' },
};

export default function VehicleTable({ vehicles, onDelete }) {
  if (vehicles.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum veículo cadastrado ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Veículos Cadastrados ({vehicles.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Fabricante</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Quilometragem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v, i) => {
              const plate = v?.placa || v?.plate || '—';
              const model = v?.modelo || v?.model || '—';
              const fabricante = v?.fabricante || v?.manufacturer || '—';
              const cor = v?.cor || v?.color || '—';
              const year = v?.ano || v?.year || '—';
              const quilometragem = Number(v?.quilometragem ?? v?.mileage ?? 0);
              const rawStatus = `${v?.status || ''}`.trim().toLowerCase();
              const st = statusMap[rawStatus] || statusMap.ativo;
              const rowKey = v?.placa || v?.plate || v?.id || i;
              return (
                <TableRow key={rowKey}>
                  <TableCell className="font-mono font-semibold">{plate}</TableCell>
                  <TableCell>{model}</TableCell>
                  <TableCell>{fabricante}</TableCell>
                  <TableCell>{cor}</TableCell>
                  <TableCell>{year}</TableCell>
                  <TableCell>{`${quilometragem.toLocaleString('pt-BR')} km`}</TableCell>
                  <TableCell>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        onDelete(v?.placa || v?.plate || v?.id);
                        toast({
                          title: "Veículo removido",
                          description: `O veículo ${plate} foi excluído com sucesso.`,
                        });
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
