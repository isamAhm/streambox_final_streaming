# Streambox Android App

This document explains how to build, test, and deploy the Streambox Android APK using Capacitor.

> **🚨 FIRST TIME SETUP:** If you haven't built an Android app before, start with **[ANDROID_BUILD_SETUP.md](./ANDROID_BUILD_SETUP.md)** for detailed Android SDK installation instructions.

## 📋 Prerequisites

### Required Software
- **Node.js** 16+ and npm
- **JDK (Java Development Kit)** 17 or higher
  - Check: `java -version`
  - Download: https://adoptium.net/
- **Android Studio** or **Android SDK Command-line Tools**
  - Download: https://developer.android.com/studio
- **Gradle** (comes with Android Studio)

### Environment Variables
Add to your `~/.bashrc` or `~/.zshrc`:
```bash
export JAVA_HOME=/path/to/jdk-17
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
```

Reload: `source ~/.bashrc`

---

## 🏗️ Architecture

**Server URL Approach:**
- The app loads your live website (`https://streamboxx.duckdns.org`) in a WebView
- No local HTML/CSS/JS is bundled (except the offline fallback page)
- Updates to the website go live automatically without rebuilding the APK
- The APK only needs rebuilding when:
  - Native configuration changes
  - Capacitor plugins are added/updated
  - App icons or splash screen change
  - Server URL changes

---

## 🔧 Configuration

### Change Server URL

**For testing against a different URL:**
```bash
CAP_SERVER_URL=http://192.168.1.100:3000 npm run cap:sync
```

**For production:**
Edit `capacitor.config.ts` and change the default URL:
```typescript
server: {
  url: process.env.CAP_SERVER_URL || 'https://your-new-url.com',
  // ...
}
```

### Adding Allowed Domains

If video hosts or APIs are blocked, add them to `allowNavigation` in `capacitor.config.ts`:
```typescript
server: {
  allowNavigation: [
    'streamboxx.duckdns.org',
    'video-host.com',  // Add new domain here
    // ...
  ]
}
```

---

## 📱 Building the App

### 1. Sync Capacitor Configuration
After any config changes:
```bash
npm run cap:sync
```

### 2. Build Debug APK

**Option A: Using npm script (recommended)**
```bash
npm run android:debug
```

**Option B: Manual**
```bash
cd android
./gradlew assembleDebug
cd ..
```

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Install Debug APK on Phone

**USB Connection:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**File Transfer:**
- Copy APK to phone
- Open with file manager
- Tap to install (enable "Install from Unknown Sources" if prompted)

### 4. Open in Android Studio

To modify native code or use the emulator:
```bash
npm run cap:open
```

This opens the `android/` folder in Android Studio.

---

## 🔐 Building Signed Release APK/AAB

### Step 1: Generate Keystore

**Create a new keystore (only once):**
```bash
keytool -genkey -v -keystore streambox-release.keystore \
  -alias streambox -keyalg RSA -keysize 2048 -validity 10000
```

**Important:**
- Save the keystore file in a secure location (DO NOT commit to git)
- Remember the keystore password and key password
- Keep a backup of the keystore - you cannot update the app without it

### Step 2: Configure Signing

Create `android/keystore.properties` (NOT committed to git):
```properties
storeFile=/absolute/path/to/streambox-release.keystore
storePassword=your_keystore_password
keyAlias=streambox
keyPassword=your_key_password
```

### Step 3: Update build.gradle

Edit `android/app/build.gradle` and add signing config:

```gradle
android {
    // ... existing config ...
    
    signingConfigs {
        release {
            def keystorePropertiesFile = rootProject.file("keystore.properties")
            if (keystorePropertiesFile.exists()) {
                def keystoreProperties = new Properties()
                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 4: Build Release AAB (for Play Store)

```bash
npm run android:release
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

### Step 5: Build Release APK (for direct distribution)

```bash
cd android
./gradlew assembleRelease
cd ..
```

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

---

## 🧪 Testing Checklist

Test these on a real device:

### Basic Functionality
- [ ] App installs and launches
- [ ] Landing page loads correctly
- [ ] Navigation between pages works
- [ ] Images and styling render properly

### Authentication
- [ ] Sign in with Clerk
- [ ] Sign up flow
- [ ] Guest mode
- [ ] Session persists after closing app
- [ ] Logout works

### Video Playback
- [ ] Movies play
- [ ] Series/TV shows play
- [ ] Anime plays
- [ ] HLS streaming works smoothly
- [ ] Video controls work (play, pause, seek)

### Fullscreen & Rotation
- [ ] Tap fullscreen button
- [ ] Video enters fullscreen mode
- [ ] Rotate phone to landscape - video stays fullscreen
- [ ] Rotate back to portrait - video stays fullscreen
- [ ] Exit fullscreen - returns to portrait app view
- [ ] Audio continues during rotation

### Back Button
- [ ] Back button navigates within site
- [ ] Back button exits fullscreen video first
- [ ] Back button at root page exits app

### External Links
- [ ] YouTube links open in system browser
- [ ] External links don't open inside the app

### Offline Behavior
- [ ] Disable Wi-Fi/data before launching
- [ ] Offline page shows with "Retry" button
- [ ] Enable connection and tap Retry
- [ ] Site loads successfully

### App Lifecycle
- [ ] Switch to another app - video pauses
- [ ] Return to app - can resume video
- [ ] Lock screen - video pauses
- [ ] Unlock - app state preserved
- [ ] Force close and relaunch - session restored

---

## 🔄 Versioning

### Update Version Numbers

Edit `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 2        // Increment for every release
        versionName "1.0.1"  // User-facing version
    }
}
```

### Git Tagging
```bash
git tag android-v1.0.0
git push origin android-v1.0.0
```

---

## 🔄 Updating the App

### Website Updates
Website changes deploy automatically - no APK rebuild needed.

### Native Configuration Updates
After changing:
- `capacitor.config.ts`
- Android permissions
- Native code
- Icons/splash screen

Run:
```bash
npm run cap:sync
npm run android:debug  # or android:release
```

---

## ⚠️ Known Limitations & Risks

### 1. Internet Required
**Issue:** App needs active internet connection.
**Why:** The app loads a live website, and streaming inherently requires connectivity.
**Mitigation:** Clear offline message with troubleshooting tips.

### 2. Video Playback Issues

**Potential Problems:**
- **DRM Content:** WebView may not support Widevine DRM
- **Codec Support:** Some proprietary codecs may not work
- **Third-party Players:** Embedded players (YouTube, Vimeo) may detect WebView and block
- **HLS Compatibility:** Older Android versions may have limited HLS support

**Testing Required:**
- Test all video sources on real devices
- Check multiple Android versions (8.0+)
- Verify with different video hosts

### 3. Google Play Policy Risks

#### Risk: Copyrighted Content
**Issue:** Streaming movies/shows may violate content policies.
**Solution:**
- Ensure you have proper licensing for all content
- Add clear Terms of Service
- Implement DMCA takedown process

#### Risk: "Thin Wrapper" Rejection
**Issue:** Google Play may reject apps that are just web views without native functionality.
**Mitigation:**
Add native features:
- Push notifications (@capacitor/push-notifications)
- Share functionality (@capacitor/share)
- Deep links for content
- Offline download capability
- Native video player integration
- Biometric authentication

**Alternative:** Distribute outside Play Store (direct APK download, third-party stores).

### 4. Performance
**Limitation:** WebView performance is slightly slower than a native app.
**Impact:** Initial load may take 1-2 seconds longer than native.
**Acceptable for:** Streaming apps where content load time is the main bottleneck anyway.

### 5. App Size
**Current:** ~15-20MB
**With Assets:** ~30-50MB with icons, splash, and optimizations
**Acceptable:** Industry standard for streaming apps.

### 6. Back Button Behavior
**Issue:** Android back button behavior must be custom-coded.
**Status:** ✅ Implemented in MainActivity.java

### 7. Status Bar & System UI
**Issue:** Status bar may overlay content.
**Status:** ✅ Configured via @capacitor/status-bar

---

## 🚀 Suggested Native Enhancements

If Google Play rejects the app or you want better UX, consider adding:

### 1. Push Notifications
```bash
npm install @capacitor/push-notifications
```
Use for: New content alerts, watch reminders.

### 2. Share Functionality
```bash
npm install @capacitor/share
```
Use for: Share movies/shows with friends.

### 3. Deep Links
Configure in AndroidManifest.xml to open specific content:
`streambox://watch/movie-id`

### 4. Biometric Auth
```bash
npm install @capacitor-community/biometric
```
Use for: Quick login with fingerprint/face.

### 5. Download Manager (Native)
Implement native video download instead of streaming-only.

### 6. Native Video Player
Use ExoPlayer instead of WebView video for better performance.

---

## 📞 Support

### Common Issues

**1. Build fails with "SDK not found"**
- Set `ANDROID_HOME` environment variable
- Run `android/gradlew --version` to verify

**2. App crashes on launch**
- Check Android logs: `adb logcat | grep Streambox`
- Verify server URL is accessible
- Check for SSL certificate issues

**3. Videos don't play**
- Enable hardware acceleration (✅ already enabled)
- Check video URL is HTTPS
- Test video URL in mobile browser first

**4. White screen on launch**
- Check network connection
- Verify server URL in capacitor.config.ts
- Check CORS configuration on server

**5. Back button doesn't work**
- Verify MainActivity.java is properly configured
- Check WebView history is populated

---

## 📝 Development Workflow

### Day-to-Day Development

1. **Make website changes** → Deploy website → Changes go live immediately
2. **Test in browser** → Test at https://streamboxx.duckdns.org
3. **Periodic APK testing** → Build debug APK weekly to catch Android-specific issues

### Before Release

1. Test all features on physical devices (not just emulator)
2. Test on multiple Android versions (8.0, 10, 12, 13+)
3. Test on different screen sizes
4. Test with slow/unstable network
5. Increment versionCode and versionName
6. Build signed release AAB
7. Test release build before publishing
8. Create git tag
9. Upload to Play Console

---

## 📚 Resources

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Android Developer Guide:** https://developer.android.com/guide
- **Play Console:** https://play.google.com/console
- **Capacitor Android Guide:** https://capacitorjs.com/docs/android

---

**Built with ❤️ using Capacitor**
