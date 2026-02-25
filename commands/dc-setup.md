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

**AI-powered tools** (MCP with REST fallback):
- `drizzle_cube_discover` - Find relevant cubes by topic/intent
- `drizzle_cube_validate` - Validate query with auto-corrections

The AI-powered tools prefer MCP but automatically fall back to REST when MCP is unavailable (configurable via `mode`).

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

### 2. Verify Connectivity and Detect MCP Support

**Test the REST API tools:**

```
Use the `drizzle_cube_meta` MCP tool to verify API connectivity
```

If meta returns cube data, the REST API is working.

**Probe MCP availability:**

```
Use the `drizzle_cube_discover` MCP tool:
- topic: "test"
- intent: "test connectivity"
```

Check the result:
- If discover returns cube matches → MCP is available, recommend `"mode": "auto"` (default)
- If discover returns an error mentioning MCP connection failure but then returns data (REST fallback worked) → MCP is unavailable but REST works, recommend `"mode": "rest"`
- If discover fails entirely → check server URL and connectivity

**Then check the status:**

```
Use the `drizzle_cube_config` MCP tool to check mode and mcpStatus
```

The `mcpStatus` field shows the detected MCP availability (`unknown`, `available`, or `unavailable`).

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
  "apiToken": "your-token-here",
  "mode": "auto"
}
```

**Mode options:**
- `"auto"` (default) - Try MCP first; if it fails, silently fall back to REST for the session
- `"mcp"` - Always use MCP, fail if unavailable
- `"rest"` - Always use REST, never attempt MCP connection

**Recommendation:** If MCP probing (step 2) showed MCP is unavailable, set `"mode": "rest"` to avoid connection attempt overhead. Otherwise leave as `"auto"`.

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

This should show the correct `serverUrl`, `mode`, and `mcpStatus`.

**Test REST API tools:**
```
Use the `drizzle_cube_meta` MCP tool to verify connectivity
```

**Test AI-powered tools:**
```
Use the `drizzle_cube_discover` MCP tool with topic: "employees", intent: "test"
```

If all return data, the configuration is working. In `"auto"` mode, the discover call will transparently fall back to REST if MCP is unavailable.

### 8. Show Configuration Summary

After saving, show the user:
- Where the config was saved
- The server URL configured
- Connection mode (`auto`, `mcp`, or `rest`)
- MCP status (`available`, `unavailable`, or `unknown`)
- Available endpoints:
  - REST API: `{serverUrl}/cubejs-api/v1`
  - MCP API: `{serverUrl}/mcp`
- Token status (configured/not configured - **never show the actual token**)
- Connection test results

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
