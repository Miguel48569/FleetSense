/**
 * FleetSense - Camada de API
 * ============================================================
 * Este arquivo centraliza TODAS as chamadas ao backend.
 * 
 * CONFIGURAÇÃO:
 *   - Defina a variável de ambiente VITE_API_URL no arquivo .env
 *     para apontar para o seu backend (ex: http://localhost:8000/api)
 *   - Se VITE_API_URL não estiver definida, o sistema usa
 *     armazenamento LOCAL (localStorage) como fallback,
 *     permitindo que o frontend funcione sem backend.
 * 
 * PARA O TIME DE BACKEND:
 *   Todas as rotas esperadas estão documentadas em BACKEND_ROUTES.md
 *   na raiz do projeto.
 */

const _RAW_BASE_URL = import.meta.env.VITE_API_URL || null;
// Normalize base URL: remove trailing slash if present so paths like
// `/veiculos` can be appended directly. Backend may or may not expose
// the API under `/api`, so `VITE_API_URL` should match the backend root.
const BASE_URL = _RAW_BASE_URL ? String(_RAW_BASE_URL).replace(/\/$/, "") : null;

// ─── Utilitários ────────────────────────────────────────────

export class ApiError extends Error {
  constructor(message, status = null, raw = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.raw = raw;
  }
}

function formatValidationDetails(raw) {
  if (!raw) return "";

  const entries = raw?.errors && typeof raw.errors === "object" ? Object.entries(raw.errors) : [];
  if (entries.length > 0) {
    return entries
      .map(([field, value]) => {
        const detail = Array.isArray(value) ? value.join(", ") : `${value}`;
        return `${field}: ${detail}`;
      })
      .join(" | ");
  }

  if (Array.isArray(raw?.details) && raw.details.length > 0) {
    return raw.details.join(" | ");
  }

  if (typeof raw?.detail === "string") return raw.detail;
  return "";
}

function extractApiErrorMessage({ method, path, status, raw }) {
  const rawMessage = raw?.message || raw?.error || raw?.msg || raw?.title || raw?.description || "";
  const validationDetails = formatValidationDetails(raw);

  const endpointName = path.includes("/usuarios")
    ? "usuários"
    : path.includes("/login")
      ? "login"
      : path.includes("/chat")
        ? "chat"
        : path;

  switch (status) {
    case 400:
      return rawMessage
        ? validationDetails
          ? `${rawMessage} | ${validationDetails}`
          : rawMessage
        : `Requisição inválida em ${method} ${endpointName}.${validationDetails ? ` Detalhes: ${validationDetails}` : ""}`;
    case 401:
      return rawMessage
        ? rawMessage
        : `Não autenticado ao acessar ${endpointName}. Faça login novamente e tente outra vez.`;
    case 403:
      return rawMessage
        ? rawMessage
        : `Acesso negado em ${endpointName}. Seu perfil não tem permissão para executar essa ação.`;
    case 404:
      return rawMessage
        ? rawMessage
        : `Rota não encontrada para ${method} ${path}. Verifique o endpoint configurado no backend.`;
    case 409:
      return rawMessage
        ? rawMessage
        : `Conflito ao processar ${endpointName}. Já existe um registro com esses dados.`;
    case 422:
      return rawMessage
        ? validationDetails
          ? `${rawMessage}${validationDetails ? ` | ${validationDetails}` : ""}`
          : rawMessage
        : `Falha de validação em ${endpointName}.${validationDetails ? ` Detalhes: ${validationDetails}` : ""}`;
    case 500:
      return rawMessage
        ? rawMessage
        : `Erro interno do servidor ao executar ${endpointName}. Verifique os logs do backend.`;
    case 502:
    case 503:
    case 504:
      return rawMessage
        ? rawMessage
        : `Serviço indisponível ao chamar ${endpointName}. Tente novamente em instantes.`;
    default:
      return rawMessage || `Erro ${status} em ${method} ${endpointName}.`;
  }
}

async function apiFetch(method, path, body = null) {
  if (!BASE_URL) throw new ApiError("VITE_API_URL is not configured. Set it in .env to your backend host (e.g. https://host or https://host/api)");
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  // Anexa token de sessão se existir (armazenado pelo AuthContext em localStorage)
  try {
    const sessionRaw = localStorage.getItem("fleetsense_auth_session");
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      const token = session?.token || null;
      if (token) options.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore parsing issues
  }

  if (body) options.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(url, options);
  } catch (networkError) {
    throw new ApiError(`Falha de rede ao chamar ${method} ${path}. Verifique se o backend está online.`, null, {
      cause: networkError?.message || String(networkError),
      url,
    });
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    const errBody = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");
    const parsedBody = typeof errBody === "string" ? { message: errBody } : errBody;
    const message = extractApiErrorMessage({ method, path, status: res.status, raw: parsedBody }) || res.statusText || `Erro ${res.status}`;
    throw new ApiError(message, res.status, parsedBody);
  }

  if (res.status === 204) return null;
  if (isJson) return res.json();
  return res.text();
}

// ─── Modo: Backend Real vs Local ────────────────────────────

const isBackendMode = () => !!BASE_URL;

export const authApi = {
  // login expects an object: { email, identificador, matricula, senha }
  login: async ({ email, identificador, matricula, senha } = {}) => {
    if (!isBackendMode()) return null;
    const payload = {
      email,
      identificador: identificador || undefined,
      matricula: matricula || undefined,
      senha,
    };
    return apiFetch("POST", "/login", payload);
  },

  createUser: async (data) => {
    if (!isBackendMode()) return null;
    const response = await apiFetch("POST", "/usuarios", data);
    return response.data || response;
  },
};

export const usersApi = {
  normalizeUser: (user) => {
    const idUsuario = user?.idUsuario ?? user?.id_usuario ?? user?.usuario_id ?? user?.id ?? null;
    const matricula = user?.matricula ?? user?.registration ?? user?.codigo ?? "";
    const email = user?.email ?? user?.usuario ?? "";
    const cargo = (user?.cargo ?? user?.role ?? user?.perfil ?? "")?.toString().toLowerCase();

    return {
      ...user,
      idUsuario,
      matricula,
      email,
      cargo,
    };
  },

  list: async () => {
    if (!isBackendMode()) throw new Error("Backend não configurado");
    const response = await apiFetch("GET", "/usuarios");
    const rows = Array.isArray(response)
      ? response
      : response?.data || response?.usuarios || response?.users || response?.results || [];
    return rows.map((user) => usersApi.normalizeUser(user));
  },

  create: async (data) => {
    if (!isBackendMode()) throw new Error("Backend não configurado");
    const payload = {
      matricula: data?.matricula ?? "",
      email: data?.email ?? "",
      senha: data?.senha ?? data?.password ?? "",
      cargo: (data?.cargo ?? "").toString().toLowerCase(),
    };
    const response = await apiFetch("POST", "/usuarios", payload);
    return usersApi.normalizeUser(response?.data ?? response);
  },

  update: async (idUsuario, data) => {
    if (!isBackendMode()) throw new Error("Backend não configurado");
    const payload = {
      matricula: data?.matricula ?? "",
      email: data?.email ?? "",
      cargo: (data?.cargo ?? "").toString().toLowerCase(),
    };

    const senha = data?.senha ?? data?.password;
    if (senha) payload.senha = senha;

    const response = await apiFetch("PUT", `/usuarios/${encodeURIComponent(idUsuario)}`, payload);
    return usersApi.normalizeUser(response?.data ?? response);
  },

  delete: async (idUsuario) => {
    if (!isBackendMode()) throw new Error("Backend não configurado");
    return apiFetch("DELETE", `/usuarios/${encodeURIComponent(idUsuario)}`);
  },
};

// ============================================================
// VEÍCULOS
// ============================================================

export const vehiclesApi = {
  normalizeStatus: (status) => {
    const raw = `${status || ""}`.trim().toLowerCase();
    if (!raw) return "Disponivel";
    if (raw === "inativo") return "inativo";
    if (raw === "em manutenção" || raw === "manutenção" || raw === "manutencao") return "manutencao";
    return "Disponivel";
  },

  normalizeVehicle: (vehicle) => {
    const placa = vehicle?.placa ?? vehicle?.plate ?? "";
    const modelo = vehicle?.modelo ?? vehicle?.model ?? "";
    const ano = vehicle?.ano ?? vehicle?.year ?? null;
    const cor = vehicle?.cor ?? vehicle?.color ?? "";
    const fabricante = vehicle?.fabricante ?? vehicle?.manufacturer ?? "";
    const quilometragem = Number(vehicle?.quilometragem ?? vehicle?.mileage ?? 0);
    const statusOriginal = vehicle?.status ?? "";
    const status = vehiclesApi.normalizeStatus(statusOriginal);

    return {
      ...vehicle,
      placa,
      modelo,
      ano,
      cor,
      fabricante,
      quilometragem,
      // aliases para manter compatibilidade no restante do front
      plate: placa,
      model: modelo,
      year: ano,
      color: cor,
      manufacturer: fabricante,
      mileage: quilometragem,
      status,
      status_original: statusOriginal,
    };
  },

  /**
   * GET /api/vehicles
   * Retorna lista de todos os veículos.
    * Resposta esperada: Array<{ placa, modelo, ano, status, cor, fabricante, quilometragem }>
   */
  list: async () => {
    if (isBackendMode()) {
      const res = await apiFetch("GET", "/veiculos");
      // Normaliza a resposta: pode vir como array direto ou envolvido em objeto
      const rows = Array.isArray(res) ? res : (res.data || res.vehicles || res.veiculos || res.results || []);
      return rows.map((vehicle) => vehiclesApi.normalizeVehicle(vehicle));
    }
    throw new Error("Backend não configurado");
  },

  /**
   * POST /api/vehicles
   * Cria um novo veículo.
   * Body: { placa: string, modelo: string, ano: number, status: string, cor: string, fabricante: string, quilometragem: number }
   * Resposta esperada: { placa, modelo, ano, status, cor, fabricante, quilometragem }
   */
  create: async (data) => {
    if (isBackendMode()) {
      const payload = {
        ...data,
        placa: data?.placa ?? data?.plate ?? "",
        modelo: data?.modelo ?? data?.model ?? "",
        ano: data?.ano ?? data?.year ?? null,
        status: data?.status ?? "Disponível",
        cor: data?.cor ?? data?.color ?? "",
        fabricante: data?.fabricante ?? data?.manufacturer ?? "",
        quilometragem: Number(data?.quilometragem ?? data?.mileage ?? 0),
      };
      delete payload.plate;
      delete payload.model;
      delete payload.year;
      delete payload.color;
      delete payload.manufacturer;
      delete payload.mileage;
      return apiFetch("POST", "/veiculos", payload);
    }
    throw new Error("Backend não configurado");
  },

  /**
   * PUT /api/vehicles/:id
   * Atualiza um veículo existente.
   * Body: { placa?, modelo?, ano?, status?, cor?, fabricante?, quilometragem? }
   * Resposta esperada: { placa, modelo, ano, status, cor, fabricante, quilometragem }
   */
  update: async (id, data) => {
    if (isBackendMode()) {
      const payload = {
        ...data,
        placa: data?.placa ?? data?.plate,
        modelo: data?.modelo ?? data?.model,
        ano: data?.ano ?? data?.year,
        cor: data?.cor ?? data?.color,
        fabricante: data?.fabricante ?? data?.manufacturer,
        quilometragem: data?.quilometragem ?? data?.mileage,
      };
      delete payload.plate;
      delete payload.model;
      delete payload.year;
      delete payload.color;
      delete payload.manufacturer;
      delete payload.mileage;
      return apiFetch("PUT", `/veiculos/${id}`, payload);
    }
    throw new Error("Backend não configurado");
  },

  /**
   * DELETE /api/vehicles/:id
   * Remove um veículo pelo ID.
   * Resposta esperada: { success: true }
   */
  delete: async (id) => {
    if (isBackendMode()) return apiFetch("DELETE", `/veiculos/${id}`);
    throw new Error("Backend não configurado");
  },
};

// ============================================================
// MOTORISTAS
// ============================================================

export const driversApi = {
  formatDriverDateTime: (value, allowNull = true) => {
    const raw = `${value ?? ""}`.trim();
    if (!raw) return allowNull ? null : "";
    if (raw.includes("T")) return raw;
    return `${raw}T00:00:00`;
  },

  normalizeDriverStatus: (driver) => {
    const rawStatus = `${driver?.status ?? driver?.status_original ?? ""}`.trim().toLowerCase();
    if (rawStatus === "inativo" || driver?.data_dem || driver?.dataDemissao || driver?.dismissal_date) return "Inativo";
    return "Disponível";
  },

  normalizeDriver: (driver) => {
    const cpf = driver?.cpf ?? driver?.id ?? "";
    const nome = driver?.nome ?? driver?.name ?? "";
    const cnh = driver?.cnh ?? "";
    const dataNasc = driver?.data_nasc ?? driver?.dataNascimento ?? driver?.birth_date ?? "";
    const dataAdm = driver?.data_adm ?? driver?.dataAdmissao ?? driver?.admission_date ?? "";
    const dataDem = driver?.data_dem ?? driver?.dataDemissao ?? driver?.dismissal_date ?? "";
    const email = driver?.email ?? "";
    const status = driversApi.normalizeDriverStatus(driver);

    return {
      ...driver,
      cpf,
      nome,
      cnh,
      data_nasc: dataNasc,
      data_adm: dataAdm,
      data_dem: dataDem,
      email,
      // aliases para compatibilidade
      id: cpf,
      name: nome,
      birth_date: dataNasc,
      admission_date: dataAdm,
      dismissal_date: dataDem,
      dataNascimento: dataNasc,
      dataAdmissao: dataAdm,
      dataDemissao: dataDem,
      status,
      status_original: driver?.status ?? driver?.status_original ?? "",
    };
  },

  /**
   * GET /api/drivers
   * Retorna lista de todos os motoristas.
   * Resposta esperada: Array<{ cpf, nome, cnh, data_nasc, data_adm, data_dem, email }>
   */
  list: async () => {
    if (isBackendMode()) {
      const res = await apiFetch("GET", "/motoristas");
      // Normaliza a resposta: pode vir como array direto ou envolvido em objeto
      const rows = Array.isArray(res) ? res : (res.data || res.drivers || res.motoristas || res.results || []);
      return rows.map((driver) => driversApi.normalizeDriver(driver));
    }
    throw new Error("Backend não configurado");
  },

  /**
   * POST /api/drivers
   * Cria um novo motorista.
   * Body: { cpf: string, nome: string, cnh: string, data_nasc: string, data_adm: string, data_dem?: string, email: string }
   * Resposta esperada: { cpf, nome, cnh, data_nasc, data_adm, data_dem, email }
   */
  create: async (data) => {
    if (isBackendMode()) {
      const payload = {
        ...data,
        cpf: data?.cpf ?? data?.id ?? "",
        nome: data?.nome ?? data?.name ?? "",
        cnh: data?.cnh ?? "",
        data_nasc: driversApi.formatDriverDateTime(data?.data_nasc ?? data?.birth_date ?? data?.dataNascimento ?? "", false).slice(0, 10),
        data_adm: driversApi.formatDriverDateTime(data?.data_adm ?? data?.admission_date ?? data?.dataAdmissao ?? ""),
        data_dem: driversApi.formatDriverDateTime(data?.data_dem ?? data?.dismissal_date ?? data?.dataDemissao ?? ""),
        email: data?.email ?? "",
        status: data?.status ?? (data?.data_dem ? "Inativo" : "Disponível"),
      };
      delete payload.id;
      delete payload.name;
      delete payload.birth_date;
      delete payload.admission_date;
      delete payload.dismissal_date;
      delete payload.dataNascimento;
      delete payload.dataAdmissao;
      delete payload.dataDemissao;
      return apiFetch("POST", "/motoristas", payload);
    }
    throw new Error("Backend não configurado");
  },

  /**
   * PUT /api/drivers/:id
   * Atualiza um motorista existente.
   * Body: { cpf?, nome?, cnh?, data_nasc?, data_adm?, data_dem?, email? }
   * Resposta esperada: { cpf, nome, cnh, data_nasc, data_adm, data_dem, email }
   */
  update: async (id, data) => {
    if (isBackendMode()) {
      const payload = {
        ...data,
        cpf: data?.cpf ?? data?.id ?? id,
        nome: data?.nome ?? data?.name,
        cnh: data?.cnh,
        data_nasc: driversApi.formatDriverDateTime(data?.data_nasc ?? data?.birth_date ?? data?.dataNascimento ?? "", false).slice(0, 10),
        data_adm: driversApi.formatDriverDateTime(data?.data_adm ?? data?.admission_date ?? data?.dataAdmissao ?? ""),
        data_dem: driversApi.formatDriverDateTime(data?.data_dem ?? data?.dismissal_date ?? data?.dataDemissao ?? ""),
        email: data?.email,
        status: data?.status ?? (data?.data_dem ? "Inativo" : "Disponível"),
      };
      delete payload.id;
      delete payload.name;
      delete payload.birth_date;
      delete payload.admission_date;
      delete payload.dismissal_date;
      delete payload.dataNascimento;
      delete payload.dataAdmissao;
      delete payload.dataDemissao;
      return apiFetch("PUT", `/motoristas/${id}`, payload);
    }
    throw new Error("Backend não configurado");
  },

  /**
   * DELETE /api/drivers/:id
   * Remove um motorista pelo ID.
   * Resposta esperada: { success: true }
   */
  delete: async (id) => {
    if (isBackendMode()) return apiFetch("DELETE", `/motoristas/${id}`);
    throw new Error("Backend não configurado");
  },
};

// ============================================================
// VIAGENS
// ============================================================

export const tripsApi = {
  normalizeTrip: (trip) => {
    const id = trip?.id ?? trip?.idViagem ?? trip?.id_viagem ?? trip?.viagem_id ?? null;
    const vehicleId = trip?.vehicle_id ?? trip?.vehicleId ?? trip?.veiculo_id ?? trip?.veiculoId ?? trip?.placa ?? trip?.vehicle_plate ?? "";
    const driverId = trip?.driver_id ?? trip?.driverId ?? trip?.motorista_id ?? trip?.motoristaId ?? trip?.cpf ?? trip?.driver_cpf ?? "";
    const origin = trip?.origin ?? trip?.origem ?? trip?.partida ?? trip?.cidade_origem ?? "";
    const destination = trip?.destination ?? trip?.destino ?? trip?.cidade_destino ?? "";
    const quilometragem = Number(trip?.quilometragem ?? trip?.distance_km ?? trip?.distancia ?? trip?.km ?? 0);
    const fuelLiters = Number(trip?.fuel_liters ?? trip?.litros ?? trip?.qtdCombustivel ?? trip?.fuel ?? 0);
    const cost = Number(trip?.cost ?? trip?.custo ?? trip?.valor ?? 0);
    const date = trip?.date ?? trip?.dataInicio ?? trip?.data ?? trip?.created_at ?? trip?.createdAt ?? "";

    return {
      ...trip,
      id,
      vehicle_id: vehicleId,
      driver_id: driverId,
      origin,
      destination,
      quilometragem,
      fuel_liters: fuelLiters,
      cost,
      date,
      dataInicio: trip?.dataInicio ?? trip?.data_inicio ?? date,
      dataFim: trip?.dataFim ?? trip?.data_fim ?? trip?.dataFim ?? trip?.dataInicio ?? date,
      partida: trip?.partida ?? origin,
      distancia: Number(trip?.distancia ?? trip?.quilometragem ?? trip?.distance_km ?? trip?.km ?? 0),
      qtdCombustivel: Number(trip?.qtdCombustivel ?? trip?.fuel_liters ?? trip?.litros ?? trip?.consumo ?? 0),
    };
  },

  /**
   * GET /api/trips
   * Retorna lista de todas as viagens.
   * Resposta esperada: Array<{ id, vehicle_id, driver_id, origin, destination,
    *                            quilometragem, fuel_liters, cost, date }>
   */
  list: async () => {
    if (isBackendMode()) {
      const res = await apiFetch("GET", "/viagens");
      // Normaliza a resposta: pode vir como array direto ou envolvido em objeto
      const rows = Array.isArray(res) ? res : (res.data || res.trips || res.viagens || res.results || []);
      return rows.map((trip) => tripsApi.normalizeTrip(trip));
    }
    throw new Error("Backend não configurado");
  },

  /**
   * POST /api/trips
   * Registra uma nova viagem.
   * Body: { vehicle_id: string, driver_id: string, origin: string,
   *         destination: string, quilometragem: number, fuel_liters: number,
   *         cost: number, date: string (ISO) }
   * Resposta esperada: { id, vehicle_id, driver_id, origin, destination,
   *                      quilometragem, fuel_liters, cost, date }
   */
  create: async (data) => {
    if (isBackendMode()) {
      const payload = {
        partida: data?.partida ?? data?.origin ?? data?.origem ?? "",
        destino: data?.destino ?? data?.destination ?? "",
        distancia: Number(data?.distancia ?? data?.quilometragem ?? data?.distance_km ?? data?.km ?? 0),
        qtdCombustivel: Number(data?.qtdCombustivel ?? data?.fuel_liters ?? data?.litros ?? data?.combustivel ?? data?.consumo ?? 0),
        custo: Number(data?.custo ?? data?.cost ?? data?.valor ?? 0),
        dataInicio: data?.dataInicio ?? data?.date ?? data?.data ?? "",
        dataFim: data?.dataFim ?? data?.date ?? data?.data ?? "",
        status: data?.status ?? "Pendente",
      };
      return apiFetch("POST", "/viagens", payload);
    }
    throw new Error("Backend não configurado");
  },

  /**
   * DELETE /api/trips/:id
   * Remove uma viagem pelo ID.
   * Resposta esperada: { success: true }
   */
  delete: async (id) => {
    if (isBackendMode()) return apiFetch("DELETE", `/viagens/${id}`);
    throw new Error("Backend não configurado");
  },
};

export const relacoesApi = {
  normalizeRelacao: (relacao) => {
    const viagem = relacao?.viagem ?? relacao?.trip ?? relacao?.viagem_relacionada ?? relacao?.relacao?.viagem ?? {};
    const veiculo = relacao?.veiculo ?? relacao?.vehicle ?? relacao?.relacao?.veiculo ?? viagem?.veiculo ?? viagem?.vehicle ?? {};
    const motorista = relacao?.motorista ?? relacao?.driver ?? relacao?.relacao?.motorista ?? viagem?.motorista ?? viagem?.driver ?? {};

    const id = relacao?.id ?? relacao?.idRelacao ?? viagem?.id ?? viagem?.idViagem ?? viagem?.viagem_id ?? null;
    const dataInicio = viagem?.dataInicio ?? viagem?.data_inicio ?? relacao?.dataInicio ?? relacao?.data_inicio ?? viagem?.data ?? viagem?.date ?? "";
    const dataFim = viagem?.dataFim ?? viagem?.data_fim ?? relacao?.dataFim ?? relacao?.data_fim ?? "";
    const partida = viagem?.partida ?? viagem?.origem ?? relacao?.partida ?? relacao?.origem ?? "";
    const destino = viagem?.destination ?? viagem?.destino ?? relacao?.destination ?? relacao?.destino ?? "";
    const distancia = Number(viagem?.distancia ?? viagem?.quilometragem ?? viagem?.km ?? relacao?.distancia ?? relacao?.km ?? 0);
    const qtdCombustivel = Number(viagem?.qtdCombustivel ?? viagem?.combustivel ?? viagem?.litros ?? relacao?.qtdCombustivel ?? relacao?.combustivel ?? 0);
    const cost = Number(viagem?.cost ?? viagem?.custo ?? viagem?.valor ?? relacao?.cost ?? relacao?.custo ?? 0);
    const status = viagem?.status ?? relacao?.status ?? "";

    const veiculoPlaca = veiculo?.placa ?? veiculo?.plate ?? relacao?.veiculo_placa ?? viagem?.veiculo_placa ?? "";
    const motoristaNome = motorista?.nome ?? motorista?.name ?? relacao?.motorista_nome ?? viagem?.motorista_nome ?? "";

    return {
      ...relacao,
      ...viagem,
      id,
      dataInicio,
      dataFim,
      partida,
      destino,
      distancia,
      qtdCombustivel,
      cost,
      status,
      veiculo,
      motorista,
      veiculo_placa: veiculoPlaca,
      motorista_nome: motoristaNome,
    };
  },

  list: async () => {
    if (!isBackendMode()) throw new Error("Backend não configurado");
    const response = await apiFetch("GET", "/relacoes");
    const rows = Array.isArray(response)
      ? response
      : response?.data || response?.relacoes || response?.relations || response?.results || [];
    return rows.map((relacao) => relacoesApi.normalizeRelacao(relacao));
  },

  create: async ({ motorista_cpf, veiculo_placa, viagem_id }) => {
    if (!isBackendMode()) throw new Error("Backend não configurado");
    const payload = {
      motorista_cpf,
      veiculo_placa,
      viagem_id,
    };
    return apiFetch("POST", "/relacoes", payload);
  },
};

// ============================================================
// MANUTENÇÕES
// ============================================================

export const maintenanceApi = {
  normalizeMaintenance: (item) => {
    const idManutencao = item?.idManutencao ?? item?.id_manutencao ?? item?.id ?? null;
    const veiculoPlaca = item?.veiculo_placa ?? item?.veiculoPlaca ?? item?.placa ?? item?.vehicle_plate ?? "";
    const dataInicio = item?.dataInicio ?? item?.data_inicio ?? item?.startDate ?? "";
    const dataPrevista = item?.dataPrevista ?? item?.data_prevista ?? item?.predictedDate ?? "";
    const dataFim = item?.dataFim ?? item?.data_fim ?? item?.endDate ?? "";
    const status = (item?.status ?? "")?.toString();

    return {
      ...item,
      idManutencao,
      veiculo_placa: veiculoPlaca,
      dataInicio,
      dataPrevista,
      dataFim,
      status,
    };
  },

  list: async () => {
    if (!isBackendMode()) throw new Error("Backend não configurado");
    const response = await apiFetch("GET", "/manutencoes");
    const rows = Array.isArray(response)
      ? response
      : response?.data || response?.manutencoes || response?.maintenance || response?.results || [];
    return rows.map((item) => maintenanceApi.normalizeMaintenance(item));
  },

  create: async (data) => {
    if (!isBackendMode()) throw new Error("Backend não configurado");
    const payload = {
      dataFim: data?.dataFim || "",
      dataInicio: data?.dataInicio || "",
      dataPrevista: data?.dataPrevista || "",
      idManutencao: 0,
      status: data?.status || "Pendente",
      veiculo_placa: data?.veiculo_placa || "",
    };
    const response = await apiFetch("POST", "/manutencoes", payload);
    return maintenanceApi.normalizeMaintenance(response?.data ?? response);
  },

  update: async (idManutencao, data) => {
    if (!isBackendMode()) throw new Error("Backend não configurado");
    const normalizedIdManutencao = Number(idManutencao ?? 0);
    const payload = {
      dataFim: data?.dataFim || "",
      dataInicio: data?.dataInicio || "",
      dataPrevista: data?.dataPrevista || "",
      idManutencao: Number.isNaN(normalizedIdManutencao) ? 0 : normalizedIdManutencao,
      status: data?.status || "Pendente",
      veiculo_placa: data?.veiculo_placa || "",
    };
    const response = await apiFetch("PUT", `/manutencoes/${encodeURIComponent(idManutencao)}`, payload);
    return maintenanceApi.normalizeMaintenance(response?.data ?? response);
  },

  delete: async (idManutencao) => {
    if (!isBackendMode()) throw new Error("Backend não configurado");
    return apiFetch("DELETE", `/manutencoes/${encodeURIComponent(idManutencao)}`);
  },
};

// ============================================================
// DASHBOARD (estatísticas agregadas)
// ============================================================

export const dashboardApi = {
  /**
   * GET /api/dashboard/stats
   * Retorna estatísticas gerais da frota.
   * Resposta esperada: {
   *   total_vehicles: number,
   *   active_vehicles: number,
   *   total_drivers: number,
   *   active_drivers: number,
   *   total_trips: number,
   *   total_cost: number
   * }
   *
   * NOTA: Se o backend não implementar esta rota, o frontend
   * calcula as estatísticas a partir dos dados de veículos,
   * motoristas e viagens individualmente.
   */
  stats: async () => {
    if (isBackendMode()) return apiFetch("GET", "/dashboard/stats");
    throw new Error("Backend não configurado");
  },
};

// ============================================================
// IA / CHAT
// ============================================================

export const aiApi = {
  welcome: async () => {
    if (!isBackendMode()) throw new Error("Backend não configurado");
    return apiFetch("GET", "/chat");
  },

  chat: async (message) => {
    if (!isBackendMode()) throw new Error("Backend não configurado");
    return apiFetch("POST", "/chat", { mensagem: message });
  },
};
