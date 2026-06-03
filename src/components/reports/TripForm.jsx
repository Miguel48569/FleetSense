import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

function getVehicleValue(vehicle) {
  return `${vehicle?.placa ?? vehicle?.veiculo_placa ?? vehicle?.vehicle_plate ?? ''}`.trim();
}

function getDriverValue(driver) {
  return `${driver?.id ?? driver?.driver_id ?? driver?.cpf ?? ''}`.trim();
}

function normalizeText(value) {
  return `${value ?? ''}`.trim().toLowerCase();
}

function isVehicleSelectable(vehicle) {
  const status = normalizeText(vehicle?.status ?? vehicle?.status_original ?? vehicle?.situacao ?? vehicle?.situacao_original);
  if (!status) return true;
  return status === 'ativo' || status === 'disponivel' || status === 'disponível';
}

function isDriverSelectable(driver) {
  const status = normalizeText(driver?.status ?? driver?.status_original ?? driver?.situacao);
  const disponibilidade = normalizeText(driver?.disponibilidade ?? driver?.available ?? driver?.ativo);

  if (!status && !disponibilidade) return true;

  const statusOk = !status || status === 'ativo' || status === 'disponivel' || status === 'disponível';
  const disponibilidadeOk = !disponibilidade || disponibilidade === 'ativo' || disponibilidade === 'disponivel' || disponibilidade === 'disponível' || disponibilidade === 'sim' || disponibilidade === 'true' || disponibilidade === 'disponível';

  return statusOk && disponibilidadeOk;
}

export default function TripForm({ onSubmit, vehicles, drivers, isLoading }) {
  const [form, setForm] = useState({
    vehicle_id: '', driver_id: '', origin: '', destination: '',
    quilometragem: '', fuel_liters: '', cost: '', date: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || isLoading) return;
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        vehicle_id: form.vehicle_id,
        driver_id: form.driver_id,
        quilometragem: Number(form.quilometragem) || 0,
        fuel_liters: Number(form.fuel_liters) || 0,
        cost: Number(form.cost) || 0,
      });
      setForm({ vehicle_id: '', driver_id: '', origin: '', destination: '', quilometragem: '', fuel_liters: '', cost: '', date: '' });
    } finally {
      setLoading(false);
    }
  };

  const submitting = loading || isLoading;

  const fieldShellClass = "rounded-xl border border-slate-200 bg-slate-50/80 shadow-sm transition-all duration-200 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20";
  const inputClass = "h-12 rounded-xl border-0 bg-transparent p-3 text-base shadow-none outline-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0";
  const selectTriggerClass = "h-12 rounded-xl border-slate-200 bg-slate-50/80 p-3 text-base shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:bg-white";

  const availableVehicles = vehicles.filter(isVehicleSelectable);
  const availableDrivers = drivers.filter(isDriverSelectable);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader><CardTitle className="text-base font-semibold">Registrar Viagem</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Veículo</Label>
            <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
              <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {availableVehicles.map((v, i) => {
                  const value = getVehicleValue(v);
                  if (!value) return null;
                  const plate = v?.placa || v?.plate || 'Veículo';
                  const model = v?.modelo || v?.model || '';
                  return (
                    <SelectItem key={value} value={value}>
                      {plate}{model ? ` - ${model}` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Motorista</Label>
            <Select value={form.driver_id} onValueChange={(v) => setForm({ ...form, driver_id: v })}>
              <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {availableDrivers.map((d, i) => {
                  const value = getDriverValue(d) || `driver-${i}`;
                  const name = d?.nome || d?.name || 'Motorista';
                  return (
                    <SelectItem key={value} value={value}>
                      {name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Origem</Label>
            <div className={fieldShellClass}>
              <Input className={inputClass} placeholder="Cidade/Local" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Destino</Label>
            <div className={fieldShellClass}>
              <Input className={inputClass} placeholder="Cidade/Local" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Quilometragem (km)</Label>
            <div className={fieldShellClass}>
              <div className="flex items-center">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0 km"
                  value={form.quilometragem}
                  onChange={(e) => setForm({ ...form, quilometragem: e.target.value })}
                  className={`${inputClass} pr-14`}
                />
                <span className="mr-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">km</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Combustível (L)</Label>
            <div className={fieldShellClass}>
              <div className="flex items-center">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0 L"
                  value={form.fuel_liters}
                  onChange={(e) => setForm({ ...form, fuel_liters: e.target.value })}
                  className={`${inputClass} pr-12`}
                />
                <span className="mr-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">L</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Custo (R$)</Label>
            <div className={fieldShellClass}>
              <div className="flex items-center">
                <span className="ml-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className={`${inputClass} pl-2`}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Data</Label>
            <div className={fieldShellClass}>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className={`${inputClass} [&::-webkit-calendar-picker-indicator]:opacity-70`}
              />
            </div>
          </div>
          <div className="flex justify-stretch sm:justify-end lg:col-span-4">
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Viagem
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
