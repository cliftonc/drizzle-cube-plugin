---
name: dc-create-cube
description: Create a new Drizzle Cube definition with measures, dimensions, and security context
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
---

# Create Cube Command

Help me create a new Drizzle Cube definition.

## Arguments
- `$1` - Cube name (e.g., "Orders", "Employees")
- `$2` - (Optional) Source table name from Drizzle schema

## Instructions

### 1. Check Existing Cubes (Optional)

**If MCP is available, check existing cubes to avoid name collisions:**

```
Use the `drizzle_cube_meta` MCP tool to see registered cubes
```

This helps:
- Avoid duplicate cube names
- See patterns used in existing cubes
- Understand available relationships

### 2. Find Source Table

**If source table provided ($2):**
- Search for the table in `schema.ts` or similar files
- Identify columns, types, and relationships

**If no source table:**
- Ask the user which Drizzle table to use
- Search for table definitions in the codebase

### 3. Generate the Cube Definition

Follow this pattern:

```typescript
import { defineCube } from 'drizzle-cube/server'
import { eq } from 'drizzle-orm'
import { tableName } from './schema'

export const ${cubeName}Cube = defineCube({
  name: '${CubeName}',

  // CRITICAL: Security context filter (REQUIRED for multi-tenant isolation)
  sql: (securityContext) => eq(tableName.organisationId, securityContext.organisationId),

  measures: {
    count: {
      type: 'count',
      sql: () => tableName.id
    }
    // Add more measures based on numeric columns
  },

  dimensions: {
    id: {
      type: 'number',
      sql: () => tableName.id,
      primaryKey: true
    }
    // Add more dimensions based on columns
  }
})
```

### 4. Map Column Types to Field Types

| Column Type | Dimension Type | Possible Measures |
|-------------|----------------|-------------------|
| `integer`, `serial`, `bigint` | `number` | `count`, `sum` |
| `varchar`, `text`, `char` | `string` | `countDistinct` |
| `boolean` | `boolean` | filtered counts |
| `timestamp`, `date`, `datetime` | `time` | time-based analysis |
| `numeric`, `decimal`, `float` | `number` | `avg`, `sum`, `min`, `max` |

### 5. Suggest Measures Based on Columns

- **Primary key** -> `count`
- **Amount/price columns** -> `sum`, `avg`
- **Status columns** -> `countDistinct`
- **Quantity columns** -> `sum`, `avg`, `min`, `max`

### 6. Ask About Relationships

Does this cube relate to other cubes? Check for:
- Foreign keys -> suggest `belongsTo`
- Referenced by other tables -> suggest `hasMany`

```typescript
joins: {
  RelatedCube: {
    targetCube: () => relatedCube,
    relationship: 'belongsTo',  // or 'hasMany'
    on: [
      { source: tableName.foreignKey, target: relatedTable.id }
    ]
  }
}
```

### 7. Verify Security Context

**CRITICAL**: Ensure the table has an `organisationId` or tenant column.

If not, ask how to filter for multi-tenant security:
- Different column name?
- Derived from a related table?
- No multi-tenancy needed? (rare, confirm explicitly)

### 8. Write the File

Save to an appropriate location:
- `src/cubes/${cubeName}.ts`
- `src/server/cubes/${cubeName}.ts`
- Match existing project structure

### 9. Register the Cube (Reminder)

After creating, remind the user to register:

```typescript
import { ${cubeName}Cube } from './cubes/${cubeName}'

semanticLayer.registerCube(${cubeName}Cube)
```

## MCP Tools Reference

| Tool | Purpose |
|------|---------|
| `drizzle_cube_meta` | Check existing cubes to avoid name collisions |

## Output
Provide the complete cube definition file with:
- Proper imports
- Security context filter (REQUIRED)
- Appropriate measures for the data
- Appropriate dimensions for the data
- Suggested joins if foreign keys exist
- Registration reminder
