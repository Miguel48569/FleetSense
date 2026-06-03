// Projeto SENAC 2026 - FleetSense
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import { maintenanceApi, vehiclesApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

const STATUS_OPTIONS = [
  { value: "Pendente", label: "Pendente" },
  { value: "Em andamento", label: "Em andamento" },
  { value: "Concluída", label: "Concluída" },
];

const STATUS_BADGE = {
  pendente: "border border-amber-200/60 bg-amber-50 text-amber-700",
  "em andamento": "border border-blue-200/60 bg-blue-50 text-blue-700",
  concluída: "border border-emerald-200/60 bg-emerald-50 text-emerald-700",
  concluida: "border border-emerald-200/60 bg-emerald-50 text-emerald-700",
};

const emptyForm = {
  idManutencao: 0,
  veiculo_placa: "",
  dataInicio: "",
  dataPrevista: "",
  dataFim: "",
  status: "Pendente",
};

function formatDateInput(value) {
  if (!value) return "";
  const text = `${value}`.trim();
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function formatDateDisplay(value) {
  if (!value) return "—";
  const text = `${value}`.trim();
  if (!text) return "—";

  const isoDateMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${day}/${month}/${year}`;
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return `${value}`.slice(0, 10);
  return date.toLocaleDateString("pt-BR");
}

function normalizeStatus(value) {
  return `${value || ""}`.trim().toLowerCase();
}

function getOrderId(order) {
  return order?.idManutencao ?? order?.id_manutencao ?? order?.id ?? 0;
}

function getVehiclePlate(vehicle) {
  return vehicle?.placa ?? vehicle?.plate ?? "";
}

function getVehicleLabel(vehicle) {
  const plate = getVehiclePlate(vehicle);
  const model = vehicle?.modelo ?? vehicle?.model ?? "";
  return `${plate}${model ? ` · ${model}` : ""}`.trim();
}

function getStatusErrorMessage(error) {
  if (error?.status === 400) {
    const details = error?.raw?.errors && typeof error.raw.errors === "object"
      ? Object.entries(error.raw.errors)
          .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join(" | ")
      : error?.raw?.message || error?.message || "Falha de validação";

    return `Erro 400: ${details}`;
  }

  return error?.message || "Não foi possível salvar a ordem de manutenção.";
}

function getDeleteErrorMessage(error) {
  if (error?.status === 400) {
    const details = error?.raw?.errors && typeof error.raw.errors === "object"
      ? Object.entries(error.raw.errors)
          .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join(" | ")
      : error?.raw?.message || error?.message || "Falha de validação";

    return `Erro 400: ${details}`;
  }

  return error?.message || "Não foi possível excluir a ordem de manutenção.";
}

function MaintenanceOrderDialog({
  open,
  mode,
  form,
  setForm,
  vehicles,
  isSaving,
  onClose,
  onSubmit,
}) {
  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Editar ordem de manutenção" : "Nova ordem de manutenção"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Atualize as informações da ordem para manter o controle operacional em dia."
              : "Crie uma nova ordem alinhada ao processo interno da operação."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Veículo</Label>
              <Select
                value={form.veiculo_placa}
                onValueChange={(value) => setForm((prev) => ({ ...prev, veiculo_placa: value }))}
              >
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20">
                  <SelectValue placeholder="Selecione a placa do veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => {
                    const plate = getVehiclePlate(vehicle);
                    return (
                      <SelectItem key={plate || vehicle?.id} value={plate}>
                        {getVehicleLabel(vehicle) || plate || "Veículo sem identificação"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataInicio" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Data de entrada
              </Label>
              <Input
                id="dataInicio"
                type="date"
                value={form.dataInicio}
                onChange={handleChange("dataInicio")}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataPrevista" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Previsão de saída
              </Label>
              <Input
                id="dataPrevista"
                type="date"
                value={form.dataPrevista}
                onChange={handleChange("dataPrevista")}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataFim" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Data de conclusão
              </Label>
              <Input
                id="dataFim"
                type="date"
                value={form.dataFim}
                onChange={handleChange("dataFim")}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode === "edit" && (
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-600">
              <span className="font-medium text-slate-900">Referência da ordem:</span> {form.idManutencao || "—"}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-600 font-medium text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteOrderDialog({
  open,
  order,
  onClose,
  onConfirm,
  isDeleting,
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir ordem de manutenção</DialogTitle>
          <DialogDescription>
            Deseja realmente excluir esta ordem de manutenção?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-800">
          <p className="font-semibold text-red-900">Ação permanente</p>
          <p className="mt-1 leading-6">
            ID <span className="font-mono text-xs">{order?.idManutencao || "—"}</span>
            {order?.veiculo_placa ? (
              <>
                {" "}para o veículo <span className="font-semibold">{order.veiculo_placa}</span>
              </>
            ) : null}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
            className="rounded-xl bg-red-600 font-medium text-white shadow-sm shadow-red-500/20 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.98]"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Maintenance() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.list,
  });

  const { data: maintenanceOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["maintenance-orders"],
    queryFn: maintenanceApi.list,
  });

  const syncVehicleStatusForMaintenance = async (payload) => {
    const maintenanceStatus = normalizeStatus(payload?.status);
    const placa = `${payload?.veiculo_placa ?? ""}`.trim();

    if (maintenanceStatus !== "em andamento" || !placa) return;

    console.log("Disparando atualização do veículo:", placa);
    await vehiclesApi.update(placa, { status: "Em manutenção" });
  };

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const savedMaintenance = await maintenanceApi.create(payload);
      await syncVehicleStatusForMaintenance(payload);

      return savedMaintenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setIsOrderDialogOpen(false);
      setEditingOrder(null);
      setForm(emptyForm);
      toast({ title: "Ordem criada", description: "A ordem de manutenção foi salva com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar ordem", description: getStatusErrorMessage(error), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ idManutencao, payload }) => {
      const savedMaintenance = await maintenanceApi.update(idManutencao, payload);
      await syncVehicleStatusForMaintenance(payload);

      return savedMaintenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setIsOrderDialogOpen(false);
      setEditingOrder(null);
      setForm(emptyForm);
      toast({ title: "Ordem atualizada", description: "As alterações foram salvas com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar ordem", description: getStatusErrorMessage(error), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (idManutencao) => maintenanceApi.delete(idManutencao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-orders"] });
      setOrderToDelete(null);
      toast({ title: "Ordem excluída", description: "A ordem de manutenção foi removida com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir ordem", description: getDeleteErrorMessage(error), variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!isOrderDialogOpen) return;

    if (editingOrder) {
      setForm({
        idManutencao: getOrderId(editingOrder),
        veiculo_placa: editingOrder.veiculo_placa || "",
        dataInicio: formatDateInput(editingOrder.dataInicio),
        dataPrevista: formatDateInput(editingOrder.dataPrevista),
        dataFim: formatDateInput(editingOrder.dataFim),
        status: editingOrder.status || "Pendente",
      });
      return;
    }

    setForm(emptyForm);
  }, [editingOrder, isOrderDialogOpen]);

  const orders = useMemo(() => {
    return maintenanceOrders
      .map((order) => ({
        ...order,
        idManutencao: getOrderId(order),
        veiculo_placa: order.veiculo_placa || order.veiculoPlaca || order.placa || "",
        dataInicio: formatDateInput(order.dataInicio),
        dataPrevista: formatDateInput(order.dataPrevista),
        dataFim: formatDateInput(order.dataFim),
        status: order.status || "Pendente",
      }))
      .sort((a, b) => Number(b.idManutencao || 0) - Number(a.idManutencao || 0));
  }, [maintenanceOrders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "todos" || normalizeStatus(order.status) === statusFilter;
      const matchesSearch =
        !term ||
        `${order.veiculo_placa || ""}`.toLowerCase().includes(term) ||
        `${order.idManutencao || ""}`.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const summary = useMemo(() => {
    const pending = orders.filter((order) => normalizeStatus(order.status) === "pendente").length;
    const inProgress = orders.filter((order) => normalizeStatus(order.status) === "em andamento").length;
    const completed = orders.filter((order) => normalizeStatus(order.status) === "concluída" || normalizeStatus(order.status) === "concluida").length;
    const overdue = orders.filter((order) => {
      if (order.dataFim) return false;
      if (!order.dataPrevista) return false;
      return new Date(order.dataPrevista).getTime() < Date.now();
    }).length;

    return {
      total: orders.length,
      pending,
      inProgress,
      completed,
      overdue,
    };
  }, [orders]);

  const handleCreateNew = () => {
    setEditingOrder(null);
    setForm(emptyForm);
    setIsOrderDialogOpen(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setIsOrderDialogOpen(true);
  };

  const handleDeleteOrder = (order) => {
    setOrderToDelete(order);
  };

  const confirmDeleteOrder = () => {
    if (!orderToDelete) return;
    deleteMutation.mutate(getOrderId(orderToDelete));
  };

  const handleSave = () => {
    if (!form.veiculo_placa || !form.dataInicio || !form.dataPrevista || !form.status) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha veículo, data de entrada, previsão e status.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...form,
      idManutencao: editingOrder ? Number(form.idManutencao || getOrderId(editingOrder)) : 0,
      dataFim: form.dataFim || "",
      dataInicio: form.dataInicio,
      dataPrevista: form.dataPrevista,
      status: form.status,
      veiculo_placa: form.veiculo_placa,
    };

    if (editingOrder) {
      updateMutation.mutate({ idManutencao: getOrderId(editingOrder), payload });
      return;
    }

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" />
            Painel Atualizado
          </div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Manutenção</h1>
          <p className="mt-1 text-muted-foreground">Acompanhe ordens, status e prazos em tempo real.</p>
        </div>

        <Button onClick={handleCreateNew} className="sm:self-start">
          <Plus className="mr-2 h-4 w-4" />
          Nova Ordem
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total de ordens</CardDescription>
            <CardTitle className="text-2xl">{summary.total}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4 text-primary" />
            Registradas no sistema
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Pendentes</CardDescription>
            <CardTitle className="text-2xl">{summary.pending}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4 text-amber-500" />
            Aguardando início
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Em andamento</CardDescription>
            <CardTitle className="text-2xl">{summary.inProgress}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4 text-blue-500" />
            Em execução na oficina
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Concluídas</CardDescription>
            <CardTitle className="text-2xl">{summary.completed}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Finalizadas com sucesso
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Lista de manutenções</CardTitle>
            <CardDescription>Listagem completa das ordens de serviço ativas e finalizadas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por placa ou ID"
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em andamento">Em andamento</SelectItem>
                  <SelectItem value="concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Prevista</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Carregando manutenções...
                    </TableCell>
                  </TableRow>
                )}

                {!ordersLoading && filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhuma manutenção encontrada para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}

                {filteredOrders.map((order) => {
                  const statusKey = normalizeStatus(order.status);
                  const badgeClass = STATUS_BADGE[statusKey] || "border-slate-200 bg-slate-50 text-slate-700";
                  const rowKey = order.idManutencao || `${order.veiculo_placa}-${order.dataInicio}`;

                  return (
                    <TableRow key={rowKey}>
                      <TableCell className="font-mono text-xs">{order.idManutencao || "—"}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">{order.veiculo_placa || "—"}</p>
                          <p className="text-xs text-muted-foreground">{statusKey || "sem status"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
                          {order.status || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateDisplay(order.dataInicio)}</TableCell>
                      <TableCell>{formatDateDisplay(order.dataPrevista)}</TableCell>
                      <TableCell>{formatDateDisplay(order.dataFim)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Editar ordem
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteOrder(order)}
                            className="border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                            aria-label="Excluir ordem de manutenção"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Resumo operacional</CardTitle>
            <CardDescription>Situação atual das ordens de manutenção</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Atrasadas</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.overdue}</p>
              <p className="mt-1 text-sm text-slate-600">Ordens com previsão vencida e sem data de conclusão.</p>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Dica de Gestão</p>
              <p className="mt-2 leading-6">
                Mantenha a descrição dos serviços detalhada no momento da edição para facilitar auditorias futuras e controle de custos.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Veículos disponíveis</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {vehiclesLoading ? "Carregando veículos..." : `${vehicles.length} veículo(s) pronto(s) para seleção.`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <MaintenanceOrderDialog
        open={isOrderDialogOpen}
        mode={editingOrder ? "edit" : "create"}
        form={form}
        setForm={setForm}
        vehicles={vehicles}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setIsOrderDialogOpen(false);
          setEditingOrder(null);
          setForm(emptyForm);
        }}
        onSubmit={handleSave}
      />

      <DeleteOrderDialog
        open={Boolean(orderToDelete)}
        order={orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={confirmDeleteOrder}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
