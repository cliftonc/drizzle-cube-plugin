---
name: dc-query
description: Build a semantic query interactively for Drizzle Cube (for users who know the schema)
allowed-tools:
  - Read
  - Glob
  - Grep
---

# Direct Query Building

Help me build a semantic query for Drizzle Cube.

> **Tip**: If the user describes their query in natural language instead of providing specific cube/measure names, use `/dc-ai-query` for AI-assisted query building. That workflow uses discover, suggest, and validate tools to convert natural language to queries.

## Arguments
- `$ARGUMENTS` - Natural language description of what to query (optional)

## Instructions

### 1. Get Available Cubes

**ALWAYS try MCP tools first - they provide live data from the running API:**

```
Use the `drizzle_cube_meta` MCP tool to fetch cube metadata
```

This returns all registered cubes with their measures, dimensions, and relationships.

**FALLBACK** (only if MCP unavailable):
- Search for `defineCube` in the codebase
- Or use curl: `curl -s $API_URL/meta -H "Authorization: Bearer $TOKEN"`

### 2. Analyze User Description

If the user provided a description (`$ARGUMENTS`), analyze it:
- "Count of orders by region" -> measures: count, dimensions: region
- "Revenue trend over time" -> measures: revenue, timeDimension with granularity
- "Top 10 customers by spend" -> measures: spend, dimensions: customer, order: desc, limit: 10
- "Employees named Alex" -> dimensions: name, email, filters: name contains 'alex'

### 3. Ask Clarifying Questions (if needed)

Only ask if the request is ambiguous:
- Which cube(s) should I query?
- What metrics (measures) do you want to see?
- How should the data be grouped (dimensions)?
- Any filters to apply?
- Time period or granularity needed?

### 4. Build the CubeQuery

```typescript
const query: CubeQuery = {
  measures: ['CubeName.measureName'],
  dimensions: ['CubeName.dimensionName'],
  timeDimensions: [{
    dimension: 'CubeName.createdAt',
    granularity: 'month',
    dateRange: ['2024-01-01', '2024-12-31']
  }],
  filters: [{
    member: 'CubeName.status',
    operator: 'equals',
    values: ['active']
  }],
  order: {
    'CubeName.measureName': 'desc'
  },
  limit: 100
}
```

### 5. Validate the Query

**ALWAYS use MCP tool for validation:**

```
Use the `drizzle_cube_dry_run` MCP tool with the query object
```

This validates the query and shows:
- `valid: true/false` - Is the query valid?
- `sql` - The generated SQL
- `cubesUsed` - Which cubes are involved
- `joinType` - How cubes are joined
- `complexity` - Query complexity rating

**FALLBACK** (only if MCP unavailable):
- Manually verify all fields exist in cube metadata
- Check filter operators match field types
- Verify date formats are correct (YYYY-MM-DD)

### 6. Execute the Query (if requested)

**Use MCP tool for execution:**

```
Use the `drizzle_cube_load` MCP tool with the query object
```

This executes the query and returns results with annotations.

**FALLBACK** (only if MCP unavailable):
```bash
curl -X POST http://localhost:4000/cubejs-api/v1/load \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"measures":["Sales.totalRevenue"],"dimensions":["Products.category"]}'
```

### 7. Offer Output Formats

**Query Object:**
```typescript
{
  measures: ['Sales.totalRevenue'],
  dimensions: ['Products.category'],
  order: { 'Sales.totalRevenue': 'desc' },
  limit: 10
}
```

**As AnalysisConfig (for dashboard portlets):**
```typescript
{
  version: 1,
  analysisType: 'query',
  activeView: 'chart',
  charts: {
    query: {
      chartType: 'bar',
      chartConfig: { xAxis: ['Products.category'], yAxis: ['Sales.totalRevenue'] },
      displayConfig: { showLegend: false }
    }
  },
  query: {
    measures: ['Sales.totalRevenue'],
    dimensions: ['Products.category'],
    order: { 'Sales.totalRevenue': 'desc' },
    limit: 10
  }
}
```

**As cURL (fallback only):**
```bash
curl -X POST http://localhost:4000/cubejs-api/v1/load \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"measures":["Sales.totalRevenue"],"dimensions":["Products.category"]}'
```

## MCP Tools Reference

### Direct Tools (This Workflow)

| Tool | Purpose |
|------|---------|
| `drizzle_cube_meta` | Get all cubes, measures, dimensions, relationships |
| `drizzle_cube_dry_run` | Validate query and preview generated SQL |
| `drizzle_cube_load` | Execute query and return results |
| `drizzle_cube_explain` | Get query execution plan for debugging |
| `drizzle_cube_batch` | Execute multiple queries in parallel |
| `drizzle_cube_config` | Check server configuration status |

### AI-Powered Tools (Use `/dc-ai-query` for these)

| Tool | Purpose |
|------|---------|
| `drizzle_cube_discover` | Find relevant cubes by topic/intent |
| `drizzle_cube_suggest` | Generate query from natural language |
| `drizzle_cube_validate` | Validate query with auto-corrections |
| `drizzle_cube_mcp_load` | Execute validated query |

## Output
- The complete CubeQuery object
- Explanation of what the query does
- Suggested chart type for visualization
- Optional: AnalysisConfig wrapper
- Query results (if executed)
