# Drizzle Cube Plugin

## Overview

This is a Claude Code plugin that integrates with [Drizzle Cube](https://github.com/cliftonc/drizzle-cube), a semantic layer for analytics built on Drizzle ORM.

## Architecture

The plugin registers a single **drizzle-cube** MCP server (stdio) that provides 8 tools:

**REST API tools** (proxy to `/cubejs-api/v1/*` endpoints):
- `drizzle_cube_meta` - Fetch cube metadata
- `drizzle_cube_dry_run` - Preview SQL without executing
- `drizzle_cube_explain` - Get execution plan
- `drizzle_cube_load` - Execute query
- `drizzle_cube_batch` - Execute multiple queries
- `drizzle_cube_config` - Check configuration status

**AI-powered tools** (proxy to `/mcp/*` endpoints):
- `drizzle_cube_discover` - Find relevant cubes by topic/intent
- `drizzle_cube_validate` - Validate query with auto-corrections

All tools use the server URL configured in `.drizzle-cube.json`.

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
│   ├── dc-cube-definition/SKILL.md
│   ├── dc-query-building/SKILL.md
│   ├── dc-chart-config/SKILL.md
│   ├── dc-dashboard-config/SKILL.md
│   └── dc-analysis-config/SKILL.md
├── .claude-plugin/
│   └── plugin.json       # Plugin marketplace metadata
├── .mcp.json             # MCP server registration (both servers)
├── package.json
└── README.md
```

## Key Files

### `.mcp.json`
Registers the single **drizzle-cube** MCP server (stdio).

### `src/index.ts`
The plugin's MCP server providing all 8 tools:

**REST API tools:**
- `drizzle_cube_meta` - Fetch cube metadata
- `drizzle_cube_dry_run` - Preview SQL without executing
- `drizzle_cube_explain` - Get execution plan
- `drizzle_cube_load` - Execute query
- `drizzle_cube_batch` - Execute multiple queries
- `drizzle_cube_config` - Check configuration status

**AI-powered tools:**
- `drizzle_cube_discover` - Find relevant cubes by topic/intent
- `drizzle_cube_validate` - Validate query with auto-corrections

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
1. Use `drizzle_cube_discover` to find relevant cubes by topic/intent
2. Build query from discover results
3. Use `drizzle_cube_validate` to check query and get auto-corrections
4. Use `drizzle_cube_load` to execute

### Direct Queries (`/dc-query`)
1. Use `drizzle_cube_meta` to see available cubes
2. Build query manually
3. Use `drizzle_cube_dry_run` to validate and preview SQL
4. Use `drizzle_cube_load` to execute

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

Current version: 2.0.1 (in both `package.json` and `.claude-plugin/plugin.json`)
