import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

const emptyForm = {
  placa: '',
  modelo: '',
  ano: '',
  status: 'Disponível',
  cor: '',
  fabricante: '',
  quilometragem: '',
};

const normalizeFormValue = (vehicle = {}) => ({
  placa: vehicle?.placa ?? vehicle?.plate ?? '',
  modelo: vehicle?.modelo ?? vehicle?.model ?? '',
  ano: vehicle?.ano ?? vehicle?.year ?? '',
  status: vehicle?.status_original ?? vehicle?.status ?? 'Disponível',
  cor: vehicle?.cor ?? vehicle?.color ?? '',
  fabricante: vehicle?.fabricante ?? vehicle?.manufacturer ?? '',
  quilometragem: vehicle?.quilometragem ?? vehicle?.mileage ?? '',
});

export default function VehicleForm({ onSubmit, initialVehicle = null, submitLabel = 'Salvar' }) {
  const [form, setForm] = useState({
    ...emptyForm,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialVehicle) {
      setForm(normalizeFormValue(initialVehicle));
      return;
    }

    setForm({ ...emptyForm });
  }, [initialVehicle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      ...form,
      ano: Number(form.ano),
      quilometragem: Number(form.quilometragem) || 0,
    });
    setForm({ ...emptyForm });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Placa</Label>
        <Input
          placeholder="ABC-1234"
          value={form.placa}
          onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Modelo</Label>
        <Input
          placeholder="Ex: Fiat Strada"
          value={form.modelo}
          onChange={(e) => setForm({ ...form, modelo: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Ano</Label>
        <Input
          type="number"
          placeholder="2024"
          value={form.ano}
          onChange={(e) => setForm({ ...form, ano: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="status-disponivel" value="Disponível">Disponível</SelectItem>
            <SelectItem key="status-inativo" value="Inativo">Inativo</SelectItem>
            <SelectItem key="status-manutencao" value="Em manutenção">Em manutenção</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Cor</Label>
        <Input
          placeholder="Ex: Prata"
          value={form.cor}
          onChange={(e) => setForm({ ...form, cor: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Fabricante</Label>
        <Input
          placeholder="Ex: Honda"
          value={form.fabricante}
          onChange={(e) => setForm({ ...form, fabricante: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Quilometragem</Label>
        <Input
          type="number"
          min="0"
          placeholder="0"
          value={form.quilometragem}
          onChange={(e) => setForm({ ...form, quilometragem: e.target.value })}
        />
      </div>
      <Button type="submit" disabled={loading} className="h-10 w-full md:w-auto">
        <Plus className="w-4 h-4 mr-2" />
        {submitLabel}
      </Button>
    </form>
  );
}
