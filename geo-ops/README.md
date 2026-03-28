# geo-ops

Plugin de integrações operacionais para o Geovendas.

## Descrição

Gerencia tarefas no quadro Jira GEO, executa consultas PostgreSQL de leitura e realiza deploys no Firebase Hosting.

## Skills

- **jira-geo**: Gerencia transições, campos e comentários no quadro Jira GEO
- **jira-geo-task**: Lê, planeja e implementa tarefas GEO completas, lendo AGENTS.md e agentes do projeto (usa modelo Opus)
- **postgres**: Executa consultas de leitura no PostgreSQL com suporte a templates
- **firebase-deploy**: Compila o projeto e realiza deploy no Firebase Hosting

## Comandos

- `/jira-geo`: Iniciar gerenciamento de tarefas no Jira GEO
- `/jira-geo-task`: Implementar uma tarefa Jira do projeto GEO
- `/postgres`: Executar consultas SQL read-only no PostgreSQL
- `/firebase-deploy`: Compilar e fazer deploy no Firebase Hosting

## Configuração

O skill postgres requer um arquivo `connections.json` na raiz do projeto com as credenciais do banco de dados.

Veja `geo-ops/skills/postgres/connections.example.json` para um exemplo de configuração.

## Autor

IBTech - Geovendas
