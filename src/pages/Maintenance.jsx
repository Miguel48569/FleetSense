// Projeto SENAC 2026 - FleetSense
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	AlertTriangle,
	CalendarClock,
	CheckCircle2,
	Gauge,
	Search,
	Wrench,
} from "lucide-react";
import { vehiclesApi, tripsApi } from "@/lib/api";
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const statusLabel = {
	ativo: "Ativo",
	inativo: "Inativo",
	manutencao: "Em manutenção",
};

const MAINTENANCE_INTERVAL_KM = 10000;
const MAINTENANCE_STORAGE_KEY = "fleetsense_maintenance_details";
const RISK_WEIGHTS = {
	kmSinceInspection: 0.5,
	inactivityDays: 0.3,
	status: 0.2,
};

function normalizeNumber(value) {
	const num = Number(value);
	return Number.isFinite(num) ? num : 0;
}

function clampPercentage(value) {
	const normalized = normalizeNumber(value);
	return Math.max(0, Math.min(100, normalized));
}

function formatCurrency(value) {
	const normalized = normalizeNumber(value);
	if (normalized <= 0) return "não informado";
	return `R$ ${normalized.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function splitCsvLine(line, delimiter) {
	const result = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i += 1) {
		const char = line[i];
		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i += 1;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === delimiter && !inQuotes) {
			result.push(current);
			current = "";
		} else {
			current += char;
		}
	}

	result.push(current);
	return result.map((item) => item.trim());
}

function toCsvSafe(value) {
	const text = `${value ?? ""}`;
	if (text.includes(";") || text.includes("\n") || text.includes('"')) {
		return `"${text.replaceAll('"', '""')}"`;
	}
	return text;
}

function getStatusScore(status) {
	if (status === "manutencao") return 100;
	if (status === "inativo") return 65;
	return 15;
}

function getVehicleRisk(vehicle, trips) {
	const modelTrips = trips.filter((trip) => `${trip.vehicle_id}` === `${vehicle.id}`);
	const totalKm = modelTrips.reduce((sum, trip) => sum + normalizeNumber(trip.distance_km), 0);
	const lastTripDate = modelTrips
		.map((trip) => trip.date)
		.filter(Boolean)
		.sort((a, b) => new Date(b) - new Date(a))[0];

	const daysWithoutTrip = lastTripDate
		? Math.floor((Date.now() - new Date(lastTripDate).getTime()) / (1000 * 60 * 60 * 24))
		: 180;

	const kmSinceInspection = totalKm % MAINTENANCE_INTERVAL_KM;
	const kmScore = Math.min((kmSinceInspection / MAINTENANCE_INTERVAL_KM) * 100, 100);
	const inactivityScore = Math.min((daysWithoutTrip / 90) * 100, 100);
	const statusScore = getStatusScore(vehicle.status);

	const risk =
		kmScore * RISK_WEIGHTS.kmSinceInspection +
		inactivityScore * RISK_WEIGHTS.inactivityDays +
		statusScore * RISK_WEIGHTS.status;

	const nextInspectionKm = Math.max(MAINTENANCE_INTERVAL_KM - kmSinceInspection, 0);

	let level = "baixo";
	if (risk >= 75) {
		level = "critico";
	} else if (risk >= 45) {
		level = "moderado";
	}

	return {
		risk: Math.min(Math.round(risk), 100),
		level,
		totalKm,
		daysWithoutTrip,
		kmSinceInspection,
		kmScore: Math.round(kmScore),
		inactivityScore: Math.round(inactivityScore),
		statusScore: Math.round(statusScore),
		nextInspectionKm,
	};
}

function getRiskBadge(level) {
	if (level === "critico") return { label: "Crítico", className: "bg-destructive text-destructive-foreground" };
	if (level === "moderado") return { label: "Moderado", className: "bg-chart-3 text-white" };
	return { label: "Baixo", className: "bg-chart-2 text-white" };
}

export default function Maintenance() {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("todos");
	const [maintenanceDetails, setMaintenanceDetails] = useState({});
	const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
	const [selectedVehicleId, setSelectedVehicleId] = useState(null);
	const [orderDraft, setOrderDraft] = useState({ description: "", cost: "", progress: "" });
	const csvInputRef = useRef(null);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
			if (stored) {
				setMaintenanceDetails(JSON.parse(stored));
			}
		} catch {
			setMaintenanceDetails({});
		}
	}, []);

	useEffect(() => {
		localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(maintenanceDetails));
	}, [maintenanceDetails]);

	const updateMaintenanceDetail = (vehicleId, patch) => {
		setMaintenanceDetails((prev) => ({
			...prev,
			[vehicleId]: {
				description: "",
				cost: "",
				progress: 0,
				...prev[vehicleId],
				...patch,
			},
		}));
	};

	const openMaintenanceOrder = (vehicleId) => {
		setSelectedVehicleId(vehicleId);
		setIsOrderDialogOpen(true);
	};

	const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
		queryKey: ["vehicles"],
		queryFn: vehiclesApi.list,
	});

	const { data: trips = [] } = useQuery({
		queryKey: ["trips"],
		queryFn: tripsApi.list,
	});

	const maintenanceRows = useMemo(() => {
		return vehicles
			.map((vehicle) => ({
				vehicle,
				...getVehicleRisk(vehicle, trips),
			}))
			.sort((a, b) => b.risk - a.risk);
	}, [vehicles, trips]);

	const filteredRows = useMemo(() => {
		const term = search.trim().toLowerCase();
		return maintenanceRows.filter(({ vehicle }) => {
			const matchesStatus = statusFilter === "todos" || vehicle.status === statusFilter;
			const vehicleName = `${vehicle.model || ""} ${vehicle.plate || ""}`.toLowerCase();
			const matchesSearch = !term || vehicleName.includes(term);
			return matchesStatus && matchesSearch;
		});
	}, [maintenanceRows, search, statusFilter]);

	const summary = useMemo(() => {
		const critical = maintenanceRows.filter((row) => row.level === "critico").length;
		const moderate = maintenanceRows.filter((row) => row.level === "moderado").length;
		const inMaintenance = vehicles.filter((vehicle) => vehicle.status === "manutencao").length;
		const healthRate = maintenanceRows.length
			? Math.round(
					(maintenanceRows.filter((row) => row.level === "baixo").length / maintenanceRows.length) * 100
				)
			: 100;

		return { critical, moderate, inMaintenance, healthRate };
	}, [maintenanceRows, vehicles]);

	const priorityRows = filteredRows.slice(0, 3);
	const inMaintenanceRows = useMemo(() => {
		return maintenanceRows.filter(({ vehicle }) => vehicle.status === "manutencao");
	}, [maintenanceRows]);

	const selectedRow = useMemo(() => {
		return maintenanceRows.find(({ vehicle }) => vehicle.id === selectedVehicleId) || null;
	}, [maintenanceRows, selectedVehicleId]);

	const selectedDetails = selectedVehicleId
		? maintenanceDetails[selectedVehicleId] || { description: "", cost: "", progress: 0 }
		: { description: "", cost: "", progress: 0 };

	useEffect(() => {
		if (!isOrderDialogOpen || !selectedVehicleId) return;
		const draftProgress =
			selectedDetails.progress === "" || selectedDetails.progress === null || selectedDetails.progress === undefined
				? ""
				: clampPercentage(selectedDetails.progress);

		setOrderDraft({
			description: selectedDetails.description || "",
			cost: selectedDetails.cost || "",
			progress: draftProgress,
		});
	}, [isOrderDialogOpen, selectedVehicleId, selectedDetails.cost, selectedDetails.description, selectedDetails.progress]);

	const selectedProgress = orderDraft.progress === "" ? 0 : clampPercentage(orderDraft.progress);

	const handleSaveOrder = () => {
		if (!selectedVehicleId) return;
		const savedProgress = orderDraft.progress === "" ? 0 : clampPercentage(orderDraft.progress);
		updateMaintenanceDetail(selectedVehicleId, {
			description: orderDraft.description,
			cost: orderDraft.cost,
			progress: savedProgress,
		});
		toast({
			title: "Ordem salva",
			description: "Descrição, custo e andamento atualizados com sucesso.",
		});
	};

	const handleExportCsv = () => {
		if (!selectedRow) return;
		const headers = ["vehicle_id", "plate", "model", "status", "description", "cost", "progress", "risk"];
		const values = [
			selectedRow.vehicle.id,
			selectedRow.vehicle.plate || "",
			selectedRow.vehicle.model || "",
			selectedRow.vehicle.status || "",
			orderDraft.description || "",
			normalizeNumber(orderDraft.cost),
			orderDraft.progress === "" ? 0 : clampPercentage(orderDraft.progress),
			selectedRow.risk,
		];
		const csvContent = `${headers.join(";")}\n${values.map(toCsvSafe).join(";")}`;
		const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const fileName = `ordem_manutencao_${selectedRow.vehicle.plate || selectedRow.vehicle.id}.csv`;

		const link = document.createElement("a");
		link.href = url;
		link.setAttribute("download", fileName);
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	};

	const handleImportCsv = async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const content = await file.text();
			const lines = content
				.split(/\r?\n/)
				.map((line) => line.trim())
				.filter(Boolean);

			if (lines.length < 2) {
				throw new Error("CSV sem dados suficientes.");
			}

			const delimiter = lines[0].includes(";") ? ";" : ",";
			const headers = splitCsvLine(lines[0], delimiter).map((header) =>
				header.toLowerCase().replace(/^\uFEFF/, "")
			);
			const data = splitCsvLine(lines[1], delimiter);

			const getValue = (aliases) => {
				const index = headers.findIndex((header) => aliases.includes(header));
				return index >= 0 ? data[index] || "" : "";
			};

			const importedDescription = getValue(["description", "descricao"]);
			const importedCost = getValue(["cost", "custo"]);
			const importedProgress = getValue(["progress", "andamento"]);

			setOrderDraft((prev) => ({
				...prev,
				description: importedDescription || prev.description,
				cost: importedCost || prev.cost,
				progress: importedProgress === "" ? prev.progress : clampPercentage(importedProgress),
			}));

			toast({
				title: "CSV importado",
				description: "Os campos da ordem foram preenchidos com os dados do arquivo.",
			});
		} catch (error) {
			toast({
				title: "Erro ao importar CSV",
				description: error.message || "Não foi possível ler o arquivo.",
				variant: "destructive",
			});
		} finally {
			event.target.value = "";
		}
	};

	return (
		<div className="space-y-5 sm:space-y-6">
			<div>
				<h1 className="text-xl font-bold tracking-tight sm:text-2xl">Manutenção</h1>
				<p className="text-muted-foreground mt-1">
					Controle preventivo com prioridade por risco operacional
				</p>
			</div>

			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Risco crítico</CardDescription>
						<CardTitle className="text-2xl">{summary.critical}</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
						<AlertTriangle className="h-4 w-4 text-destructive" />
						Veículos que exigem atenção imediata
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Risco moderado</CardDescription>
						<CardTitle className="text-2xl">{summary.moderate}</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
						<Wrench className="h-4 w-4 text-chart-3" />
						Agende revisão preventiva
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Em manutenção</CardDescription>
						<CardTitle className="text-2xl">{summary.inMaintenance}</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
						<CalendarClock className="h-4 w-4 text-primary" />
						Frota indisponível no momento
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Saúde da frota</CardDescription>
						<CardTitle className="text-2xl">{summary.healthRate}%</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<Progress value={summary.healthRate} />
						<p className="flex items-center gap-2 text-sm text-muted-foreground">
							<CheckCircle2 className="h-4 w-4 text-chart-2" />
							Proporção de veículos com baixo risco
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
				<Card className="xl:col-span-3">
					<CardHeader className="pb-3">
						<CardTitle>Agenda sugerida</CardTitle>
						<CardDescription>
							Risco = 50% km desde revisão + 30% tempo sem uso + 20% status
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
							<div className="relative flex-1">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Buscar por modelo ou placa"
									className="pl-9"
								/>
							</div>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-full sm:w-[180px]">
									<SelectValue placeholder="Filtrar status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos</SelectItem>
									<SelectItem value="ativo">Ativo</SelectItem>
									<SelectItem value="manutencao">Em manutenção</SelectItem>
									<SelectItem value="inativo">Inativo</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Veículo</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Risco</TableHead>
									<TableHead>Detalhes manutenção</TableHead>
									<TableHead>Próxima revisão</TableHead>
									<TableHead className="text-right">Km rodados</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{vehiclesLoading && (
									<TableRow>
										<TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
											Carregando plano de manutenção...
										</TableCell>
									</TableRow>
								)}

								{!vehiclesLoading && filteredRows.length === 0 && (
									<TableRow>
										<TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
											Nenhum veículo encontrado para os filtros selecionados.
										</TableCell>
									</TableRow>
								)}

								{filteredRows.map(({ vehicle, risk, level, totalKm, kmSinceInspection, kmScore, inactivityScore, statusScore, nextInspectionKm }) => {
									const badge = getRiskBadge(level);
									const details = maintenanceDetails[vehicle.id] || {};
									const progress = clampPercentage(details.progress);
									const hasDescription = Boolean(details.description?.trim());
									return (
										<TableRow key={vehicle.id}>
											<TableCell>
												<button
													type="button"
													onClick={() => openMaintenanceOrder(vehicle.id)}
													className="group -m-1 rounded-md p-1 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
													title="Abrir ordem de manutenção"
												>
													<div className="font-medium text-primary underline underline-offset-2 decoration-primary/60 group-hover:text-primary/80">{vehicle.model || "Sem modelo"}</div>
													<div className="text-xs text-muted-foreground group-hover:text-foreground/80">{vehicle.plate || "Sem placa"}</div>
													<div className="text-[11px] font-medium text-primary/70">Clique para editar ordem</div>
												</button>
											</TableCell>
											<TableCell>
												<Badge variant="secondary">{statusLabel[vehicle.status] || "Sem status"}</Badge>
											</TableCell>
											<TableCell>
												<div className="space-y-2">
													<Badge className={badge.className}>{badge.label}</Badge>
													<Progress value={risk} className="h-1.5" />
													<p className="text-[11px] text-muted-foreground">
														Km {kmScore}% · Inatividade {inactivityScore}% · Status {statusScore}%
													</p>
												</div>
											</TableCell>
											<TableCell>
												{vehicle.status !== "manutencao" && (
													<span className="text-xs text-muted-foreground">Sem manutenção ativa</span>
												)}
												{vehicle.status === "manutencao" && (
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground">
															{hasDescription ? details.description : "Adicione uma descrição no painel lateral."}
														</p>
														<p className="text-xs text-muted-foreground">
															Custo: {formatCurrency(details.cost)}
														</p>
														<p className="text-xs text-muted-foreground">Andamento: {progress}%</p>
													</div>
												)}
											</TableCell>
											<TableCell>
												{nextInspectionKm <= 1200
													? `Revisar em ${Math.round(nextInspectionKm)} km`
													: `${Math.round(nextInspectionKm)} km restantes`}
												<p className="text-[11px] text-muted-foreground">
													Rodados desde revisão: {Math.round(kmSinceInspection).toLocaleString("pt-BR")} km
												</p>
											</TableCell>
											<TableCell className="text-right">{Math.round(totalKm).toLocaleString("pt-BR")} km</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<Card className="xl:col-span-2">
					<CardHeader className="pb-3">
						<CardTitle>Ordens em manutenção</CardTitle>
						<CardDescription>
							Descrição, custo e andamento dos veículos em oficina
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{inMaintenanceRows.length === 0 && (
							<p className="text-sm text-muted-foreground">Nenhum veículo com status em manutenção.</p>
						)}

						{inMaintenanceRows.map(({ vehicle }) => {
							const details = maintenanceDetails[vehicle.id] || { description: "", cost: "", progress: 0 };
							const progress = clampPercentage(details.progress);
							return (
								<div key={vehicle.id} className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2.5">
									<div>
										<p className="text-sm font-semibold leading-tight">{vehicle.model || "Sem modelo"}</p>
										<p className="text-xs text-muted-foreground">{vehicle.plate || "Sem placa"}</p>
									</div>

									<p className="text-xs text-muted-foreground">
										{details.description?.trim() || "Sem descrição registrada."}
									</p>
									<p className="text-xs text-muted-foreground">Custo: {formatCurrency(details.cost)}</p>
									<Progress value={progress} className="h-1.5" />
									<p className="text-xs text-muted-foreground">Andamento atual: {progress}%</p>
									<Button
										variant="outline"
										size="sm"
										className="w-full"
										onClick={() => openMaintenanceOrder(vehicle.id)}
									>
										Editar ordem
									</Button>
								</div>
							);
						})}

						<CardHeader className="px-0 pt-2 pb-0">
							<CardTitle>Top prioridades</CardTitle>
							<CardDescription>Itens para a próxima janela de manutenção</CardDescription>
						</CardHeader>

						<div className="rounded-lg border border-border/80 bg-muted/20 p-3 text-xs text-muted-foreground">
							<p className="font-medium text-foreground">Critério de risco</p>
							<p>50%: km desde a última revisão (ciclo de 10.000 km)</p>
							<p>30%: dias sem viagem (escala até 90 dias)</p>
							<p>20%: status atual do veículo</p>
							<p className="mt-1">Faixas: 0-44 baixo, 45-74 moderado, 75-100 crítico.</p>
						</div>

						{priorityRows.length === 0 && (
							<p className="text-sm text-muted-foreground">
								Sem veículos críticos no momento.
							</p>
						)}

						{priorityRows.map(({ vehicle, risk, level, daysWithoutTrip, kmSinceInspection }) => {
							const badge = getRiskBadge(level);
							return (
								<div
									key={vehicle.id}
									className="rounded-lg border border-border/80 bg-muted/20 p-3"
								>
									<div className="mb-2 flex items-start justify-between gap-2">
										<div>
											<p className="text-sm font-semibold leading-tight">{vehicle.model || "Sem modelo"}</p>
											<p className="text-xs text-muted-foreground">{vehicle.plate || "Sem placa"}</p>
										</div>
										<Badge className={badge.className}>{badge.label}</Badge>
									</div>
									<div className="space-y-1 text-xs text-muted-foreground">
										<p className="flex items-center gap-1">
											<Gauge className="h-3.5 w-3.5" />
											Índice de risco: {risk}%
										</p>
										<p>
											Km desde revisão: {Math.round(kmSinceInspection).toLocaleString("pt-BR")} km
										</p>
										<p>
											Tempo sem viagem: {daysWithoutTrip} dias
										</p>
									</div>
									<Button
										variant="outline"
										size="sm"
										className="mt-3 w-full"
										onClick={() => openMaintenanceOrder(vehicle.id)}
									>
										Agendar revisão
									</Button>
								</div>
							);
						})}
					</CardContent>
				</Card>
			</div>

			<Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>Ordem de manutenção</DialogTitle>
						<DialogDescription>
							{selectedRow
								? `${selectedRow.vehicle.model || "Sem modelo"} · ${selectedRow.vehicle.plate || "Sem placa"}`
								: "Selecione um veículo para editar a ordem."}
						</DialogDescription>
					</DialogHeader>

					{selectedRow && (
						<div className="space-y-4">
							<div className="grid grid-cols-1 gap-2 rounded-lg border border-border/80 bg-muted/20 p-3 text-xs text-muted-foreground sm:grid-cols-3">
								<p>Risco atual: <span className="font-semibold text-foreground">{selectedRow.risk}%</span></p>
								<p>Km desde revisão: <span className="font-semibold text-foreground">{Math.round(selectedRow.kmSinceInspection).toLocaleString("pt-BR")} km</span></p>
								<p>Tempo sem viagem: <span className="font-semibold text-foreground">{selectedRow.daysWithoutTrip} dias</span></p>
							</div>

							<div>
								<p className="mb-1 text-sm font-medium">Descrição do serviço</p>
								<Textarea
									value={orderDraft.description || ""}
									onChange={(event) =>
										setOrderDraft((prev) => ({ ...prev, description: event.target.value }))
									}
									placeholder="Ex.: troca de pastilha de freio e inspeção de suspensão"
									className="min-h-[96px]"
								/>
							</div>

							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<div>
									<p className="mb-1 text-sm font-medium">Custo estimado (R$)</p>
									<Input
										type="number"
										min="0"
										step="0.01"
										value={orderDraft.cost || ""}
										onChange={(event) =>
											setOrderDraft((prev) => ({ ...prev, cost: event.target.value }))
										}
										placeholder="0,00"
									/>
								</div>

								<div>
									<p className="mb-1 text-sm font-medium">Andamento (%)</p>
									<Input
										type="number"
										min="0"
										max="100"
										value={orderDraft.progress}
										onChange={(event) => {
											const rawValue = event.target.value;
											setOrderDraft((prev) => ({
												...prev,
												progress: rawValue === "" ? "" : clampPercentage(rawValue),
											}));
										}}
										onBlur={() => {
											if (orderDraft.progress === "") return;
											setOrderDraft((prev) => ({ ...prev, progress: clampPercentage(prev.progress) }));
										}}
									/>
								</div>
							</div>

							<input
								ref={csvInputRef}
								type="file"
								accept=".csv,text/csv"
								onChange={handleImportCsv}
								className="hidden"
							/>

							<Progress value={selectedProgress} />
							<p className="text-xs text-muted-foreground">Andamento atual: {selectedProgress}%</p>

							<div className="flex flex-wrap gap-2">
								<Button variant="outline" onClick={() => csvInputRef.current?.click()}>
									Importar CSV
								</Button>
								<Button variant="outline" onClick={handleExportCsv}>
									Exportar CSV
								</Button>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button onClick={handleSaveOrder}>Salvar</Button>
						<Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
							Fechar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
