/**
 * Drizzle Cube MCP Server
 *
 * A single MCP server providing 8 tools for interacting with a Drizzle Cube API:
 *
 * REST API tools (HTTP requests to /cubejs-api/v1/* endpoints):
 * - drizzle_cube_meta: Fetch cube metadata
 * - drizzle_cube_dry_run: Validate query and preview SQL
 * - drizzle_cube_explain: Get query execution plan
 * - drizzle_cube_batch: Execute multiple queries in parallel
 * - drizzle_cube_config: View current configuration status
 *
 * MCP client tools (connection to /mcp endpoint):
 * - drizzle_cube_load: Execute a query (benefits from AI validation)
 * - drizzle_cube_discover: Find relevant cubes by topic/intent
 * - drizzle_cube_validate: Validate queries with auto-corrections
 *
 * The AI-powered tools use the MCP SDK's StreamableHTTPClientTransport to
 * connect as a proper MCP client to the remote /mcp endpoint, which speaks
 * the MCP 2025-11-25 Streamable HTTP protocol.
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
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
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

// MCP client for AI-powered tools (lazy-initialized)
let mcpClient: Client | null = null
let mcpTransport: StreamableHTTPClientTransport | null = null

async function getMcpClient(): Promise<Client> {
  if (mcpClient) return mcpClient

  const headers: Record<string, string> = {}
  if (config.apiToken) {
    headers['Authorization'] = `Bearer ${config.apiToken}`
  }

  mcpTransport = new StreamableHTTPClientTransport(
    new URL(`${config.serverUrl}/mcp`),
    { requestInit: { headers } }
  )

  mcpClient = new Client(
    { name: 'drizzle-cube-plugin', version: '2.0.2' },
    { capabilities: {} }
  )

  await mcpClient.connect(mcpTransport)
  console.error('MCP client connected to:', `${config.serverUrl}/mcp`)
  return mcpClient
}

async function closeMcpClient(): Promise<void> {
  if (mcpClient) {
    await mcpClient.close()
    mcpClient = null
    mcpTransport = null
    console.error('MCP client disconnected')
  }
}

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
  // AI-powered tools (proxy to remote MCP server endpoints)
  {
    name: 'drizzle_cube_discover',
    description:
      'AI-powered cube discovery. Find relevant cubes, measures, and dimensions based on a natural language topic and intent. Returns ranked matches with suggested measures and dimensions.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description:
            'The main topic to search for (e.g., "sales", "employees", "productivity")',
        },
        intent: {
          type: 'string',
          description:
            'The full natural language question or intent (e.g., "I want to see sales by region for last quarter")',
        },
      },
      required: ['topic', 'intent'],
    },
  },
  {
    name: 'drizzle_cube_validate',
    description:
      'AI-powered query validation. Validates a CubeQuery and provides auto-corrections, suggestions, and error messages. Use this before executing queries to catch issues.',
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
              description: 'Array of measure names',
            },
            dimensions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of dimension names',
            },
            timeDimensions: {
              type: 'array',
              items: { type: 'object' },
              description: 'Array of time dimension configurations',
            },
            filters: {
              type: 'array',
              items: { type: 'object' },
              description: 'Array of filter objects',
            },
            order: {
              type: 'object',
              description: 'Order configuration',
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
        try {
          const client = await getMcpClient()
          const result = await client.callTool({
            name: 'load',
            arguments: { query },
          })
          // MCP tool results have content array, extract and format
          const content = result.content
          if (Array.isArray(content) && content.length > 0) {
            const firstItem = content[0]
            if (typeof firstItem === 'object' && 'text' in firstItem) {
              return {
                content: [{ type: 'text', text: firstItem.text as string }],
              }
            }
          }
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          }
        } catch (error) {
          // Reset client on connection error so next call tries fresh
          mcpClient = null
          mcpTransport = null
          throw error
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

      // AI-powered tools (use MCP client to connect to /mcp endpoint)
      case 'drizzle_cube_discover': {
        const { topic, intent } = args as { topic: string; intent: string }
        try {
          const client = await getMcpClient()
          const result = await client.callTool({
            name: 'discover',
            arguments: { topic, intent },
          })
          // MCP tool results have content array, extract and format
          const content = result.content
          if (Array.isArray(content) && content.length > 0) {
            const firstItem = content[0]
            if (typeof firstItem === 'object' && 'text' in firstItem) {
              return {
                content: [{ type: 'text', text: firstItem.text as string }],
              }
            }
          }
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          }
        } catch (error) {
          // Reset client on connection error so next call tries fresh
          mcpClient = null
          mcpTransport = null
          throw error
        }
      }

      case 'drizzle_cube_validate': {
        const query = (args as { query: unknown }).query
        try {
          const client = await getMcpClient()
          const result = await client.callTool({
            name: 'validate',
            arguments: { query },
          })
          // MCP tool results have content array, extract and format
          const content = result.content
          if (Array.isArray(content) && content.length > 0) {
            const firstItem = content[0]
            if (typeof firstItem === 'object' && 'text' in firstItem) {
              return {
                content: [{ type: 'text', text: firstItem.text as string }],
              }
            }
          }
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          }
        } catch (error) {
          // Reset client on connection error so next call tries fresh
          mcpClient = null
          mcpTransport = null
          throw error
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
  console.error(`MCP endpoint: ${config.serverUrl}/mcp`)
  console.error(`Auth: ${config.apiToken ? 'Configured' : 'Not configured'}`)

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await closeMcpClient()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await closeMcpClient()
    process.exit(0)
  })
}

main().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
