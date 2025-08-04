# Figma Official Dev Mode MCP Setup

## Prerequisites
- Figma Professional/Organization/Enterprise plan with Dev Mode
- Figma Desktop App (latest version)
- Claude Code

## Setup Steps

1. **Enable in Figma Desktop App:**
   ```
   Open Figma Desktop App
   → Menu → Preferences 
   → Enable "Dev Mode MCP Server"
   ```

2. **Claude Code will automatically detect** the server at:
   ```
   http://127.0.0.1:3845/sse
   ```

3. **Available Commands:**
   - `get_code` - Get React + Tailwind code for selected Figma elements
   - `get_variable_defs` - Extract design tokens (colors, spacing, typography)

## Usage for Storyline Voice Components

1. **Select voice state indicator in Figma**
2. **In Claude Code, I can run:**
   ```
   get_code for selected voice indicator component
   get_variable_defs for trauma-informed color palette
   ```

3. **This gives you:**
   - React Native compatible component structure
   - Design tokens as JavaScript objects
   - Real-time sync with your Figma designs

## Benefits
- No API token management
- Real-time design updates
- Built-in Code Connect integration
- Seamless Claude Code integration