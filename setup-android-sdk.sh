#!/bin/bash

# Android SDK Setup Script for Streambox APK Build
# This script downloads and installs only what's needed (~1 GB)

set -e  # Exit on error

echo "🚀 Setting up Android SDK for Streambox APK build..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Java
echo "📋 Checking prerequisites..."
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java not found. Please install JDK 17+${NC}"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
echo -e "${GREEN}✅ Java $JAVA_VERSION found${NC}"

# Set SDK location
SDK_DIR="$HOME/Android/Sdk"
echo ""
echo "📁 SDK will be installed to: $SDK_DIR"
echo "   This will use approximately 1 GB of disk space"
echo ""

# Ask for confirmation
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Create directory
mkdir -p "$SDK_DIR/cmdline-tools"

# Download command-line tools
echo ""
echo "📥 Downloading Android command-line tools..."
cd ~
TOOLS_ZIP="commandlinetools-linux-11076708_latest.zip"

if [ ! -f "$TOOLS_ZIP" ]; then
    wget -q --show-progress https://dl.google.com/android/repository/$TOOLS_ZIP
    echo -e "${GREEN}✅ Download complete${NC}"
else
    echo -e "${YELLOW}ℹ️  Using existing download${NC}"
fi

# Extract
echo ""
echo "📦 Extracting..."
unzip -q -o $TOOLS_ZIP
mv cmdline-tools "$SDK_DIR/cmdline-tools/latest"
echo -e "${GREEN}✅ Extracted${NC}"

# Set up environment
export ANDROID_HOME="$SDK_DIR"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

# Accept licenses
echo ""
echo "📜 Accepting Android SDK licenses..."
yes | "$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" --licenses > /dev/null 2>&1
echo -e "${GREEN}✅ Licenses accepted${NC}"

# Install required packages
echo ""
echo "📦 Installing required SDK packages..."
echo "   This may take a few minutes..."
"$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" \
    "platform-tools" \
    "platforms;android-36" \
    "build-tools;35.0.0" \
    > /dev/null 2>&1

echo -e "${GREEN}✅ SDK packages installed${NC}"

# Update project config
PROJECT_DIR="/media/isam-ahmed/Local Disk/linux/my_project/streambox_final_streaming"
LOCAL_PROPS="$PROJECT_DIR/android/local.properties"

echo ""
echo "⚙️  Updating project configuration..."
echo "sdk.dir=$SDK_DIR" > "$LOCAL_PROPS"
echo -e "${GREEN}✅ Project configured${NC}"

# Check disk usage
SDK_SIZE=$(du -sh "$SDK_DIR" | cut -f1)
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Android SDK setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Disk space used: $SDK_SIZE"
echo "📁 SDK location: $SDK_DIR"
echo ""
echo "🔧 Add to your ~/.bashrc (optional but recommended):"
echo -e "${YELLOW}"
echo "export ANDROID_HOME=\$HOME/Android/Sdk"
echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools"
echo -e "${NC}"
echo ""
echo "📱 Next steps:"
echo "   1. Connect your Android phone via USB"
echo "   2. Enable USB Debugging (Developer Options)"
echo "   3. Change USB mode to 'File Transfer' (not MIDI)"
echo "   4. Run: adb devices"
echo "   5. Build APK: npm run android:debug"
echo ""
