# Blender MCP Setup Guide for Storyline
## AI-Powered 3D Icon Creation with Claude + Blender

This guide will set up Blender MCP so you can create Storyline's 3D icons using natural language commands in Claude.

---

## Prerequisites

### Required Software
- **Blender 3.6+** (Download from [blender.org](https://www.blender.org/download/))
- **Claude Desktop App** (Download from [claude.ai](https://claude.ai/download))
- **Python 3.8+** (Usually comes with Blender)
- **uv package manager** (For MCP server installation)

---

## Step 1: Install uv Package Manager

### Windows
```bash
# Install uv using pip
pip install uv

# Or using pipx (recommended)
pipx install uv
```

### Mac
```bash
# Install using Homebrew
brew install uv

# Or using curl
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Linux
```bash
# Install using curl
curl -LsSf https://astral.sh/uv/install.sh | sh
```

---

## Step 2: Install Blender MCP Server

```bash
# Install the MCP server globally
uvx install blender-mcp

# Verify installation
uvx blender-mcp --help
```

---

## Step 3: Download and Install Blender Add-on

1. **Download the add-on:**
   - Go to: https://github.com/ahujasid/blender-mcp
   - Download `addon.py` (or clone the entire repo)

2. **Install in Blender:**
   - Open Blender
   - Go to `Edit > Preferences > Add-ons`
   - Click `Install...` button
   - Select the downloaded `addon.py` file
   - Click `Install Add-on`
   - ✅ **Enable the add-on** by checking the box next to "Interface: Blender MCP"

3. **Verify installation:**
   - Press `N` to open the side panel
   - You should see a "Blender MCP" tab

---

## Step 4: Configure Claude Desktop

### Find Your Config File

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Mac:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### Edit Configuration

1. **Open Claude Desktop**
2. **Go to:** `Claude > Settings > Developer > Edit Config`
3. **Add this configuration:**

```json
{
  "mcpServers": {
    "blender": {
      "command": "uvx",
      "args": ["blender-mcp"]
    }
  }
}
```

**For Windows users, use this instead:**
```json
{
  "mcpServers": {
    "blender": {
      "command": "cmd",
      "args": ["/c", "uvx", "blender-mcp"]
    }
  }
}
```

4. **Save and restart Claude Desktop completely**

---

## Step 5: Start the Connection

### Startup Order (Important!)
1. **Open Claude Desktop first**
2. **Open Blender second**
3. **Start MCP server in Blender third**

### In Blender:
1. Press `N` to open side panel
2. Find "Blender MCP" tab
3. Click **"Start MCP Server"**
4. You should see "Server started on port 8008" (or similar)

### In Claude Desktop:
- You should see a **🔨 hammer icon** appear in the tools section
- This indicates Blender MCP is connected successfully

---

## Step 6: Test the Connection

### Basic Test Commands

Try these in Claude Desktop:

```
Create a simple cube in Blender
```

```
Add a sphere and make it blue
```

```
Create a microphone shape for an icon
```

If successful, you'll see objects appear in Blender automatically!

---

## Creating Storyline Icons with Blender MCP

Now you can create your 3D icons using natural language! Here are example prompts:

### Microphone Icon
```
Create a professional microphone icon for a voice recording app. 
Make it have:
- A rounded capsule head (not too long)
- Elegant grille details 
- A simple stand base
- Use color #8854D0 (soft purple) for the main body
- Make it suitable for a mobile app icon
- Keep it clean and minimal
```

### Conversation Bubble Icon
```
Create a 3D conversation bubble icon with:
- Rounded rectangular main bubble
- Small tail pointing down-left
- Three small dots inside for AI indication
- Use color #8854D0 for the bubble
- Add subtle glow/emission
- Make it clean and modern for a mobile interface
```

### Book/Chapter Icon
```
Design a 3D book icon representing storytelling:
- Closed book with slightly rounded edges
- Visible spine and pages
- Bookmark ribbon in color #E4B363 (warm ochre)
- Main book color #8854D0 (soft purple)
- Clean, premium feel suitable for memoir writing app
```

### Safe Space Shield Icon
```
Create a protective shield icon representing emotional safety:
- Classic shield shape with rounded top
- Heart symbol in the center
- Warm, protective color #E4B363 (ochre)
- Subtle glow effect
- Gentle, non-aggressive appearance
- Suitable for trauma-informed design
```

---

## Advanced Storyline Icon Workflow

### 1. Create with Claude + Blender MCP
```
Claude: Create a [icon description with Storyline brand colors]
```

### 2. Refine and Export
```
Claude: Adjust the proportions and add subtle material details
Claude: Set up proper lighting for icon rendering
Claude: Export as GLTF for Three.js integration
```

### 3. Render Multiple States
```
Claude: Create 3 versions - idle, active, and disabled states
Claude: Apply different materials for each state
```

### 4. Export Pipeline
```
Claude: Render high-resolution images at 24px, 48px, 64px, and 1024px
Claude: Export 3D models optimized for mobile
```

---

## Storyline Brand Integration

### Set Up Brand Materials
```
Create materials for Storyline brand colors:
- Soft Plum: #8854D0 with slight metallic finish
- Warm Ochre: #E4B363 with gentle glow
- Gentle Sage: #A8C090 for recording states
- Ink Black: #1B1C1E for contrast elements
Make them suitable for mobile icon rendering
```

### Lighting Setup
```
Set up lighting that matches Storyline's warm, emotional brand:
- Soft ambient lighting
- Directional light with slight purple tint
- Fill light with warm ochre color
- No harsh shadows - keep it gentle and safe
```

---

## Troubleshooting

### Connection Issues
- ✅ Ensure Blender add-on server is running (green indicator)
- ✅ MCP server is configured correctly in Claude
- ❌ **Don't** run `uvx blender-mcp` manually in terminal
- 🔄 Restart both Claude and Blender if issues persist

### Performance Tips
- Start with simple objects, then add complexity
- Break complex requests into smaller steps
- Save your Blender file frequently
- Test exports regularly

### Common Fixes
- **No hammer icon:** Restart Claude Desktop completely
- **Commands not working:** Check Blender MCP server is started
- **Timeout errors:** Simplify requests or break into steps
- **Connection lost:** Restart both applications

---

## Export Pipeline for React Native

Once you have your 3D icons created:

### Static Renders
```
Claude: Render this icon at multiple sizes with transparent background:
- 18px, 24px, 32px, 48px, 64px, 1024px
- Light and dark mode versions
- All interaction states (idle, active, disabled)
```

### 3D Model Export
```
Claude: Export this model as GLTF optimized for mobile:
- Low polygon count
- Compressed textures
- Single material per object
- Under 200KB file size
```

---

## Next Steps for Storyline

1. **Create Core Icons** (microphone, conversation, book, shield)
2. **Set up brand materials** with exact Storyline colors
3. **Create multiple states** for each icon (idle, active, disabled)
4. **Export optimized assets** for React Native integration
5. **Test in Three.js** prototype to verify performance

---

## Pro Tips

### Efficient Workflow
- Create one master icon, then duplicate and modify for variations
- Use Blender's material slots for easy color changes
- Set up camera angles optimized for icon views
- Use consistent lighting across all icons

### Brand Consistency
- Save brand materials as Blender presets
- Use consistent proportions across all icons
- Test icons at small sizes (24px) during creation
- Maintain the "organic warmth" in geometric shapes

### Performance Optimization
- Keep polygon counts low (under 1000 triangles per icon)
- Use simple materials with minimal texture maps
- Optimize for mobile rendering
- Test loading times on target devices

---

This setup gives you AI-powered 3D icon creation that perfectly matches Storyline's sophisticated, trauma-informed brand. You can now create professional-quality 3D icons using natural language commands!

**Ready to start creating your first Storyline icon?** 🎨