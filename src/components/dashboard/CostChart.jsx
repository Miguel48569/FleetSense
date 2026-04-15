// Projeto SENAC 2026 - FleetSense
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CostChart({ trips }) {
  const monthlyData = React.useMemo(() => {
    const months = {};
    trips.forEach(trip => {
      if (!trip.date || !trip.cost) return;
      const month = new Date(trip.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      months[month] = (months[month] || 0) + (trip.cost || 0);
    });
    return Object.entries(months).map(([month, total]) => ({ month, total: Number(total.toFixed(2)) })).slice(-6);
  }, [trips]);

  if (monthlyData.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base font-semibold">Custos Mensais</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Nenhum dado de custo disponível.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Custos Mensais (R$)</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Custo']}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
