---
name: geovendas360
description: "Architectural knowledge base for the CRM360 ecosystem — 11 integrated projects across 5 stacks. Use when working on geovendas-vue, geovendas-vaadin23, geochat-api, geovendas-dotnet/Comm, or any CRM360 project. Covers backend Java (Spring Boot), frontends (Vue.js 2, Vaadin 6/23), WhatsApp middleware (.NET), and Evolution API (Node.js)."
---

# Geovendas360 - CRM360 Workspace

> **Skill de compreensão arquitetural completa do ecossistema CRM360**
> Versão: 2.0 | Última atualização: 2026-01-22

## Índice
1. [Visão Geral do Ecossistema](#1-visão-geral-do-ecossistema)
2. [Backend Java - Camada Compartilhada](#2-backend-java---camada-compartilhada)
3. [Frontends Multi-Stack](#3-frontends-multi-stack)
4. [Serviços de Comunicação](#4-serviços-de-comunicação)
5. [Pontos de Integração Críticos](#5-pontos-de-integração-críticos)
6. [Padrões Arquiteturais](#6-padrões-arquiteturais)
7. [Troubleshooting Multi-Stack](#7-troubleshooting-multi-stack)

---

## 1. Visão Geral do Ecossistema

### 1.1 Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CRM360 WORKSPACE                              │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ↓           ↓           ↓
            ┌───────────┐  ┌─────────┐  ┌──────────┐
            │ Frontends │  │ Backend │  │   Comm   │
            └─────┬─────┘  └────┬────┘  └────┬─────┘
                  │             │            │
     ┌────────────┼─────┐       │            │
     ↓            ↓     ↓       ↓            ↓
┌─────────┐ ┌────────┐ ┌────┐ ┌─┴──┐ ┌────────────┐
│Vue.js 2 │ │Vaadin6 │ │V23 │ │Java│ │  .NET 8    │
│  (SPA)  │ │(Legacy)│ │(New)│ │Libs│ │(WhatsApp)  │
└────┬────┘ └────┬───┘ └─┬──┘ └─┬──┘ └─────┬──────┘
     │           │       │      │           │
     └───────────┴───────┴──────┴───────────┘
                         ↓
              ┌──────────────────────┐
              │  PostgreSQL/MySQL    │
              │  RabbitMQ            │
              │  Redis               │
              │  AWS S3              │
              └──────────────────────┘
```

### 1.2 Projetos do Workspace (CRM360.code-workspace)

| # | Projeto | Stack | Propósito | Status |
|---|---------|-------|-----------|--------|
| 1 | **geochat-api** | Node.js 20 + TypeScript | API WhatsApp multi-provider (Evolution API) | ✅ Ativo |
| 2 | **geovendas-vue** | Vue.js 2 + TypeScript | Frontend CRM moderno (SPA) | ✅ Ativo |
| 3 | **geovendas-vaadin6** | Vaadin 6 + Java 8 | Frontend CRM legacy (server-side) | ✅ Legacy ativo |
| 4 | **Comm** | .NET 8 + C# | Middleware WhatsApp centralizado | ✅ Ativo |
| 5 | **ibtech-geovendas** | Vaadin 23 + Java 17 | Frontend CRM moderno (Vaadin Flow) | ✅ Novo padrão |
| 6 | **geovendas-entity** | Java 17 + JPA | Entidades de domínio compartilhadas | ✅ Biblioteca |
| 7 | **geovendas-service** | Java 17 + Spring | Serviços de negócio compartilhados | ✅ Biblioteca |
| 8 | **geovendas-repository** | Java 17 + Spring Data | Repositories compartilhados | ✅ Biblioteca |
| 9 | **geovendas-utils** | Java 17 | Utilitários gerais | ✅ Biblioteca |
| 10 | **geovendas-java17-lib** | Java 17 + Vaadin 23 | Componentes Vaadin + Helpers | ✅ Biblioteca |
| 11 | **geovendas-view-crm** | Vaadin 23 + Java 17 | Componentes CRM especializados | ✅ Biblioteca |

### 1.3 Fluxo de Dados Principal

```
┌──────────────────────────────────────────────────────────────────┐
│ FLUXO DE COMUNICAÇÃO WHATSAPP                                    │
└──────────────────────────────────────────────────────────────────┘

WhatsApp (Dialog360/JoinDev)
         ↓
    Comm (.NET)
    ├─ Processa webhook
    ├─ Armazena em PostgreSQL
    └─ Enfileira em RabbitMQ
         ↓
    geochat-api (Node.js)
    ├─ Consome fila
    ├─ Processa chatbots (OpenAI, Typebot, etc)
    └─ Emite webhooks
         ↓
    Geovendas Backend (Java)
    ├─ Sincroniza com CRM
    └─ Notifica via WebSocket
         ↓
    Frontend (Vue.js / Vaadin)
    └─ Atualiza UI em tempo real
```

---

## 2. Backend Java - Camada Compartilhada

### 2.1 Arquitetura em 3 Camadas

```
┌──────────────────────────────────────────────┐
│           APLICAÇÕES CONSUMIDORAS            │
│  (geovendas-vaadin6, ibtech-geovendas, etc)  │
└───────────────────┬──────────────────────────┘
                    │ imports
        ┌───────────┼──────────┐
        ↓           ↓          ↓
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│geovendas-    │ │geovendas-   │ │geovendas-    │
│ service      │←│ repository  │←│ entity       │
│              │ │             │ │              │
│Business Logic│ │Data Access  │ │Domain Models │
└──────┬───────┘ └──────┬──────┘ └──────┬───────┘
       │                │               │
       └────────────────┴───────────────┘
                        ↓
                 ┌──────────────┐
                 │geovendas-    │
                 │ utils        │
                 │              │
                 │Shared Utils  │
                 └──────────────┘
```

### 2.2 geovendas-entity (Domain Layer)

**Localização**: `geovendas-entity/`

**Propósito**: Entidades JPA (mapeamento objeto-relacional)

**Estrutura Conceitual**:
```
com.geovendas.entity/
├── core/entity/
│   ├── AbstractEntity          # Base com ID, auditoria
│   └── GeoAbstractEntity       # Extensão com campos geo
└── common/entity/
    ├── crm/                    # CRM: prospects, contatos, emails
    ├── ga/                     # Google Analytics
    ├── notification/           # Notificações
    └── [outros domínios]
```

**Características**:
- **JPA/Hibernate 5.6.15**: Mapeamento OR
- **Auditoria automática**: JaVers 6.6.5 (tracking de mudanças)
- **AbstractEntity**: ID auto-generated + campos de auditoria (usuario_inclusao, data_inclusao, etc)
- **Relacionamentos**: @ManyToOne, @OneToMany, @ManyToMany
- **Conversores customizados**: Para tipos complexos

**Exemplo de Entidade**:
- `CRMProspectEntity`: Mapeia tabela `crmprospect`, estende `GeoAbstractEntity`

### 2.3 geovendas-repository (Data Access Layer)

**Localização**: `geovendas-repository/`

**Propósito**: Repositórios Spring Data JPA (CRUD + queries customizadas)

**Estrutura Conceitual**:
```
com.geovendas.repository/
├── core/repository/
│   └── GeoJpaRepository<T>     # Interface base genérica
└── common/repository/
    ├── crm/                    # 20+ repositories CRM
    ├── ga/                     # Google Analytics
    └── [outros domínios]
```

**Padrão**:
```java
interface CRMProspectRepository extends GeoJpaRepository<CRMProspectEntity> {
    // CRUD herdado de JpaRepository
    // Queries dinâmicas de JpaSpecificationExecutor

    @Query("HQL ou SQL nativo")
    Page<CRMProspectEntity> findByParams(..., Pageable pageable);
}
```

**Características**:
- **Spring Data JPA**: CRUD automático
- **JpaSpecificationExecutor**: Queries dinâmicas
- **Paginação**: Via `Pageable`
- **Queries customizadas**: @Query com HQL/SQL nativo

### 2.4 geovendas-service (Business Logic Layer)

**Localização**: `geovendas-service/`

**Propósito**: Lógica de negócio, orquestração de repositories

**Estrutura Conceitual**:
```
com.geovendas.service/
├── core/service/
│   ├── AbstractService<T>           # Base genérico
│   └── GeoAbstractService<T, R>     # Com repository injection
└── common/service/
    ├── crm/                         # 20+ services CRM
    ├── ga/                          # Google Analytics
    ├── http/                        # HttpService (REST calls)
    └── [outros domínios]
```

**Hierarquia**:
```
AbstractService<T>
    ↓
GeoAbstractService<T, R extends JpaRepository>
    ↓
CRMProspectService (específico)
```

**Operações Base Herdadas**:
- `findAll()`, `save(T)`, `update(T)`, `get(Long id)`, `delete(Long id)`
- `list(Pageable)`, `count()`

**Características**:
- **@Service**: Anotação Spring
- **Dependency Injection**: Constructor-based
- **Transações**: Gerenciadas por Spring
- **Integrações externas**: RDStation, HTTP calls, RabbitMQ

### 2.5 geovendas-utils (Shared Utilities)

**Localização**: `geovendas-utils/`

**Propósito**: Utilitários gerais compartilhados (sem dependências de geovendas)

**Estrutura Conceitual**:
```
com.geovendas.utils/
├── annotations/        # @Lock, etc
├── constants/          # Constantes
├── converters/         # Conversores
├── enums/              # Enumerações
├── exceptions/         # Exceções customizadas
├── formatters/         # Data, moeda, etc
├── helpers/            # Helpers gerais
├── log/                # LoggerProxy (SLF4J)
└── validators/         # Validadores
```

**Características**:
- **Sem dependências de domínio**: Reutilizável em qualquer projeto
- **Java 17**: Recursos modernos
- **Logging centralizado**: LoggerProxy

### 2.6 geovendas-java17-lib (Component Library)

**Localização**: `geovendas-java17-lib/`

**Propósito**: Biblioteca de componentes Vaadin + helpers avançados

**Estrutura Conceitual**:
```
com.geovendas.lib/
├── components/         # 13 subpacotes de componentes Vaadin
├── helpers/            # 21 helpers (VaadinHelper, AwsHelper, etc)
├── converters/         # Storage S3/MinIO converters
├── export/             # Excel, PDF, CSV
├── mail/               # Email (Apache Commons Email)
└── security/           # Spring Security utilities
```

**Características**:
- **Vaadin 23.3.13**: Componentes reutilizáveis
- **AWS S3 SDK**: AwsHelper
- **JasperReports**: Relatórios
- **Apache POI**: Excel
- **ModelMapper**: Mapeamento de objetos

### 2.7 Diagrama de Dependências Maven

```
geovendas-utils (sem dependências internas)
        ↓
geovendas-entity (+ utils)
        ↓
    ┌───┴────┐
    ↓        ↓
geovendas-  geovendas-java17-lib
repository  (+ entity + utils)
    ↓
geovendas-service
(+ repository + entity + utils)
        ↓
geovendas-view-crm
(+ service + java17-lib)
        ↓
ibtech-geovendas / geovendas-vaadin6
(aplicações consumidoras)
```

**Nota**: Todas as dependências com scope `provided` (não empacotadas no JAR).

---

## 3. Frontends Multi-Stack

### 3.1 geovendas-vue (Vue.js 2 - SPA Moderno)

**Localização**: `geovendas-vue/`

**Stack**:
- Vue.js 2.6.11 + Composition API
- TypeScript 4.1.5 (strict mode)
- Vuetify 2.6.14 (Material Design)
- Vuex 3.6.2 + vuex-persist
- inversify-props (Dependency Injection)
- class-transformer (Model mapping)

**Arquitetura**:
```
Components (UI)
    ↓ @inject()
Services (Business Logic - DI Singleton)
    ↓
HttpService (Axios + Bearer token)
    ↓
Backend REST API
```

**Módulos Principais**:
- **CRM**: 70 componentes (clientes, prospects, pedidos, atividades)
- **GeoChat**: Interface de chat omnichannel (WhatsApp, Email, Calls)
- **Call Center**: Fila de chamadas, atendimento
- **B2B**: Auditoria, estoque
- **Comissões**: Metas, análise

**Autenticação**:
- **URL-based**: Token via query params (`?token=...&apiUrl=...`)
- **AuthGuard**: Valida e injeta contexto em SessionService
- **Sem login tradicional**: Token embedded na URL

**Estado Global (Vuex)**:
```typescript
State {
  notifications: NotificationModel[]
  activeClient: ClientModel | null
  openConversation: ConversationModel | null
  contactNumber: string | null
  userContactInfo: UserContactInfo | null
}
```

**Comunicação Real-time**:
- **Socket.io**: WebSocket para eventos real-time
- Eventos: `message:received`, `conversation:updated`, `call:incoming`

**Localização de Código**:
- Views: `src/views/crm/`, `src/views/gc/`
- Components: `src/components/crm/`, `src/components/gc/`
- Services: `src/services/crm/`, `src/services/gc/`
- Models: `src/models/crm/`, `src/models/gc/`

### 3.2 geovendas-vaadin6 (Vaadin 6 - Legacy)

**Localização**: `geovendas-vaadin6/`

**Stack**:
- Vaadin 6.8.19 (server-side components)
- Java 1.8
- Gradle (build WAR)
- Hibernate (acesso direto a dados)

**Arquitetura**:
- **Monolítica server-side**: UI roda no servidor, cliente apenas renderiza
- **Sem separação clara frontend/backend**: Acesso direto a BD via Hibernate
- **Componentes Vaadin 6**: Button, Table, Window, etc (antigos)

**Propósito**:
- **Legacy em produção**: Clientes existentes ainda usam
- **Manutenção ativa**: Correções de bugs, ajustes
- **Versão**: 2026.4.9742 (formato: YYYY.V.BUILD)

**Estrutura**:
```
src/main/java/br/inf/ibtech/
├── IBTechApplication.java      # extends Vaadin Application
├── ui/                         # Componentes UI
│   ├── crm/
│   ├── b2b/
│   └── MainTab
├── res/                        # REST Resources (Jersey - secundário)
├── db/                         # Acesso direto a BD
└── services/                   # Serviços de negócio
```

**Integrações**:
- Redis (CRMRedisService)
- S3/IBM COS (armazenamento)
- Socket.IO (real-time)

### 3.3 ibtech-geovendas (Vaadin 23 - Novo Padrão)

**Localização**: `geovendas-vaadin24/ibtech-geovendas`

**Stack**:
- Vaadin 23.3.13 Flow (modern Web Components)
- Java 17
- Spring Boot 2.7.1
- Maven (build JAR)
- Vue.js (componentes customizados em `src/main/vue-app/`)

**Arquitetura**:
- **Vaadin Flow**: Server-rendered components + Web Components no cliente
- **Spring Boot integrado**: Acesso direto a Spring Data JPA
- **Sem REST explícito**: Vaadin Flow abstrai comunicação via WebSocket

**Propósito**:
- **Novo padrão da plataforma**: Substitui gradualmente Vaadin 6
- **Modernização**: Recursos avançados, melhor UX
- **Versão**: 1.0-SNAPSHOT (desenvolvimento ativo)

**Estrutura**:
```
src/main/java/com/geovendas/
├── Application.java            # Spring Boot + Vaadin Flow
├── components/                 # 67 componentes Vaadin Flow
│   ├── crm/
│   ├── b2b/
│   └── report/
├── service/                    # Serviços (importa geovendas-service)
├── repository/                 # Repositories (importa geovendas-repository)
└── entity/                     # Entities (importa geovendas-entity)
```

**Dependências Compartilhadas**:
- `geovendas-service` (1.2.0-SNAPSHOT)
- `geovendas-java17-lib` (1.0-SNAPSHOT)
- `geovendas-entity` (1.2.0-SNAPSHOT)
- `geovendas-repository` (1.2.0-SNAPSHOT)
- Todas com scope `provided`

**Comunicação**:
- **Vaadin Flow**: Estado sincronizado via WebSocket automático
- **HttpClient**: Para APIs externas (Geopodia, etc)

### 3.4 geovendas-view-crm (Component Library)

**Localização**: `geovendas-view-crm/`

**Stack**:
- Vaadin 23.3.13 Flow
- Java 17
- Maven (JAR library - não aplicação)

**Propósito**:
- **Biblioteca reutilizável**: Componentes CRM especializados
- **Importada por**: ibtech-geovendas e outras aplicações
- **Versão**: 1.2.0-SNAPSHOT

**Estrutura**:
```
src/main/java/com/geovendas/
├── components/crm/
│   ├── pr/                     # Processos CRM
│   │   ├── kanban/             # Visualização Kanban
│   │   ├── fluxo/              # Fluxos de trabalho
│   │   └── processo/           # Detalhes processo
│   └── wa/                     # WhatsApp integration
└── frontend/                   # TypeScript/Vue assets
```

**Comunicação**:
- **Não comunica diretamente**: É uma biblioteca
- **Herda comunicação**: Da aplicação que importa (ibtech-geovendas)

---

## 4. Serviços de Comunicação

### 4.1 geochat-api (Evolution API - Node.js)

**Localização**: `geochat-api/`

**Stack**:
- Node.js 20+ + TypeScript 5+
- Express.js (REST API)
- Prisma ORM (PostgreSQL/MySQL dual-support)
- EventEmitter2 (eventos internos)

**Propósito**: API REST multi-tenant para WhatsApp com suporte a múltiplos provedores

**Arquitetura em Camadas**:
```
Express Router (RouterBroker pattern)
    ↓
Guards (Auth, Instance, Telemetry)
    ↓
Controller (thin orchestration)
    ↓
Service (business logic)
    ↓
Repository (Prisma)
    ↓
Database (PostgreSQL/MySQL)
```

**Provedores WhatsApp**:
1. **Baileys** (WhatsApp Web - open-source)
2. **Meta Business API** (oficial, pago)
3. **Evolution API** (customizado)

Todos implementam `ChannelStartupService` (interface unificada).

**Integrações de Chatbot** (8 plataformas):
- **EvolutionBot**: Bot nativo com triggers
- **Typebot**: Visual flow builder
- **Chatwoot**: CRM de atendimento
- **OpenAI**: GPT + Whisper (áudio)
- **Dify**: AI agents
- **Flowise**: LangChain
- **N8N**: Workflow automation
- **EvoAI**: Custom AI

**Sistema de Eventos** (7 canais):
```
EventEmitter2 (interno)
        ↓
   EventManager.emit()
        ↓
   ┌────┴────┬─────────┬────────┬─────┬────────┬────────┐
   ↓         ↓         ↓        ↓     ↓        ↓        ↓
Webhook  WebSocket  RabbitMQ  SQS   NATS    Pusher  Kafka
```

**Multi-tenancy**:
- Cada "instância" = uma conexão WhatsApp isolada
- `WAMonitoringService`: Orquestra ciclo de vida
- Isolamento: Database-level + Memory-level + Cache-level

**Fluxo de Mensagem Completo**:
```
WhatsApp → ChannelStartupService → EventEmitter2
    ↓
Listeners ativados:
    ├─ Repository (salva BD)
    ├─ ChatbotService (processa resposta)
    └─ EventManager (distribui para webhooks, websocket, queues)
```

**Localização de Código**:
- Controllers: `src/api/controllers/`
- Services: `src/api/services/`
- Repositories: `src/api/repository/`
- Integrations: `src/api/integrations/`
  - Channel: `whatsapp/`, `meta/`, `evolution/`
  - Chatbot: `typebot/`, `chatwoot/`, `openai/`, etc
  - Event: `webhook/`, `websocket/`, `rabbitmq/`, etc

### 4.2 Comm (Middleware .NET 8)

**Localização**: `geovendas-dotnet/Comm`

**Stack**:
- .NET 8.0 + ASP.NET Core
- Entity Framework Core 6.0.32 (PostgreSQL)
- RabbitMQ 6.8.1
- AutoMapper 12.0.1
- Serilog 2.10.0

**Propósito**: Middleware de comunicação centralizado entre Geovendas e provedores WhatsApp

**Arquitetura em Camadas**:
```
Controllers (17 controllers)
    ↓
Services (27 serviços)
    ↓
Repositories (11 repositories)
    ↓
Database (PostgreSQL via EF Core)
```

**Provedores WhatsApp**:
1. **Dialog360** (Hub 360)
2. **JoinDev** (API alternativa)

**Padrão Factory**:
```
WhatsAppFactory
    ├─ IWhatsAppDispatcher (envio)
    │   ├─ WhatsApp360DialogDispatcher
    │   └─ [Outros providers]
    └─ IWhatsAppReceiver (recebimento)
        ├─ WhatsApp360DialogReceiver
        └─ [Outros providers]
```

**Background Services** (processamento assíncrono):
- `WhatsappConsumerService`: Consome fila RabbitMQ (mensagens recebidas)
- `JoinDevWebhookConsumerService`: Consome webhooks JoinDev
- `WebhookSenderService`: Retransmite webhooks para downstream
- `WabaMediaRemoveService`: Limpeza automática de mídia expirada

**Multi-tenancy**:
- Isolamento por **License** (tenant)
- Filas RabbitMQ separadas: `ReceiveQueue_{licenseId}`
- Dados isolados por `LicenseId` em todas as tabelas

**Fluxo de Mensagem Inbound**:
```
WhatsApp Webhook (Dialog360/JoinDev)
    ↓
WhatsAppWebhookController
    ↓
RabbitMQ (ReceiveQueue_{licenseId})
    ↓
WhatsappConsumerService (background)
    ↓
WhatsAppReceiverService
    ↓
Database (WhatsAppMessage, WhatsAppConversation)
    ↓
WebhookSenderService (retransmite para downstream)
```

**Fluxo de Mensagem Outbound**:
```
POST /api/whatsapp/messages/send
    ↓
WhatsAppDispatcherService
    ↓
WhatsAppFactory seleciona dispatcher
    ↓
Dialog360/JoinDev API (envio)
    ↓
Status tracking: PENDING → SENT → DELIVERED/READ
```

**Localização de Código**:
- Controllers: `/Controllers`
- Services: `/Services`
- Repositories: `/Repositories`
- DTOs: `/Dtos` (57 DTOs, incluindo subpasta JoinDev com 24+ DTOs)
- Models: `/Models/Database` (14 entidades EF Core)
- Providers: `/Providers/Whatsapp/` (abstração de provedores)
- Background Services: `/Services/*ConsumerService`, `/Services/WebhookSenderService`

---

## 5. Pontos de Integração Críticos

### 5.1 Comm ↔ geochat-api

**Tipo**: RabbitMQ + HTTP Webhooks

**Fluxo Bidirecional**:
```
┌─────────────────────────────────────────────────────┐
│ Comm (.NET) ←→ RabbitMQ ←→ geochat-api (Node.js)   │
└─────────────────────────────────────────────────────┘

Direção 1: Comm → geochat-api
    Comm (Webhook receiver)
        ↓
    RabbitMQ (geochat_webhook_{licenseId})
        ↓
    geochat-api (Consumer)
        ↓
    Processa chatbots, salva BD, emite eventos

Direção 2: geochat-api → Comm
    geochat-api (EventManager)
        ↓
    HTTP POST /api/whatsapp/webhook
        ↓
    Comm (WhatsAppWebhookController)
        ↓
    Enfileira em RabbitMQ
```

**Configuração**:
- **Fila RabbitMQ**: `geochat_webhook_{licenseId}`
- **Webhook URL**: Configurável em geochat-api via `/webhook/set/:instanceName`
- **Autenticação**: JWT Bearer token (opcional via `jwt_key` header)

### 5.2 Frontends ↔ Backend Java

**Tipo**: REST + WebSocket

**Vue.js → Backend Java**:
```
Vue Component
    ↓ @inject()
Service (DI Singleton)
    ↓
HttpService (Axios)
    ↓ Bearer token automático
POST/GET /api/...
    ↓
Backend Java (Spring Boot)
    ↓
Service → Repository → Database
```

**Vaadin 23 → Backend Java**:
```
Vaadin Component (UI)
    ↓ @Autowired
Service (Spring Bean)
    ↓
Repository (Spring Data)
    ↓
Database
```

Nota: Vaadin Flow abstrai comunicação HTTP via WebSocket automático.

**WebSocket Real-time**:
```
Backend event
    ↓
WebSocket Server (Socket.io ou Spring WebSocket)
    ↓
Frontend listeners
    ↓
UI update (Vue reactivity ou Vaadin Push)
```

### 5.3 Dependências Maven entre Projetos Java

**Ordem de Build**:
```
1. geovendas-utils (sem deps)
2. geovendas-entity (→ utils)
3. geovendas-repository (→ entity, utils)
4. geovendas-service (→ repository, entity, utils)
5. geovendas-java17-lib (→ entity, utils)
6. geovendas-view-crm (→ service, java17-lib)
7. ibtech-geovendas (→ service, repository, entity, view-crm, java17-lib)
```

**Todas as dependências com scope `provided`**: Não empacotadas no JAR final.

**Repositório Maven**: GitHub Packages (privado)

### 5.4 Webhook Flows de WhatsApp

**Fluxo Completo de Ponta a Ponta**:
```
1. WhatsApp envia mensagem
    ↓
2. Dialog360/JoinDev recebe e dispara webhook
    ↓
3. Comm (.NET) recebe webhook
    ├─ Valida assinatura
    ├─ Armazena em PostgreSQL (WhatsAppMessage)
    └─ Enfileira em RabbitMQ (ReceiveQueue_{licenseId})
    ↓
4. Comm (WhatsappConsumerService) consome fila
    ├─ Processa mensagem
    └─ Retransmite via WebhookSenderService
    ↓
5. geochat-api (Node.js) recebe webhook
    ├─ Armazena em BD (Message, Chat, Contact)
    ├─ Processa chatbots (OpenAI, Typebot, etc)
    └─ Emite eventos (WebSocket, RabbitMQ, outros)
    ↓
6. Backend Java (Geovendas) recebe evento
    ├─ Sincroniza com CRM
    ├─ Cria atividade
    └─ Notifica usuários via WebSocket
    ↓
7. Frontend (Vue.js/Vaadin) atualiza UI
    └─ Notificação, badge, lista de conversas
```

**Configuração de Webhook por Instância** (geochat-api):
```
POST /webhook/set/:instanceName
{
  "webhook": {
    "enabled": true,
    "url": "https://geovendas-api.url/webhook",
    "events": ["messages.upsert", "messages.update", "connection.update"],
    "headers": { "jwt_key": "secret" },
    "byEvents": true
  }
}
```

---

## 6. Padrões Arquiteturais

### 6.1 Por Stack Tecnológico

#### Java (Spring Boot)
- **3-Layer Architecture**: Entity → Repository → Service
- **Repository Pattern**: Spring Data JPA com `GeoJpaRepository<T>`
- **Service Layer**: `AbstractService<T>` → `GeoAbstractService<T, R>` → Serviços específicos
- **Dependency Injection**: Constructor-based (Spring)
- **Generic Type Hierarchy**: Reutilização de CRUD genérico

#### .NET (ASP.NET Core)
- **3-Layer Architecture**: Models → Repositories → Services → Controllers
- **Factory Pattern**: `WhatsAppFactory` para múltiplos provedores
- **Background Services**: `BackgroundService` classes para async processing
- **Queue Pattern**: RabbitMQ com Dead Letter Queues (DLQ)
- **Dependency Injection**: Constructor-based (ASP.NET Core DI)
- **DTO Pattern**: Desacoplamento entre Models e API contracts

#### Node.js (Express)
- **3-Layer Architecture**: Repository (Prisma) → Service → Controller
- **Event-Driven**: EventEmitter2 para eventos internos
- **RouterBroker Pattern**: Routing + validation integrado (JSONSchema7)
- **Service Locator**: `server.module.ts` instancia todos os serviços
- **Multi-provider**: Padrão Strategy para WhatsApp providers

#### Vue.js 2 (Frontend SPA)
- **Dependency Injection**: inversify-props com singleton DI
- **Service Layer**: Services isolados com lógica de negócio
- **Model-Driven**: class-transformer para JSON → Model tipado
- **State Management**: Vuex com vuex-persist (localStorage)
- **URL-based Auth**: Token via query params (sem login tradicional)

### 6.2 Padrões Comuns a Todos

| Padrão | Descrição | Onde Usar |
|--------|-----------|-----------|
| **Repository Pattern** | Abstração de acesso a dados | Java, .NET, Node.js |
| **Service Layer** | Lógica de negócio isolada | Todos os backends |
| **Dependency Injection** | IoC container gerenciado | Todos (Spring, ASP.NET, inversify) |
| **DTO Pattern** | Desacoplamento Models/API | .NET, Node.js, Vue.js |
| **Event-Driven** | Comunicação assíncrona via eventos | Node.js (EventEmitter2), .NET (Background Services) |
| **Multi-tenancy** | Isolamento por tenant (License/Instance) | Node.js (instance), .NET (license) |
| **Factory Pattern** | Criação de objetos polimórficos | .NET (WhatsAppFactory), Node.js (ChannelStartupService) |
| **Background Services** | Processamento assíncrono | .NET (BackgroundService), Node.js (setInterval) |

### 6.3 Autenticação por Stack

| Stack | Método | Token | Onde Valida |
|-------|--------|-------|-------------|
| **Vue.js** | URL query params | Bearer JWT | AuthGuard → SessionService |
| **Vaadin 6** | Session-based | HTTP Session | Spring Security |
| **Vaadin 23** | Spring Security | Bearer JWT ou Session | Spring Security Filter |
| **Comm (.NET)** | JWT Bearer | Bearer JWT | ASP.NET Core Auth Middleware |
| **geochat-api** | API Key | Header `apikey` | AuthGuard middleware |
| **Backend Java** | Bearer JWT | Bearer JWT | Spring Security Filter |

---

## 7. Troubleshooting Multi-Stack

### 7.1 Problemas de Integração

#### Webhook não recebe eventos (geochat-api → Backend)

**Sintoma**: Eventos WhatsApp não chegam ao backend

**Checklist**:
1. **Verificar configuração webhook**:
   ```bash
   GET /webhook/find/:instanceName
   # Campos: enabled=true, url correta, events listados
   ```

2. **Testar conectividade**:
   ```bash
   curl -X POST https://backend-url/webhook \
     -H "Content-Type: application/json" \
     -d '{"event":"test","data":{}}'
   ```

3. **Verificar logs geochat-api**:
   - Buscar: "webhook.emit", "WebhookController"
   - Erros HTTP: timeout, 404, 500

4. **Validar JWT** (se configurado):
   - Header `jwt_key` gera token válido?
   - Backend valida Bearer token?

5. **Eventos habilitados**:
   - `byEvents: true` requer `events` array
   - Sem `events` → envia TODOS

#### Instância WhatsApp não conecta (geochat-api)

**Sintoma**: Status permanece "connecting" ou "close"

**Checklist**:
1. **Provider específico**:
   - **Baileys**: QR code escaneado? Session válida?
   - **Business API**: Token e businessId válidos?

2. **Logs de conexão**:
   ```bash
   grep "connectionUpdate\|BaileysStartupService" logs/evolution-api.log
   ```

3. **Limpar cache/session**:
   ```bash
   # Redis
   redis-cli FLUSHDB

   # Ou deletar instância
   DELETE /instance/delete/:instanceName
   POST /instance/create
   ```

4. **Proxy** (se configurado):
   ```bash
   GET /proxy/find/:instanceName
   ```

5. **Timeout**: Verificar `delInstanceTime` em settings

#### Frontend não autentica (Vue.js)

**Sintoma**: Redirecionado para /forbidden

**Checklist**:
1. **Query params**:
   - URL tem `?token=...&apiUrl=...`?
   - Token válido e não expirado?

2. **Console do navegador**:
   - Buscar erros CORS, 401, 403
   - DevTools → Console

3. **SessionService**:
   ```javascript
   // DevTools Console
   Vue.$root.$children[0].$options.provide().sessionService
   // Verificar: token, apiUrl, socketIOUrl
   ```

4. **CORS no backend**:
   - Backend permite origin do Vue
   - Headers: `Access-Control-Allow-Origin`

5. **AuthGuard logs**: Router guard validação

#### RabbitMQ não processa mensagens (Comm ↔ geochat-api)

**Sintoma**: Mensagens ficam na fila sem processar

**Checklist**:
1. **Consumer está rodando?**:
   ```bash
   # .NET
   ps aux | grep Comm

   # Node.js
   pm2 list | grep geochat-api
   ```

2. **Fila correta?**:
   ```bash
   # RabbitMQ Management
   http://localhost:15672
   # Verificar: ReceiveQueue_{licenseId}, geochat_webhook_{licenseId}
   ```

3. **Dead Letter Queue**:
   - Mensagens em `{queueName}_dlq`?
   - Indica falha no processamento

4. **Logs de consumer**:
   ```bash
   # .NET
   tail -f logs/comm.log | grep "WhatsappConsumerService"

   # Node.js
   tail -f logs/evolution-api.log | grep "RabbitMQ"
   ```

5. **Conexão RabbitMQ**:
   ```bash
   # Testar conectividade
   telnet localhost 5672
   ```

#### Vaadin 23 não carrega componentes

**Sintoma**: Componentes não renderizam

**Checklist**:
1. **Build frontend**:
   ```bash
   mvn clean package -Pproduction
   # Verifica: target/classes/META-INF/VAADIN/
   ```

2. **Whitelisted packages**:
   ```properties
   # application.properties
   vaadin.whitelisted-packages=com.vaadin,com.flowingcode,com.geovendas
   ```

3. **Node.js instalado**:
   ```bash
   node --version  # >= 16
   npm --version
   ```

4. **Logs Vaadin**:
   - Buscar: "Vaadin", "frontend", "webpack"

5. **Cache limpo**:
   ```bash
   rm -rf node_modules frontend/generated
   mvn vaadin:prepare-frontend
   ```

### 7.2 Logs por Stack

#### Java (Spring Boot)
```bash
# Localização padrão
tail -f logs/application.log

# Por nível
grep "ERROR" logs/application.log
grep "WARN" logs/application.log

# Por classe
grep "CRMProspectService" logs/application.log
```

#### .NET (ASP.NET Core + Serilog)
```bash
# Localização (Serilog PostgreSQL sink)
SELECT * FROM error_log ORDER BY timestamp DESC LIMIT 100;

# Arquivo (se configurado)
tail -f logs/comm.log

# Por nível
grep "Error" logs/comm.log
```

#### Node.js (Evolution API)
```bash
# Configurável via LOG_LEVEL
tail -f logs/evolution-api.log

# Por tipo
grep "ERROR" logs/evolution-api.log
grep "connectionUpdate" logs/evolution-api.log
grep "webhook.emit" logs/evolution-api.log
```

#### Vue.js (Browser)
```javascript
// DevTools → Console
// Todos os logs aparecem aqui

// Network
// DevTools → Network → XHR/Fetch/WS

// Vue DevTools
// Components, Vuex, Events
```

### 7.3 Health Checks

#### geochat-api
```bash
curl http://localhost:8080/health

# Instâncias
curl -H "apikey: key" http://localhost:8080/instance/fetchInstances
```

#### Comm (.NET)
```bash
curl http://localhost:5005/health

# Licenças
curl -H "Authorization: Bearer token" http://localhost:5005/api/license
```

#### Backend Java
```bash
curl http://localhost:8080/actuator/health

# Endpoints Spring Actuator
/actuator/info
/actuator/metrics
```

#### RabbitMQ
```bash
# Management UI
http://localhost:15672

# CLI
rabbitmqctl list_queues
rabbitmqctl list_consumers
```

#### PostgreSQL
```bash
psql -U user -d database -c "SELECT version();"
```

### 7.4 Problemas de Performance

#### Backend Java lento

**Possíveis causas**:
1. **N+1 queries**: @OneToMany sem @BatchSize ou @Fetch(LAZY)
2. **Sem paginação**: Queries retornando muitos registros
3. **Connection pool esgotado**: `spring.datasource.hikari.maximum-pool-size`
4. **Sem cache**: Redis desabilitado ou mal configurado

**Soluções**:
- Habilitar query logging: `spring.jpa.show-sql=true`
- EXPLAIN ANALYZE queries lentas
- Aumentar pool de conexões
- Implementar cache em serviços críticos

#### Comm (.NET) lento

**Possíveis causas**:
1. **RabbitMQ overload**: Muitas mensagens na fila
2. **EF Core tracking**: DbContext com muitas entidades rastreadas
3. **Background service bloqueando**: Processamento síncrono

**Soluções**:
- Escalar consumers horizontalmente
- `AsNoTracking()` em queries read-only
- Async/await em todo processamento

#### geochat-api lento

**Possíveis causas**:
1. **Cache desabilitado**: Redis não configurado
2. **Muitas instâncias**: WAMonitor sobrecarregado
3. **Event emitters síncronos**: Listeners bloqueando

**Soluções**:
- Habilitar Redis: `REDIS_ENABLED=true`
- Limitar instâncias por processo
- Mover listeners para async/await

#### Frontend Vue.js lento

**Possíveis causas**:
1. **Bundle grande**: Sem lazy loading
2. **ag-Grid pesado**: Muitas rows sem virtual scrolling
3. **Muitas requisições HTTP**: Sem batch/cache

**Soluções**:
- Lazy load routes: `component: () => import()`
- Habilitar virtual scrolling em ag-Grid
- Implementar cache client-side

---

## Conclusão

Esta Skill fornece uma visão arquitetural completa do **CRM360 Workspace**, permitindo:

✅ **Compreensão rápida** da estrutura multi-stack (Java, .NET, Node.js, Vue.js)
✅ **Identificação de fluxos** críticos de dados entre projetos
✅ **Localização precisa** de componentes, serviços e integrações
✅ **Troubleshooting eficiente** de problemas comuns em cada stack
✅ **Navegação conceitual** sem depender de implementações específicas

**Para mais detalhes**:
- `geochat-api/AGENTS.md` - Documentação da Evolution API
- `.cursor/rules/` - Regras específicas de desenvolvimento
- Código-fonte dos projetos individuais

---

**Última atualização**: 2026-01-22
**Versão da Skill**: 2.0
**Projetos cobertos**: 11 projetos do CRM360.code-workspace
**Stacks**: Java 17, .NET 8, Node.js 20, Vue.js 2, Vaadin 6/23
