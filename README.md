# RISYS - Sistema de Gestão Escolar

Sistema modular de gestão escolar desenvolvido com React + Node.js + PostgreSQL.

## 🚀 Stack Tecnológica

### Frontend
- **React 18** + **Vite** - Build ultra-rápido
- **TypeScript** - Tipagem estática
- **TailwindCSS 3.4** - Design system customizado
- **Zustand** - State management
- **TanStack React Query** - Server state e cache
- **Framer Motion** - Animações elegantes
- **Lucide Icons** - Ícones modernos
- **React Router 6** - Navegação SPA
- **React Hook Form** - Formulários
- **Axios** - Cliente HTTP
- **Socket.io Client** - Real-time

### Backend
- **Node.js 18+** + **Express.js**
- **TypeScript** - Tipagem estática
- **Prisma ORM** - Database toolkit
- **PostgreSQL 15+** - Banco de dados
- **Redis** + **BullMQ** - Filas e cache
- **Socket.io** - WebSockets
- **JWT** - Autenticação stateless
- **Zod** - Validação de schemas
- **OpenAI GPT-4** - Análise de documentos
- **Resend** - Emails transacionais
- **Supabase Storage** - Armazenamento de arquivos

## 📦 Módulos

| Módulo | Descrição |
|--------|-----------|
| **Communication** | Chat, canais, mensagens diretas e tickets de suporte |
| **Procurement** | Requisições de compra com fluxo de aprovação |
| **Assets** | Gestão de patrimônio, QR codes e inventário |
| **CRM** | Pipeline de leads e processo de admissão |
| **GED** | Gestão eletrônica de documentos com AI |
| **Admin** | Usuários, configurações e auditoria |

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+
- Redis

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/risys.git
cd risys
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de template e configure suas credenciais:

```bash
# Backend
cp backend/env-template.txt backend/.env
```

### 4. Execute as migrações do banco
```bash
npm run db:migrate
npm run db:seed
```

### 5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173` e a API em `http://localhost:3001`.

## 👤 Credenciais de Demo

Após executar o seed:

| Email | Senha | Role |
|-------|-------|------|
| admin@risys.app | admin123 | Administrador |
| manager@risys.app | demo123 | Gestor |
| teacher@risys.app | demo123 | Professor |
| it@risys.app | demo123 | TI |
| finance@risys.app | demo123 | Financeiro |
| admissions@risys.app | demo123 | Admissões |

## 📁 Estrutura do Projeto

```
risysproject/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Schema do banco
│   │   └── seed.ts          # Dados iniciais
│   └── src/
│       ├── config/          # Configurações
│       ├── controllers/     # Controladores
│       ├── middlewares/     # Middlewares
│       ├── routes/          # Rotas da API
│       ├── services/        # Serviços
│       ├── socket/          # WebSocket
│       ├── types/           # Tipos TypeScript
│       ├── utils/           # Utilitários
│       └── server.ts        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── layouts/         # Layouts
│   │   ├── lib/             # API client e utils
│   │   ├── pages/           # Páginas
│   │   ├── stores/          # Zustand stores
│   │   ├── styles/          # CSS global
│   │   ├── App.tsx          # Componente raiz
│   │   └── main.tsx         # Entry point
│   ├── index.html
│   └── tailwind.config.js
├── package.json             # Workspace root
└── README.md
```

## 🎨 Design System

### Paleta de Cores
- **Primary**: `#0aacce` → `#006685`
- **Neutral**: Tons de cinza
- **Success**: Verde
- **Warning**: Amarelo/Laranja
- **Error**: Vermelho

### Tipografia
- **Sans**: Inter
- **Mono**: JetBrains Mono

## 🔒 Sistema de Permissões

| Nível | Código | Permissões |
|-------|--------|------------|
| Visualização | VIEW | Apenas leitura |
| Edição | EDIT | Criar e editar |
| Administração | ADMIN | Todas as operações |

## 🌍 Internacionalização

O sistema suporta:
- 🇧🇷 Português (pt)
- 🇺🇸 English (en)

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev           # Inicia frontend e backend
npm run dev:frontend  # Apenas frontend
npm run dev:backend   # Apenas backend

# Build
npm run build         # Build de produção

# Banco de Dados
npm run db:migrate    # Executa migrações
npm run db:generate   # Gera Prisma Client
npm run db:seed       # Popula com dados iniciais
npm run db:studio     # Abre Prisma Studio
```

## 🧪 Testes E2E (frontend)

A onda 1 instalou Playwright no workspace `frontend/`. A onda 2.5 amplia a
cobertura para os três formulários públicos: admissão, matrícula e
rematrícula.

```bash
cd frontend
npm run test:e2e:install      # baixa o navegador Chromium (uma vez)
npm run dev                   # em outro terminal, sobe o dev server (5173)
npm run test:e2e              # roda os 3 specs (smoke + happy-path stubs)
```

Os smokes validam que `/admissions/apply`, `/enrollment/apply` e
`/re-enrollment/:token` montam (sem dependência do backend). Os blocos
de happy path completos só rodam quando as variáveis abaixo estão
presentes:

```bash
E2E_ADMISSION_TOKEN=<token>      # admissão
E2E_ENROLLMENT_TOKEN=<token>     # matrícula (precisa também de LEAD_ID)
E2E_ENROLLMENT_LEAD_ID=<leadId>
E2E_REENROLLMENT_TOKEN=<token>   # rematrícula
npm run test:e2e
```

A onda 2.5 mantém o preenchimento step-by-step como TODO; a estrutura
está pronta para a onda 3 ligar cada step incrementalmente sem alterar
os specs já no repositório.

### Testes unitários frontend

A onda 2.5 instalou Vitest + Testing Library no `frontend/`. Os primeiros
specs cobrem os validadores de step do formulário de matrícula:

```bash
cd frontend
npm run test                # 23 testes em ~600ms
npm run test:watch          # modo dev
npm run test:coverage       # relatório de cobertura
```

## 🔁 Fluxo de Rematrícula — Validação Local

A rematrícula cobre o ciclo completo: criação de campanha, envio de convites,
confirmação da família, aprovação de documentos, geração e assinatura de
contrato, registro de taxa e migração do aluno para o ano letivo seguinte.

### 1. Subir dados de teste

```bash
cd backend
npm run seed:rematricula            # cria período + alunos + convites
npm run seed:rematricula -- --clean # remove o seed anterior e recria
```

O seed cria:
- 1 período `OPEN` no ano letivo seguinte com 4 séries elegíveis e reajuste 5%.
- `PeriodPriceTable` com valor anual e taxa de matrícula por série.
- 8 alunos (5 com `Lead` ativo do ano anterior, 3 sem contrato próprio)
  cobrindo os cenários ADIMPLENTE, INADIMPLENTE e SEM_CONTRATO.
- 8 convites distribuídos entre todos os `gateStatus`
  (CONVITE_ENVIADO → REMATRICULADO + RECUSADO).

Registros de seed são identificáveis pelo prefixo `[E2E]` em `Lead.familyName`
e por `Student.code` iniciando com `E2E-`.

### 2. URLs para auditar manualmente

| Rota | O que validar |
|------|----------------|
| `/crm/re-enrollments` | Kanban com 7 colunas povoadas, stat cards corretos, drawer "Novo convite" |
| `/crm/re-enrollments/:periodId` | Aba Pré-Rematrícula: 5 cards de stats, AdjustmentConfig, PriceTableEditor |
| `/crm/re-enrollments/periods` | Barra de progresso reflete só REMATRICULADO sobre total |
| `/crm/re-enrollments/invites/:id` | Pipeline strip, abas Resumo/Documentos/Contrato/Pagamento |
| `/re-enrollment/:token` | Formulário público de rematrícula (token vem do invite) |
| `/public/pre-reenrollment/:token` | Resposta pública AGREED / DISAGREED / NEGOTIATING |

### 3. Verificar e-mail em desenvolvimento

Sem `RESEND_API_KEY` configurada, os envios são logados pelo serviço.
Para inspecionar envios reais, configure `RESEND_API_KEY` no `.env` do backend.

### 4. Limpeza

```bash
cd backend
npm run seed:rematricula -- --clean   # recria do zero
```

Para apenas remover (sem recriar), edite o seed e comente as funções `create*`
ou execute o script `clean-imported-reenrollment.ts` se aplicável.

## 📄 Licença

Este projeto é proprietário e confidencial.

---

Desenvolvido com ❤️ para a gestão escolar moderna.
