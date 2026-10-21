# Android App Icon Change Guide

## Current Status
The Android app is using the default Capacitor/Android icons. This guide will help you replace them with custom Streambox icons.

## Icon Requirements

Android app icons need multiple sizes for different screen densities:

| Density | Mipmap Folder | Icon Size | Round Icon Size |
|---------|---------------|-----------|-----------------|
| mdpi    | mipmap-mdpi   | 48x48     | 48x48          |
| hdpi    | mipmap-hdpi   | 72x72     | 72x72          |
| xhdpi   | mipmap-xhdpi  | 96x96     | 96x96          |
| xxhdpi  | mipmap-xxhdpi | 144x144   | 144x144        |
| xxxhdpi | mipmap-xxxhdpi| 192x192   | 192x192        |

## Available Source Icons

Your project has these logo files:
- `public/images/logo2.png` - 242x242 (square, good for app icon!)
- `public/images/favicon1.png` - 334x334 (square, also good!)
- `public/images/logo.png` - 825x239 (wide, not suitable for app icon)

## Option 1: Automatic Generation (Recommended)

I'll create a script that automatically generates all required icon sizes from your logo.

### Steps:
1. Choose your source icon (logo2.png or favicon1.png, or provide your own)
2. Run the icon generation script
3. Rebuild and reinstall the APK

## Option 2: Manual Icon Preparation

### Using Online Tool (Easiest)
1. Go to: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. Upload your logo file
3. Adjust padding, shape, and colors
4. Download the generated icon pack
5. Extract and copy to `android/app/src/main/res/`

### Using ImageMagick (Command Line)
If you have ImageMagick installed, you can resize manually:
```bash
convert source.png -resize 48x48 mipmap-mdpi/ic_launcher.png
convert source.png -resize 72x72 mipmap-hdpi/ic_launcher.png
convert source.png -resize 96x96 mipmap-xhdpi/ic_launcher.png
convert source.png -resize 144x144 mipmap-xxhdpi/ic_launcher.png
convert source.png -resize 192x192 mipmap-xxxhdpi/ic_launcher.png
```

## Files to Replace

All icons are in: `android/app/src/main/res/`

### Standard Icons (required)
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

### Round Icons (optional, for newer Android)
- `mipmap-mdpi/ic_launcher_round.png` (48x48)
- `mipmap-hdpi/ic_launcher_round.png` (72x72)
- `mipmap-xhdpi/ic_launcher_round.png` (96x96)
- `mipmap-xxhdpi/ic_launcher_round.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher_round.png` (192x192)

### Foreground Icons (for adaptive icons)
- `mipmap-mdpi/ic_launcher_foreground.png` (108x108)
- `mipmap-hdpi/ic_launcher_foreground.png` (162x162)
- `mipmap-xhdpi/ic_launcher_foreground.png` (216x216)
- `mipmap-xxhdpi/ic_launcher_foreground.png` (324x324)
- `mipmap-xxxhdpi/ic_launcher_foreground.png` (432x432)

## After Changing Icons

1. **Rebuild the APK:**
   ```bash
   npm run android:debug
   ```

2. **Reinstall on your phone:**
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Clear launcher cache (if icon doesn't update):**
   - On your phone: Long press home screen > Settings > Clear icon cache
   - Or restart your phone

## Tips for Best Results

1. **Use a square image** (1:1 aspect ratio) - e.g., 512x512 or 1024x1024
2. **Keep it simple** - Icons look best when simple and recognizable at small sizes
3. **Add padding** - Leave ~10-15% transparent padding around your logo
4. **Test on device** - Icons can look different on actual devices vs. computer
5. **Use PNG with transparency** - Allows the icon to work on any background

## Design Recommendations

For Streambox, consider:
- **Dark background** with **red accent** (matches your brand)
- **Simple "S" logo** or **play button symbol**
- **High contrast** - ensures visibility on all launcher backgrounds
- **No text** - Text is hard to read at small icon sizes

## Capacitor's `@capacitor/assets` Tool (Advanced)

Capacitor has a built-in tool to generate all icons from a single source:

1. **Install the tool:**
   ```bash
   npm install -g @capacitor/assets
   ```

2. **Create a source icon:**
   Place a 1024x1024 PNG at: `resources/icon.png`

3. **Generate all icons:**
   ```bash
   npx @capacitor/assets generate --iconOnly
   ```

This automatically creates all required sizes!

## Need a Custom Icon?

If you want me to create a custom icon generation script or if you need help with a specific icon design, let me know and I can:
- Generate icons from your existing logo
- Create a custom script to automate the process
- Help you design a simple, effective app icon
