import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function TripForm({ onSubmit, vehicles, drivers }) {
  const [form, setForm] = useState({
    vehicle_id: '', driver_id: '', origin: '', destination: '',
    quilometragem: '', fuel_liters: '', cost: '', date: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      ...form,
      quilometragem: Number(form.quilometragem) || 0,
      fuel_liters: Number(form.fuel_liters) || 0,
      cost: Number(form.cost) || 0,
    });
    setForm({ vehicle_id: '', driver_id: '', origin: '', destination: '', quilometragem: '', fuel_liters: '', cost: '', date: '' });
    setLoading(false);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader><CardTitle className="text-base font-semibold">Registrar Viagem</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Veículo</Label>
            <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v, i) => (<SelectItem key={v?.id || v?.plate || i} value={v.id}>{v.plate} - {v.model}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Motorista</Label>
            <Select value={form.driver_id} onValueChange={(v) => setForm({ ...form, driver_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {drivers.map((d, i) => (<SelectItem key={d?.id || d?.name || i} value={d.id}>{d.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Origem</Label>
            <Input placeholder="Cidade/Local" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Destino</Label>
            <Input placeholder="Cidade/Local" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Quilometragem (km)</Label>
            <Input type="number" placeholder="0" value={form.quilometragem} onChange={(e) => setForm({ ...form, quilometragem: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Combustível (L)</Label>
            <Input type="number" step="0.1" placeholder="0" value={form.fuel_liters} onChange={(e) => setForm({ ...form, fuel_liters: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Custo (R$)</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Data</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div className="flex justify-stretch sm:justify-end lg:col-span-4">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Viagem
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
