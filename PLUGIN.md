# Drizzle Cube Plugin

This plugin provides Claude with tools to interact with Drizzle Cube semantic layer APIs for analytics and dashboard building.

## Configuration

The plugin connects to a Drizzle Cube server. Configure the server URL in one of these locations (in priority order):

1. **Project config**: `.drizzle-cube.json` in your project directory
2. **Global config**: `~/.drizzle-cube/config.json`
3. **Environment variables**: `DRIZZLE_CUBE_SERVER_URL`, `DRIZZLE_CUBE_API_TOKEN`

### Config Format

```json
{
  "serverUrl": "http://localhost:3001",
  "apiToken": "your-optional-auth-token"
}
```

**Note**: The old `apiUrl` format with `/cubejs-api/v1` path is still supported for backward compatibility.

## When to Use Which Tools

### AI-Powered Workflow (Natural Language)

Use when the user describes what they want in natural language:
- "Show me sales trends"
- "How many employees do we have?"
- "What was our productivity this quarter?"

**Workflow:**
1. `drizzle_cube_discover` - Find relevant cubes by topic/intent
2. `drizzle_cube_suggest` - Generate query from natural language
3. `drizzle_cube_validate` - Check and auto-correct the query
4. `drizzle_cube_mcp_load` - Execute the validated query

**Command:** `/dc-ai-query`

### Direct Workflow (Known Schema)

Use when the user provides specific cube, measure, or dimension names:
- "Query Employees.count"
- "Get Sales.totalRevenue by Products.category"
- "Run this query: { measures: [...] }"

**Workflow:**
1. `drizzle_cube_meta` - Get schema reference (if needed)
2. `drizzle_cube_dry_run` - Preview SQL (optional)
3. `drizzle_cube_load` - Execute query directly

**Command:** `/dc-query`

## Available Tools

### Direct API Tools

| Tool | Endpoint | Purpose |
|------|----------|---------|
| `drizzle_cube_meta` | `/cubejs-api/v1/meta` | Fetch cube metadata |
| `drizzle_cube_dry_run` | `/cubejs-api/v1/dry-run` | Validate query, preview SQL |
| `drizzle_cube_explain` | `/cubejs-api/v1/explain` | Get execution plan |
| `drizzle_cube_load` | `/cubejs-api/v1/load` | Execute a query |
| `drizzle_cube_batch` | `/cubejs-api/v1/batch` | Execute multiple queries |
| `drizzle_cube_config` | (local) | Check configuration status |

### AI-Powered MCP Tools

| Tool | Endpoint | Purpose |
|------|----------|---------|
| `drizzle_cube_discover` | `/mcp/discover` | Find cubes by topic/intent |
| `drizzle_cube_suggest` | `/mcp/suggest` | NL to query conversion |
| `drizzle_cube_validate` | `/mcp/validate` | Validate with corrections |
| `drizzle_cube_mcp_load` | `/mcp/load` | Execute validated query |

## Quick Reference

### Check Configuration
```
drizzle_cube_config()
```

### Get Schema
```
drizzle_cube_meta()
```

### AI Query Workflow
```
1. drizzle_cube_discover({ topic: "sales", intent: "revenue by region" })
2. drizzle_cube_suggest({ naturalLanguage: "total revenue by region for 2024" })
3. drizzle_cube_validate({ query: suggestedQuery })
4. drizzle_cube_mcp_load({ query: validatedQuery })
```

### Direct Query
```
drizzle_cube_load({
  query: {
    measures: ["Sales.totalRevenue"],
    dimensions: ["Sales.region"],
    timeDimensions: [{
      dimension: "Sales.date",
      dateRange: ["2024-01-01", "2024-12-31"]
    }]
  }
})
```

## Commands

| Command | Purpose |
|---------|---------|
| `/dc-ai-query` | AI-powered natural language query building |
| `/dc-query` | Direct query building (when you know the schema) |
| `/dc-setup` | Configure plugin settings |
| `/dc-create-cube` | Create a new cube definition |
| `/dc-create-dashboard` | Create a dashboard configuration |
| `/dc-add-chart` | Add a chart to an existing dashboard |
| `/dc-debug` | Debug queries and troubleshoot issues |

## Skills

The plugin includes skills that provide reference knowledge for:
- Query building syntax and patterns
- Dashboard and chart configuration
- Cube definition structure
- Analysis config format

Skills are automatically used by commands when needed.
