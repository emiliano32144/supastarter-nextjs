from PIL import Image, ImageDraw, ImageFont
import os

# Brand colors
GOLD = (212, 175, 55)  # #D4AF37
BLACK = (26, 26, 26)   # #1a1a1a
WHITE = (245, 245, 245) # #f5f5f5

def create_icon(size, output_path):
    """Create a simple brand icon: black circle with gold border and 'F' text"""
    img = Image.new('RGB', (size, size), BLACK)
    draw = ImageDraw.Draw(img)
    
    # Draw gold circle border
    padding = size // 8
    draw.ellipse([padding, padding, size - padding, size - padding], outline=GOLD, width=max(2, size // 64))
    
    # Draw 'F' text
    try:
        font_size = size // 2
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "F"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - text_height // 4
    
    draw.text((x, y), text, fill=GOLD, font=font)
    
    img.save(output_path, 'PNG')
    print(f"Created: {output_path} ({size}x{size})")

def create_screenshot(size, label, output_path):
    """Create a simple screenshot placeholder"""
    img = Image.new('RGB', size, BLACK)
    draw = ImageDraw.Draw(img)
    
    # Draw gold accent line at top
    draw.rectangle([0, 0, size[0], size[1] // 40], fill=GOLD)
    
    # Draw placeholder text
    try:
        font_size = size[1] // 20
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = f"FILO {label}"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size[0] - text_width) // 2
    y = (size[1] - text_height) // 2
    
    draw.text((x, y), text, fill=GOLD, font=font)
    
    # Draw subtext
    subtext = "Screenshot Placeholder"
    try:
        subfont_size = size[1] // 40
        subfont = ImageFont.truetype("arial.ttf", subfont_size)
    except:
        subfont = ImageFont.load_default()
    
    subbbox = draw.textbbox((0, 0), subtext, font=subfont)
    subtext_width = subbbox[2] - subbbox[0]
    subx = (size[0] - subtext_width) // 2
    suby = y + text_height + 20
    
    draw.text((subx, suby), subtext, fill=(128, 128, 128), font=subfont)
    
    img.save(output_path, 'PNG')
    print(f"Created: {output_path} ({size[0]}x{size[1]})")

# Create directories
base_dir = os.path.join("apps", "web", "public")
icon_dir = os.path.join(base_dir, "icons")
screenshot_dir = os.path.join(base_dir, "screenshots")

os.makedirs(icon_dir, exist_ok=True)
os.makedirs(screenshot_dir, exist_ok=True)

# Generate icons
create_icon(192, os.path.join(icon_dir, "icon-192x192.png"))
create_icon(512, os.path.join(icon_dir, "icon-512x512.png"))

# Generate screenshots
create_screenshot((1280, 720), "Desktop", os.path.join(screenshot_dir, "home.png"))
create_screenshot((750, 1334), "Mobile", os.path.join(screenshot_dir, "mobile.png"))

print("\nAll PWA assets generated successfully!")
