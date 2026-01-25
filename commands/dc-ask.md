---
name: dc-ask
description: Use AI-powered tools to build and execute analytics queries from natural language
allowed-tools:
  - Read
  - Glob
  - Grep
---

# AI-Powered Query Building

Help me analyze data using natural language. This workflow uses the real Drizzle Cube MCP server's AI-powered tools to discover relevant cubes, validate queries, and execute them.

## Arguments
- `$ARGUMENTS` - Natural language description of what you want to analyze (optional)

## Instructions

### When to Use This Workflow

Use this AI-powered workflow when:
- User asks in natural language: "Show me...", "What are the...", "How many..."
- User doesn't know the exact cube or measure names
- User wants to explore what data is available
- User describes what they want to analyze, not how to query it

**For direct queries** (when user knows specific cube.measure names), use `/dc-query` instead.

### Architecture Note

This workflow uses **two MCP servers**:
1. **drizzle-cube-api** (real MCP server): Provides AI-powered `discover`, `validate`, and `load` tools
2. **drizzle-cube** (plugin): Provides REST API tools like `drizzle_cube_meta`, `drizzle_cube_dry_run`

### 1. Discover Relevant Cubes

**FIRST**, find cubes that match the user's intent using the **real MCP server**:

```
Use the `discover` MCP tool (from drizzle-cube-api server):
- topic: Extract key topic (e.g., "sales", "employees", "productivity")
- intent: Pass the user's full question
```

This returns:
- `matches` - Cubes ranked by relevance score
- `suggestedMeasures` - Recommended measures for each cube
- `suggestedDimensions` - Recommended dimensions for each cube

**Example:**
```
discover({
  topic: "productivity",
  intent: "I want to see how productive our engineering team has been this quarter"
})
```

### 2. Build Query from Schema

**NEXT**, using the discover results, build a CubeQuery object yourself:

From the discover response, you have:
- Available cube names
- Suggested measures (e.g., `Productivity.totalLinesOfCode`)
- Suggested dimensions (e.g., `Employees.name`, `Employees.department`)

Construct a query object with:
```json
{
  "measures": ["Productivity.totalLinesOfCode"],
  "dimensions": ["Employees.name"],
  "timeDimensions": [{
    "dimension": "Productivity.date",
    "granularity": "quarter",
    "dateRange": "last quarter"
  }]
}
```

**Tips for query construction:**
- Use measure names exactly as returned by discover
- Include relevant dimensions for grouping
- Add timeDimensions for time-based analysis
- Add filters if the user specified conditions

### 3. Validate the Query

**THEN**, check the query for errors and get auto-corrections using the **real MCP server**:

```
Use the `validate` MCP tool (from drizzle-cube-api server):
- query: The query object you built in step 2
```

This returns:
- `valid` - Whether the query is valid
- `correctedQuery` - Auto-corrected query if issues were found
- `issues` - List of problems detected
- `suggestions` - Helpful suggestions

**Example:**
```
validate({
  query: {
    measures: ["Productivity.totalLinesOfCode"],
    dimensions: ["Employees.name"],
    timeDimensions: [{
      dimension: "Productivity.date",
      granularity: "quarter",
      dateRange: "last quarter"
    }]
  }
})
```

### 4. Execute the Query

**FINALLY**, run the validated query using the **real MCP server**:

```
Use the `load` MCP tool (from drizzle-cube-api server):
- query: The validated/corrected query
```

This returns:
- `data` - Query results
- `annotation` - Metadata about measures and dimensions

### Workflow Summary

```
User: "How productive was engineering this quarter?"
        ↓
[1] discover({ topic: "productivity", intent: "..." })
        ↓ (found: Productivity cube, Employees cube)
[2] AI builds query from discover results
        ↓ (constructed query with measures, dimensions, time)
[3] validate({ query: ... })
        ↓ (valid, no corrections needed)
[4] load({ query: ... })
        ↓
Results displayed to user
```

## MCP Tools Reference

### AI-Powered Tools (from drizzle-cube-api server)

| Tool | Purpose |
|------|---------|
| `discover` | Find relevant cubes by topic/intent |
| `validate` | Validate query with auto-corrections |
| `load` | Execute validated query |

### REST API Tools (from drizzle-cube plugin)

| Tool | Purpose |
|------|---------|
| `drizzle_cube_meta` | Get all cubes, measures, dimensions |
| `drizzle_cube_dry_run` | Validate query and preview SQL |
| `drizzle_cube_load` | Execute query directly via REST API |

## Error Handling

If **discover** returns no matches:
- Try broader topics
- Use `drizzle_cube_meta` to see all available cubes

If **validate** finds issues:
- Use the `correctedQuery` if provided
- Show `issues` to user and ask for clarification

If query construction is unclear:
- Ask user for clarification
- Fall back to `/dc-query` for manual query building with full schema

## Output

After successful execution:
1. Display the query results in a clear format
2. Show the generated query for reference
3. Suggest a chart type for visualization
4. Offer to save as AnalysisConfig for dashboards
