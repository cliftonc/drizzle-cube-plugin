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

This plugin provides a single **drizzle-cube** MCP server with 8 tools:

**REST API tools:**
- `drizzle_cube_meta` - Fetch cube metadata
- `drizzle_cube_dry_run` - Preview SQL without executing
- `drizzle_cube_explain` - Get execution plan
- `drizzle_cube_load` - Execute query
- `drizzle_cube_batch` - Execute multiple queries
- `drizzle_cube_config` - Check configuration status

**AI-powered tools** (proxy to server's `/mcp/*` endpoints):
- `drizzle_cube_discover` - Find relevant cubes by topic/intent
- `drizzle_cube_validate` - Validate query with auto-corrections

All tools are configured via `.drizzle-cube.json` or environment variables.

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

### 2. Verify Connectivity

**Test the REST API tools:**

```
Use the `drizzle_cube_meta` MCP tool to verify API connectivity
```

If meta returns cube data, the API is working.

**Test the AI-powered tools:**

```
Use the `drizzle_cube_discover` MCP tool:
- topic: "test"
- intent: "test connectivity"
```

If this returns cube matches, the AI tools are accessible.

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

### 4. Update Configuration File

Create/update `.drizzle-cube.json`:
```json
{
  "serverUrl": "https://try.drizzle-cube.dev",
  "apiToken": "your-token-here"
}
```

This configures all 8 tools (both REST API and AI-powered tools use this server URL).

### 5. Create Directory if Needed

For global config:
```bash
mkdir -p ~/.drizzle-cube
```

### 6. Write the Config File

Use the Write tool to create the config file with the user's settings.

### 7. Verify the Configuration

**Verify configuration loaded:**
```
Use the `drizzle_cube_config` MCP tool to confirm settings are loaded
```

**Test REST API tools:**
```
Use the `drizzle_cube_meta` MCP tool to verify connectivity
```

**Test AI-powered tools:**
```
Use the `drizzle_cube_discover` MCP tool with topic: "employees", intent: "test"
```

If all return data, the configuration is working.

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

All tools are provided by the single **drizzle-cube** MCP server:

### REST API Tools

| Tool | Purpose |
|------|---------|
| `drizzle_cube_config` | Check current configuration status |
| `drizzle_cube_meta` | Get cube metadata |
| `drizzle_cube_dry_run` | Preview SQL without executing |
| `drizzle_cube_explain` | Get execution plan |
| `drizzle_cube_load` | Execute query |
| `drizzle_cube_batch` | Execute multiple queries |

### AI-Powered Tools

| Tool | Purpose |
|------|---------|
| `drizzle_cube_discover` | Find relevant cubes by topic/intent |
| `drizzle_cube_validate` | Validate query with auto-corrections |

## Output

Confirm the setup with:
- Config file location
- Server URL (visible)
- Token status (configured/not configured - don't show the actual token)
- Connection test results
- Next steps to start querying (`/dc-ask` for natural language, `/dc-query` for direct queries)
