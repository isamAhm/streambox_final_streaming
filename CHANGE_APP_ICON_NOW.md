# Change App Icon - Quick Start

## 🚀 Three Ways to Change Your Android App Icon

### Method 1: Automatic Script (Bash) ⭐ RECOMMENDED
Since ImageMagick is already installed, this is the fastest method:

```bash
./generate-app-icons.sh
```

The script will:
1. Ask you to choose between logo2.png, favicon1.png, or a custom image
2. Automatically generate all 15 required icon files
3. Place them in the correct Android resource folders

### Method 2: Python Script (Alternative)
If you prefer Python or the bash script doesn't work:

```bash
# First install Pillow if needed
pip3 install Pillow

# Then run the script
python3 generate-app-icons.py
```

### Method 3: Online Tool (No coding required)
1. Go to: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. Upload your logo file (use `public/images/logo2.png` or `public/images/favicon1.png`)
3. Customize the icon appearance
4. Download the generated zip
5. Extract and copy all files to `android/app/src/main/res/`

---

## 📋 After Generating Icons

Once you've generated the icons using any method above:

### 1. Rebuild the APK
```bash
npm run android:debug
```

### 2. Install on Your Phone
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### 3. Check the New Icon
- Look at your phone's app drawer
- The new icon should appear (may need to clear launcher cache or restart phone)

---

## 🎨 Your Current Logo Options

You have two good square logos in your project:

1. **logo2.png** (242x242) - Located at `public/images/logo2.png`
   - Square format ✅
   - Good for app icon ✅

2. **favicon1.png** (334x334) - Located at `public/images/favicon1.png`
   - Square format ✅
   - Larger resolution ✅
   - Good for app icon ✅

Both are suitable! Choose whichever looks better as an icon.

---

## 🔧 If Icon Doesn't Update

Sometimes Android caches the old icon. Try these:

1. **Uninstall the old app completely:**
   ```bash
   adb uninstall com.streambox.app
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

2. **Clear launcher cache:**
   - Long press on home screen → Settings → Clear icon cache

3. **Restart your phone**

---

## 📝 What Gets Generated

The script creates icons in these locations:

```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png (48x48)
│   ├── ic_launcher_round.png (48x48)
│   └── ic_launcher_foreground.png (108x108)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72)
│   ├── ic_launcher_round.png (72x72)
│   └── ic_launcher_foreground.png (162x162)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96x96)
│   ├── ic_launcher_round.png (96x96)
│   └── ic_launcher_foreground.png (216x216)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144x144)
│   ├── ic_launcher_round.png (144x144)
│   └── ic_launcher_foreground.png (324x324)
└── mipmap-xxxhdpi/
    ├── ic_launcher.png (192x192)
    ├── ic_launcher_round.png (192x192)
    └── ic_launcher_foreground.png (432x432)
```

**15 icon files total** - covering all Android screen densities

---

## ⚡ Quick Command Summary

```bash
# Option 1: Run bash script (recommended)
./generate-app-icons.sh

# Option 2: Run Python script
python3 generate-app-icons.py

# After generating icons:
npm run android:debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 💡 Need Help?

- Read the full guide: `ANDROID_ICON_CHANGE_GUIDE.md`
- Check your source logos: `public/images/logo2.png` and `public/images/favicon1.png`
- The scripts are ready to run - just choose one and go!

---

## ✅ Ready to Start?

Run this now:
```bash
./generate-app-icons.sh
```

Choose option 1 or 2, and the icons will be automatically generated!
