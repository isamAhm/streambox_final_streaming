#!/bin/bash

# Streambox Android Icon Generator
# This script generates all required Android icon sizes from a source image

set -e

echo "🎨 Streambox Android Icon Generator"
echo "===================================="
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed."
    echo ""
    echo "To install ImageMagick:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  Fedora: sudo dnf install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo ""
    echo "Alternatively, use the online tool:"
    echo "  https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html"
    exit 1
fi

# Source image options
echo "Available source images:"
echo "  1) public/images/logo2.png (242x242 - square logo)"
echo "  2) public/images/favicon1.png (334x334 - square favicon)"
echo "  3) Custom path (you specify)"
echo ""
read -p "Choose option (1-3): " choice

case $choice in
    1)
        SOURCE_IMAGE="public/images/logo2.png"
        ;;
    2)
        SOURCE_IMAGE="public/images/favicon1.png"
        ;;
    3)
        read -p "Enter path to your icon image: " SOURCE_IMAGE
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Check if source image exists
if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "❌ Source image not found: $SOURCE_IMAGE"
    exit 1
fi

echo ""
echo "✅ Using source image: $SOURCE_IMAGE"
echo ""

# Base directory for Android resources
RES_DIR="android/app/src/main/res"

# Function to generate icon
generate_icon() {
    local size=$1
    local output_dir=$2
    local output_name=$3
    
    mkdir -p "$RES_DIR/$output_dir"
    
    echo "  Generating ${size}x${size} → $output_dir/$output_name"
    
    # Generate with transparent background and optional padding
    convert "$SOURCE_IMAGE" \
        -resize "${size}x${size}" \
        -background none \
        -gravity center \
        -extent "${size}x${size}" \
        "$RES_DIR/$output_dir/$output_name"
}

echo "🔄 Generating standard launcher icons..."
generate_icon 48 "mipmap-mdpi" "ic_launcher.png"
generate_icon 72 "mipmap-hdpi" "ic_launcher.png"
generate_icon 96 "mipmap-xhdpi" "ic_launcher.png"
generate_icon 144 "mipmap-xxhdpi" "ic_launcher.png"
generate_icon 192 "mipmap-xxxhdpi" "ic_launcher.png"

echo ""
echo "🔄 Generating round launcher icons..."
generate_icon 48 "mipmap-mdpi" "ic_launcher_round.png"
generate_icon 72 "mipmap-hdpi" "ic_launcher_round.png"
generate_icon 96 "mipmap-xhdpi" "ic_launcher_round.png"
generate_icon 144 "mipmap-xxhdpi" "ic_launcher_round.png"
generate_icon 192 "mipmap-xxxhdpi" "ic_launcher_round.png"

echo ""
echo "🔄 Generating adaptive icon foregrounds..."
generate_icon 108 "mipmap-mdpi" "ic_launcher_foreground.png"
generate_icon 162 "mipmap-hdpi" "ic_launcher_foreground.png"
generate_icon 216 "mipmap-xhdpi" "ic_launcher_foreground.png"
generate_icon 324 "mipmap-xxhdpi" "ic_launcher_foreground.png"
generate_icon 432 "mipmap-xxxhdpi" "ic_launcher_foreground.png"

echo ""
echo "✅ All icons generated successfully!"
echo ""
echo "📱 Next steps:"
echo "  1. Review the generated icons in: $RES_DIR/mipmap-*/"
echo "  2. Rebuild the APK: npm run android:debug"
echo "  3. Install on device: adb install -r android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "💡 Tip: If the icon doesn't update, try:"
echo "  - Clear your launcher's icon cache"
echo "  - Uninstall and reinstall the app"
echo "  - Restart your phone"
echo ""
