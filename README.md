# FleetSense

![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Backend](https://img.shields.io/badge/backend-Flask%20%2B%20PostgreSQL-000000?style=for-the-badge&logo=flask&logoColor=white)
![IA](https://img.shields.io/badge/IA-Assistente%20de%20Frota-0F766E?style=for-the-badge)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-2563EB?style=for-the-badge)

FleetSense é uma plataforma inteligente de gestão de frotas desenvolvida para a Residência Tecnológica do Porto Digital. O projeto organiza dados operacionais de veículos, motoristas, viagens, custos e manutenção em uma interface web única, com apoio de Inteligência Artificial para acelerar consultas, apoiar a tomada de decisão e gerar insights sobre a operação.

O problema que o sistema resolve é o da dispersão de informação: em vez de consultar planilhas, sistemas isolados ou relatórios manuais, a equipe acessa uma camada centralizada que combina dados da frota com automações baseadas em IA.

Projeto em nuvem: https://fleet-sense-swart.vercel.app/

## Visão Geral

- Frontend construído em React com Vite.
- Integração com backend Python Flask e banco PostgreSQL.
- Chat inteligente para consultas sobre a frota.
- Base para análise de custos, consumo e manutenção preventiva.
- Sessão autenticada com token salvo no navegador quando o backend está habilitado.

## Stack

- Frontend: React 18, Vite, Tailwind CSS, React Router DOM, React Query.
- Backend: Python, Flask, PostgreSQL.
- IA: camada de chat e análise processada no backend, com provedor configurável por ambiente.

## Pré-requisitos

Antes de executar o projeto localmente, instale:

- Node.js 18 ou superior.
- npm 9 ou superior.
- Backend FleetSense em execução, se você quiser usar login, CRUD remoto e IA.

Se o backend ainda não estiver disponível, o frontend pode abrir em modo local para partes não dependentes da API, mas o chat de IA e as rotas remotas não funcionarão.

## Guia de Implantação Local

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd FleetSense
```

### 2. Instalar dependências do frontend

```bash
npm install
```

### 3. Criar o arquivo de ambiente

Copie o exemplo e ajuste os valores. No Windows:

```bash
copy .env.example .env
```

Em macOS/Linux:

```bash
cp .env.example .env
```

### 4. Configurar as variáveis de ambiente

Edite o arquivo `.env` com a URL real do backend.

### 5. Executar a aplicação

```bash
npm run dev
```

Abra a URL informada pelo Vite, normalmente `http://localhost:5173`.

### 6. Gerar build de produção

```bash
npm run build
```

### 7. Pré-visualizar o build

```bash
npm run preview
```

## Variáveis de Ambiente (.env)

O frontend usa apenas a URL base do backend em tempo de build/execution do Vite. As chaves da IA normalmente ficam no backend Flask, não no navegador.

### Frontend

```env
VITE_API_URL=http://localhost:8000
VITE_APP_TITLE=FleetSense
```

### Backend Flask e IA

Use este bloco como referência para o serviço Python que processa a IA:

```env
FLASK_ENV=development
FLASK_DEBUG=1
DATABASE_URL=postgresql://usuario:senha@localhost:5432/fleetsense

OPENAI_API_KEY=[sua_chave_aqui]
OPENAI_MODEL=gpt-4o

# Alternativas, se o backend usar outro provedor de IA
LANGCHAIN_API_KEY=[sua_chave_aqui]
LOCAL_LLM_URL=[url_do_modelo_local]
```

Observação: se o seu backend usar outro provedor, substitua os nomes acima pelos nomes reais do seu serviço. O frontend não lê essas chaves diretamente.

## Implantação na Vercel

Se o frontend for publicado na Vercel, use:

- Root Directory: `FleetSense`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable: `VITE_API_URL` apontando para o backend publicado
- URL pública do projeto: https://fleet-sense-swart.vercel.app/

Exemplo:

```env
VITE_API_URL=https://seu-backend-exemplo.com
```

## Documentação de Integrações de IA

O frontend não executa o modelo de IA diretamente. Ele apenas coleta o contexto da frota e envia as solicitações para o backend Flask, que fica responsável por consultar o provedor de IA, montar a resposta e devolvê-la ao navegador.

### Fluxo técnico

1. O usuário acessa a página de chat no frontend.
2. O frontend carrega o contexto operacional da frota com consultas para veículos, motoristas e viagens.
3. A camada `src/lib/api.js` centraliza as chamadas HTTP e usa `VITE_API_URL` como base.
4. O chat chama `GET /chat` para mensagem inicial e `POST /chat` para perguntas do usuário.
5. O backend recebe a mensagem, adiciona o contexto necessário e encaminha a requisição ao serviço de IA configurado.
6. A resposta volta em JSON e é renderizada no frontend com suporte a Markdown.

### Contrato esperado pelo frontend

O frontend aceita respostas em formatos como:

```json
{
  "reply": "Texto final da IA"
}
```

ou variações equivalentes com `message`, `mensagem` ou um objeto aninhado em `data`.

### Contexto enviado para IA

O chat usa dados operacionais da frota como contexto para melhorar as respostas:

- veículos cadastrados;
- motoristas ativos e inativos;
- viagens registradas;
- custos e métricas agregadas;
- histórico de conversa quando disponível no backend.

### Serviço de IA utilizado

Como a integração real de IA é processada no backend Flask, este repositório documenta o uso do serviço de forma contratual. Preencha abaixo com a tecnologia oficial do seu deploy final:

- Provedor de IA: [Inserir provedor aqui, por exemplo OpenAI GPT-4o, LangChain, modelo local, etc.]
- Endpoint principal: `POST /chat`
- Objetivo: gerar respostas operacionais, apoiar análise de custos e oferecer sugestões sobre manutenção preventiva.

## Engenharia de Prompt

A qualidade do sistema depende do prompt usado no backend para orientar o agente de IA. O ideal é separar instruções de sistema, contexto dinâmico e pergunta do usuário.

### System Prompt principal

```text
[Inserir prompt aqui]
```

### Estrutura recomendada do prompt

```text
Você é o assistente inteligente do FleetSense.

Objetivo:
- responder perguntas sobre a frota com clareza e objetividade;
- apoiar análise de custos, consumo, manutenção e disponibilidade;
- priorizar respostas curtas quando a pergunta for direta.

Contexto disponível:
- lista de veículos;
- lista de motoristas;
- histórico de viagens;
- indicadores consolidados de custo e consumo;
- histórico de mensagens quando houver.

Regras:
- responda em português do Brasil;
- quando houver dados insuficientes, explique a limitação;
- use Markdown simples quando isso melhorar a leitura;
- não invente números nem veículos inexistentes;
- sugira ações práticas quando houver anomalias ou custos altos.

[Inserir prompt aqui]
```

### Prompt de contexto

Recomenda-se montar o contexto com os dados mais recentes da API antes de chamar o modelo:

```text
Veículos: [dados do backend]
Motoristas: [dados do backend]
Viagens: [dados do backend]
Pergunta do usuário: [mensagem atual]
```

### Prompt de resposta

Regras de saída sugeridas:

- retornar uma resposta objetiva;
- destacar alertas de consumo, custo ou manutenção;
- quando necessário, sugerir ação operacional;
- manter o texto pronto para renderização em Markdown.

## Estrutura do Projeto

```text
FleetSense/
├── src/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── BACKEND_ROUTES.md
├── PROJECT_DOCUMENTATION.md
├── vite.config.js
└── package.json
```

## Principais Arquivos

- `src/lib/api.js`: camada central de acesso à API e ao chat de IA.
- `src/lib/AuthContext.jsx`: controle de autenticação e sessão.
- `src/pages/Chat.jsx`: interface do assistente de frota.
- `BACKEND_ROUTES.md`: contrato esperado entre frontend e backend.
- `PROJECT_DOCUMENTATION.md`: documentação geral do projeto.

## Troubleshooting

- Se o frontend abrir sem dados, verifique se `VITE_API_URL` está apontando para o backend correto.
- Se o chat retornar erro de rede, confirme se o backend Flask está online e se a rota de IA está habilitada.
- Se a autenticação falhar, valide se o backend retorna token na resposta do login e se a sessão foi salva em `fleetsense_auth_session`.
- Se estiver publicando na Vercel, confirme que o diretório raiz é `FleetSense` e que o build termina em `dist`.

## Licença

Projeto acadêmico desenvolvido para a Residência Tecnológica do Porto Digital. Ajuste esta seção conforme a política de licenciamento adotada pelo grupo.