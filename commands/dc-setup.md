---
name: dc-setup
description: Configure Drizzle Cube plugin settings (API URL and authentication)
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

# Setup Command

Configure the Drizzle Cube plugin with your API URL and authentication token.

## Instructions

### 1. Check Current Configuration

**First, check if MCP is already configured:**

```
Use the `drizzle_cube_config` MCP tool to check current status
```

This shows:
- Current API URL (if configured)
- Whether a token is configured
- Configuration source (project vs global)

### 2. Ask for Configuration

If not configured or user wants to change settings:

**API URL:**
- What is your Drizzle Cube API URL?
- Default: `http://localhost:4000/cubejs-api/v1`
- Examples:
  - Local development: `http://localhost:4000/cubejs-api/v1`
  - Production: `https://api.example.com/cubejs-api/v1`

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
  "apiUrl": "http://localhost:4000/cubejs-api/v1",
  "apiToken": "your-token-here"
}
```

**Global config (`~/.drizzle-cube/config.json`):**
```json
{
  "apiUrl": "http://localhost:4000/cubejs-api/v1",
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
- The API URL configured
- Token status (configured/not configured - **never show the actual token**)
- Connection test result

### 8. Explain Configuration Priority

The MCP server reads configuration in this order:
1. `.drizzle-cube.json` in current project directory
2. `~/.drizzle-cube/config.json` (global)
3. Environment variables (`DRIZZLE_CUBE_API_URL`, `DRIZZLE_CUBE_API_TOKEN`)

Project config takes precedence, allowing different settings per project.

## MCP Tools Reference

| Tool | Purpose |
|------|---------|
| `drizzle_cube_config` | Check current configuration status |
| `drizzle_cube_meta` | Test API connectivity by fetching metadata |

## Output

Confirm the setup with:
- Config file location
- API URL (visible)
- Token status (configured/not configured - don't show the actual token)
- Connection test result
- Next steps to start querying
