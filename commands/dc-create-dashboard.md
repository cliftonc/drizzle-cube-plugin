---
name: dc-create-dashboard
description: Create a new Drizzle Cube dashboard configuration
allowed-tools:
  - Read
  - Write
  - Glob
---

# Create Dashboard Command

Help me create a new dashboard configuration for Drizzle Cube.

## Arguments
- `$1` - Dashboard name/title (e.g., "Sales Overview", "HR Dashboard")

## Instructions

### 1. Get Available Cubes

**ALWAYS use MCP tool first to know what data is available:**

```
Use the `drizzle_cube_meta` MCP tool to fetch all cubes
```

This shows all available:
- Cubes and their descriptions
- Measures (metrics you can display)
- Dimensions (ways to group data)
- Relationships between cubes

**FALLBACK** (only if MCP unavailable):
- Search for `defineCube` in the codebase

### 2. Create the DashboardConfig Structure

```typescript
import type { DashboardConfig } from 'drizzle-cube/client'

export const ${dashboardName}Dashboard: DashboardConfig = {
  layoutMode: 'grid',

  grid: {
    cols: 12,
    rowHeight: 80,
    minW: 2,
    minH: 2
  },

  colorPalette: 'default',

  filters: [
    // Dashboard-level filters (optional)
  ],

  portlets: [
    // Chart widgets go here
  ]
}
```

### 3. Ask About Dashboard Content

- What data should this dashboard show?
- What metrics are most important (KPIs)?
- What trends should be visualized?
- What comparisons are needed?

### 4. Suggest Layout Based on Common Patterns

**Executive Dashboard:**
- Row 1: 4 KPI numbers (w:3 each)
- Row 2: Main trend line chart (w:8) + pie chart (w:4)
- Row 3: Data table (w:12)

**Sales Dashboard:**
- Row 1: Revenue KPI (w:3), Orders KPI (w:3), AOV KPI (w:3), Conversion KPI (w:3)
- Row 2: Revenue trend (w:6) + Revenue by region (w:6)
- Row 3: Top products table (w:6) + Top customers table (w:6)

**Operations Dashboard:**
- Row 1: Status summary (w:12)
- Row 2: Activity timeline (w:8) + Distribution pie (w:4)
- Row 3: Detailed metrics table (w:12)

### 5. Generate Portlet Configs

For each portlet, use the AnalysisConfig format:

```typescript
{
  id: 'unique-id',
  title: 'Chart Title',
  w: 6,  // Grid width (1-12)
  h: 4,  // Grid height
  x: 0,  // X position (0-11)
  y: 0,  // Y position (row)
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType: 'bar',  // or line, pie, kpiNumber, etc.
        chartConfig: {
          xAxis: ['Cube.dimension'],
          yAxis: ['Cube.measure']
        },
        displayConfig: {
          showLegend: true
        }
      }
    },
    query: {
      measures: ['Cube.measure'],
      dimensions: ['Cube.dimension']
    }
  }
}
```

### 6. Validate Queries (Optional but Recommended)

**Use MCP tool to validate each portlet query:**

```
Use the `drizzle_cube_dry_run` MCP tool with each query
```

This ensures all field names are correct before saving.

### 7. Ask About Dashboard Filters

- Should there be a global date filter?
- Any dimension filters (region, category, etc.)?
- Create `DashboardFilter` objects and map to portlets

```typescript
filters: [
  {
    id: 'dateFilter',
    label: 'Date Range',
    filter: {
      member: 'Orders.createdAt',
      operator: 'inDateRange',
      values: ['2024-01-01', '2024-12-31']
    },
    isUniversalTime: true
  }
]
```

### 8. Write the Dashboard File

Save to `src/dashboards/${dashboardName}.ts` or similar location.

## MCP Tools Reference

| Tool | Purpose |
|------|---------|
| `drizzle_cube_meta` | Get available cubes, measures, dimensions |
| `drizzle_cube_dry_run` | Validate portlet queries before saving |

## Output
Provide:
- Complete DashboardConfig with all portlets
- Appropriate chart types for each metric
- Logical grid layout
- Any suggested dashboard filters
