---
name: dc-debug
description: Debug a Drizzle Cube query using dry-run and explain endpoints
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Debug Command

Help me debug a Drizzle Cube query.

## Arguments
- `$ARGUMENTS` - Query to debug (JSON string or file path)

## Instructions

### 1. Parse the Query

- If JSON provided, parse it as CubeQuery
- If file path provided, read the file
- If nothing provided, ask for the query

### 2. Validate Query Structure

Basic validation before API call:
- Check required fields (at least measures OR dimensions)
- Verify field naming format (Cube.field)
- Check filter operator validity

### 3. Run Dry-Run Validation

**ALWAYS use MCP tool:**

```
Use the `drizzle_cube_dry_run` MCP tool with the query object
```

This returns:
- `valid: true/false` - Is the query valid?
- `sql` - The generated SQL (formatted)
- `cubesUsed` - Which cubes are involved
- `joinType` - How cubes are joined (single_cube, multi_cube_join, etc.)
- `complexity` - Query complexity rating (low/medium/high)
- `analysis` - Detailed breakdown of query planning

**FALLBACK** (only if MCP unavailable):
```bash
curl -X POST http://localhost:4000/cubejs-api/v1/dry-run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DRIZZLE_CUBE_API_TOKEN" \
  -d '{"measures": ["Sales.totalRevenue"], "dimensions": ["Products.category"]}'
```

### 4. Analyze Dry-Run Response

If `valid: false`, check:
- Error messages in response
- Field names for typos
- Filter syntax correctness
- Cube existence

If `valid: true`, review:
- Generated SQL for correctness
- Join strategy (is it optimal?)
- Complexity rating

### 5. Run Query Explain (for performance analysis)

**ALWAYS use MCP tool:**

```
Use the `drizzle_cube_explain` MCP tool with the query object
```

This returns execution plan details:
- Query execution strategy
- Estimated costs
- Index usage
- Performance recommendations

**FALLBACK** (only if MCP unavailable):
```bash
curl -X POST http://localhost:4000/cubejs-api/v1/explain \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DRIZZLE_CUBE_API_TOKEN" \
  -d '{"measures": ["Sales.totalRevenue"], "dimensions": ["Products.category"]}'
```

### 6. Check Common Issues

**Field not found:**
- Use `drizzle_cube_meta` to verify cube is registered
- Check field name spelling (case-sensitive)
- Ensure measure vs dimension is correct

**Security context issues:**
- Verify the cube has `sql` function with security context
- Check if organisationId is being passed in API request

**Join issues:**
- Verify relationships exist between cubes (check meta)
- Check join direction (belongsTo vs hasMany)
- For star schema, ensure dimension has hasMany back to facts

**Performance issues:**
- Large result sets - add LIMIT
- Missing indexes - check EXPLAIN output
- Complex filters - simplify or add indexes

### 7. Provide Debug Report

Format the output as:

```
=== Query Debug Report ===

Query:
{
  measures: ["Sales.totalRevenue"],
  dimensions: ["Products.category"]
}

Validation: VALID / INVALID
Error: (if invalid)

Generated SQL:
SELECT
  "products"."category" AS "Products.category",
  SUM("sales"."revenue") AS "Sales.totalRevenue"
FROM "sales"
INNER JOIN "products" ON ...
WHERE "sales"."organisation_id" = $1
GROUP BY 1

Cubes Used: Sales, Products
Join Type: multi_cube_join
Complexity: medium

Execution Plan:
- GroupAggregate (cost=...)
  - Sort (cost=...)
    - Nested Loop (cost=...)

Recommendations:
- Consider adding index on sales.product_id
- Query returns estimated 1,234 rows
```

## MCP Tools Reference

| Tool | Purpose |
|------|---------|
| `drizzle_cube_dry_run` | Validate query and preview generated SQL |
| `drizzle_cube_explain` | Get query execution plan for performance analysis |
| `drizzle_cube_meta` | Get cube metadata to verify field names |
| `drizzle_cube_config` | Check API configuration status |

## Output
- Query validation status
- Generated SQL (formatted)
- Cubes and joins involved
- Execution plan analysis
- Performance recommendations
- Suggested fixes for any issues
