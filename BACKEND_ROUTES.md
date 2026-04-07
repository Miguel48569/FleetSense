# Documentação de Rotas do Backend - FleetSense

Esta documentação descreve todas as rotas que o backend precisa implementar para que o frontend do FleetSense funcione corretamente. 

O frontend já está configurado para consumir estas rotas na camada de API (`src/lib/api.js`).

## Configuração Base

Todas as requisições do frontend são feitas para a URL base definida na variável de ambiente `VITE_API_URL`. O backend deve responder com dados no formato JSON.

---

## 1. Veículos

### `GET /vehicles`
Retorna a lista de todos os veículos cadastrados.

**Resposta de Sucesso (200 OK):**
```json
[
  {
    "id": "string ou number",
    "plate": "ABC-1234",
    "model": "Toyota Hilux",
    "year": 2024,
    "status": "ativo" // "ativo", "inativo" ou "manutencao"
  }
]
```

### `POST /vehicles`
Cadastra um novo veículo.

**Corpo da Requisição:**
```json
{
  "plate": "ABC-1234",
  "model": "Toyota Hilux",
  "year": 2024,
  "status": "ativo"
}
```

**Resposta de Sucesso (201 Created):**
Retorna o objeto do veículo criado, incluindo o `id` gerado pelo banco.

### `DELETE /vehicles/:id`
Remove um veículo do sistema.

**Resposta de Sucesso (200 OK):**
```json
{
  "success": true
}
```

---

## 2. Motoristas

### `GET /drivers`
Retorna a lista de todos os motoristas cadastrados.

**Resposta de Sucesso (200 OK):**
```json
[
  {
    "id": "string ou number",
    "name": "João da Silva",
    "cnh": "12345678900",
    "status": "ativo", // "ativo" ou "inativo"
    "vehicle_id": "id_do_veiculo_ou_vazio" 
  }
]
```

### `POST /drivers`
Cadastra um novo motorista.

**Corpo da Requisição:**
```json
{
  "name": "João da Silva",
  "cnh": "12345678900",
  "status": "ativo",
  "vehicle_id": "id_do_veiculo" // Opcional
}
```

**Resposta de Sucesso (201 Created):**
Retorna o objeto do motorista criado, incluindo o `id` gerado.

### `DELETE /drivers/:id`
Remove um motorista do sistema.

**Resposta de Sucesso (200 OK):**
```json
{
  "success": true
}
```

---

## 3. Viagens e Relatórios

### `GET /trips`
Retorna a lista de todas as viagens registradas.

**Resposta de Sucesso (200 OK):**
```json
[
  {
    "id": "string ou number",
    "vehicle_id": "id_do_veiculo",
    "driver_id": "id_do_motorista",
    "origin": "São Paulo, SP",
    "destination": "Campinas, SP",
    "distance_km": 120.5,
    "fuel_liters": 12.0,
    "cost": 65.90,
    "date": "2026-04-02" // Formato YYYY-MM-DD
  }
]
```

### `POST /trips`
Registra uma nova viagem.

**Corpo da Requisição:**
```json
{
  "vehicle_id": "id_do_veiculo",
  "driver_id": "id_do_motorista",
  "origin": "São Paulo, SP",
  "destination": "Campinas, SP",
  "distance_km": 120.5,
  "fuel_liters": 12.0,
  "cost": 65.90,
  "date": "2026-04-02"
}
```

**Resposta de Sucesso (201 Created):**
Retorna o objeto da viagem criada, incluindo o `id` gerado.

### `DELETE /trips/:id`
Remove uma viagem do sistema.

**Resposta de Sucesso (200 OK):**
```json
{
  "success": true
}
```

---

## 4. Inteligência Artificial (Chat)

Esta é a rota principal para o time de IA implementar. Ela recebe a pergunta do usuário e o contexto atual da frota para gerar uma resposta.

### `POST /ai/chat`
Processa uma pergunta do usuário e retorna a resposta gerada pela IA.

**Corpo da Requisição:**
```json
{
  "message": "Qual veículo tem maior consumo?",
  "context": {
    "vehicles": [ /* Array com todos os veículos */ ],
    "drivers": [ /* Array com todos os motoristas */ ],
    "trips": [ /* Array com todas as viagens */ ]
  },
  "history": [
    {
      "role": "user",
      "content": "Olá"
    },
    {
      "role": "assistant",
      "content": "Olá! Como posso ajudar com a sua frota hoje?"
    }
  ]
}
```

**Resposta de Sucesso (200 OK):**
```json
{
  "reply": "O veículo com maior consumo é a Toyota Hilux (BRA-2E19), com média de 8.5 km/L nas últimas viagens registradas."
}
```

*Nota: O campo `reply` suporta formatação em Markdown, então a IA pode retornar tabelas, listas e texto em negrito.*
