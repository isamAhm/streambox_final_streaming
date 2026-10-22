# Live Sports Android Fix - REVERTED

## Original Issue
Live Sports streams were not playing on Android app, showing error:
```
Remove sandbox attributes on the iframe tag
```

## Attempted Fix (FAILED)
Initially tried adding `sandbox` attribute with permissions to the iframe, thinking it was a WebView security issue.

## Actual Root Cause
The error message "Remove sandbox attributes on the iframe tag" is **NOT** a browser/WebView error - it's coming from the **streaming provider's anti-embedding protection**. 

The streaming provider detects when their content is embedded in an iframe with sandbox restrictions and blocks playback with this specific error message.

## Correct Solution
**REMOVE all sandbox attributes from the iframe** - the iframe must have NO sandbox restrictions for the streaming provider to allow playback.

## What We Learned
1. The same error appears on both web and Android when sandbox is present
2. The streaming provider actively detects and blocks sandboxed iframes
3. Live Sports streams require an unrestricted iframe to work
4. This is a provider-side restriction, not a browser/WebView security policy

## Files Modified
- `pages/live-sports.tsx` - Removed sandbox attribute from iframe (reverted to original)

## Current Status
✅ Sandbox attribute removed (reverted)
⏳ Testing needed to see if Android works without sandbox
❓ May need alternative solution for Android if provider blocks WebView entirely

## Next Steps
1. Test if Live Sports works on Android without any sandbox attributes
2. If still broken on Android, the issue may be provider-level WebView detection
3. May need to find alternative streaming sources that support WebView/mobile apps
