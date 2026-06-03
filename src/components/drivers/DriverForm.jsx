import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

const emptyForm = {
  cpf: '',
  nome: '',
  cnh: '',
  data_nasc: '',
  data_adm: '',
  data_dem: '',
  email: '',
};

function normalizeFormValue(driver = {}) {
  return {
    cpf: driver?.cpf ?? driver?.id ?? '',
    nome: driver?.nome ?? driver?.name ?? '',
    cnh: driver?.cnh ?? '',
    data_nasc: driver?.data_nasc ?? driver?.dataNascimento ?? driver?.birth_date ?? '',
    data_adm: driver?.data_adm ?? driver?.dataAdmissao ?? driver?.admission_date ?? '',
    data_dem: driver?.data_dem ?? driver?.dataDemissao ?? driver?.dismissal_date ?? '',
    email: driver?.email ?? '',
  };
}

export default function DriverForm({ onSubmit, initialDriver = null, submitLabel = 'Salvar', onCancel }) {
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialDriver) {
      setForm(normalizeFormValue(initialDriver));
      return;
    }

    setForm({ ...emptyForm });
  }, [initialDriver]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setForm({ ...emptyForm });
    setLoading(false);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{initialDriver ? 'Editar Motorista' : 'Novo Motorista'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">CPF</Label>
            <Input
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Nome</Label>
            <Input
              placeholder="Nome completo"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">CNH</Label>
            <Input
              placeholder="Nº da CNH"
              value={form.cnh}
              onChange={(e) => setForm({ ...form, cnh: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Data de nascimento</Label>
            <Input
              type="date"
              value={form.data_nasc}
              onChange={(e) => setForm({ ...form, data_nasc: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Data de admissão</Label>
            <Input
              type="date"
              value={form.data_adm}
              onChange={(e) => setForm({ ...form, data_adm: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Data de demissão</Label>
            <Input
              type="date"
              value={form.data_dem}
              onChange={(e) => setForm({ ...form, data_dem: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
            <Label className="text-xs font-medium">Email</Label>
            <Input
              type="email"
              placeholder="nome@empresa.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2 md:col-span-2 lg:col-span-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="h-10 w-full md:w-auto">
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading} className="h-10 w-full md:w-auto lg:col-span-3">
              <Plus className="w-4 h-4 mr-2" />
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
