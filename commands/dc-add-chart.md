---
name: dc-add-chart
description: Add a new chart/portlet to an existing Drizzle Cube dashboard
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
---

# Add Chart Command

Help me add a new chart to an existing dashboard.

## Arguments
- `$1` - Chart description or type (e.g., "revenue by region bar chart", "monthly trend")

## Instructions

### 1. Get Available Cubes and Fields

**ALWAYS use MCP tool first to know what data is available:**

```
Use the `drizzle_cube_meta` MCP tool to fetch all cubes
```

This shows:
- Available cubes
- Measures you can visualize
- Dimensions for grouping
- Time dimensions for trends

**FALLBACK** (only if MCP unavailable):
- Search for `defineCube` in the codebase

### 2. Find Existing Dashboard

Search for existing dashboard configs:
- Look for `DashboardConfig` in the codebase
- Check `src/dashboards/`, `src/config/`, or similar
- List available dashboards if multiple found

Ask which dashboard to modify if not clear.

### 3. Read Existing Dashboard

Understand the current state:
- Current portlets and their positions
- Grid configuration
- Existing filters
- Color palette

### 4. Calculate Next Position

- Find the maximum y value in existing portlets
- Calculate where the new chart should go
- Suggest appropriate width based on chart type

### 5. Generate Chart Config Based on Description

**For "KPI" or "number":**
```typescript
{
  id: 'new-kpi',
  title: 'KPI Title',
  w: 3, h: 2, x: 0, y: nextY,
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType: 'kpiNumber',
        chartConfig: { yAxis: ['Cube.measure'] },
        displayConfig: { prefix: '', decimals: 0 }
      }
    },
    query: { measures: ['Cube.measure'] }
  }
}
```

**For "bar" or "comparison":**
```typescript
{
  id: 'new-bar',
  title: 'Bar Chart Title',
  w: 6, h: 4, x: 0, y: nextY,
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType: 'bar',
        chartConfig: { xAxis: ['Cube.dimension'], yAxis: ['Cube.measure'] },
        displayConfig: { showLegend: true }
      }
    },
    query: {
      measures: ['Cube.measure'],
      dimensions: ['Cube.dimension']
    }
  }
}
```

**For "trend" or "line":**
```typescript
{
  id: 'new-line',
  title: 'Trend Chart',
  w: 8, h: 4, x: 0, y: nextY,
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType: 'line',
        chartConfig: { xAxis: ['Cube.createdAt'], yAxis: ['Cube.measure'] },
        displayConfig: { showLegend: true, showGrid: true }
      }
    },
    query: {
      measures: ['Cube.measure'],
      timeDimensions: [{
        dimension: 'Cube.createdAt',
        granularity: 'month'
      }]
    }
  }
}
```

**For "table":**
```typescript
{
  id: 'new-table',
  title: 'Data Table',
  w: 12, h: 5, x: 0, y: nextY,
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'table',
    charts: {
      query: {
        chartType: 'table',
        chartConfig: {},
        displayConfig: {}
      }
    },
    query: {
      measures: ['Cube.measure1', 'Cube.measure2'],
      dimensions: ['Cube.dimension1', 'Cube.dimension2'],
      limit: 100
    }
  }
}
```

### 6. Ask for Specific Fields

Using the metadata from step 1, ask:
- Which cube should this query?
- What measures to show?
- How to group the data (dimensions)?
- Any filters needed?

### 7. Validate the Query

**Use MCP tool to validate before adding:**

```
Use the `drizzle_cube_dry_run` MCP tool with the query
```

This ensures the query is valid before adding to dashboard.

### 8. Ask About Dashboard Filter Mapping

- Should this chart respond to dashboard filters?
- Add `dashboardFilterMapping: ['filterId']` if yes

### 9. Generate Unique ID

Base the ID on chart content:
- `revenue-by-region`
- `monthly-sales-trend`
- `top-customers-table`

### 10. Update the Dashboard File

- Add the new portlet to the `portlets` array
- Ensure grid positions don't overlap
- Use the Edit tool to modify the existing file

## MCP Tools Reference

| Tool | Purpose |
|------|---------|
| `drizzle_cube_meta` | Get available cubes, measures, dimensions |
| `drizzle_cube_dry_run` | Validate query before adding to dashboard |

## Output
- The new portlet configuration
- Updated dashboard file with the new chart
- Confirm the grid position is valid
