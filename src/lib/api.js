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

async function apiFetch(method, path, body = null) {
  if (!BASE_URL) throw new Error("VITE_API_URL is not configured. Set it in .env to your backend host (e.g. https://host or https://host/api)");
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  // AUTENTICAÇÃO DESATIVADA DURANTE DESENVOLVIMENTO
  // const token = localStorage.getItem(AUTH_TOKEN_KEY);
  // if (token) {
  //   options.headers.Authorization = `Bearer ${token}`;
  // }
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Erro ${res.status}`);
  }
  return res.json();
}

// ─── Modo: Backend Real vs Local ────────────────────────────

const isBackendMode = () => !!BASE_URL;

export const authApi = {
  login: async (email, senha) => {
    if (!isBackendMode()) return null;
    return apiFetch("POST", "/login", { email, senha });
  },

  createUser: async (data) => {
    if (!isBackendMode()) return null;
    const response = await apiFetch("POST", "/usuarios", data);
    return response.data || response;
  },
};

// ============================================================
// VEÍCULOS
// ============================================================

export const vehiclesApi = {
  normalizeStatus: (status) => {
    const raw = `${status || ""}`.trim().toLowerCase();
    if (!raw) return "ativo";
    if (raw === "disponível" || raw === "disponivel") return "ativo";
    if (raw === "em manutenção" || raw === "manutenção" || raw === "manutencao") return "manutencao";
    if (raw === "inativo") return "inativo";
    return raw;
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

  normalizeDriver: (driver) => {
    const cpf = driver?.cpf ?? driver?.id ?? "";
    const nome = driver?.nome ?? driver?.name ?? "";
    const cnh = driver?.cnh ?? "";
    const dataNasc = driver?.data_nasc ?? driver?.dataNascimento ?? driver?.birth_date ?? "";
    const dataAdm = driver?.data_adm ?? driver?.dataAdmissao ?? driver?.admission_date ?? "";
    const dataDem = driver?.data_dem ?? driver?.dataDemissao ?? driver?.dismissal_date ?? "";
    const email = driver?.email ?? "";

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
      return Array.isArray(res) ? res : (res.data || res.trips || res.viagens || res.results || []);
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
        ...data,
        quilometragem: data?.quilometragem ?? data?.distance_km ?? 0,
      };
      delete payload.distance_km;
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
// IA / CHAT  ← ROTA PARA O TIME DE IA
// ============================================================

export const aiApi = {
  /**
   * POST /api/ai/chat
   * ─────────────────────────────────────────────────────────
   * ESTA É A ROTA QUE O TIME DE IA DEVE IMPLEMENTAR.
   *
   * Envia uma mensagem do usuário junto com o contexto da frota
   * para o modelo de IA e retorna a resposta em texto.
   *
   * REQUEST BODY:
   * {
   *   message: string,          // pergunta do usuário
   *   context: {
   *     vehicles: Array<{       // lista de veículos
   *       id, plate, model, year, status
   *     }>,
   *     drivers: Array<{        // lista de motoristas
   *       id, name, cnh, status, vehicle_id
   *     }>,
   *     trips: Array<{          // lista de viagens
   *       id, vehicle_id, driver_id, origin, destination,
  *       quilometragem, fuel_liters, cost, date
   *     }>
   *   },
   *   history: Array<{          // histórico da conversa (opcional)
   *     role: "user" | "assistant",
   *     content: string
   *   }>
   * }
   *
   * RESPONSE ESPERADA:
   * {
   *   reply: string             // resposta em Markdown
   * }
   *
   * EXEMPLO DE IMPLEMENTAÇÃO (Python/FastAPI):
   *
   *   @app.post("/api/ai/chat")
   *   async def chat(body: ChatRequest):
   *       # Monte o prompt com body.context e body.history
   *       # Chame seu modelo (OpenAI, Gemini, LLaMA, etc.)
   *       # Retorne { "reply": "..." }
   *       pass
   * ─────────────────────────────────────────────────────────
   */
  chat: async ({ message, context, history = [] }) => {
    if (isBackendMode()) {
      return apiFetch("POST", "/ai/chat", { message, context, history });
    }

    // ── MODO LOCAL: resposta simulada ──────────────────────
    // Remove este bloco quando o backend de IA estiver pronto.
    await new Promise((r) => setTimeout(r, 800));

    const { vehicles = [], drivers = [], trips = [] } = context;
    const totalCost = trips.reduce((s, t) => s + (t.cost || 0), 0);
    const avgKmL =
      trips.length > 0
        ? (
            trips.reduce((s, t) => s + (t.quilometragem ?? t.distance_km ?? 0), 0) /
            Math.max(
              trips.reduce((s, t) => s + (t.fuel_liters || 0), 0),
              1
            )
          ).toFixed(1)
        : "—";

    return {
      reply: `**[Modo Simulação — Backend de IA não conectado]**

Sua pergunta: *"${message}"*

---

**Resumo atual da frota:**
- **Veículos:** ${vehicles.length} (${vehicles.filter((v) => v.status === "ativo").length} ativos)
- **Motoristas:** ${drivers.length} (${drivers.filter((d) => d.status === "ativo").length} ativos)
- **Viagens registradas:** ${trips.length}
- **Custo total:** R$ ${totalCost.toFixed(2)}
- **Média de consumo:** ${avgKmL} km/L

> Para ativar a IA real, configure \`VITE_API_URL\` no arquivo \`.env\` e implemente a rota \`POST /api/ai/chat\` no backend.`,
    };
  },
};
