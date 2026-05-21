// Projeto SENAC 2026 - FleetSense
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { driversApi } from "@/lib/api";
import DriverForm from "@/components/drivers/DriverForm";
import DriverTable from "@/components/drivers/DriverTable";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const statusLabelMap = {
  ativo: "Ativo",
  inativo: "Inativo",
};

function normalizeCpf(value) {
  return `${value ?? ""}`.replace(/\D/g, "");
}

function normalizeDate(value) {
  return `${value ?? ""}`.slice(0, 10);
}

function normalizeNullableDate(value) {
  const normalized = normalizeDate(value);
  return normalized || null;
}

function persistedDriverMatchesSubmission(driver, submitted) {
  if (!driver) return false;

  const persisted = {
    nome: `${driver?.nome ?? driver?.name ?? ""}`.trim(),
    cnh: `${driver?.cnh ?? ""}`.trim(),
    email: `${driver?.email ?? ""}`.trim().toLowerCase(),
    data_nasc: normalizeDate(driver?.data_nasc ?? driver?.dataNascimento ?? driver?.birth_date),
    data_adm: normalizeDate(driver?.data_adm ?? driver?.dataAdmissao ?? driver?.admission_date),
    data_dem: normalizeNullableDate(driver?.data_dem ?? driver?.dataDemissao ?? driver?.dismissal_date),
  };

  const expected = {
    nome: `${submitted?.nome ?? submitted?.name ?? ""}`.trim(),
    cnh: `${submitted?.cnh ?? ""}`.trim(),
    email: `${submitted?.email ?? ""}`.trim().toLowerCase(),
    data_nasc: normalizeDate(submitted?.data_nasc ?? submitted?.birth_date ?? submitted?.dataNascimento),
    data_adm: normalizeDate(submitted?.data_adm ?? submitted?.admission_date ?? submitted?.dataAdmissao),
    data_dem: normalizeNullableDate(submitted?.data_dem ?? submitted?.dismissal_date ?? submitted?.dataDemissao),
  };

  return (
    persisted.nome === expected.nome &&
    persisted.cnh === expected.cnh &&
    persisted.email === expected.email &&
    persisted.data_nasc === expected.data_nasc &&
    persisted.data_adm === expected.data_adm &&
    persisted.data_dem === expected.data_dem
  );
}

function DriverField({ label, value }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="rounded-md border bg-background px-3 py-2 text-sm">{value || "—"}</div>
    </div>
  );
}

function formatDateInput(value) {
  if (!value) return '';
  const raw = `${value}`;
  return raw.includes('T') ? raw.slice(0, 10) : raw.slice(0, 10);
}

export default function Drivers() {
  const queryClient = useQueryClient();
  const [selectedDriver, setSelectedDriver] = useState(null);

  // ── Buscar lista de motoristas ───────────────────────────
  // Backend: GET /api/motoristas
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: driversApi.list,
  });

  // ── Criar motorista ──────────────────────────────────────
  // Backend: POST /api/motoristas
  const createMutation = useMutation({
    mutationFn: driversApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: "Motorista cadastrado", description: "Motorista adicionado com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  // ── Deletar motorista ────────────────────────────────────
  // Backend: DELETE /api/motoristas/:id
  const deleteMutation = useMutation({
    mutationFn: driversApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
    onError: (err) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => driversApi.update(id, data),
    onSuccess: async (_, variables) => {
      const refreshedDrivers = await queryClient.fetchQuery({
        queryKey: ["drivers"],
        queryFn: driversApi.list,
      });

      const updatedDriver = refreshedDrivers.find((driver) => {
        const driverCpf = driver?.cpf ?? driver?.cpf_cnpj ?? driver?.id;
        return normalizeCpf(driverCpf) === normalizeCpf(variables?.id);
      });

      if (!persistedDriverMatchesSubmission(updatedDriver, variables?.data)) {
        toast({
          title: "Atualização não confirmada",
          description: "O backend respondeu sucesso, mas os dados não mudaram. Verifique a API de PUT /motoristas/{cpf}.",
          variant: "destructive",
        });
        return;
      }

      setSelectedDriver(null);
      toast({ title: "Motorista atualizado", description: "As informações foram salvas com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    },
  });

  const selectedDriverId = selectedDriver?.cpf ?? selectedDriver?.cpf_cnpj ?? selectedDriver?.id;
  const selectedStatus = selectedDriver?.data_dem ? 'Inativo' : 'Ativo';
  const selectedStatusLabel = statusLabelMap[selectedStatus.toLowerCase()] || selectedStatus;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Motoristas</h1>
        <p className="text-muted-foreground mt-1">
          Cadastre motoristas e associe a veículos
        </p>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold">Novo Motorista</h2>
              <p className="text-sm text-muted-foreground">Preencha os dados abaixo para cadastrar um motorista.</p>
            </div>
          </div>
          <DriverForm
            onSubmit={(data) => createMutation.mutate(data)}
            submitLabel={createMutation.isPending ? "Salvando..." : "Salvar"}
          />
        </CardContent>
      </Card>
      <DriverTable
        drivers={drivers}
        isLoading={isLoading}
        onDelete={(cpfOrId) => deleteMutation.mutate(cpfOrId)}
        onSelectDriver={(driver) => setSelectedDriver(driver)}
      />

      <Dialog open={Boolean(selectedDriver)} onOpenChange={(open) => !open && setSelectedDriver(null)}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Detalhes do motorista</DialogTitle>
            <DialogDescription>
              Clique fora do modal para fechar ou atualize os campos abaixo e salve.
            </DialogDescription>
          </DialogHeader>

          {selectedDriver && (
            <div className="space-y-5">
              <Card className="border-dashed">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Motorista selecionado</p>
                      <h3 className="text-lg font-semibold">{selectedDriver?.nome || selectedDriver?.name || '—'}</h3>
                    </div>
                    <Badge variant="outline">{selectedStatusLabel}</Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <DriverField label="CPF" value={selectedDriver?.cpf || selectedDriver?.cpf_cnpj || selectedDriver?.id} />
                    <DriverField label="Nome" value={selectedDriver?.nome || selectedDriver?.name} />
                    <DriverField label="CNH" value={selectedDriver?.cnh} />
                    <DriverField label="Data de nascimento" value={formatDateInput(selectedDriver?.data_nasc || selectedDriver?.dataNascimento || selectedDriver?.birth_date)} />
                    <DriverField label="Data de admissão" value={formatDateInput(selectedDriver?.data_adm || selectedDriver?.dataAdmissao || selectedDriver?.admission_date)} />
                    <DriverField label="Data de demissão" value={formatDateInput(selectedDriver?.data_dem || selectedDriver?.dataDemissao || selectedDriver?.dismissal_date)} />
                    <DriverField label="Email" value={selectedDriver?.email} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
                    <div>
                      <h4 className="text-base font-semibold">Editar motorista</h4>
                      <p className="text-sm text-muted-foreground">Os campos já vêm preenchidos com os dados atuais.</p>
                    </div>
                  </div>
                  <DriverForm
                    initialDriver={selectedDriver}
                    submitLabel={updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
                    onSubmit={(data) => {
                      if (!selectedDriverId) {
                        toast({ title: "Erro ao atualizar", description: "Motorista sem CPF/ID válido.", variant: "destructive" });
                        return;
                      }
                      updateMutation.mutate({ id: selectedDriverId, data });
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
