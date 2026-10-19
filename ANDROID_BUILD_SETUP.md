# Android Build Setup Guide

## Current Status

✅ Capacitor configured and Android project created  
✅ Gradle downloaded successfully  
✅ `local.properties` created with SDK path  
❌ **Android SDK incomplete** - need to install required components

## Problem

Your system has a minimal Android SDK at `/usr/lib/android-sdk` but it's missing:
- Build Tools 35.0.0
- Platform 36 (Android 14)
- Command-line tools
- SDK licenses not accepted

## Solution: Install Android Studio (Recommended)

This is the easiest and most reliable way to get everything you need.

### Step 1: Download Android Studio

```bash
# Download from official site (or use snap)
sudo snap install android-studio --classic
```

**Or download manually:**
- Visit: https://developer.android.com/studio
- Download the Linux version
- Extract and run: `./android-studio/bin/studio.sh`

### Step 2: Launch Android Studio and Complete Setup

1. Open Android Studio
2. Follow the setup wizard
3. It will download:
   - Android SDK
   - Android SDK Platform
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android SDK Command-line Tools

4. Accept all license agreements when prompted

### Step 3: Find Your SDK Location

After installation, the SDK is usually at:
- `~/Android/Sdk` (most common)
- Or check in Android Studio: **Settings → Appearance & Behavior → System Settings → Android SDK**

### Step 4: Update local.properties

Once you know your SDK path, update:

```bash
# Edit this file
nano android/local.properties
```

Replace the path with your actual SDK location:
```properties
sdk.dir=/home/isam-ahmed/Android/Sdk
```

### Step 5: Update Environment Variables (Optional but Recommended)

Add to `~/.bashrc`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

Then reload:
```bash
source ~/.bashrc
```

### Step 6: Build the APK

```bash
cd "/media/isam-ahmed/Local Disk/linux/my_project/streambox_final_streaming"
npm run android:debug
```

## Alternative: Command-Line Only Setup (Advanced)

If you don't want Android Studio, you can use command-line tools only:

### 1. Download Command-Line Tools

```bash
cd ~
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip
mkdir -p ~/Android/Sdk/cmdline-tools
mv cmdline-tools ~/Android/Sdk/cmdline-tools/latest
```

### 2. Accept Licenses

```bash
yes | ~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager --licenses
```

### 3. Install Required Packages

```bash
~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-36" "build-tools;35.0.0"
```

### 4. Update local.properties

```bash
echo "sdk.dir=$HOME/Android/Sdk" > "android/local.properties"
```

### 5. Build

```bash
npm run android:debug
```

## Verification

After setup, verify everything is ready:

```bash
# Check SDK location
ls -la ~/Android/Sdk

# Should see folders like:
# - build-tools/
# - cmdline-tools/
# - platforms/
# - platform-tools/

# Try building
cd "/media/isam-ahmed/Local Disk/linux/my_project/streambox_final_streaming"
npm run android:debug
```

## Expected Output

When build succeeds, you'll see:

```
BUILD SUCCESSFUL in XXs
```

And your APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Next Steps After Successful Build

1. **Install APK on your phone:**
   ```bash
   # Connect phone via USB with USB debugging enabled
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

2. **Test the app** using the checklist in `ANDROID.md`

3. **Report any issues** you encounter during testing

## Common Issues

### "SDK location not found"
- Verify `android/local.properties` has correct path
- Path must match your actual SDK installation

### "License not accepted"
- Run: `sdkmanager --licenses`
- Type 'y' for each license

### "Build tools not found"
- Install missing version: `sdkmanager "build-tools;35.0.0"`

### Gradle timeout
- ✅ Already fixed by increasing timeout in gradle-wrapper.properties

## Need Help?

If you get stuck:
1. Share the exact error message
2. Run with more details: `cd android && ./gradlew assembleDebug --stacktrace`
3. Check Java version: `java -version` (need JDK 17+)

---

**Current Fix Status:**
- ✅ Gradle timeout fixed (increased to 600 seconds)
- ✅ local.properties created
- ⏳ Need to install complete Android SDK

**Action Required:** Install Android Studio or command-line tools following steps above
