# Building APK for Physical Phone Testing (Minimal Space)

## Perfect for Limited Disk Space! 🎯

You DON'T need:
- ❌ Android Studio IDE (saves ~5 GB)
- ❌ Android Emulator images (saves ~10 GB)
- ❌ Extra platforms and tools

You only need:
- ✅ Command-line tools (~200 MB)
- ✅ One Android platform (~300 MB)
- ✅ Build tools (~200 MB)
- **Total: ~1 GB instead of 15+ GB**

---

## Step-by-Step Setup

### 1. Download Android Command-Line Tools

```bash
cd ~
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip
mkdir -p ~/Android/Sdk/cmdline-tools
mv cmdline-tools ~/Android/Sdk/cmdline-tools/latest
```

### 2. Install Only What You Need

```bash
# Accept licenses first
yes | ~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager --licenses

# Install ONLY these packages (minimal set)
~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager \
  "platform-tools" \
  "platforms;android-36" \
  "build-tools;35.0.0"
```

**Space check:**
```bash
du -sh ~/Android/Sdk
# Should show around 700MB-1GB
```

### 3. Update Your Project Config

```bash
cd "/media/isam-ahmed/Local Disk/linux/my_project/streambox_final_streaming"
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties
```

### 4. Build the APK

```bash
npm run android:debug
```

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk` (~10-15 MB)

---

## Preparing Your Android Phone

### Enable Developer Mode

1. **Open Settings** on your phone
2. **About Phone** → Tap **Build Number** 7 times
3. You'll see "You are now a developer!"

### Enable USB Debugging

1. **Settings** → **System** → **Developer Options**
2. Enable **USB Debugging**
3. Enable **Install via USB** (if available)

### Trust Your Computer

1. Connect phone to PC via USB cable
2. Phone will show popup: **"Allow USB debugging?"**
3. Check **"Always allow from this computer"**
4. Tap **OK**

---

## Installing APK on Your Phone

### Method 1: Using ADB (Recommended)

```bash
# Check if phone is connected
adb devices
# Should show: List of devices attached
#              ABC123456789    device

# Install the APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or reinstall if already exists
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Method 2: Direct Transfer (If ADB doesn't work)

```bash
# Copy APK to your Downloads folder
adb push android/app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/streambox.apk
```

Then on your phone:
1. Open **Files** or **Downloads** app
2. Tap **streambox.apk**
3. Tap **Install**
4. If blocked, enable **"Install unknown apps"** for your file manager

### Method 3: USB File Transfer

1. Connect phone via USB
2. Select **"File Transfer"** mode on phone
3. Copy `android/app/build/outputs/apk/debug/app-debug.apk` to phone's **Download** folder
4. Open file manager on phone and install

---

## Testing Your App

### Launch the App

1. Open Streambox from your app drawer
2. It should load https://streamboxx.duckdns.org

### Quick Test Checklist

**Basic (5 minutes):**
- [ ] App launches and shows website
- [ ] Can navigate between pages
- [ ] Videos play
- [ ] Audio works
- [ ] Can pause/play video

**Video Features (5 minutes):**
- [ ] Tap fullscreen button - video goes fullscreen
- [ ] Rotate phone to landscape - stays fullscreen
- [ ] Rotate back to portrait - stays fullscreen
- [ ] Exit fullscreen - returns to normal view

**Navigation (2 minutes):**
- [ ] Back button goes back in site
- [ ] Back button at home exits app
- [ ] Back button during video returns to page

**Auth & Guest (3 minutes):**
- [ ] Guest mode works
- [ ] Can sign in with Clerk
- [ ] Session persists after closing app

**Edge Cases (5 minutes):**
- [ ] Turn off Wi-Fi - shows offline page
- [ ] Turn on Wi-Fi - can retry and load
- [ ] Lock screen during video - pauses
- [ ] Unlock - can resume
- [ ] Switch to another app and back - state preserved

---

## Viewing Logs (For Debugging)

If something doesn't work, check logs:

```bash
# View all logs
adb logcat

# Filter for your app only
adb logcat | grep Streambox

# Filter for errors only
adb logcat *:E

# Clear logs and start fresh
adb logcat -c
adb logcat | grep Streambox
```

---

## Updating the APK

After making changes to the website or Android config:

```bash
# Rebuild
npm run android:debug

# Reinstall (overwrites existing app)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

**Note:** Website changes go live automatically. You only need to rebuild the APK when:
- Changing Capacitor config
- Changing native Android code
- Changing app icons/splash screen
- Changing server URL

---

## Uninstalling

```bash
# Via ADB
adb uninstall com.streambox.app

# Or on phone
# Settings → Apps → Streambox → Uninstall
```

---

## Troubleshooting

### "adb: command not found"

```bash
# Add to PATH temporarily
export PATH=$PATH:$HOME/Android/Sdk/platform-tools

# Or permanently (add to ~/.bashrc)
echo 'export PATH=$PATH:$HOME/Android/Sdk/platform-tools' >> ~/.bashrc
source ~/.bashrc
```

### "device unauthorized"

1. Unplug phone
2. Revoke USB debugging authorizations on phone (Developer Options)
3. Plug back in and accept authorization again

### "device offline"

```bash
adb kill-server
adb start-server
adb devices
```

### "App won't install"

```bash
# Uninstall first
adb uninstall com.streambox.app

# Then install fresh
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### "Gradle build failed"

Check you have Java installed:
```bash
java -version
# Need JDK 17+

# Install if missing (Ubuntu/Debian)
sudo apt install openjdk-17-jdk
```

---

## Space Saving Tips

### Clean Build Files (Save ~500 MB)

```bash
cd android
./gradlew clean
cd ..
```

### Remove Unused SDK Platforms

```bash
# List installed packages
~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager --list_installed

# Remove old platforms you don't need
~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager --uninstall "platforms;android-33"
```

### Clean Gradle Cache (Save ~1-2 GB)

```bash
rm -rf ~/.gradle/caches
```

---

## Disk Space Summary

**Before setup:** 0 GB  
**After SDK install:** ~1 GB  
**After first build:** ~1.5 GB  
**Per APK:** ~15 MB  

**Compare to full Android Studio:** 15-20 GB ❌

---

## Production Release Build

When ready for production:

```bash
# Generate keystore (one time only)
keytool -genkey -v -keystore ~/streambox-release.keystore \
  -alias streambox -keyalg RSA -keysize 2048 -validity 10000

# Create keystore.properties
cat > android/keystore.properties << EOF
storeFile=$HOME/streambox-release.keystore
storePassword=YOUR_PASSWORD_HERE
keyAlias=streambox
keyPassword=YOUR_PASSWORD_HERE
EOF

# Build release AAB
npm run android:release

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Quick Reference Commands

```bash
# Build APK
npm run android:debug

# Check phone connected
adb devices

# Install to phone
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat | grep Streambox

# Uninstall
adb uninstall com.streambox.app

# Check disk usage
du -sh ~/Android/Sdk
```

---

**✅ Perfect for testing on physical phone with limited PC storage!**
