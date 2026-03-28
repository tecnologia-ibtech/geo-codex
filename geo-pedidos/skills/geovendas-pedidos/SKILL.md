---
name: geovendas-pedidos
description: "Architectural knowledge base for the Forca de Vendas (ISF) system — offline-first app for sales reps. Use when working on the pedidos repo, geovendas-vaadin6 backend, or any ISF-related code. Covers frontend (AngularJS/CoffeeScript), backend (Java/JAX-RS/JPA), offline sync pattern, and domain concepts."
---

# Skill: Implementações no Força de Vendas Confecção (Geovendas)

## Visão Geral do Sistema

O **Força de Vendas** (ISF - Integração de Força de Vendas) é uma aplicação **offline-first** usada por representantes comerciais para digitação de pedidos, gestão de clientes e acompanhamento de vendas no setor têxtil/confecção.

O sistema é composto por dois repositórios:
- **Frontend** (`/Users/gab/repo/pedidos`): App do representante (ISF)
- **Backend** (`/Users/gab/repo/geovendas-vaadin6`): Servidor REST + Backoffice administrativo (Vaadin 6)

---

## Resolver Tasks SUS

Quando o usuario pedir para resolver uma task SUS, o fluxo completo ja esta implementado como command dentro do proprio projeto pedidos:

- **Command:** `/resolve-sus` — disponivel em `.claude/commands/resolve-sus.md` no repositorio pedidos
- **O que faz:** Le a task no Jira, classifica, invoca skills de dominio, implementa, abre PR e comenta no Jira
- **Pre-requisito:** Estar com o Codex aberto no diretorio do projeto pedidos

Nao tente replicar esse fluxo manualmente. Oriente o usuario a usar `/resolve-sus` no projeto pedidos.

---

## Workflow de Implementacao

Ao trabalhar no projeto pedidos, siga este fluxo antes de escrever qualquer codigo:

### 1. Entender o problema

Leia atentamente o que o usuario descreveu. Se necessario, faca perguntas curtas e objetivas antes de qualquer analise ou codigo.

### 2. Analisar o fluxo completo

**Sempre faca isso antes de escrever uma linha:**

- Identifique os arquivos envolvidos:
  - Controller: `client/scripts/controllers/<Nome>Ctrl.coffee`
  - Service: `client/scripts/services/<Nome>PersistService.coffee`
  - Utils: `client/scripts/shared/utils.coffee` ou `<Nome>Utils.coffee`
  - View: `client/views/<modulo>/<view>.html`
  - Custom Factory: `client/scripts/custom/<Nome>CustomFactory.coffee`
- Leia os arquivos relevantes com Read antes de propor qualquer mudanca
- Trace o fluxo de ponta a ponta: View -> Controller -> Service -> Backend
- Identifique o ponto exato onde o problema ocorre

### 3. Implementar

1. **Leia os arquivos relevantes** antes de qualquer coisa
2. **Proponha o que vai mudar** (Controller? Service? View? Utils?) com justificativa
3. **Implemente seguindo os padroes abaixo** — sem inventar novos padroes
4. **Nao refatore codigo nao relacionado** ao problema descrito
5. **Nao adicione comentarios** em codigo que ja e autoexplicativo
6. **Nao crie arquivos novos** se a mudanca cabe em um arquivo existente

### Arquivos de referencia do projeto

- **Controller principal:** `client/scripts/controllers/CadPedidoCtrl.coffee`
- **Service principal:** `client/scripts/services/PedidoPersistService.coffee`
- **Utils base:** `client/scripts/shared/utils.coffee`
- **Controllers base:** `client/scripts/shared/main.coffee`
- **Diretivas:** `client/scripts/shared/directives.coffee`
- **Custom Factory base:** `client/scripts/custom/CustomFactory.coffee`

---

## Padroes de Codigo Obrigatorios

### Linguagem e estrutura

- **Sempre CoffeeScript** — nunca JavaScript puro
- `'use strict'` no inicio de cada arquivo
- Indentacao com 4 espacos
- Sem parenteses desnecessarios no CoffeeScript (exceto em chamadas com multiplos argumentos)
- Arrow functions com `->` ou `=>`

### Nomenclatura

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Controllers | PascalCase + `Ctrl` | `CadastroPedidoCtrl` |
| Services/Persist | PascalCase + `PersistService` | `PedidoPersistService` |
| Utils | PascalCase + `Utils` | `PedidoUtils`, `ValueUtils` |
| Custom Factories | PascalCase + `CustomFactory` | `BrindeCustomFactory` |
| Variaveis/Funcoes | camelCase | `pedidoAtual`, `calcularTotal()` |
| Constantes | UPPER_SNAKE_CASE | `ORIGEM_FV = 10` |
| Booleanos | prefixo `flag` ou `is` | `flagBloqueado`, `isLoading` |
| Metodos privados | prefixo `_` | `_validarCliente()` |
| Campos de banco | prefixo `cod` ou `seq` | `codCliente`, `seqSortimento` |
| Diretivas | kebab-case | `representacao-formato-milhar` |

### Estrutura de Controller

```coffeescript
'use strict'

angular.module('app.controllers')

.controller('NomeCtrl', [
    '$rootScope', '$scope', '$filter', '$uibModal', 'blockUI', 'toastr', 'logger',
    'Service1', 'Service2',
    ($rootScope, $scope, $filter, $uibModal, blockUI, toastr, logger,
     Service1, Service2) ->

        # -- Inicializacoes --
        $scope.dados     = []
        $scope.filtro    = {}
        $scope.aux       =
            campo1: undefined
            campo2: false

        CONSTANTE_LOCAL  = 10

        # -- Funcoes privadas --
        _funcaoPrivada = ->
            # implementacao

        # -- Funcoes publicas ($scope) --
        $scope.funcaoPublica = ->
            # implementacao

        # -- Watchers --
        $scope.$watch 'filtro', (newVal, oldVal) ->
            return if newVal is oldVal
            # reacao
        , true

        # -- Inicializacao --
        init = ->
            # carregar dados

        init()
])
```

### Promises

- Sempre use `$q.defer()` — nunca Promise nativa
- Sempre encadeie `.then().catch()`
- Para multiplas requisicoes paralelas use `$q.all([])`

```coffeescript
# Correto
deferred = $q.defer()
operacao()
    .then (resultado) ->
        deferred.resolve resultado
    .catch (erro) ->
        deferred.reject erro
deferred.promise

# Correto — multiplas
$q.all([Service1.load(), Service2.load()]).then (resultados) ->
    $scope.dados1 = resultados[0]
    $scope.dados2 = resultados[1]
```

### UX durante operacoes assincronas

```coffeescript
blockUI.start("Carregando...")
Service.load()
    .then (dados) ->
        $scope.lista = dados
        logger.logSuccess($rootScope.traducao[XXXX])
    .catch (erro) ->
        logger.logError(erro.msg or "Erro inesperado")
    .finally ->
        blockUI.stop()
```

### Validacoes

```coffeescript
# Sempre use ValueUtils para nulos/undefined
if ValueUtils.isNull(valor)     # ao inves de !valor ou valor == null
if ValueUtils.isNotNull(valor)
if ValueUtils.isTrue(flag)
if ValueUtils.isFalse(flag)
```

### Modais

```coffeescript
$uibModal.open(
    templateUrl: "views/modulo/nomeModal.html"
    controller:  'NomeModalCtrl'
    size:        'lg'
    resolve:
        dados: -> $scope.dadosParaModal
).result.then (resultado) ->
    # processar resultado
```

### Broadcast de eventos

```coffeescript
# Emitir
$rootScope.$broadcast 'nomeEvento', { chave: valor }

# Receber
$scope.$on 'nomeEvento', (event, dados) ->
    $scope.processar dados
```

---

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│                REPRESENTANTE (ISF)               │
│              AngularJS 1.x + CoffeeScript        │
│                                                   │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐  │
│  │ Views    │  │ Controllers│  │  Components   │  │
│  │  (.html) │  │  (.coffee) │  │  (ib-*)       │  │
│  └────┬─────┘  └─────┬──────┘  └──────┬───────┘  │
│       └───────────────┼────────────────┘          │
│                       ▼                           │
│            ┌─────────────────────┐                │
│            │  PersistServices    │                │
│            │  (syncData/prepare) │                │
│            └──────┬──────┬───────┘                │
│                   │      │                        │
│            ┌──────▼──┐ ┌─▼──────────┐             │
│            │ PouchDB │ │  $http     │             │
│            │ (local) │ │  (REST)    │             │
│            └────┬────┘ └─────┬──────┘             │
└─────────────┼────────────────┼────────────────────┘
              │                │
              ▼                ▼
        ┌──────────┐   ┌──────────────────────────┐
        │ CouchDB  │   │   BACKEND (Java)          │
        │ (backup) │   │   JAX-RS REST API          │
        └──────────┘   │                            │
                       │  ┌────────────────────┐    │
                       │  │ Resources (@Path)  │    │
                       │  │ (B2SP*, CRM*)      │    │
                       │  └────────┬───────────┘    │
                       │           ▼                │
                       │  ┌────────────────────┐    │
                       │  │  Models (DTO)      │    │
                       │  │  (B2SP*Model)      │    │
                       │  └────────┬───────────┘    │
                       │           ▼                │
                       │  ┌────────────────────┐    │
                       │  │ DB Beans (Entity)  │    │
                       │  │ JPA/Hibernate      │    │
                       │  └────────┬───────────┘    │
                       │           ▼                │
                       │     ┌────────────┐         │
                       │     │ PostgreSQL │         │
                       │     └────────────┘         │
                       └────────────────────────────┘
```

### Modelo Offline-First

O app funciona offline. Todos os dados são armazenados localmente em **PouchDB** (IndexedDB) e sincronizados com o servidor quando online:

- **Download**: REST API → PouchDB local (via `syncData()` dos PersistServices)
- **Backup**: PouchDB local ↔ CouchDB remoto (replicação nativa PouchDB)
- **Upload de pedidos**: PouchDB local → POST REST API (integração)

---

## Frontend — Estrutura do Projeto

```
/Users/gab/repo/pedidos/
├── client/
│   ├── config.html              # Configuração por ambiente (serverURL, conta, flags)
│   ├── index.html               # Entry point
│   ├── scripts/
│   │   ├── app.coffee           # Bootstrap AngularJS, módulos, $rootScope helpers
│   │   ├── config/
│   │   │   ├── config.coffee    # Provider EnvConfig (carrega config.html), interceptors HTTP
│   │   │   ├── roteamento.coffee # Rotas ($routeProvider) e resolves
│   │   │   └── ServerConfigService.coffee # Carrega e cacheia configurações do servidor
│   │   ├── controllers/         # Controllers AngularJS (um por tela/modal)
│   │   ├── services/            # PersistServices (CRUD + sync por entidade)
│   │   ├── shared/              # Utils, helpers, lógica de negócio compartilhada
│   │   │   ├── service.coffee   # PouchService base (factory que todos PersistServices estendem)
│   │   │   ├── utils.coffee     # Utils gerais (enorme, contém muitos helpers)
│   │   │   ├── directives.coffee
│   │   │   ├── filters.coffee
│   │   │   ├── pedido/          # Lógica de pedido (descontos, divisão, políticas)
│   │   │   ├── cliente/         # Lógica de cliente
│   │   │   ├── produto/         # Lógica de produto
│   │   │   └── marisol/         # Customizações Marisol (cliente específico)
│   │   ├── components/          # Componentes reutilizáveis (prefixo ib-)
│   │   │   ├── ib-component.coffee  # Declaração do módulo app.components
│   │   │   ├── ib-select/       # Componente de seleção genérico
│   │   │   ├── ib-pedido/       # Componentes de pedido
│   │   │   ├── ib-politica/     # Componentes de política comercial
│   │   │   └── ib-cliente/      # Componentes de cliente
│   │   └── custom/              # CustomFactories (lógica por cliente/empresa)
│   │       ├── CustomFactory.coffee       # Factory mãe que delega por conta
│   │       ├── OrderCustomFactory.coffee  # Customizações de pedido
│   │       ├── StockCustomFactory.coffee  # Customizações de estoque
│   │       └── ...
│   ├── views/                   # Templates HTML (AngularJS)
│   │   ├── pedido/              # Telas de pedido
│   │   ├── cliente/             # Telas de cliente
│   │   ├── comercial/           # Telas comerciais
│   │   ├── financeiro/          # Telas financeiras
│   │   ├── components/          # Templates dos componentes ib-*
│   │   └── pages/               # Páginas especiais (login, loading)
│   ├── styles/                  # SCSS
│   └── i18n/                    # Traduções locais (fallback)
├── Gruntfile.coffee             # Build (CoffeeScript → JS, SCSS → CSS, livereload)
└── package.json
```

### Tecnologias do Frontend

| Tecnologia | Uso |
|---|---|
| **AngularJS 1.x** | Framework MVC |
| **CoffeeScript** | Linguagem (compila para JS via Grunt) |
| **PouchDB** | Storage local offline (IndexedDB) |
| **CouchDB** | Backup/replicação remota |
| **Grunt** | Build tool |
| **SCSS/LESS** | Estilos |
| **Bootstrap 3** | UI framework (via angular-ui-bootstrap) |
| **ag-Grid** | Tabelas complexas |
| **Lodash** | Utilidades JS (acessado como `_`) |
| **Moment.js** | Manipulação de datas |
| **Highcharts** | Gráficos |

### Padrão: PersistService (Frontend)

Todo acesso a dados segue o padrão **PersistService**, que estende `PouchService`:

```coffeescript
# Exemplo: CondPagtoPersistService.coffee
angular.module('app.services')
.factory('CondPagtoPersistService', [
    '$rootScope', '$http', '$q', '$filter', 'PouchService'
    ($rootScope, $http, $q, $filter, PouchService) ->

        TYPE = 'cond_pagto'  # Nome do "banco" PouchDB local

        CondPagtoPersist = angular.extend({}, new PouchService(TYPE), {

            # syncData: baixa dados do servidor e salva localmente
            syncData: ->
                deferred = $q.defer()
                service = this
                params = {
                    codRepres: $rootScope.main.user.codRepres
                    token: $rootScope.main.user.token
                    versionApp: $rootScope.getVersionApp()
                }
                $rootScope.serverOnline().then (status) ->
                    $rootScope.server("/condPagto").then (url) ->
                        $http.get(url, { params: params })
                            .then (response) ->
                                data = response.data
                                service.destroy().then ->
                                    listDocs = _.map(data, (item, index) ->
                                        return service.prepare(item)
                                    )
                                    service.bulkDocs(listDocs).then () ->
                                        deferred.resolve true
                deferred.promise

            # prepare: transforma dados do servidor para formato PouchDB
            prepare: (condPagto) ->
                condPagto.codRepres = $rootScope.getCodRep()
                condPagto.dataAtualizacao = new Date().getTime()
                delete condPagto['id']
                condPagto._id = this.getKey(condPagto.codCondPagto)
                return condPagto
        })
        return CondPagtoPersist
])
```

**Padrão de sync**:
1. `$rootScope.server("/endpoint")` → resolve a URL completa (`serverURL + /endpoint`)
2. `$http.get(url, { params })` → GET com `codRepres`, `token`, `versionApp`
3. `service.destroy()` → limpa dados locais antigos
4. `service.prepare(item)` → transforma cada registro (adiciona `_id`, remove campos JPA)
5. `service.bulkDocs(listDocs)` → insere tudo no PouchDB local
6. `$rootScope.$broadcast('syncNomeTabela', { percentage })` → emite progresso

**PouchService base** (em `shared/service.coffee`):
- Cria/gerencia banco PouchDB local com sufixo: `ibtech_{pathName}{sufixoBanco}_rep{codRep}_{TYPE}`
- Métodos herdados: `getAll()`, `getByKey(key)`, `upsert(doc)`, `bulkDocs(docs)`, `destroy()`, `allDocs(opts)`
- Gerencia replicação com CouchDB remoto via `beginSync()`

### Padrão: Chamadas REST

```coffeescript
# Construção de URL
$rootScope.server("/endpoint").then (url) ->
    # url = config.serverURL + "/endpoint"
    # ex: "/IBTech_Geo/rest/endpoint" ou "http://host:8080/IBTech_Geo/rest/endpoint"

# GET com parâmetros padrão
params = {
    codRepres: $rootScope.main.user.codRepres
    token: $rootScope.main.user.token
    versionApp: $rootScope.getVersionApp()
}
$http.get(url, { params: params })

# POST (ex: envio de pedido)
$http.post(url, jsonBody, { params: params })
```

### Padrão: Roteamento

Em `config/roteamento.coffee`, rotas seguem:
```coffeescript
'nomeDaRota': {
    url: '/modulo/nomeTela'
    templateUrl: 'views/modulo/nomeTela.html'
    controller: 'NomeTelaCtrl'
    resolve:
        serverConfig: ['ServerConfigService', (ServerConfigService) ->
            ServerConfigService.get()
        ]
        # outros resolves pré-carregam dados necessários
}
```

### Padrão: Componentes (ib-*)

Componentes reutilizáveis seguem a convenção:
- **Script**: `client/scripts/components/ib-nome/ibNome.component.coffee`
- **Template**: `client/views/components/ib-nome/ibNome.html`
- Registrados no módulo `app.components`
- Usam `controllerAs` com `vm` como alias

### Padrão: CustomFactories

CustomFactories implementam lógica específica por empresa/conta:
```coffeescript
# CustomFactory.coffee decide qual implementação usar baseado na conta
# Ex: OrderCustomFactory pode ter comportamento diferente para Kyly vs Rovitex
```
Cada factory delega para uma implementação específica baseada em `$rootScope.getEnvConfig().conta`.

### Padrão: Tradução

O sistema usa IDs numéricos para tradução:
```coffeescript
$rootScope.traducao[1232]  # "Erro ao executar ação"
$rootScope.traducao[655]   # "Deseja realmente sair"
```
- Traduções são carregadas do **banco de dados** (tabela no PostgreSQL) durante o login
- Atualizadas via `TraducaoUtils.atualizarTraducao()`
- Cada texto tem um `idTexto` numérico e `textoTraducao` string

### Padrão: ServerConfig

`ServerConfigService` carrega e cacheia configurações do servidor. É o "feature flag system" do app:
```coffeescript
serverConfig.modeloIntegracao          # 10=Confecção, 20=Malharia, 40=Calçadista
serverConfig.flagUtilizaEstoque        # flags booleanas controlam features
serverConfig.flagDescontoItem
serverConfig.flagInformaTransportadora
# ... centenas de flags
```

### Padrão: Config do Ambiente (config.html)

```json
{
    "nomeEmpresa": "NomeCliente",
    "serverURL": "/IBTech_Geo/rest",
    "couchURL": "http://host:5984/",
    "conta": "SIGLA",
    "sufixoBanco": "",
    "tipoDesconto": 10,
    "campos": { ... }
}
```
- `serverURL`: base URL do backend REST
- `conta`: sigla da empresa (usado para multi-tenancy)
- `couchURL`: URL do CouchDB para replicação

---

## Backend — Estrutura do Projeto

```
/Users/gab/repo/geovendas-vaadin6/
├── build.gradle                 # Build Gradle (WAR: IBTech_Geo.war)
├── src/main/java/br/inf/ibtech/
│   ├── res/                     # REST Resources (JAX-RS)
│   │   ├── IBResource.java      # Classe base de todos os resources
│   │   ├── IBAutenticationResource.java  # Auth (/auth)
│   │   ├── b2sp/                # *** Endpoints do Força de Vendas (ISF) ***
│   │   │   ├── B2SPUsuarioResource.java      # /user (login, senha)
│   │   │   ├── B2SPPedidoResource.java       # /pedido (integração pedidos)
│   │   │   ├── B2SPProdutoResource.java      # /produto
│   │   │   ├── B2SPTabPrecoResource.java     # /tabpreco (+ /colecoes, /produtos, /estados)
│   │   │   ├── B2SPCondPagtoResource.java    # /condPagto
│   │   │   ├── B2SPCadResource.java          # /cadGeral (cadastros gerais)
│   │   │   ├── B2SPCidadeResource.java       # /cidade
│   │   │   ├── B2SPSetorResource.java        # /setor
│   │   │   ├── B2SPComissaoResource.java     # /comissao
│   │   │   ├── B2SPRelatorioResource.java    # /relatorio
│   │   │   ├── B2SPLoteEntregaResource.java  # /loteentrega
│   │   │   ├── B2SPContaCorrenteResource.java # /contaCorrente
│   │   │   ├── B2SPConnectionControl.java    # Controle de conexões ativas
│   │   │   └── ... (dezenas de resources)
│   │   ├── crm/                 # Endpoints CRM (agenda, visitas, pesquisa NPS)
│   │   │   ├── CRMAgendaResource.java
│   │   │   ├── CRMVisitaResource.java
│   │   │   └── ...
│   │   ├── b2b/                 # Endpoints B2B (portal do lojista)
│   │   └── b2c/                 # Endpoints B2C
│   ├── model/                   # DTOs (Models para serialização JSON)
│   │   └── b2sp/                # Models do Força de Vendas
│   │       ├── B2SPSetorModel.java
│   │       ├── B2SPCondVendaModel.java
│   │       ├── B2SPPedidoModel.java
│   │       └── ...
│   ├── db/                      # Entities JPA (acesso ao banco)
│   │   └── b2sp/                # Entities do Força de Vendas
│   │       ├── B2SPSetor.java
│   │       ├── B2SPCondVenda.java
│   │       ├── B2SPEstoqueProduto.java
│   │       └── ...
│   ├── calc/                    # Lógica de cálculo e integração
│   │   └── b2sp/
│   │       ├── IntegracaoPedido.java   # Integração principal de pedidos
│   │       └── ...
│   ├── custom/                  # CustomFactories do backend (por empresa)
│   │   └── factory/
│   ├── utils/                   # Utilitários gerais
│   │   ├── jpa/                 # JPA helpers (EMF, IBEntityManager, AbstractBean)
│   │   ├── Authenticator.java
│   │   └── jwt/IBTokenizer.java
│   ├── service/                 # Services de negócio
│   └── sql/                     # SQL helpers
├── WebContent/
│   └── WEB-INF/web.xml          # Config servlet (JAX-RS auto-scan)
└── Jenkinsfile                  # CI/CD pipeline
```

### Tecnologias do Backend

| Tecnologia | Uso |
|---|---|
| **Java** | Linguagem principal |
| **Gradle** | Build tool (gera IBTech_Geo.war) |
| **JAX-RS (Jersey)** | REST API (annotations @Path, @GET, @POST) |
| **JPA/Hibernate 4.3** | ORM / acesso ao banco |
| **Vaadin 6** | Interface administrativa (backoffice) |
| **PostgreSQL** | Banco de dados |
| **Lombok** | @Getter, @Setter, @NoArgsConstructor, etc. |
| **Jackson (codehaus)** | Serialização JSON |
| **Gson** | Serialização JSON (usado em alguns endpoints) |
| **AWS SDK** | S3, deploy |

### Padrão: Resource REST (Backend)

Todo endpoint REST segue a estrutura **Resource → Model → DB Bean**:

```java
// 1. Resource (REST endpoint) — br.inf.ibtech.res.b2sp
@Path("/setor")
public class B2SPSetorResource extends IBResource {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<B2SPSetorModel> getSetores(
            @QueryParam("codRepres") String codRepres,
            @QueryParam("token") String token,
            @QueryParam("versionApp") String versionApp) {

        validarToken(codRepres, token, versionApp);  // Autenticação
        B2SPRepresSyncHistorico.registrar(codRepres, token, "Setores"); // Log de sync
        B2SPConnectionControl.manterLista(...); // Controle de conexão

        List<B2SPSetorModel> listRet = new ArrayList<>();
        try {
            List<B2SPSetor> setoresAtivos = B2SPSetor.getAtivos();
            for (B2SPSetor setor : setoresAtivos) {
                listRet.add(new B2SPSetorModel(setor));
            }
        } catch (Exception e) {
            throw new BadRequestException(e.getMessage());
        } finally {
            B2SPConnectionControl.manterLista(Acao.EXCLUIR, ...); // Limpa conexão
        }
        return listRet;
    }
}
```

```java
// 2. Model (DTO) — br.inf.ibtech.model.b2sp
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class B2SPSetorModel extends AbstractModel {
    private String codigo;
    private String nome;

    public B2SPSetorModel(B2SPSetor setor) {
        this.setCodEmpresa(setor.getCodEmpresa());
        this.setCodigo(setor.getCodigo());
        this.setNome(setor.getNome());
    }
}
```

```java
// 3. DB Bean (Entity) — br.inf.ibtech.db.b2sp
@Entity
@Getter @Setter
@NamedQueries({
    @NamedQuery(name = B2SPSetor.GET_BY_KEY,
        query = "SELECT a FROM B2SPSetor a WHERE a.codEmpresa = :p1 AND a.codigo = :p2")
})
public class B2SPSetor extends AbstractBean {
    public static final String GET_BY_KEY = "b2SPSetorGetByKey";

    @Column(nullable = false)
    private String codEmpresa;
    @Column(nullable = false)
    private String codigo;
    private String nome;
    private Integer flagAtivo = 1;

    public static List<B2SPSetor> getAtivos() {
        IBEntityManager em = EMF.createEntityManager();
        try {
            TypedQuery<B2SPSetor> query = em.createQuery(
                "SELECT s FROM B2SPSetor s WHERE s.flagAtivo = 1 AND s.codEmpresa = :p1",
                B2SPSetor.class);
            query.setParameter("p1", AppData.getCompanyIntegracaoStr());
            return query.getResultList();
        } finally {
            em.close();
        }
    }
}
```

**Padrão completo de um endpoint GET de sincronização**:
1. `validarToken(codRepres, token, versionApp)` — valida autenticação
2. `B2SPRepresSyncHistorico.registrar(...)` — registra histórico de sync
3. `B2SPConnectionControl.manterLista(INCLUIR, ...)` — marca conexão ativa
4. Busca dados via Entity beans (static methods com JPQL)
5. Converte para Models (DTOs)
6. `B2SPConnectionControl.manterLista(EXCLUIR, ...)` no `finally`
7. Retorna lista de Models serializados como JSON

### Padrão: IBResource (Base)

`IBResource` é a classe base de todos os REST resources:
- Faz login automático (`loginAutomatico()`) com usuário de integração `portalb2b`
- Gerencia tokens via `IBTokenizer` (JWT-like)
- Valida tokens com `validarToken()`
- Referências estáticas: `ACCOUNT`, `COMPANY`, `USER`

### Padrão: Autenticação

A autenticação do representante funciona assim:
1. Frontend faz `POST /user/login` com login + password
2. Backend retorna objeto com `codRepres`, `token`, e dados do usuário
3. Token é enviado em todas as chamadas subsequentes como `?token=xxx`
4. Backend valida o token via `validarToken()` em cada request

### Padrão: Multi-tenancy

O backend usa `codEmpresa` para multi-tenancy:
- `AppData.getCompanyIntegracaoStr()` retorna o código da empresa ativa
- Todas as queries filtram por `codEmpresa`
- O frontend identifica a empresa pela `conta` no `config.html`

### Padrão: DB Beans (Entities)

- Estendem `AbstractBean` (que tem `id`, `alteracaoData`, etc.)
- Usam `@NamedQuery` para queries padrão (GET_BY_KEY, etc.)
- Métodos estáticos para consultas (ex: `B2SPSetor.getAtivos()`)
- `EMF.createEntityManager()` para obter EntityManager
- **Sempre fechar EntityManager no `finally`**
- Usam Lombok (`@Getter`, `@Setter`, `@Entity`)

---

## Modelos de Integração

O sistema suporta diferentes modelos de negócio, controlados por `serverConfig.modeloIntegracao`:

| Valor | Modelo | Descrição |
|---|---|---|
| **10** | Confecção (padrão) | Modelo padrão para confecção têxtil |
| **20** | Malharia | Variação para malharias (verificado via `$rootScope.isMalharia()`) |
| **30** | Outro modelo | Usado em integrações específicas |
| **40** | Calçadista | Modelo para indústria calçadista (grades, sortimentos específicos) |

Verificação no frontend:
```coffeescript
$rootScope.isMalharia = -> (serverConfig?.modeloIntegracao or 10) is 20
serverConfig.flagSortimentoCalcadista  # flag complementar para calçadistas
```

---

## Mapeamento Frontend → Backend (Endpoints Principais)

| Frontend Service | Endpoint REST | Backend Resource | Função |
|---|---|---|---|
| `UsuarioPersistService` | `POST /user/login` | `B2SPUsuarioResource` | Login do representante |
| `UsuarioPersistService` | `POST /user/esqueceuASenha` | `B2SPUsuarioResource` | Recuperação de senha |
| `CadGeralPersistService` | `GET /cadGeral` | `B2SPCadResource` | Cadastros gerais (grades, descontos, limites) |
| `CondPagtoPersistService` | `GET /condPagto` | `B2SPCondPagtoResource` | Condições de pagamento |
| `TabPrecoPersistService` | `GET /tabpreco` | `B2SPTabPrecoResource` | Tabelas de preço |
| `ProdutoPersistService` | `GET /produto` | `B2SPProdutoResource` | Produtos e referências |
| `EstoquePersistService` | `GET /tabpreco/produtos` | `B2SPTabPrecoResource` | Estoque/disponibilidade |
| `PedidoPersistService` | `POST /pedido` | `B2SPPedidoResource` | Envio/integração de pedidos |
| `SetorPersistService` | `GET /setor` | `B2SPSetorResource` | Setores de atividade |
| `CidadePersistService` | `GET /cidade` | `B2SPCidadeResource` | Cidades |
| `LoteEntregaPersistService` | `GET /loteentrega` | `B2SPLoteEntregaResource` | Lotes de entrega |
| `ComissoesPersistService` | `GET /comissao` | `B2SPComissaoResource` | Comissões |
| `ContaCorrentePersistService` | `GET /contaCorrente` | `B2SPContaCorrenteResource` | Conta corrente |
| `TransportadoraPersistService` | `GET /transportadora` | `TransportadoraResource` | Transportadoras |
| `TipoCobrancaPersistService` | `GET /tipoCobranca` | `B2SPTipoCobrancaResource` | Tipos de cobrança |
| `TipoEntregaPersistService` | `GET /tipoEntrega` | `B2SPTipoEntregaResource` | Tipos de entrega |
| `TipoNotaPersistService` | `GET /tipoNota` | `B2SPTipoNotaResource` | Tipos de nota |
| `MarcaService` | `GET /marca` | `B2SPMarcaResource` | Marcas |
| `RamoAtividadePersistService` | `GET /ramoAtividade` | `B2SPRamoAtividadeResource` | Ramos de atividade |
| `AgendaPersistService` | `GET /crm/agenda` | `CRMAgendaResource` | Agenda CRM |
| `MensagemPersistService` | — | — | Mensagens (local + sync) |
| `CatalogoPersistService` | `POST /catalogo/salvar` | `B2SPCatalogoResource` | Catálogo de imagens |

---

## Guia para Implementação de Features

### Adicionando um novo campo/dado a uma entidade existente

**1. Backend — Entity (DB Bean)**:
```
Arquivo: src/main/java/br/inf/ibtech/db/b2sp/B2SP{Entidade}.java
```
Adicionar o novo campo com Lombok:
```java
private String novocampo;
// ou
private Integer flagNovo = 0;
```

**2. Backend — Model (DTO)**:
```
Arquivo: src/main/java/br/inf/ibtech/model/b2sp/B2SP{Entidade}Model.java
```
Adicionar o campo e popular no construtor:
```java
private String novocamp;

public B2SPEntidadeModel(B2SPEntidade entity) {
    // ... campos existentes
    this.setNovocampo(entity.getNovocampo());
}
```

**3. Frontend — PersistService**:
Geralmente não precisa alterar o PersistService. O campo novo vem automaticamente no JSON e é salvo no PouchDB.

**4. Frontend — View/Controller**:
Usar o novo campo no template HTML e no controller CoffeeScript.

### Criando um novo endpoint REST

**1. Backend — Resource**:
```
Criar: src/main/java/br/inf/ibtech/res/b2sp/B2SP{Nome}Resource.java
```
```java
@Path("/novoendpoint")
public class B2SPNovoResource extends IBResource {
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<B2SPNovoModel> get(
            @QueryParam("codRepres") String codRepres,
            @QueryParam("token") String token,
            @QueryParam("versionApp") String versionApp) {
        validarToken(codRepres, token, versionApp);
        // ... lógica
    }
}
```
O JAX-RS auto-descobre via `@Path` — não precisa registrar em nenhum lugar.

**2. Backend — Model + Entity**:
Criar os respectivos Model e Entity seguindo os padrões acima.

**3. Frontend — PersistService**:
```
Criar: client/scripts/services/NovoPersistService.coffee
```
Seguir o padrão de `CondPagtoPersistService` (mais simples) ou `CadGeralPersistService`.

**4. Frontend — Injetar no app.coffee**:
Adicionar o novo service na lista de dependências do `.run()` em `app.coffee` se necessário para sync automático.

### Criando uma nova tela

**1. View** (HTML):
```
Criar: client/views/{modulo}/nomeTela.html
```

**2. Controller** (CoffeeScript):
```
Criar: client/scripts/controllers/NomeTelaCtrl.coffee
ou
Criar: client/scripts/{modulo}/NomeTelaCtrl.coffee
```

**3. Rota**:
Adicionar em `client/scripts/config/roteamento.coffee`:
```coffeescript
'nomeTela': {
    url: '/modulo/nomeTela'
    templateUrl: 'views/modulo/nomeTela.html'
    controller: 'NomeTelaCtrl'
    resolve:
        serverConfig: ['ServerConfigService', (ServerConfigService) ->
            ServerConfigService.get()
        ]
}
```

### Criando um novo componente reutilizável

**1. Script**:
```
Criar: client/scripts/components/ib-nome/ibNome.component.coffee
```
```coffeescript
angular.module('app.components')
.component('ibNome', {
    templateUrl: 'views/components/ib-nome/ibNome.html'
    bindings:
        dados: '<'
        onChangeValue: '&'
    controller: ['$rootScope', 'ValueUtils',
        ($rootScope, ValueUtils) ->
            vm = this
            # ... lógica
    ]
    controllerAs: 'vm'
})
```

**2. Template**:
```
Criar: client/views/components/ib-nome/ibNome.html
```

---

## Conceitos Importantes do Domínio

| Conceito | Descrição |
|---|---|
| **Representante (codRepres)** | Vendedor/representante comercial que usa o app |
| **Tabela de Preço (codTabPreco)** | Define preços, coleções e políticas comerciais |
| **Coleção** | Agrupamento sazonal de produtos (ex: Verão 2026) |
| **Referência (codReferencia)** | Modelo do produto (ex: camiseta modelo X) |
| **SKU** | Combinação referência + cor + tamanho |
| **Grade** | Distribuição de tamanhos para uma referência |
| **Sortimento** | Composição de cores/modelos em um pacote |
| **Condição de Pagamento (codCondPagto)** | Forma de pagamento (30/60/90 dias, etc.) |
| **Lote de Entrega** | Agrupamento de embarques com datas de entrega |
| **Tipo de Nota** | Classificação fiscal da nota (venda, bonificação, etc.) |
| **Situação do Pedido** | 10=Rascunho, 20=Pronto, 27=Parcialmente integrado, 30=Integrado, 98/99=Excluído |
| **Política Comercial** | Regras de desconto, quantidade mínima, frete, etc. |
| **ServerConfig** | Configurações globais que controlam comportamento do app (flags) |
| **Conta (sigla)** | Identificador da empresa cliente da Geovendas |
| **Integração** | Processo de enviar pedidos do app para o ERP do cliente |

---

## Boas Práticas

1. **Sempre verificar `serverConfig` flags** antes de implementar lógica condicional — o comportamento frequentemente depende de flags
2. **Usar `ValueUtils.isNull()` / `ValueUtils.isNotNull()`** para null-checks no CoffeeScript (nunca `== null` direto)
3. **Tradução**: usar `$rootScope.traducao[ID]` para textos visíveis ao usuário — nunca hardcodar strings em português
4. **EntityManager**: sempre fechar no `finally` block no backend
5. **Novos campos no backend**: lembrar de adicionar tanto na Entity quanto no Model
6. **Prefixo de PouchDB**: respeitar o padrão `ibtech_{path}{sufixo}_rep{codRep}_{type}`
7. **CustomFactory**: se a lógica varia por empresa, usar o mecanismo de CustomFactory ao invés de if/else por conta
8. **$broadcast**: emitir eventos de progresso durante sync para feedback ao usuário
9. **Tratamento de erros**: usar `BadRequestException` no backend, tratar `.catch` no frontend
10. **Offline**: toda lógica do frontend deve funcionar offline — dados vêm do PouchDB local, não do servidor
