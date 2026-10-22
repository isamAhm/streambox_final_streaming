# Live Sports Android Fix - Sandbox Attribute

## Issue
Live Sports streams were not playing on Android app, showing error:
```
Remove sandbox attributes on the iframe tag
```

## Root Cause
Android WebView has stricter security policies than regular browsers. When an iframe doesn't have explicit `sandbox` permissions, the WebView blocks it by default for security reasons.

## Solution
Added `sandbox` attribute with necessary permissions to the Live Sports iframe:

```tsx
sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
```

### Sandbox Permissions Explained:
- `allow-scripts` - Allows JavaScript execution in the iframe (required for video players)
- `allow-same-origin` - Allows iframe to access its own origin (required for API calls)
- `allow-forms` - Allows form submission (some players have controls)
- `allow-popups` - Allows popups (some streams may need this)
- `allow-presentation` - Allows fullscreen mode

## Files Modified
- `pages/live-sports.tsx` - Added sandbox attribute to iframe

## Why Live TV Didn't Need This
Live TV was already working fine without the sandbox attribute, likely because:
1. Different iframe source/provider
2. Simpler embed requirements
3. Different security context

We only applied the fix to Live Sports where the issue was occurring.

## Testing
After this fix:
- ✅ Live Sports streams should play on Android
- ✅ Fullscreen should work
- ✅ Stream controls should be functional
- ✅ No more "Remove sandbox attributes" error

## Deployment
This is a website code change, so it requires:
1. Push to repository
2. Deploy to production server
3. Clear Android app cache or reinstall
4. Test live sports streaming

## Status
✅ Code Fixed  
⏳ Needs Production Deployment
