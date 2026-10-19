# App Resources

## Icon
Replace `icon.png` with your 1024x1024 PNG logo (will be resized for all Android densities).

## Splash Screen
Replace `splash.png` with your splash screen image (2732x2732 PNG recommended).

## Generating Assets
After replacing the images, run:
```bash
npx @capacitor/assets generate --android
```

This will automatically generate all required icon and splash screen sizes for Android.

## Current Placeholders
The default Capacitor icons are being used until you provide your own assets.
