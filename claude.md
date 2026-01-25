# Drizzle Cube Plugin

## Overview

This is a Claude Code plugin that integrates with [Drizzle Cube](https://github.com/cliftonc/drizzle-cube), a semantic layer for analytics built on Drizzle ORM.

## Architecture

The plugin registers **two MCP servers**:

1. **drizzle-cube-api** (URL-based) - The real Drizzle Cube MCP server
   - Endpoint: `https://try.drizzle-cube.dev/mcp` (default)
   - Tools: `discover`, `validate`, `load`
   - Provides AI-powered query building

2. **drizzle-cube** (stdio plugin) - This plugin's REST API tools
   - Tools: `drizzle_cube_meta`, `drizzle_cube_dry_run`, `drizzle_cube_explain`, `drizzle_cube_load`, `drizzle_cube_batch`, `drizzle_cube_config`
   - Provides direct REST API access for debugging

## Directory Structure

```
drizzle-cube-plugin/
├── src/
│   └── index.ts          # MCP server implementation (REST API tools only)
├── dist/
│   └── index.js          # Compiled MCP server
├── commands/             # Slash commands (/dc-*)
│   ├── dc-setup.md       # Configure server URL and verify connectivity
│   ├── dc-ask.md         # Natural language queries (AI-powered)
│   ├── dc-query.md       # Direct schema-aware queries
│   ├── dc-debug.md       # SQL preview and execution plans
│   ├── dc-create-cube.md # Create cube definitions
│   ├── dc-create-dashboard.md
│   └── dc-add-chart.md
├── skills/               # Reference documentation skills
│   ├── dc-cube-definition.md
│   ├── dc-query-building.md
│   ├── dc-chart-config.md
│   ├── dc-dashboard-config.md
│   └── dc-analysis-config.md
├── .claude-plugin/
│   └── plugin.json       # Plugin marketplace metadata
├── .mcp.json             # MCP server registration (both servers)
├── package.json
└── README.md
```

## Key Files

### `.mcp.json`
Registers both MCP servers. The `drizzle-cube-api` URL can be changed to point to a different Drizzle Cube server.

### `src/index.ts`
The plugin's MCP server providing 6 REST API tools:
- `drizzle_cube_meta` - Fetch cube metadata
- `drizzle_cube_dry_run` - Preview SQL without executing
- `drizzle_cube_explain` - Get execution plan
- `drizzle_cube_load` - Execute query via REST
- `drizzle_cube_batch` - Execute multiple queries
- `drizzle_cube_config` - Check configuration status

### Configuration
The plugin reads config from (in priority order):
1. `.drizzle-cube.json` in project directory
2. `~/.drizzle-cube/config.json` (global)
3. Environment variables (`DRIZZLE_CUBE_SERVER_URL`, `DRIZZLE_CUBE_API_TOKEN`)

Config format:
```json
{
  "serverUrl": "https://try.drizzle-cube.dev",
  "apiToken": "optional-token"
}
```

## Workflows

### Natural Language Queries (`/dc-ask`)
1. Use `discover` (from drizzle-cube-api) to find relevant cubes
2. Build query from discover results
3. Use `validate` to check query
4. Use `load` to execute

### Direct Queries (`/dc-query`)
1. Use `drizzle_cube_meta` to see available cubes
2. Build query manually
3. Use `drizzle_cube_load` to execute

### Debugging (`/dc-debug`)
1. Use `drizzle_cube_dry_run` to preview SQL
2. Use `drizzle_cube_explain` for execution plan

## Development

```bash
npm install
npm run build    # Compile TypeScript with esbuild
npm start        # Run the MCP server
```

## Version

Current version: 2.0.0 (in both `package.json` and `.claude-plugin/plugin.json`)
