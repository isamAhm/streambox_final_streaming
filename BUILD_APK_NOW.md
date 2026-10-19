# 🚀 Build Your APK Now (Physical Phone Testing)

## Perfect for Limited Disk Space!

You only need **~1 GB** (not 15+ GB like Android Studio)

---

## Quick Setup (5 commands)

```bash
# 1. Download SDK tools
cd ~
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip
mkdir -p ~/Android/Sdk/cmdline-tools
mv cmdline-tools ~/Android/Sdk/cmdline-tools/latest

# 2. Accept licenses
yes | ~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager --licenses

# 3. Install only what you need
~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager \
  "platform-tools" \
  "platforms;android-36" \
  "build-tools;35.0.0"

# 4. Set SDK location
cd "/media/isam-ahmed/Local Disk/linux/my_project/streambox_final_streaming"
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties

# 5. Build APK!
npm run android:debug
```

**Done!** Your APK is at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Install on Your Phone

### Prepare Phone

1. Settings → About Phone → Tap "Build Number" 7 times
2. Settings → System → Developer Options
3. Enable "USB Debugging"
4. Connect phone via USB
5. Allow USB debugging popup

### Install APK

```bash
# Check phone is connected
adb devices

# Install
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Or copy APK to phone and install manually**

---

## Test Your App

1. ✅ App launches
2. ✅ Videos play
3. ✅ Fullscreen works
4. ✅ Rotation works
5. ✅ Back button works
6. ✅ Guest mode works

---

## Detailed Guides

- **[ANDROID_PHYSICAL_PHONE_SETUP.md](./ANDROID_PHYSICAL_PHONE_SETUP.md)** - Complete physical phone guide
- **[ANDROID_BUILD_SETUP.md](./ANDROID_BUILD_SETUP.md)** - Full setup options
- **[ANDROID.md](./ANDROID.md)** - Build & deployment reference

---

**Space Used:** ~1 GB (vs 15+ GB for Android Studio)  
**Time:** 10-20 minutes (mostly download time)  
**Result:** Working APK on your phone! 🎉
