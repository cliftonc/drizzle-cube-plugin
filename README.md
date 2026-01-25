# Drizzle Cube Plugin for Claude Code

A Claude Code plugin that provides MCP (Model Context Protocol) tools for interacting with [Drizzle Cube](https://github.com/cliftonc/drizzle-cube) semantic layer APIs.

## Features

This plugin registers **two MCP servers** for a complete Drizzle Cube integration:

### AI-Powered Tools (from real Drizzle Cube MCP server)

| Tool | Description |
|------|-------------|
| `discover` | Find relevant cubes by topic or natural language intent |
| `validate` | Validate queries with auto-corrections |
| `load` | Execute validated queries |

### REST API Tools (from plugin)

| Tool | Description |
|------|-------------|
| `drizzle_cube_meta` | Fetch cube metadata (measures, dimensions, relationships) |
| `drizzle_cube_dry_run` | Validate a query and preview generated SQL |
| `drizzle_cube_explain` | Get query execution plan with performance analysis |
| `drizzle_cube_load` | Execute a query directly via REST API |
| `drizzle_cube_batch` | Execute multiple queries in parallel |
| `drizzle_cube_config` | View current configuration status |

## Architecture

```
┌─────────────────────┐     ┌──────────────────────────────────┐
│  Claude Code        │     │  Drizzle Cube Server             │
│                     │     │                                  │
│  MCP Servers:       │     │  /mcp (MCP endpoint)             │
│  - drizzle-cube-api ├────►│    - discover                    │
│    (HTTP to /mcp)   │     │    - validate                    │
│                     │     │    - load                        │
│  - drizzle-cube     │     │    + prompts, resources          │
│    (stdio plugin)   │     │                                  │
│    - meta           ├────►│  /cubejs-api/v1 (REST API)       │
│    - dry_run        │     │    - meta, dry-run, explain      │
│    - explain        │     │    - load, batch                 │
│    - load           │     │                                  │
│    - batch          │     └──────────────────────────────────┘
│    - config         │
└─────────────────────┘
```

**Why two servers?**
- The real Drizzle Cube MCP server provides AI-powered tools with prompts and resources
- The plugin provides direct REST API access for debugging, SQL preview, and batch queries

## Installation

### From GitHub

```bash
/plugin install cliftonc/drizzle-cube-plugin
```

### Local Development

```bash
git clone https://github.com/cliftonc/drizzle-cube-plugin.git
cd drizzle-cube-plugin
npm install
npm run build
/plugin install ./drizzle-cube-plugin
```

## Configuration

The plugin works out of the box with the demo server at `https://try.drizzle-cube.dev`.

### Quick Start

No configuration needed for the demo server. Just install and use:

```
/dc-ask "show me productivity by employee"
```

### Custom Server Configuration

To use your own Drizzle Cube server, configure both the MCP server URL and REST API URL:

#### 1. MCP Server (in `.mcp.json`)

The plugin's `.mcp.json` registers the real MCP server. Update the URL to point to your server:

```json
{
  "mcpServers": {
    "drizzle-cube-api": {
      "type": "url",
      "url": "https://your-server.com/mcp"
    },
    "drizzle-cube": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/index.js"]
    }
  }
}
```

#### 2. REST API (in `.drizzle-cube.json`)

Create `.drizzle-cube.json` in your project directory:

```json
{
  "serverUrl": "https://your-server.com",
  "apiToken": "your-optional-token"
}
```

Or create a global config at `~/.drizzle-cube/config.json`.

#### 3. Environment Variables (alternative)

```bash
export DRIZZLE_CUBE_SERVER_URL="https://your-server.com"
export DRIZZLE_CUBE_API_TOKEN="your-token"
```

### Configuration Priority

1. `.drizzle-cube.json` in current project directory
2. `~/.drizzle-cube/config.json` (global)
3. Environment variables

## Available Commands

| Command | Description |
|---------|-------------|
| `/dc-setup` | Configure server URL and verify connectivity |
| `/dc-ask` | Query data using natural language (AI-powered) |
| `/dc-query` | Build queries with full schema awareness |
| `/dc-debug` | Debug queries with SQL preview and execution plans |
| `/dc-create-cube` | Create new cube definitions |
| `/dc-create-dashboard` | Create dashboard configurations |
| `/dc-add-chart` | Add charts to existing dashboards |

## Usage Examples

### Natural Language Queries (AI-powered)

Ask questions in plain English:

```
/dc-ask "show me total revenue by product category for last month"
```

This uses the `discover` → `validate` → `load` workflow from the real MCP server.

### Direct Queries (schema-aware)

When you know the cube structure:

```
/dc-query
```

This uses `drizzle_cube_meta` to show available cubes, then `drizzle_cube_load` to execute.

### Debug SQL

Preview the generated SQL without executing:

```
/dc-debug
```

This uses `drizzle_cube_dry_run` and `drizzle_cube_explain` for SQL preview and execution plans.

### Check Configuration

```
/dc-setup
```

Verify your server connection and see available endpoints.

## Skills (Documentation Reference)

The plugin includes 5 skills for documentation on Drizzle Cube concepts:

- `dc-cube-definition` - Creating cube definitions
- `dc-query-building` - Building semantic queries
- `dc-chart-config` - Configuring chart visualizations
- `dc-dashboard-config` - Creating dashboard layouts
- `dc-analysis-config` - Configuring analysis modes

## Requirements

- A running [Drizzle Cube](https://github.com/cliftonc/drizzle-cube) API endpoint (or use the demo server)
- Node.js 18+ (for running the plugin MCP server)

## Related Projects

- [Drizzle Cube](https://github.com/cliftonc/drizzle-cube) - Drizzle ORM-first semantic layer with Cube.js compatibility
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM for SQL databases

## License

MIT
