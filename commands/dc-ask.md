---
name: dc-ask
description: Use AI-powered tools to build and execute analytics queries from natural language
allowed-tools:
  - Read
  - Glob
  - Grep
---

# AI-Powered Query Building

Help me analyze data using natural language. This workflow uses the Drizzle Cube plugin's AI-powered tools to discover relevant cubes, validate queries, and execute them.

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

### 1. Discover Relevant Cubes

**FIRST**, find cubes that match the user's intent:

```
Use the `drizzle_cube_discover` tool:
- topic: Extract key topic (e.g., "sales", "employees", "productivity")
- intent: Pass the user's full question
```

This returns:
- `matches` - Cubes ranked by relevance score
- `suggestedMeasures` - Recommended measures for each cube
- `suggestedDimensions` - Recommended dimensions for each cube

**Example:**
```
drizzle_cube_discover({
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

#### Cross-Cube Joins

Cubes have relationships (joins) defined between them. You can use dimensions from joined cubes directly in your query without separate lookups:

```json
{
  "measures": ["Employees.count"],
  "filters": [{"member": "Departments.name", "operator": "equals", "values": ["Engineering"]}]
}
```

This works because Employees has a `belongsTo` relationship to Departments. The semantic layer automatically handles the SQL join.

**Key principle:** If you need to filter by a human-readable name (like "Engineering") instead of an ID, check if there's a joined cube with that dimension and filter directly on it.

#### Time Dimension Filtering

There are two ways to filter by time:

**Method 1: Using timeDimensions (for time-series aggregation)**
```json
{
  "measures": ["Sales.totalRevenue"],
  "timeDimensions": [{
    "dimension": "Sales.createdAt",
    "granularity": "month",
    "dateRange": "last quarter"
  }]
}
```

**Method 2: Using filters (for simple date filtering)**
```json
{
  "measures": ["Sales.totalRevenue"],
  "filters": [
    {"member": "Sales.createdAt", "operator": "inDateRange", "values": ["2024-01-01", "2024-03-31"]}
  ]
}
```

**Predefined date ranges:** `"last 7 days"`, `"last month"`, `"last quarter"`, `"this year"`, `"from 1 year ago to now"`

**Date operators:** `inDateRange`, `beforeDate`, `afterDate`

### 3. Validate the Query

**THEN**, check the query for errors and get auto-corrections:

```
Use the `drizzle_cube_validate` tool:
- query: The query object you built in step 2
```

This returns:
- `valid` - Whether the query is valid
- `correctedQuery` - Auto-corrected query if issues were found
- `issues` - List of problems detected
- `suggestions` - Helpful suggestions

**Example:**
```
drizzle_cube_validate({
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

**FINALLY**, run the validated query:

```
Use the `drizzle_cube_load` tool:
- query: The validated/corrected query
```

This returns:
- `data` - Query results
- `annotation` - Metadata about measures and dimensions

### Workflow Summary

```
User: "How many people are in the engineering department?"
        |
[1] drizzle_cube_discover({ topic: "employees", intent: "..." })
        | (found: Employees cube with Departments join)
[2] AI builds query using cross-cube filter
        | { measures: ["Employees.count"],
        |   filters: [{ member: "Departments.name", operator: "equals", values: ["Engineering"] }] }
[3] drizzle_cube_validate({ query: ... })
        | (valid, no corrections needed)
[4] drizzle_cube_load({ query: ... })
        |
Results displayed to user (single query, no ID lookup needed)
```

## MCP Tools Reference

### AI-Powered Tools

| Tool | Purpose |
|------|---------|
| `drizzle_cube_discover` | Find relevant cubes by topic/intent |
| `drizzle_cube_validate` | Validate query with auto-corrections |

### REST API Tools

| Tool | Purpose |
|------|---------|
| `drizzle_cube_meta` | Get all cubes, measures, dimensions |
| `drizzle_cube_dry_run` | Validate query and preview SQL |
| `drizzle_cube_load` | Execute query |
| `drizzle_cube_batch` | Execute multiple queries in parallel |

## Error Handling

If **drizzle_cube_discover** returns no matches:
- Try broader topics
- Use `drizzle_cube_meta` to see all available cubes

If **drizzle_cube_validate** finds issues:
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

## Related Skills

For detailed reference on query building, invoke these skills:

- **dc-query-building** - Complete filter operators, time dimensions, grouped filters (AND/OR)
- **dc-cube-definition** - How joins work between cubes (belongsTo, hasMany, etc.)
- **dc-analysis-config** - Building funnel, flow, and retention queries
