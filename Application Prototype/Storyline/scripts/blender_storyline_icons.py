"""
Storyline Icon Creation Script for Blender
Run this script directly in Blender's Text Editor to create 3D icons
"""

import bpy
import bmesh
from mathutils import Vector
import math

# Storyline brand colors
COLORS = {
    'soft_plum': (0.533, 0.329, 0.816, 1.0),      # #8854D0
    'warm_ochre': (0.894, 0.702, 0.388, 1.0),     # #E4B363
    'gentle_sage': (0.659, 0.753, 0.565, 1.0),    # #A8C090
    'ink_black': (0.106, 0.110, 0.118, 1.0),      # #1B1C1E
    'soft_white': (0.98, 0.98, 0.98, 1.0)
}

def clear_scene():
    """Clear all objects from the scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def create_material(name, color, metallic=0.1, roughness=0.3, emission=0.0):
    """Create a material with specified properties"""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    
    # Clear default nodes
    mat.node_tree.nodes.clear()
    
    # Add principled BSDF
    bsdf = mat.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Emission Strength'].default_value = emission
    
    # Add output node
    output = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def setup_lighting():
    """Set up warm, emotional lighting for Storyline brand"""
    # Add world lighting
    world = bpy.context.scene.world
    world.use_nodes = True
    
    # Clear existing nodes
    world.node_tree.nodes.clear()
    
    # Add environment texture
    env_node = world.node_tree.nodes.new('ShaderNodeTexEnvironment')
    background = world.node_tree.nodes.new('ShaderNodeBackground')
    output = world.node_tree.nodes.new('ShaderNodeOutputWorld')
    
    # Set warm background color
    background.inputs['Color'].default_value = (0.1, 0.08, 0.12, 1.0)  # Dark purple tint
    background.inputs['Strength'].default_value = 0.3
    
    world.node_tree.links.new(background.outputs['Background'], output.inputs['Surface'])
    
    # Add key light
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
    key_light = bpy.context.active_object
    key_light.data.energy = 3
    key_light.data.color = (1.0, 0.95, 0.9)  # Slightly warm
    
    # Add fill light
    bpy.ops.object.light_add(type='AREA', location=(-3, 2, 5))
    fill_light = bpy.context.active_object
    fill_light.data.energy = 1
    fill_light.data.color = COLORS['warm_ochre'][:3]  # Warm ochre fill

def create_microphone_icon():
    """Create a professional microphone icon"""
    clear_scene()
    
    # Create materials
    body_mat = create_material("Microphone_Body", COLORS['soft_plum'], metallic=0.3, roughness=0.2)
    grille_mat = create_material("Microphone_Grille", COLORS['ink_black'], metallic=0.8, roughness=0.1)
    stand_mat = create_material("Microphone_Stand", COLORS['ink_black'], metallic=0.5, roughness=0.3)
    
    # Create microphone capsule
    bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=1.2, location=(0, 0, 1))
    capsule = bpy.context.active_object
    capsule.name = "Microphone_Capsule"
    
    # Apply smooth shading and material
    bpy.ops.object.shade_smooth()
    capsule.data.materials.append(body_mat)
    
    # Create grille pattern (simplified)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.41, depth=0.8, location=(0, 0, 1.2))
    grille = bpy.context.active_object
    grille.name = "Microphone_Grille"
    grille.data.materials.append(grille_mat)
    
    # Create stand base
    bpy.ops.mesh.primitive_cylinder_add(radius=0.6, depth=0.1, location=(0, 0, 0))
    base = bpy.context.active_object
    base.name = "Microphone_Base"
    base.data.materials.append(stand_mat)
    
    # Create stand arm
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=1, location=(0, 0, 0.5))
    arm = bpy.context.active_object
    arm.name = "Microphone_Arm"
    arm.data.materials.append(stand_mat)
    
    # Set up camera
    setup_icon_camera()
    setup_lighting()
    
    print("✅ Microphone icon created!")

def create_conversation_bubble():
    """Create a 3D conversation bubble icon"""
    clear_scene()
    
    # Create materials
    bubble_mat = create_material("Bubble", COLORS['soft_plum'], roughness=0.1, emission=0.1)
    dot_mat = create_material("Dots", COLORS['soft_white'], emission=0.3)
    
    # Create main bubble using a rounded cube
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0.5))
    bubble = bpy.context.active_object
    bubble.name = "Conversation_Bubble"
    
    # Add subsurface modifier for roundness
    bpy.ops.object.modifier_add(type='SUBSURF')
    bubble.modifiers["Subdivision Surface"].levels = 2
    
    bpy.ops.object.shade_smooth()
    bubble.data.materials.append(bubble_mat)
    
    # Create tail
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.3, location=(-0.8, -0.8, -0.2))
    tail = bpy.context.active_object
    tail.name = "Bubble_Tail"
    tail.data.materials.append(bubble_mat)
    
    # Create dots for AI indication
    for i, x_pos in enumerate([-0.4, 0, 0.4]):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.12, location=(x_pos, 0, 0.6))
        dot = bpy.context.active_object
        dot.name = f"AI_Dot_{i+1}"
        dot.data.materials.append(dot_mat)
    
    setup_icon_camera()
    setup_lighting()
    
    print("✅ Conversation bubble icon created!")

def create_book_icon():
    """Create a 3D book icon representing storytelling"""
    clear_scene()
    
    # Create materials
    cover_mat = create_material("Book_Cover", COLORS['soft_plum'], roughness=0.4)
    pages_mat = create_material("Book_Pages", COLORS['soft_white'], roughness=0.8)
    bookmark_mat = create_material("Bookmark", COLORS['warm_ochre'], roughness=0.2)
    
    # Create book cover
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
    book = bpy.context.active_object
    book.name = "Book_Cover"
    book.scale = (1.2, 0.1, 1.6)
    book.data.materials.append(cover_mat)
    
    # Create pages
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0.05, 0))
    pages = bpy.context.active_object
    pages.name = "Book_Pages"
    pages.scale = (1.1, 0.08, 1.5)
    pages.data.materials.append(pages_mat)
    
    # Create bookmark ribbon
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0.5, 0, 0.8))
    bookmark = bpy.context.active_object
    bookmark.name = "Bookmark"
    bookmark.scale = (0.1, 0.12, 0.8)
    bookmark.data.materials.append(bookmark_mat)
    
    setup_icon_camera()
    setup_lighting()
    
    print("✅ Book icon created!")

def create_shield_icon():
    """Create a protective shield icon for emotional safety"""
    clear_scene()
    
    # Create materials
    shield_mat = create_material("Shield", COLORS['warm_ochre'], metallic=0.2, roughness=0.3, emission=0.05)
    heart_mat = create_material("Heart", COLORS['soft_plum'], emission=0.1)
    
    # Create shield shape using a cylinder with modifier
    bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=0.2, location=(0, 0, 0))
    shield = bpy.context.active_object
    shield.name = "Safety_Shield"
    
    # Enter edit mode to shape the shield
    bpy.context.view_layer.objects.active = shield
    bpy.ops.object.mode_set(mode='EDIT')
    
    # Select top vertices and scale them to create shield shape
    bpy.ops.mesh.select_all(action='DESELECT')
    bpy.ops.mesh.select_mode(type='VERT')
    
    # This is a simplified approach - in a real script you'd do more detailed modeling
    bpy.ops.object.mode_set(mode='OBJECT')
    
    shield.data.materials.append(shield_mat)
    bpy.ops.object.shade_smooth()
    
    # Create heart symbol in center
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.3, location=(0, 0.15, 0.2))
    heart1 = bpy.context.active_object
    heart1.name = "Heart_Left"
    heart1.location = (-0.15, 0.15, 0.2)
    heart1.data.materials.append(heart_mat)
    
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.3, location=(0.15, 0.15, 0.2))
    heart2 = bpy.context.active_object
    heart2.name = "Heart_Right"
    heart2.data.materials.append(heart_mat)
    
    # Create heart bottom point
    bpy.ops.mesh.primitive_cone_add(radius1=0.2, depth=0.4, location=(0, 0.1, -0.1))
    heart_point = bpy.context.active_object
    heart_point.name = "Heart_Point"
    heart_point.rotation_euler[0] = math.radians(180)
    heart_point.data.materials.append(heart_mat)
    
    setup_icon_camera()
    setup_lighting()
    
    print("✅ Shield icon created!")

def setup_icon_camera():
    """Set up camera for optimal icon rendering"""
    # Delete default camera if it exists
    if 'Camera' in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects['Camera'])
    
    # Add new camera
    bpy.ops.object.camera_add(location=(4, -4, 3))
    camera = bpy.context.active_object
    camera.name = "Icon_Camera"
    
    # Point camera at origin
    camera.rotation_euler = (1.1, 0, 0.785)  # 45-degree angle
    
    # Set as active camera
    bpy.context.scene.camera = camera

def render_icon(name, size=1024):
    """Render the current scene as an icon"""
    # Set render settings
    bpy.context.scene.render.resolution_x = size
    bpy.context.scene.render.resolution_y = size
    bpy.context.scene.render.film_transparent = True  # Transparent background
    
    # Set output path
    bpy.context.scene.render.filepath = f"/Users/jamesfarmer/Application Prototype/Storyline/assets/icons/{name}_{size}.png"
    
    # Render
    bpy.ops.render.render(write_still=True)
    print(f"✅ Rendered {name} icon at {size}px")

# Main execution functions
def create_all_storyline_icons():
    """Create all Storyline icons"""
    print("🎨 Creating Storyline icons...")
    
    # Create each icon
    create_microphone_icon()
    render_icon("microphone", 1024)
    
    create_conversation_bubble()
    render_icon("conversation_bubble", 1024)
    
    create_book_icon()
    render_icon("book", 1024)
    
    create_shield_icon()
    render_icon("shield", 1024)
    
    print("✅ All Storyline icons created!")

# Instructions for use:
print("""
🎨 Storyline Icon Creation Script Loaded!

To use this script:
1. Copy and paste any of these functions into Blender's Text Editor
2. Run the script by clicking 'Run Script' or pressing Alt+P

Available functions:
- create_microphone_icon()
- create_conversation_bubble()
- create_book_icon()
- create_shield_icon()
- create_all_storyline_icons()

Example: Run 'create_microphone_icon()' to create just the microphone
""")