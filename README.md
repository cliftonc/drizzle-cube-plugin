# Drizzle Cube Plugin for Claude Code

A Claude Code plugin that provides MCP (Model Context Protocol) tools for interacting with [Drizzle Cube](https://github.com/cliftonc/drizzle-cube) semantic layer APIs.

## Features

This plugin provides the following MCP tools:

| Tool | Description |
|------|-------------|
| `drizzle_cube_meta` | Fetch cube metadata (measures, dimensions, relationships) |
| `drizzle_cube_dry_run` | Validate a query and preview generated SQL |
| `drizzle_cube_explain` | Get query execution plan with performance analysis |
| `drizzle_cube_load` | Execute a query and return results |
| `drizzle_cube_batch` | Execute multiple queries in parallel |
| `drizzle_cube_config` | View current configuration status |

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

The plugin connects to a Drizzle Cube API endpoint. Configure the API URL and optional authentication token using one of these methods (in priority order):

### 1. Project Configuration (recommended)

Create `.drizzle-cube.json` in your project directory:

```json
{
  "apiUrl": "http://localhost:3001/cubejs-api/v1",
  "apiToken": "your-optional-token"
}
```

### 2. Global Configuration

Create `~/.drizzle-cube/config.json`:

```json
{
  "apiUrl": "https://your-api.example.com/cubejs-api/v1",
  "apiToken": "your-token"
}
```

### 3. Environment Variables

```bash
export DRIZZLE_CUBE_API_URL="http://localhost:3001/cubejs-api/v1"
export DRIZZLE_CUBE_API_TOKEN="your-token"
```

## Usage Examples

Once installed, you can use the tools in Claude Code:

### Fetch Metadata

Ask Claude to fetch available cubes:

```
"What cubes are available in my Drizzle Cube API?"
```

Claude will use `drizzle_cube_meta` to retrieve metadata.

### Run Queries

Ask Claude to query your data:

```
"Show me total revenue by product category for the last month"
```

Claude will:
1. Use `drizzle_cube_meta` to understand available measures/dimensions
2. Use `drizzle_cube_dry_run` to validate the query
3. Use `drizzle_cube_load` to execute and return results

### Debug SQL

Ask Claude to show the generated SQL:

```
"What SQL would be generated for counting employees by department?"
```

Claude will use `drizzle_cube_dry_run` to show the SQL without executing.

## Requirements

- A running [Drizzle Cube](https://github.com/cliftonc/drizzle-cube) API endpoint
- Node.js 18+ (for running the MCP server)

## Related Projects

- [Drizzle Cube](https://github.com/cliftonc/drizzle-cube) - Drizzle ORM-first semantic layer with Cube.js compatibility
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM for SQL databases

## License

MIT
