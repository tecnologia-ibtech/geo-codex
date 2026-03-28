# Guia Completo do QA Tester — Plugin geo-qa

Guia passo a passo para QA Testers usarem o plugin de automacao de testes.

---

## Indice

1. [O que eh o geo-qa?](#1-o-que-eh-o-geo-qa)
2. [Pre-requisitos](#2-pre-requisitos)
3. [Instalacao](#3-instalacao)
4. [Configuracao do ambiente](#4-configuracao-do-ambiente)
5. [Fluxo de trabalho completo](#5-fluxo-de-trabalho-completo)
6. [Usando o /qa-test passo a passo](#6-usando-o-qa-test-passo-a-passo)
7. [Executando os testes](#7-executando-os-testes)
8. [Quando o teste encontra um problema](#8-quando-o-teste-encontra-um-problema)
9. [Finalizando a tarefa](#9-finalizando-a-tarefa)
10. [Referencia rapida de comandos](#10-referencia-rapida-de-comandos)
11. [Perguntas frequentes](#11-perguntas-frequentes)
12. [Resolucao de problemas](#12-resolucao-de-problemas)

---

## 1. O que eh o geo-qa?

O geo-qa eh um plugin do Codex que **gera testes automatizados para voce**. Em vez de testar manualmente cada tela, voce descreve o que precisa ser testado e o Claude gera o codigo de teste automaticamente.

**Antes (manual):**
```
Receber tarefa → Abrir o sistema → Clicar nas telas → Anotar resultado → Devolver tarefa
```

**Agora (automatizado):**
```
Receber tarefa → Rodar /qa-test → Descrever o que testar → Claude gera testes → Rodar testes → Devolver tarefa
```

**Voce NAO precisa saber programar.** O Claude faz perguntas sobre o que testar e gera o codigo sozinho.

### O que o plugin testa?

| Nivel | O que testa | Exemplo |
|-------|-------------|---------|
| **UI/E2E** | Telas, formularios, botoes, navegacao | "Clicar em Salvar e ver mensagem de sucesso" |
| **API** | Endpoints REST do backend | "Chamar GET /rest/clientes e verificar resposta" |
| **Code** | Logica de negocio (calculos, regras) | "Desconto de 10% sobre R$100 = R$90" |

### Sistemas suportados

| Sistema | O que eh | URL Local |
|---------|----------|-----------|
| **IGS** (Vaadin 6) | Sistema principal — backoffice | http://localhost:8080/IBTech_Geo/app |
| **CRM360** (Vaadin 24) | CRM, dashboard, analytics | http://localhost:8081 |
| **Pedidos** (ISF) | App do representante — pedidos | http://localhost:9000 |

---

## 2. Pre-requisitos

Antes de comecar, voce precisa ter instalado:

### 2.1. Node.js (versao 18 ou superior)

Verifique se ja tem:
```bash
node --version
```

Se nao tiver, instale: https://nodejs.org/

### 2.2. Codex (CLI)

Verifique se ja tem:
```bash
claude --version
```

Se nao tiver, peca para o time de infra instalar ou siga: https://docs.anthropic.com/en/docs/claude-code

### 2.3. Git

Verifique se ja tem:
```bash
git --version
```

### 2.4. Acesso ao repositorio geo-codex

Voce precisa ter acesso ao repositorio https://github.com/tecnologia-ibtech/geo-codex

---

## 3. Instalacao

### Passo 1: Clonar o repositorio

```bash
git clone https://github.com/tecnologia-ibtech/geo-codex.git ~/repo/geo-codex
```

### Passo 2: Instalar o plugin no Codex

Abra o Codex em qualquer pasta e execute:
```bash
claude
```

Dentro do Codex, digite:
```
/plugin marketplace add tecnologia-ibtech/geo-codex
/plugin install geo-qa
```

### Passo 3: Instalar dependencias dos testes

```bash
cd ~/repo/geo-codex/geo-qa/tests
npm install
npx playwright install chromium
```

**O que acontece:** Isso baixa o Playwright (ferramenta de automacao de browser) e o navegador Chrome que sera usado para rodar os testes.

### Passo 4: Configurar credenciais

```bash
cd ~/repo/geo-codex/geo-qa/tests
cp .env.example .env
```

Abra o arquivo `.env` com qualquer editor de texto e preencha suas credenciais:

```env
# Vaadin 6 (IGS)
VAADIN6_BASE_URL=http://localhost:8080/IBTech_Geo/app
VAADIN6_USER=seu_usuario_igs
VAADIN6_PASS=sua_senha_igs

# Vaadin 24 (CRM360)
VAADIN24_BASE_URL=http://localhost:8081
VAADIN24_USER=seu_usuario_crm
VAADIN24_PASS=sua_senha_crm

# Pedidos (ISF / Forca de Vendas)
PEDIDOS_BASE_URL=http://localhost:9000
PEDIDOS_USER=seu_usuario_pedidos
PEDIDOS_PASS=sua_senha_pedidos
```

**IMPORTANTE:** O arquivo `.env` NUNCA sera commitado (esta no .gitignore). Suas senhas ficam apenas na sua maquina.

### Passo 5: Verificar instalacao

```bash
cd ~/repo/geo-codex/geo-qa/tests
npx playwright test --list
```

Deve listar os testes existentes. Se aparecer a lista, esta tudo pronto!

---

## 4. Configuracao do ambiente

Para rodar os testes, voce precisa dos sistemas rodando localmente.

### Subir os sistemas

Siga os procedimentos do time de infra para subir cada sistema que vai testar:

| Sistema | Como subir | Porta |
|---------|-----------|-------|
| IGS (Vaadin 6) | Tomcat com WAR `IBTech_Geo.war` | 8080 |
| CRM360 (Vaadin 24) | Docker ou Spring Boot local | 8081 |
| Pedidos (ISF) | Docker ou `grunt serve` | 9000 |

### Verificar se estao rodando

Abra no navegador:
- IGS: http://localhost:8080/IBTech_Geo/app
- CRM360: http://localhost:8081
- Pedidos: http://localhost:9000

Se as telas de login aparecerem, o ambiente esta pronto.

---

## 5. Fluxo de trabalho completo

Este eh o fluxo de uma tarefa de QA do inicio ao fim:

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DO QA TESTER                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. RECEBER TAREFA                                          │
│     └─ Tarefa QUA-XXXX chega no Jira                       │
│     └─ Ler descricao e PRs vinculadas                      │
│                                                             │
│  2. GERAR TESTES                                            │
│     └─ Abrir Codex: claude                            │
│     └─ Digitar: /qa-test QUA-XXXX                           │
│     └─ Responder perguntas do Claude                        │
│     └─ Aprovar plano de testes                              │
│     └─ Claude gera os testes automaticamente                │
│                                                             │
│  3. EXECUTAR TESTES                                         │
│     └─ Subir o sistema localmente                           │
│     └─ Rodar: npx playwright test --grep "QUA-XXXX"        │
│     └─ Ver resultado (passou ou falhou)                     │
│                                                             │
│  4. AVALIAR RESULTADO                                       │
│     │                                                       │
│     ├─ PASSOU ────────────────────────┐                     │
│     │  └─ Ir para passo 6             │                     │
│     │                                 │                     │
│     └─ FALHOU ─────────────────────┐  │                     │
│        └─ Ir para passo 5          │  │                     │
│                                    │  │                     │
│  5. DEVOLVER PARA O DEV            │  │                     │
│     └─ Abrir a tarefa QUA no Jira  │  │                     │
│     └─ Comentar com evidencia:     │  │                     │
│        - Screenshot do erro        │  │                     │
│        - Log do teste              │  │                     │
│        - Qual cenario falhou       │  │                     │
│     └─ Mover tarefa para "To Do"   │  │                     │
│     └─ Aguardar correcao do dev    │  │                     │
│     └─ Quando dev corrigir:        │  │                     │
│        voltar ao passo 3           │  │                     │
│                                    │  │                     │
│  6. FINALIZAR TAREFA ◄─────────────┘──┘                     │
│     └─ Commitar testes: /commit                             │
│     └─ Comentar no Jira: "Testes automatizados gerados"     │
│     └─ Mover tarefa para "Done"                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Usando o /qa-test passo a passo

### Passo 1: Abrir o Codex

Abra o terminal na pasta do geo-codex e inicie o Claude:

```bash
cd ~/repo/geo-codex
claude
```

### Passo 2: Invocar o plugin

Digite o comando com a chave da sua tarefa Jira:

```
/qa-test QUA-1234
```

Ou, se quiser testar algo sem tarefa Jira:

```
/qa-test
```

### Passo 3: Claude analisa a tarefa

O Claude vai:
1. Buscar a tarefa QUA-1234 no Jira
2. Ler as PRs vinculadas
3. Analisar o que foi alterado no codigo

Voce vera algo como:

```
Analisei a tarefa QUA-1234 e as PRs vinculadas:
- PR #456 em geovendas-vaadin6: alterou tela de desconto comercial
- PR #789 em pedidos: alterou calculo de desconto no pedido

Arquivos alterados:
- DescontoComercialView.java (tela de configuracao)
- PedidoService.java (calculo de desconto)
- cadPedido.coffee (tela de pedido no ISF)

Confirma que esses sao os fluxos que preciso testar?
```

### Passo 4: Responder as perguntas

O Claude vai fazer perguntas uma por vez. Responda com o maximo de detalhe possivel.

**Exemplo de conversa:**

```
Claude: Quais telas especificas eu preciso acessar para testar isso?
        Me descreva o caminho de navegacao.

Voce:   No IGS, menu GEOvendas > Politica Comercial > Desconto Comercial.
        No Pedidos, tela de criacao de pedido, aba Geral.

Claude: Descreva passo a passo o cenario de sucesso.
        Quais campos preenche? O que espera ver?

Voce:   1. Abrir politica comercial para a tabela de preco 20260110
        2. Criar faixa de desconto: 5% para 0-50 pecas
        3. Salvar
        4. No Pedidos, criar pedido com 30 pecas
        5. O desconto deve aparecer como 5%

Claude: E se o usuario tentar um desconto acima do maximo?
        Qual mensagem de erro espera?

Voce:   O sistema deve limitar ao percentual maximo da faixa.
        Se o maximo eh 15%, nao pode aplicar 25%.

Claude: Tem algum cenario que ja deu bug antes nessa area?

Voce:   Sim, ja teve problema quando a faixa tinha valor zero.
        E tambem quando o representante nao tinha tabela associada.

Claude: Credenciais de acesso para testar?

Voce:   IGS: admin / admin123
        Pedidos: rep60334 / senha123
```

### Passo 5: Aprovar o plano

Depois de todas as perguntas, o Claude apresenta o plano:

```
Vou gerar os seguintes testes para QUA-1234:

Arquivo: tests/vaadin6/features/QUA-1234-desconto-comercial.spec.ts

UI/E2E (@e2e):
1. Criar faixa de desconto 5% para 0-50 pecas
2. Criar faixa de desconto 15% para 51-999999 pecas
3. Verificar desconto 5% aplicado no pedido com 30 pecas
4. Verificar desconto 15% aplicado no pedido com 100 pecas
5. Tentar desconto 25% (acima do maximo) — deve limitar a 15%

API (@api):
1. GET /rest/desconto-comercial — retorna faixas criadas

Aprova este plano?
```

Responda **"sim"** ou peca ajustes.

### Passo 6: Claude gera os testes

O Claude cria os arquivos `.spec.ts` automaticamente. Voce vera as mensagens de criacao dos arquivos.

### Passo 7: Claude tenta executar

Se o sistema estiver rodando, o Claude pergunta:

```
O sistema IGS esta rodando localmente? Posso executar os testes agora?
```

Se voce disser sim, ele roda e mostra o resultado. Se disser nao, os testes ficam prontos para voce rodar depois.

---

## 7. Executando os testes

### Rodar todos os testes de uma tarefa

```bash
cd ~/repo/geo-codex/geo-qa/tests
npx playwright test --grep "QUA-1234"
```

### Rodar com o navegador visivel (recomendado para debug)

```bash
npx playwright test --grep "QUA-1234" --headed
```

Isso abre o Chrome e voce ve o teste acontecendo em tempo real.

### Rodar por sistema

```bash
# So testes do IGS
npx playwright test --project=vaadin6

# So testes do CRM360
npx playwright test --project=vaadin24

# So testes do Pedidos
npx playwright test --project=pedidos
```

### Rodar por nivel

```bash
# So testes de tela (E2E)
npx playwright test --grep @e2e

# So testes de API
npx playwright test --grep @api
```

### Ver relatorio HTML

Apos rodar os testes, abra o relatorio visual:

```bash
npx playwright show-report
```

Abre uma pagina no navegador com:
- Lista de testes que passaram e falharam
- Screenshots dos erros
- Tempo de execucao
- Videos (em caso de falha)

### Entendendo o resultado

```
Running 5 tests using 1 worker

  ✓  deve criar faixa de desconto 5% (12s)
  ✓  deve criar faixa de desconto 15% (8s)
  ✓  deve aplicar desconto 5% no pedido (15s)
  ✗  deve aplicar desconto 15% no pedido (20s)        ← FALHOU
  ✓  deve limitar desconto acima do maximo (10s)

  4 passed
  1 failed
```

- **✓** = Teste passou (funcionalidade OK)
- **✗** = Teste falhou (possivel bug)

---

## 8. Quando o teste encontra um problema

### Passo 1: Coletar evidencias

Quando um teste falha, o Playwright gera automaticamente:
- **Screenshot** da tela no momento da falha (em `test-results/`)
- **Video** da execucao (se configurado)
- **Log** com detalhes do erro

Para ver tudo organizado:
```bash
npx playwright show-report
```

### Passo 2: Analisar o erro

Abra o relatorio e clique no teste que falhou. Voce vera:
- A linha exata que falhou
- O que era esperado vs o que aconteceu
- Screenshot da tela

**Exemplos comuns de falha:**

| Erro | Significado |
|------|-------------|
| `Expected "5%" but received "0%"` | O desconto nao foi aplicado |
| `Timeout waiting for element` | A tela nao carregou ou o elemento nao apareceu |
| `Element not found` | O botao/campo nao existe (pode ter mudado) |
| `Status 500` | O backend retornou erro |

### Passo 3: Devolver para o desenvolvedor

1. **Abra a tarefa QUA no Jira**

2. **Adicione um comentario com as evidencias:**

```
Teste automatizado falhou no cenario:
"deve aplicar desconto 15% no pedido"

Erro: Expected desconto "15%" but received "0%"

Passos para reproduzir:
1. Configurar faixa de desconto 15% para 51-999999 pecas
2. Criar pedido com 100 pecas
3. O desconto deveria ser 15% mas aparece 0%

Screenshot: [anexar imagem de test-results/]
Log completo: [colar saida do terminal]

Teste em: geo-codex/geo-qa/tests/vaadin6/features/QUA-1234-desconto-comercial.spec.ts
```

3. **Mova a tarefa de volta para "To Do"** (ou o status equivalente no board de QA)

4. **Aguarde a correcao do dev**

### Passo 4: Re-testar apos correcao

Quando o dev corrigir e avisar:

1. Atualize o codigo local:
```bash
cd ~/repo/geo-codex
git pull
```

2. Rode os testes novamente:
```bash
cd geo-qa/tests
npx playwright test --grep "QUA-1234"
```

3. Se passar, siga para finalizacao. Se falhar novamente, repita o ciclo.

---

## 9. Finalizando a tarefa

Quando TODOS os testes passarem:

### Passo 1: Commitar os testes

Abra o Codex e use o comando de commit:

```bash
cd ~/repo/geo-codex
claude
```

```
/commit
```

O Claude vai gerar um commit como:
```
test(QUA-1234): testes de desconto comercial
```

### Passo 2: Push para o repositorio

O Claude pergunta se pode fazer push. Responda sim.

### Passo 3: Registrar no Jira

Na tarefa QUA-1234, adicione um comentario final:

```
Testes automatizados gerados e aprovados.

Cobertura:
- 5 testes E2E (tela de desconto comercial + criacao de pedido)
- 1 teste API (endpoint de desconto)

Todos os testes passando.

Arquivo: geo-qa/tests/vaadin6/features/QUA-1234-desconto-comercial.spec.ts
```

### Passo 4: Mover tarefa para "Done"

Mova a tarefa QUA-1234 para Done no board de qualidade.

---

## 10. Referencia rapida de comandos

### Comandos do Codex

| Comando | O que faz |
|---------|-----------|
| `/qa-test QUA-1234` | Gera testes para tarefa Jira |
| `/qa-test` | Modo livre (sem tarefa) |
| `/commit` | Commita e faz push dos testes |

### Comandos do terminal

| Comando | O que faz |
|---------|-----------|
| `npx playwright test` | Roda todos os testes |
| `npx playwright test --grep "QUA-1234"` | Roda testes de uma tarefa |
| `npx playwright test --headed` | Roda com browser visivel |
| `npx playwright test --project=vaadin6` | Roda so testes do IGS |
| `npx playwright test --project=vaadin24` | Roda so testes do CRM360 |
| `npx playwright test --project=pedidos` | Roda so testes do Pedidos |
| `npx playwright test --grep @e2e` | Roda so testes de tela |
| `npx playwright test --grep @api` | Roda so testes de API |
| `npx playwright show-report` | Abre relatorio HTML |

### Atalhos uteis

```bash
# Atualizar repositorio
cd ~/repo/geo-codex && git pull

# Ver testes disponiveis
cd ~/repo/geo-codex/geo-qa/tests && npx playwright test --list

# Rodar um teste especifico
npx playwright test --grep "nome do teste"

# Rodar com debug (para quando algo nao funciona)
npx playwright test --grep "QUA-1234" --headed --debug
```

---

## 11. Perguntas frequentes

### "Preciso saber programar?"

Nao. O Claude gera todo o codigo. Voce so precisa descrever o que testar e rodar os comandos.

### "E se o teste gerado estiver errado?"

Peca ao Claude para ajustar. Diga algo como:
```
O teste "deve aplicar desconto" esta clicando no botao errado.
O botao correto se chama "Salvar Desconto", nao "Salvar".
```

O Claude corrige automaticamente.

### "E se eu nao souber responder uma pergunta do Claude?"

Diga que nao sabe. O Claude vai reformular a pergunta ou sugerir opcoes. Exemplo:
```
Claude: Quais cenarios de erro preciso testar?
Voce:   Nao tenho certeza. O que voce sugere baseado nas PRs?
Claude: Baseado no codigo, sugiro testar:
        A) Campo vazio
        B) Valor negativo
        C) Permissao insuficiente
        Quais desses fazem sentido?
```

### "Posso rodar os testes sem o sistema rodando?"

Nao para testes E2E e API — eles precisam do sistema rodando. Testes de code-level podem rodar sem o sistema.

### "E se o teste passar mas eu sei que tem bug?"

Conte ao Claude e peca para gerar um teste mais especifico:
```
O teste passou mas sei que quando o cliente tem CNPJ invalido da erro.
Gera um teste para esse cenario.
```

### "Posso editar os testes manualmente?"

Pode, mas nao eh necessario. Se precisar de ajustes, peca ao Claude. Os arquivos `.spec.ts` estao em `geo-qa/tests/[sistema]/features/`.

### "E se eu precisar testar algo que nao tem tarefa Jira?"

Use o modo livre:
```
/qa-test
```

O Claude vai perguntar o que voce quer testar.

### "Como sei quais testes ja existem?"

```bash
cd ~/repo/geo-codex/geo-qa/tests
npx playwright test --list
```

Ou veja os arquivos:
```bash
ls geo-qa/tests/vaadin6/features/
ls geo-qa/tests/vaadin24/features/
ls geo-qa/tests/pedidos/features/
```

---

## 12. Resolucao de problemas

### "Erro: No tests found"

**Causa:** Nenhum arquivo `.spec.ts` corresponde ao filtro.

**Solucao:** Verifique o nome correto:
```bash
npx playwright test --list | grep "QUA-1234"
```

### "Erro: VAADIN6_USER must be set"

**Causa:** Credenciais nao configuradas.

**Solucao:** Verifique se o arquivo `.env` existe e tem as credenciais:
```bash
cat ~/repo/geo-codex/geo-qa/tests/.env
```

Se nao existir, crie:
```bash
cd ~/repo/geo-codex/geo-qa/tests
cp .env.example .env
# Edite o .env com suas credenciais
```

### "Erro: Timeout waiting for selector"

**Causa:** O sistema nao esta rodando ou esta lento.

**Solucao:**
1. Verifique se o sistema esta rodando no navegador
2. Tente rodar com browser visivel para ver o que acontece:
   ```bash
   npx playwright test --grep "QUA-1234" --headed
   ```

### "Erro: net::ERR_CONNECTION_REFUSED"

**Causa:** O sistema nao esta acessivel na URL configurada.

**Solucao:** Verifique:
1. O sistema esta rodando?
2. A porta esta correta no `.env`?
3. Tente acessar a URL no navegador

### "Erro: Could not find Chromium"

**Causa:** Browser nao instalado.

**Solucao:**
```bash
cd ~/repo/geo-codex/geo-qa/tests
npx playwright install chromium
```

### "O Claude nao encontra o comando /qa-test"

**Causa:** Plugin nao instalado.

**Solucao:**
```bash
claude
# Dentro do Codex:
/plugin install geo-qa
```

### "Os testes passam na minha maquina mas falham na do colega"

**Causas possiveis:**
1. Dados diferentes no banco local
2. Versao diferente do sistema
3. Credenciais diferentes

**Solucao:** Comparar os arquivos `.env` e a versao dos sistemas.

---

## Proximos passos

Depois de dominar o basico:

1. **Explore os testes existentes** — veja como sao escritos para entender o padrao
2. **Rode os testes migrados** — ja existem 11 testes prontos do antigo Selenium
3. **Gere seu primeiro teste** — use `/qa-test` com uma tarefa real
4. **Compartilhe com o time** — ajude outros QAs a comecar

Duvidas? Abra uma issue em https://github.com/tecnologia-ibtech/geo-codex/issues
