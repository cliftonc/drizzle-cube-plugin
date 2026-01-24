/**
 * Drizzle Cube MCP Server
 *
 * Provides tools for interacting with a Drizzle Cube API:
 *
 * Original Cube.js-compatible tools:
 * - drizzle_cube_meta: Fetch cube metadata
 * - drizzle_cube_dry_run: Validate query and preview SQL
 * - drizzle_cube_explain: Get query execution plan
 * - drizzle_cube_load: Execute a query
 * - drizzle_cube_batch: Execute multiple queries in parallel
 *
 * AI-powered MCP tools:
 * - drizzle_cube_discover: Find relevant cubes by topic/intent
 * - drizzle_cube_suggest: Generate query from natural language
 * - drizzle_cube_validate: Validate query with auto-corrections
 * - drizzle_cube_mcp_load: Execute validated query
 *
 * Configuration priority:
 * 1. .drizzle-cube.json in current directory (project config)
 * 2. ~/.drizzle-cube/config.json (global config)
 * 3. Environment variables (DRIZZLE_CUBE_SERVER_URL, DRIZZLE_CUBE_API_TOKEN)
 *
 * Config format:
 *   { "serverUrl": "http://localhost:3001", "apiToken": "..." }
 *   (Legacy apiUrl with path is also supported for backward compatibility)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Configuration interface
interface Config {
  serverUrl: string // Base server URL (e.g., http://localhost:3001)
  apiToken: string
}

// Raw config from file (supports both old and new format)
interface RawConfig {
  serverUrl?: string // New format: just the server
  apiUrl?: string // Legacy format: includes /cubejs-api/v1 path
  apiToken?: string
}

// Strip /cubejs-api/v1 suffix if present (for backward compatibility)
function normalizeServerUrl(url: string): string {
  return url.replace(/\/cubejs-api\/v1\/?$/, '')
}

// Load configuration from file
function loadConfigFile(path: string): RawConfig | null {
  try {
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8')
      const config = JSON.parse(content)
      return {
        serverUrl: config.serverUrl,
        apiUrl: config.apiUrl,
        apiToken: config.apiToken,
      }
    }
  } catch (error) {
    console.error(`Warning: Failed to read config from ${path}:`, error)
  }
  return null
}

// Load configuration with priority
function loadConfig(): Config {
  // Priority 1: Project config (.drizzle-cube.json in current directory)
  const projectConfigPath = join(process.cwd(), '.drizzle-cube.json')
  const projectConfig = loadConfigFile(projectConfigPath)

  // Priority 2: Global config (~/.drizzle-cube/config.json)
  const globalConfigPath = join(homedir(), '.drizzle-cube', 'config.json')
  const globalConfig = loadConfigFile(globalConfigPath)

  // Priority 3: Environment variables (fallback)
  // Support both new (SERVER_URL) and old (API_URL) env vars
  const envConfig: RawConfig = {
    serverUrl: process.env.DRIZZLE_CUBE_SERVER_URL,
    apiUrl: process.env.DRIZZLE_CUBE_API_URL,
    apiToken: process.env.DRIZZLE_CUBE_API_TOKEN,
  }

  // Get raw URL from first available source (prefer serverUrl over apiUrl)
  const rawUrl =
    projectConfig?.serverUrl ||
    projectConfig?.apiUrl ||
    globalConfig?.serverUrl ||
    globalConfig?.apiUrl ||
    envConfig.serverUrl ||
    envConfig.apiUrl ||
    'http://localhost:3001'

  // Normalize to base server URL (strip /cubejs-api/v1 if present)
  const serverUrl = normalizeServerUrl(rawUrl)

  // Merge configs (project > global > env > defaults)
  const config: Config = {
    serverUrl,
    apiToken:
      projectConfig?.apiToken ||
      globalConfig?.apiToken ||
      envConfig.apiToken ||
      '',
  }

  // Log configuration source (for debugging)
  const hasProjectUrl = projectConfig?.serverUrl || projectConfig?.apiUrl
  const hasGlobalUrl = globalConfig?.serverUrl || globalConfig?.apiUrl
  const hasEnvUrl = envConfig.serverUrl || envConfig.apiUrl

  const source = hasProjectUrl
    ? 'project (.drizzle-cube.json)'
    : hasGlobalUrl
      ? 'global (~/.drizzle-cube/config.json)'
      : hasEnvUrl
        ? 'environment variables'
        : 'defaults'

  console.error(`Configuration loaded from: ${source}`)

  return config
}

// Load config
const config = loadConfig()

// Helper to make API requests
// endpoint should be a full path like /cubejs-api/v1/load or /mcp/discover
async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: unknown
): Promise<unknown> {
  const url = `${config.serverUrl}${endpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (config.apiToken) {
    headers['Authorization'] = `Bearer ${config.apiToken}`
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API error (${response.status}): ${error}`)
  }

  return response.json()
}

// Define available tools
const tools: Tool[] = [
  {
    name: 'drizzle_cube_meta',
    description:
      'Fetch cube metadata including measures, dimensions, and relationships from the Drizzle Cube API',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'drizzle_cube_dry_run',
    description:
      'Validate a query and preview the generated SQL without executing it',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'object',
          description: 'The CubeQuery object to validate',
          properties: {
            measures: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Array of measure names (e.g., ["Sales.totalRevenue"])',
            },
            dimensions: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Array of dimension names (e.g., ["Products.category"])',
            },
            timeDimensions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  dimension: { type: 'string' },
                  granularity: { type: 'string' },
                  dateRange: {
                    oneOf: [
                      { type: 'string' },
                      { type: 'array', items: { type: 'string' } },
                    ],
                  },
                },
              },
              description: 'Array of time dimension configurations',
            },
            filters: {
              type: 'array',
              items: { type: 'object' },
              description: 'Array of filter objects',
            },
            order: {
              type: 'object',
              description:
                'Order configuration (e.g., {"Sales.revenue": "desc"})',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of rows to return',
            },
          },
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'drizzle_cube_explain',
    description: 'Get the query execution plan with performance analysis',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'object',
          description: 'The CubeQuery object to explain',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'drizzle_cube_load',
    description: 'Execute a query and return the results',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'object',
          description: 'The CubeQuery object to execute',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'drizzle_cube_batch',
    description: 'Execute multiple queries in parallel and return all results',
    inputSchema: {
      type: 'object',
      properties: {
        queries: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of CubeQuery objects to execute',
        },
      },
      required: ['queries'],
    },
  },
  {
    name: 'drizzle_cube_config',
    description:
      'Get current configuration status (server URL and whether token is configured)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // AI-powered MCP tools
  {
    name: 'drizzle_cube_discover',
    description:
      'Discover relevant cubes based on topic or intent. Returns matching cubes with relevance scores and suggested measures/dimensions. Use this FIRST when user describes what data they want to analyze in natural language.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description:
            'Topic or keyword to search for (e.g., "sales", "employees", "productivity")',
        },
        intent: {
          type: 'string',
          description:
            'Natural language intent describing what the user wants to analyze (e.g., "I want to see revenue trends by region")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
        },
        minScore: {
          type: 'number',
          description:
            'Minimum relevance score between 0 and 1 (default: 0.1)',
        },
      },
    },
  },
  {
    name: 'drizzle_cube_suggest',
    description:
      'Generate a semantic query from natural language. Use this after discover to build a query from user intent. Returns a suggested CubeQuery object.',
    inputSchema: {
      type: 'object',
      properties: {
        naturalLanguage: {
          type: 'string',
          description:
            'Query described in plain English (e.g., "Show me total sales by product category for the last quarter")',
        },
        cube: {
          type: 'string',
          description:
            'Optional: constrain query generation to a specific cube name',
        },
      },
      required: ['naturalLanguage'],
    },
  },
  {
    name: 'drizzle_cube_validate',
    description:
      'Validate a query and get auto-corrections for any issues. Use this to check queries before execution. Returns validation status and corrected query if needed.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'object',
          description: 'The CubeQuery object to validate',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'drizzle_cube_mcp_load',
    description:
      'Execute a validated query through the MCP endpoint. Use this after the discover→suggest→validate workflow to execute the final query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'object',
          description: 'The validated CubeQuery object to execute',
        },
      },
      required: ['query'],
    },
  },
]

// Create MCP server
const server = new Server(
  {
    name: 'drizzle-cube-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}))

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      // Original Cube.js-compatible tools (use /cubejs-api/v1/* endpoints)
      case 'drizzle_cube_meta': {
        const result = await apiRequest('/cubejs-api/v1/meta', 'GET')
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'drizzle_cube_dry_run': {
        const query = (args as { query: unknown }).query
        const result = await apiRequest('/cubejs-api/v1/dry-run', 'POST', query)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'drizzle_cube_explain': {
        const query = (args as { query: unknown }).query
        const result = await apiRequest('/cubejs-api/v1/explain', 'POST', query)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'drizzle_cube_load': {
        const query = (args as { query: unknown }).query
        const result = await apiRequest('/cubejs-api/v1/load', 'POST', query)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'drizzle_cube_batch': {
        const queries = (args as { queries: unknown[] }).queries
        const result = await apiRequest('/cubejs-api/v1/batch', 'POST', {
          queries,
        })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      // AI-powered MCP tools (use /mcp/* endpoints)
      case 'drizzle_cube_discover': {
        const { topic, intent, limit, minScore } = args as {
          topic?: string
          intent?: string
          limit?: number
          minScore?: number
        }
        const result = await apiRequest('/mcp/discover', 'POST', {
          topic,
          intent,
          limit,
          minScore,
        })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'drizzle_cube_suggest': {
        const { naturalLanguage, cube } = args as {
          naturalLanguage: string
          cube?: string
        }
        const result = await apiRequest('/mcp/suggest', 'POST', {
          naturalLanguage,
          cube,
        })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'drizzle_cube_validate': {
        const query = (args as { query: unknown }).query
        const result = await apiRequest('/mcp/validate', 'POST', { query })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'drizzle_cube_mcp_load': {
        const query = (args as { query: unknown }).query
        const result = await apiRequest('/mcp/load', 'POST', { query })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'drizzle_cube_config': {
        // Return current configuration status (without exposing the token)
        const projectConfigPath = join(process.cwd(), '.drizzle-cube.json')
        const globalConfigPath = join(homedir(), '.drizzle-cube', 'config.json')

        const status = {
          serverUrl: config.serverUrl,
          tokenConfigured: !!config.apiToken,
          endpoints: {
            cubeApi: `${config.serverUrl}/cubejs-api/v1`,
            mcpApi: `${config.serverUrl}/mcp`,
          },
          configSources: {
            projectConfig: existsSync(projectConfigPath)
              ? projectConfigPath
              : null,
            globalConfig: existsSync(globalConfigPath) ? globalConfigPath : null,
            environmentVariables: {
              DRIZZLE_CUBE_SERVER_URL: !!process.env.DRIZZLE_CUBE_SERVER_URL,
              DRIZZLE_CUBE_API_URL: !!process.env.DRIZZLE_CUBE_API_URL,
              DRIZZLE_CUBE_API_TOKEN: !!process.env.DRIZZLE_CUBE_API_TOKEN,
            },
          },
          help: {
            projectConfig:
              'Create .drizzle-cube.json with { "serverUrl": "http://localhost:3001" }',
            globalConfig: `Create ${globalConfigPath} with { "serverUrl": "http://localhost:3001" }`,
            envVars:
              'Set DRIZZLE_CUBE_SERVER_URL and DRIZZLE_CUBE_API_TOKEN environment variables',
          },
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    }
  }
})

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Drizzle Cube MCP server started')
  console.error(`Server URL: ${config.serverUrl}`)
  console.error(`Auth: ${config.apiToken ? 'Configured' : 'Not configured'}`)
}

main().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
