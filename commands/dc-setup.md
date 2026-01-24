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

## Instructions

### 1. Check Current Configuration

**First, check if MCP is already configured:**

```
Use the `drizzle_cube_config` MCP tool to check current status
```

This shows:
- Current server URL (if configured)
- API endpoints (cubejs-api and mcp)
- Whether a token is configured
- Configuration source (project vs global)

### 2. Ask for Configuration

If not configured or user wants to change settings:

**Server URL:**
- What is your Drizzle Cube server URL?
- Default: `http://localhost:3001`
- Examples:
  - Local development: `http://localhost:3001`
  - Production: `https://api.example.com`
- Note: Don't include `/cubejs-api/v1` path - just the base server URL

**Authentication Token:**
- Do you need authentication for your API?
- If yes, what is your API token?
- Leave blank for no authentication

**Configuration Scope:**
- Where should this configuration be saved?
  - **Project** (`.drizzle-cube.json` in current directory) - for project-specific config
  - **Global** (`~/.drizzle-cube/config.json`) - for user-wide default

### 3. Create the Configuration File

**Project config (`.drizzle-cube.json`):**
```json
{
  "serverUrl": "http://localhost:3001",
  "apiToken": "your-token-here"
}
```

**Global config (`~/.drizzle-cube/config.json`):**
```json
{
  "serverUrl": "http://localhost:3001",
  "apiToken": "your-token-here"
}
```

### 4. Create Directory if Needed

For global config:
```bash
mkdir -p ~/.drizzle-cube
```

### 5. Write the Config File

Use the Write tool to create the config file with the user's settings.

### 6. Verify the Configuration

**Use MCP tool to verify:**

```
Use the `drizzle_cube_config` MCP tool to confirm settings are loaded
```

Then test the connection:

```
Use the `drizzle_cube_meta` MCP tool to verify API connectivity
```

If meta returns cube data, the configuration is working!

**FALLBACK** (if MCP unavailable):
```bash
curl -s "${API_URL}/meta" -H "Authorization: Bearer ${TOKEN}" | head -c 200
```

### 7. Show Configuration Summary

After saving, show the user:
- Where the config was saved
- The server URL configured
- Available endpoints (cubejs-api and mcp)
- Token status (configured/not configured - **never show the actual token**)
- Connection test result

### 8. Explain Configuration Priority

The MCP server reads configuration in this order:
1. `.drizzle-cube.json` in current project directory
2. `~/.drizzle-cube/config.json` (global)
3. Environment variables (`DRIZZLE_CUBE_SERVER_URL`, `DRIZZLE_CUBE_API_TOKEN`)

Note: The legacy `DRIZZLE_CUBE_API_URL` environment variable and old `apiUrl` config format are still supported for backward compatibility.

Project config takes precedence, allowing different settings per project.

## MCP Tools Reference

| Tool | Purpose |
|------|---------|
| `drizzle_cube_config` | Check current configuration status |
| `drizzle_cube_meta` | Test API connectivity by fetching metadata |

## Output

Confirm the setup with:
- Config file location
- Server URL (visible)
- Token status (configured/not configured - don't show the actual token)
- Connection test result
- Next steps to start querying
