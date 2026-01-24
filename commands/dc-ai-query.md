---
name: dc-ai-query
description: Use AI-powered tools to build and execute analytics queries from natural language
allowed-tools:
  - Read
  - Glob
  - Grep
---

# AI-Powered Query Building

Help me analyze data using natural language. This workflow uses AI-powered MCP endpoints to discover relevant cubes and generate queries from plain English.

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
Use the `drizzle_cube_discover` MCP tool:
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

### 2. Generate Query from Natural Language

**NEXT**, convert the user's request to a semantic query:

```
Use the `drizzle_cube_suggest` MCP tool:
- naturalLanguage: The user's question in plain English
- cube: (optional) Constrain to a specific cube from step 1
```

This returns:
- `suggestedQuery` - A complete CubeQuery object
- `explanation` - Why this query was suggested
- `alternatives` - Other possible interpretations

**Example:**
```
drizzle_cube_suggest({
  naturalLanguage: "Show me total lines of code by employee for the last quarter",
  cube: "Productivity"
})
```

### 3. Validate the Query

**THEN**, check the query for errors and get auto-corrections:

```
Use the `drizzle_cube_validate` MCP tool:
- query: The suggested query from step 2
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
Use the `drizzle_cube_mcp_load` MCP tool:
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
[2] suggest({ naturalLanguage: "..." })
        ↓ (generated query with measures, dimensions, time)
[3] validate({ query: ... })
        ↓ (valid, no corrections needed)
[4] mcp_load({ query: ... })
        ↓
Results displayed to user
```

## MCP Tools Reference

### AI-Powered Tools (Natural Language)

| Tool | Purpose |
|------|---------|
| `drizzle_cube_discover` | Find relevant cubes by topic/intent |
| `drizzle_cube_suggest` | Generate query from natural language |
| `drizzle_cube_validate` | Validate query with auto-corrections |
| `drizzle_cube_mcp_load` | Execute validated query |

### Direct Tools (When You Know the Schema)

| Tool | Purpose |
|------|---------|
| `drizzle_cube_meta` | Get all cubes, measures, dimensions |
| `drizzle_cube_dry_run` | Validate query and preview SQL |
| `drizzle_cube_load` | Execute query directly |

## Error Handling

If **discover** returns no matches:
- Try broader topics
- Use `drizzle_cube_meta` to see all available cubes

If **suggest** can't generate a query:
- Ask user for clarification
- Fall back to `/dc-query` for manual query building

If **validate** finds issues:
- Use the `correctedQuery` if provided
- Show `issues` to user and ask for clarification

## Output

After successful execution:
1. Display the query results in a clear format
2. Show the generated query for reference
3. Suggest a chart type for visualization
4. Offer to save as AnalysisConfig for dashboards
