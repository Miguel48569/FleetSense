import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
}

function getDriverStatus(driver) {
  return driver?.data_dem ? 'Inativo' : 'Ativo';
}

export default function DriverTable({ drivers, onDelete }) {

  if (drivers.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum motorista cadastrado ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Motoristas Cadastrados ({drivers.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>CPF</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>CNH</TableHead>
              <TableHead>Data nasc.</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead>Demissão</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((d) => {
              const cpf = d.cpf || d.cpf_cnpj || d.id || '—';
              const nome = d.nome || d.name || '—';
              const cnh = d.cnh || '—';
              const dataNasc = formatDate(d.data_nasc || d.dataNascimento || d.birth_date);
              const dataAdm = formatDate(d.data_adm || d.dataAdmissao || d.admission_date);
              const dataDem = formatDate(d.data_dem || d.dataDemissao || d.dismissal_date);
              const email = d.email || '—';
              const status = getDriverStatus(d);
              return (
                <TableRow key={cpf}>
                  <TableCell className="font-mono text-xs">{cpf}</TableCell>
                  <TableCell className="font-medium">{nome}</TableCell>
                  <TableCell className="font-mono">{cnh}</TableCell>
                  <TableCell>{dataNasc}</TableCell>
                  <TableCell>{dataAdm}</TableCell>
                  <TableCell>{dataDem}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{email}</TableCell>
                  <TableCell>
                    <Badge variant={status === 'Ativo' ? 'default' : 'secondary'}>
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(cpf)}>
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
