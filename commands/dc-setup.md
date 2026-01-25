---
name: dc-setup
description: Configure Drizzle Cube plugin settings (server URL and authentication)
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

# Setup Command

Configure the Drizzle Cube plugin with your server URL and authentication token.

## Architecture Overview

This plugin uses **two MCP servers**:

1. **drizzle-cube-api** (URL-based): The real Drizzle Cube MCP server
   - Provides AI-powered tools: `discover`, `validate`, `load`
   - Default: `https://try.drizzle-cube.dev/mcp` (demo server)
   - Configure by updating `.mcp.json` to point to your server

2. **drizzle-cube** (stdio plugin): REST API tools
   - Provides: `drizzle_cube_meta`, `drizzle_cube_dry_run`, `drizzle_cube_explain`, `drizzle_cube_load`, `drizzle_cube_batch`, `drizzle_cube_config`
   - Configured via `.drizzle-cube.json` or environment variables

## Instructions

### 1. Check Current Configuration

**First, check if the plugin is configured:**

```
Use the `drizzle_cube_config` MCP tool to check current status
```

This shows:
- Current server URL (if configured)
- API endpoints (cubejs-api and mcp)
- Whether a token is configured
- Configuration source (project vs global)

### 2. Verify MCP Server Connectivity

**Test the real MCP server tools:**

```
Use the `discover` MCP tool (from drizzle-cube-api server):
- topic: "test"
```

If this returns cube matches, the MCP server is accessible.

**Test the REST API tools:**

```
Use the `drizzle_cube_meta` MCP tool to verify REST API connectivity
```

If meta returns cube data, the REST API is working.

### 3. Configure Server URL (if needed)

If not configured or user wants to change settings:

**Server URL:**
- What is your Drizzle Cube server URL?
- Default: `https://try.drizzle-cube.dev` (demo server - works out of the box)
- Examples:
  - Demo server: `https://try.drizzle-cube.dev`
  - Local development: `http://localhost:3001`
  - Production: `https://api.example.com`
- Note: Don't include `/cubejs-api/v1` or `/mcp` path - just the base server URL

**Authentication Token:**
- Do you need authentication for your API?
- If yes, what is your API token?
- Leave blank for no authentication (demo server doesn't require auth)

**Configuration Scope:**
- Where should this configuration be saved?
  - **Project** (`.drizzle-cube.json` in current directory) - for project-specific config
  - **Global** (`~/.drizzle-cube/config.json`) - for user-wide default

### 4. Update Configuration Files

**For REST API tools** - Create/update `.drizzle-cube.json`:
```json
{
  "serverUrl": "https://try.drizzle-cube.dev",
  "apiToken": "your-token-here"
}
```

**For MCP server** - Update `.mcp.json` if pointing to a different server:
```json
{
  "mcpServers": {
    "drizzle-cube-api": {
      "type": "url",
      "url": "https://your-server.com/mcp"
    },
    "drizzle-cube": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/index.js"]
    }
  }
}
```

### 5. Create Directory if Needed

For global config:
```bash
mkdir -p ~/.drizzle-cube
```

### 6. Write the Config File

Use the Write tool to create the config file with the user's settings.

### 7. Verify the Configuration

**Verify REST API:**
```
Use the `drizzle_cube_config` MCP tool to confirm settings are loaded
```

Then test:
```
Use the `drizzle_cube_meta` MCP tool to verify REST API connectivity
```

**Verify MCP server:**
```
Use the `discover` MCP tool with topic: "employees" or similar
```

If both return data, the configuration is working.

### 8. Show Configuration Summary

After saving, show the user:
- Where the config was saved
- The server URL configured
- Available endpoints:
  - REST API: `{serverUrl}/cubejs-api/v1`
  - MCP API: `{serverUrl}/mcp`
- Token status (configured/not configured - **never show the actual token**)
- Connection test results for both APIs

### 9. Explain Configuration Priority

The plugin reads configuration in this order:
1. `.drizzle-cube.json` in current project directory
2. `~/.drizzle-cube/config.json` (global)
3. Environment variables (`DRIZZLE_CUBE_SERVER_URL`, `DRIZZLE_CUBE_API_TOKEN`)

Note: The legacy `DRIZZLE_CUBE_API_URL` environment variable and old `apiUrl` config format are still supported for backward compatibility.

Project config takes precedence, allowing different settings per project.

## MCP Tools Reference

### From drizzle-cube-api (real MCP server)

| Tool | Purpose |
|------|---------|
| `discover` | Test MCP server connectivity |
| `validate` | Validate queries |
| `load` | Execute queries |

### From drizzle-cube (plugin)

| Tool | Purpose |
|------|---------|
| `drizzle_cube_config` | Check current configuration status |
| `drizzle_cube_meta` | Test REST API connectivity |

## Output

Confirm the setup with:
- Config file location
- Server URL (visible)
- Token status (configured/not configured - don't show the actual token)
- MCP server connection test result
- REST API connection test result
- Next steps to start querying (`/dc-ask` for natural language, `/dc-query` for direct queries)
