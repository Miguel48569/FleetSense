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
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, 'Veículos']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
