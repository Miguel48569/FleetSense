/**
 * FleetSense - Camada de API
 * ============================================================
 * Este arquivo centraliza TODAS as chamadas ao backend.
 * 
 * CONFIGURAÇÃO:
 *   - Defina a variável de ambiente VITE_API_URL no arquivo .env
 *     para apontar para o seu backend (ex: http://localhost:8000/api)
 *   - Se existir `access_token` nos app params, as requisições enviam
 *     o header `Authorization: Bearer <token>`
 *   - Se VITE_API_URL não estiver definida, o sistema usa
 *     armazenamento LOCAL (localStorage) como fallback,
 *     permitindo que o frontend funcione sem backend.
 * 
 * PARA O TIME DE BACKEND:
 *   Todas as rotas esperadas estão documentadas em BACKEND_ROUTES.md
 *   na raiz do projeto.
 */

import { appParams } from "./app-params";

const BASE_URL = import.meta.env.VITE_API_URL || null;

// ─── Utilitários ────────────────────────────────────────────

const generateId = () => `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const localDB = {
  get: (key) => {
    try {
      return JSON.parse(localStorage.getItem(`fleetsense_${key}`) || "[]");
    } catch {
      return [];
    }
  },
  set: (key, data) => {
    localStorage.setItem(`fleetsense_${key}`, JSON.stringify(data));
  },
};

const formatAuthHeader = (accessToken) => {
  if (!accessToken) return null;
  if (accessToken.toLowerCase().startsWith("bearer ")) return accessToken;
  return `Bearer ${accessToken}`;
};

async function apiFetch(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const accessToken = appParams.token;
  const authorizationHeader = formatAuthHeader(accessToken);
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
    },
  };
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

// ============================================================
// VEÍCULOS
// ============================================================

export const vehiclesApi = {
  /**
   * GET /api/vehicles
   * Retorna lista de todos os veículos.
   * Resposta esperada: Array<{ id, plate, model, year, status }>
   */
  list: async () => {
    if (isBackendMode()) return apiFetch("GET", "/vehicles");
    return localDB.get("vehicles");
  },

  /**
   * POST /api/vehicles
   * Cria um novo veículo.
   * Body: { plate: string, model: string, year: number, status: string }
   * Resposta esperada: { id, plate, model, year, status }
   */
  create: async (data) => {
    if (isBackendMode()) return apiFetch("POST", "/vehicles", data);
    const vehicles = localDB.get("vehicles");
    const newVehicle = { ...data, id: generateId() };
    localDB.set("vehicles", [...vehicles, newVehicle]);
    return newVehicle;
  },

  /**
   * PUT /api/vehicles/:id
   * Atualiza um veículo existente.
   * Body: { plate?, model?, year?, status? }
   * Resposta esperada: { id, plate, model, year, status }
   */
  update: async (id, data) => {
    if (isBackendMode()) return apiFetch("PUT", `/vehicles/${id}`, data);
    const vehicles = localDB.get("vehicles");
    const updated = vehicles.map((v) => (v.id === id ? { ...v, ...data } : v));
    localDB.set("vehicles", updated);
    return updated.find((v) => v.id === id);
  },

  /**
   * DELETE /api/vehicles/:id
   * Remove um veículo pelo ID.
   * Resposta esperada: { success: true }
   */
  delete: async (id) => {
    if (isBackendMode()) return apiFetch("DELETE", `/vehicles/${id}`);
    const vehicles = localDB.get("vehicles");
    localDB.set("vehicles", vehicles.filter((v) => v.id !== id));
    return { success: true };
  },
};

// ============================================================
// MOTORISTAS
// ============================================================

export const driversApi = {
  /**
   * GET /api/drivers
   * Retorna lista de todos os motoristas.
   * Resposta esperada: Array<{ id, name, cnh, status, vehicle_id }>
   */
  list: async () => {
    if (isBackendMode()) return apiFetch("GET", "/drivers");
    return localDB.get("drivers");
  },

  /**
   * POST /api/drivers
   * Cria um novo motorista.
   * Body: { name: string, cnh: string, status: string, vehicle_id?: string }
   * Resposta esperada: { id, name, cnh, status, vehicle_id }
   */
  create: async (data) => {
    if (isBackendMode()) return apiFetch("POST", "/drivers", data);
    const drivers = localDB.get("drivers");
    const newDriver = { ...data, id: generateId() };
    localDB.set("drivers", [...drivers, newDriver]);
    return newDriver;
  },

  /**
   * PUT /api/drivers/:id
   * Atualiza um motorista existente.
   * Body: { name?, cnh?, status?, vehicle_id? }
   * Resposta esperada: { id, name, cnh, status, vehicle_id }
   */
  update: async (id, data) => {
    if (isBackendMode()) return apiFetch("PUT", `/drivers/${id}`, data);
    const drivers = localDB.get("drivers");
    const updated = drivers.map((d) => (d.id === id ? { ...d, ...data } : d));
    localDB.set("drivers", updated);
    return updated.find((d) => d.id === id);
  },

  /**
   * DELETE /api/drivers/:id
   * Remove um motorista pelo ID.
   * Resposta esperada: { success: true }
   */
  delete: async (id) => {
    if (isBackendMode()) return apiFetch("DELETE", `/drivers/${id}`);
    const drivers = localDB.get("drivers");
    localDB.set("drivers", drivers.filter((d) => d.id !== id));
    return { success: true };
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
   *                            distance_km, fuel_liters, cost, date }>
   */
  list: async () => {
    if (isBackendMode()) return apiFetch("GET", "/trips");
    return localDB.get("trips");
  },

  /**
   * POST /api/trips
   * Registra uma nova viagem.
   * Body: { vehicle_id: string, driver_id: string, origin: string,
   *         destination: string, distance_km: number, fuel_liters: number,
   *         cost: number, date: string (ISO) }
   * Resposta esperada: { id, vehicle_id, driver_id, origin, destination,
   *                      distance_km, fuel_liters, cost, date }
   */
  create: async (data) => {
    if (isBackendMode()) return apiFetch("POST", "/trips", data);
    const trips = localDB.get("trips");
    const newTrip = { ...data, id: generateId() };
    localDB.set("trips", [...trips, newTrip]);
    return newTrip;
  },

  /**
   * DELETE /api/trips/:id
   * Remove uma viagem pelo ID.
   * Resposta esperada: { success: true }
   */
  delete: async (id) => {
    if (isBackendMode()) return apiFetch("DELETE", `/trips/${id}`);
    const trips = localDB.get("trips");
    localDB.set("trips", trips.filter((t) => t.id !== id));
    return { success: true };
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
    // Fallback: calcula localmente
    const vehicles = localDB.get("vehicles");
    const drivers = localDB.get("drivers");
    const trips = localDB.get("trips");
    return {
      total_vehicles: vehicles.length,
      active_vehicles: vehicles.filter((v) => v.status === "ativo").length,
      total_drivers: drivers.length,
      active_drivers: drivers.filter((d) => d.status === "ativo").length,
      total_trips: trips.length,
      total_cost: trips.reduce((s, t) => s + (t.cost || 0), 0),
    };
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
   *       distance_km, fuel_liters, cost, date
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
            trips.reduce((s, t) => s + (t.distance_km || 0), 0) /
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
