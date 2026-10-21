#!/usr/bin/env python3
"""
Streambox Android Icon Generator (Python version)
Generates all required Android icon sizes from a source image
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("❌ Pillow (PIL) is not installed.")
    print("")
    print("To install Pillow:")
    print("  pip install Pillow")
    print("  or")
    print("  pip3 install Pillow")
    print("")
    sys.exit(1)

def generate_icon(source_image, size, output_path):
    """Generate an icon of specified size from source image."""
    # Open and resize image
    img = Image.open(source_image)
    
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Resize with high-quality resampling
    img_resized = img.resize((size, size), Image.Resampling.LANCZOS)
    
    # Save
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img_resized.save(output_path, 'PNG')
    
    print(f"  ✓ Generated {size}x{size} → {output_path.relative_to(Path.cwd())}")

def main():
    print("🎨 Streambox Android Icon Generator (Python)")
    print("=" * 50)
    print("")
    
    # Check available source images
    logo2 = Path("public/images/logo2.png")
    favicon1 = Path("public/images/favicon1.png")
    
    print("Available source images:")
    if logo2.exists():
        print(f"  1) {logo2} (square logo)")
    if favicon1.exists():
        print(f"  2) {favicon1} (square favicon)")
    print("  3) Custom path (you specify)")
    print("")
    
    choice = input("Choose option (1-3): ").strip()
    
    if choice == "1" and logo2.exists():
        source_image = logo2
    elif choice == "2" and favicon1.exists():
        source_image = favicon1
    elif choice == "3":
        custom_path = input("Enter path to your icon image: ").strip()
        source_image = Path(custom_path)
    else:
        print("❌ Invalid choice or file not found")
        sys.exit(1)
    
    if not source_image.exists():
        print(f"❌ Source image not found: {source_image}")
        sys.exit(1)
    
    print("")
    print(f"✅ Using source image: {source_image}")
    print("")
    
    # Base directory
    res_dir = Path("android/app/src/main/res")
    
    # Icon sizes for each density
    sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    
    # Foreground sizes (for adaptive icons)
    foreground_sizes = {
        "mipmap-mdpi": 108,
        "mipmap-hdpi": 162,
        "mipmap-xhdpi": 216,
        "mipmap-xxhdpi": 324,
        "mipmap-xxxhdpi": 432,
    }
    
    try:
        # Generate standard launcher icons
        print("🔄 Generating standard launcher icons...")
        for density, size in sizes.items():
            output_path = res_dir / density / "ic_launcher.png"
            generate_icon(source_image, size, output_path)
        
        print("")
        print("🔄 Generating round launcher icons...")
        for density, size in sizes.items():
            output_path = res_dir / density / "ic_launcher_round.png"
            generate_icon(source_image, size, output_path)
        
        print("")
        print("🔄 Generating adaptive icon foregrounds...")
        for density, size in foreground_sizes.items():
            output_path = res_dir / density / "ic_launcher_foreground.png"
            generate_icon(source_image, size, output_path)
        
        print("")
        print("✅ All icons generated successfully!")
        print("")
        print("📱 Next steps:")
        print("  1. Review the generated icons in: android/app/src/main/res/mipmap-*/")
        print("  2. Rebuild the APK: npm run android:debug")
        print("  3. Install on device: adb install -r android/app/build/outputs/apk/debug/app-debug.apk")
        print("")
        print("💡 Tip: If the icon doesn't update, try:")
        print("  - Uninstall the old app first")
        print("  - Clear your launcher's icon cache")
        print("  - Restart your phone")
        print("")
        
    except Exception as e:
        print(f"❌ Error generating icons: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
