---
name: create-mcp
description: "Creates an MCP server project to integrate an API or service with Codex. Use when the user wants to create an MCP server, wrap an API for Claude, connect an external service, or says /mcp."
allowed-tools: Read, Glob, Grep, Write, Bash(npm:*), Bash(npx:*), Bash(pip:*), WebFetch
---

# Create MCP Server

Generates a complete MCP server project that wraps an API or service for use with Codex.

## Step 1: Gather Input

Accept one of three input forms:

### Option A: OpenAPI/Swagger Spec

- User provides a URL or local file path to a JSON/YAML spec
- If URL: fetch with WebFetch
- If local file: read with Read
- Parse the spec to extract endpoints, parameters, and types

### Option B: API Documentation URL

- User provides a URL to API docs
- Fetch the page with WebFetch
- Extract endpoints, methods, parameters, and auth requirements from the content

### Option C: Manual Description

- User describes the API endpoints directly
- Ask structured questions:
  1. Base URL
  2. Authentication method
  3. Endpoints (method, path, parameters, response)

## Step 2: API Analysis

From the input, extract and organize:

| Field | Description |
|-------|-------------|
| Base URL | The API's root URL |
| Auth method | API Key, Bearer Token, OAuth, or none |
| Endpoints | List of method + path + description |
| Parameters | Path params, query params, request body with types |
| Response types | Expected response structure per endpoint |

Present a summary table:

```
| # | Method | Path            | Description      | Suggested Tool Name |
|---|--------|-----------------|------------------|---------------------|
| 1 | GET    | /users/{id}     | Get user by ID   | get-user            |
| 2 | POST   | /users          | Create a user    | create-user         |
| 3 | GET    | /orders         | List orders      | list-orders         |
```

Tool naming rules:
- Kebab-case
- Verb-noun format: `get-user`, `list-orders`, `create-invoice`
- `GET` single → `get-<resource>`
- `GET` list → `list-<resources>`
- `POST` → `create-<resource>`
- `PUT/PATCH` → `update-<resource>`
- `DELETE` → `delete-<resource>`

## Step 3: Tool Selection

Ask the user which endpoints to include as MCP tools:

> Which endpoints should be exposed as MCP tools? You can:
> - Select all (default)
> - List numbers to include (e.g., "1, 3, 5")
> - List numbers to exclude (e.g., "all except 4")

## Step 4: Stack Choice

Ask the user:

> Which language for the MCP server?
> 1. **TypeScript** (recommended) — uses `@modelcontextprotocol/sdk`
> 2. **Python** — uses `mcp` package

## Step 5: Generate Project

### TypeScript Structure

```
mcp-<name>/
├── src/
│   ├── index.ts           # Server setup, tool registration, stdio transport
│   ├── tools/
│   │   └── <tool-name>.ts # One file per tool
│   └── types.ts           # Shared TypeScript interfaces from API types
├── package.json
├── tsconfig.json
└── README.md
```

**`package.json`:**
- Dependencies: `@modelcontextprotocol/sdk`, `zod`
- DevDependencies: `typescript`, `tsx`, `@types/node`
- Scripts: `"build": "tsc"`, `"start": "node dist/index.js"`, `"dev": "tsx src/index.ts"`

**`tsconfig.json`:**
- `strict: true`
- `module: "Node16"`, `moduleResolution: "Node16"`
- `target: "ES2022"`
- `outDir: "./dist"`

**`src/index.ts`:**
- Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
- Import `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`
- Create server instance with name and version
- Register each tool with `server.tool(name, description, schema, handler)`
- Connect via `server.connect(new StdioServerTransport())`

**`src/tools/<tool-name>.ts`:**
- Export a function that makes the HTTP request
- Use native `fetch`
- Accept typed parameters, return typed response
- Handle errors with descriptive messages

**`src/types.ts`:**
- TypeScript interfaces for API request/response types
- Inferred from the spec or documentation

### Python Structure

```
mcp-<name>/
├── src/
│   ├── __init__.py
│   ├── server.py          # Server setup, tool registration, stdio transport
│   └── tools/
│       ├── __init__.py
│       └── <tool_name>.py # One file per tool (snake_case)
├── pyproject.toml
└── README.md
```

**`pyproject.toml`:**
- Dependencies: `mcp`, `httpx`
- Build system: `hatchling`
- Entry point script for running the server

**`src/server.py`:**
- Import from `mcp.server.fastmcp`
- Create `FastMCP` instance
- Register tools with `@mcp.tool()` decorator
- Each tool has type hints and docstring (used as description)

**`src/tools/<tool_name>.py`:**
- Async function using `httpx`
- Type hints for parameters and return
- Docstring becomes the tool description

## Step 6: Authentication Setup

Based on detected auth method:

### API Key
- Environment variable: `<NAME>_API_KEY`
- Passed as header (typically `X-API-Key` or `Authorization: ApiKey ...`)
- Create `.env.example`:
  ```
  <NAME>_API_KEY=your-api-key-here
  ```

### Bearer Token
- Environment variable: `<NAME>_TOKEN`
- Passed as `Authorization: Bearer <token>`
- Create `.env.example`:
  ```
  <NAME>_TOKEN=your-token-here
  ```

### No Auth
- No environment variables needed
- Skip `.env.example`

**Important:** Never hardcode credentials. Always use environment variables.

## Step 7: Generate Configuration Snippet

Generate the Codex settings snippet for the user:

### TypeScript
```json
{
  "mcpServers": {
    "<name>": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/absolute/path/to/mcp-<name>",
      "env": {
        "<NAME>_API_KEY": "your-key-here"
      }
    }
  }
}
```

### Python
```json
{
  "mcpServers": {
    "<name>": {
      "command": "python",
      "args": ["-m", "src.server"],
      "cwd": "/absolute/path/to/mcp-<name>",
      "env": {
        "<NAME>_API_KEY": "your-key-here"
      }
    }
  }
}
```

Tell the user where to add it:
- **Project-level:** `.claude/settings.json` (recommended — scoped to this project)
- **Global:** `~/.claude/settings.json` (available in all projects)

## Step 8: Post-Generation

After creating all files:

1. **Install dependencies:**
   - TypeScript: `npm install`
   - Python: `pip install -e .`
2. **Verify the server starts** without errors (quick smoke test)
3. **Present summary:**
   ```
   MCP server created: mcp-<name>/

   Tools: <list of tool names>
   Auth: <method> via <ENV_VAR>

   To configure Codex, add to .claude/settings.json:
   <snippet>

   To test: npx tsx src/index.ts (or python -m src.server)
   ```

## Rules

- Always present the endpoint table for user selection before generating
- Never hardcode API keys or tokens
- One tool per file — keeps the codebase organized
- Use native `fetch` in TypeScript (no axios)
- Use `httpx` in Python (not `requests` — async support)
- Generate real types from the spec, not `any` or `dict`
- Include error handling in every tool (network errors, auth errors, API errors)
- The README should explain what the server does, how to build, and how to configure
