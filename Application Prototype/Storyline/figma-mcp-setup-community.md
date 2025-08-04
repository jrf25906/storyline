# Community Figma MCP Setup (@thirdstrandstudio/mcp-figma)

## Why This Option
- 31 comprehensive API methods
- Full Figma REST API coverage
- Component and style management
- Works with any Figma plan

## Setup Steps

### 1. Install via Smithery (Easiest)
```bash
npx @smithery/cli@latest install @thirdstrandstudio/mcp-figma --client claude
```

### 2. Generate Figma API Token
1. Go to Figma → Settings → Personal Access Tokens
2. Click "Create new token"
3. Name: "Claude_MCP_Storyline"
4. Select scopes:
   - ✅ **File content** (required)
   - ✅ **Comments** (for collaboration)
   - ✅ **Libraries** (for design system)
5. Copy token immediately

### 3. Configure Environment Variable
Add to your shell profile (~/.zshrc or ~/.bash_profile):
```bash
export FIGMA_API_KEY="your_token_here"
```

Reload shell:
```bash
source ~/.zshrc
```

### 4. Manual Configuration (Alternative)
If Smithery doesn't work, add to Claude desktop config:

Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["@thirdstrandstudio/mcp-figma"],
      "env": {
        "FIGMA_API_KEY": "your_token_here"
      }
    }
  }
}
```

### 5. Restart Claude Code
Close and reopen Claude Code to load the new MCP server.

## Available Commands for Storyline

### File Operations
- `get_file` - Retrieve complete Figma file structure
- `get_file_nodes` - Get specific components/frames
- `get_images` - Export component images/icons

### Design System Management  
- `get_team_components` - Access shared component library
- `get_team_styles` - Extract color/text/effect styles
- `get_local_variables` - Get design tokens and variables

### Collaboration
- `get_comments` - Review design feedback
- `post_comment` - Add implementation notes
- `delete_comments` - Clean up resolved discussions

### Advanced Features
- `get_component_sets` - Access variant components
- `get_published_components` - Library components
- `search_files` - Find specific design files

## Usage Examples for Voice Components

### Extract Voice State Colors
```
get_team_styles for trauma-informed color palette
```

### Get Component Structure  
```
get_file_nodes for voice state indicator components
```

### Export Assets
```
get_images for voice state icons and indicators
```

## Benefits Over Official MCP
- Works with any Figma plan (including free)
- Complete API access (31 methods vs 2)
- Component library management
- Advanced file operations
- Comment and collaboration features