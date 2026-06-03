**Visão Geral**

- **O que é o FleetSense:** uma plataforma que ajuda empresas a cuidar da sua frota de veículos reunindo informações importantes em um só lugar.
- **Conceito central:** transformar dados da frota em informação útil — mostrar o que está funcionando, o que precisa de atenção e onde é possível economizar.
- **Para que serve:** permitir que gestores acompanhem veículos e motoristas, planejem manutenções, identifiquem desperdício de combustível e gerem relatórios simples para decisões mais rápidas.
- **Benefícios:** reduzir custos, aumentar a disponibilidade dos veículos, melhorar a segurança e organizar o trabalho das equipes de manutenção e logística.
- **Público-alvo:** empresas com frotas (logística, entrega, serviços), gestores de operações e equipes de manutenção.

**Tecnologias Principais**

-- **Frontend:** React 18, Vite
-- **Estilização:** Tailwind CSS
-- **Gerenciamento de estado/consulta:** @tanstack/react-query
-- **Formulários:** react-hook-form
-- **Roteamento:** react-router-dom

**Estrutura do Projeto**

- **Páginas principais:** [src/pages/Dashboard.jsx](src/pages/Dashboard.jsx#L1), [src/pages/Drivers.jsx](src/pages/Drivers.jsx#L1), [src/pages/Vehicles.jsx](src/pages/Vehicles.jsx#L1), [src/pages/Reports.jsx](src/pages/Reports.jsx#L1), [src/pages/Login.jsx](src/pages/Login.jsx#L1)
- **Componentes reutilizáveis:** [src/components/ui](src/components/ui#L1) (biblioteca de componentes UI e primitives)
- **Layouts e navegação:** [src/components/layout/AppLayout.jsx](src/components/layout/AppLayout.jsx#L1), [src/components/layout/Sidebar.jsx](src/components/layout/Sidebar.jsx#L1)
- **Formulários e tabelas:** [src/components/drivers/DriverForm.jsx](src/components/drivers/DriverForm.jsx#L1), [src/components/drivers/DriverTable.jsx](src/components/drivers/DriverTable.jsx#L1), [src/components/vehicles/VehicleForm.jsx](src/components/vehicles/VehicleForm.jsx#L1), [src/components/vehicles/VehicleTable.jsx](src/components/vehicles/VehicleTable.jsx#L1)
- **Lib e utilitários:** [src/lib/api.js](src/lib/api.js#L1), [src/lib/AuthContext.jsx](src/lib/AuthContext.jsx#L1), [src/lib/query-client.js](src/lib/query-client.js#L1), [src/lib/utils.js](src/lib/utils.js#L1)

**O que cada parte faz**

- **Dashboard:** Visualiza métricas da frota (consumo, status, gráficos). Ver: [src/pages/Dashboard.jsx](src/pages/Dashboard.jsx#L1)
- **Drivers:** CRUD de motoristas e tabela/listagem. Ver: [src/pages/Drivers.jsx](src/pages/Drivers.jsx#L1)
- **Vehicles:** CRUD de veículos e tabelas de consulta. Ver: [src/pages/Vehicles.jsx](src/pages/Vehicles.jsx#L1)
- **Reports:** Geração de relatórios e formulários para filtros. Ver: [src/pages/Reports.jsx](src/pages/Reports.jsx#L1)
- **Chat:** Componente de comunicação interna entre usuários. Ver: [src/pages/Chat.jsx](src/pages/Chat.jsx#L1)

**Como rodar localmente**

- **Pré-requisitos:** Node.js (>=16) e npm ou yarn.
- **Instalar dependências:**

```bash
npm install
```

- **Iniciar em modo de desenvolvimento:**

```bash
npm run dev
```

- **Build para produção:**

```bash
npm run build
```

- **Servir build localmente (preview):**

```bash
npm run preview
```

- **Scripts adicionais:** `lint`, `lint:fix`, `typecheck`.

**Configurações importantes**

- Arquivo de configuração do Vite: [vite.config.js](vite.config.js#L1)
- Tailwind: [tailwind.config.js](tailwind.config.js#L1)
- Parâmetros da aplicação: [src/lib/app-params.js](src/lib/app-params.js#L1)

**Como contribuir**

- Criar branch a partir de `main` com nome descritivo.
- Rodar `npm install` e `npm run dev` localmente.
- Seguir padrões de lint e rodar `npm run lint` antes do PR.

**Próximos passos recomendados**

- Documentar as rotas de backend em [BACKEND_ROUTES.md](BACKEND_ROUTES.md#L1).
- Adicionar exemplos de payloads nas chamadas de API em [src/lib/api.js](src/lib/api.js#L1).
- Incluir um CONTRIBUTING.md com guidelines de PR e commit.

**Arquivo criado**

Documentação gerada e salva em: [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md#L1)
