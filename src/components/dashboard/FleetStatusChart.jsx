// Projeto SENAC 2026 - FleetSense
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const STATUS_COLORS = {
  ativo: 'hsl(160, 60%, 45%)',
  inativo: 'hsl(220, 9%, 46%)',
  manutencao: 'hsl(38, 92%, 50%)',
};

const STATUS_LABELS = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  manutencao: 'Manutenção',
};

export default function FleetStatusChart({ vehicles }) {
  const data = React.useMemo(() => {
    const counts = {};
    vehicles.forEach(v => {
      const s = v.status || 'ativo';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#888',
    }));
  }, [vehicles]);

  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base font-semibold">Status da Frota</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Nenhum veículo cadastrado.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Status da Frota</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={44} outerRadius={82} paddingAngle={4} dataKey="value">
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, 'Veículos']} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
