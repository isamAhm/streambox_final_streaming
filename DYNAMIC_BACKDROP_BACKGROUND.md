# Dynamic Backdrop Background Feature

## Overview
The home page now features a dynamic blurred background that adapts to the currently displayed billboard backdrop. Every time the billboard rotates to a new movie/show, the entire page background smoothly transitions to match.

## Implementation

### 1. Billboard Backdrop Store
**File**: `hooks/useBillboardBackdrop.ts`

Created a Zustand store to share the current billboard backdrop URL across components:
```typescript
interface BillboardBackdropStore {
  backdropUrl: string;
  setBackdropUrl: (url: string) => void;
}
```

### 2. Billboard Component Update
**File**: `components/Billboard.tsx`

Updated to publish backdrop changes:
- Imported `useBillboardBackdrop` hook
- Added effect to update backdrop URL whenever the main movie changes:
```typescript
useEffect(() => {
  if (mainMovie?.backdropUrl || mainMovie?.thumbnailUrl) {
    setBackdropUrl(mainMovie.backdropUrl || mainMovie.thumbnailUrl);
  }
}, [mainMovie?.backdropUrl, mainMovie?.thumbnailUrl, setBackdropUrl]);
```

### 3. Home Page Background
**File**: `pages/index.tsx`

Added dynamic blurred background layer:
```typescript
<div className="min-h-screen overflow-x-hidden relative">
  {/* Dynamic Blurred Background */}
  <div 
    className="fixed inset-0 w-full h-full transition-all duration-1000 ease-in-out"
    style={{
      backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}
  >
    {/* Heavy blur and dark overlay */}
    <div className="absolute inset-0 backdrop-blur-3xl bg-black/70" />
  </div>

  {/* Content - positioned above background */}
  <div className="relative z-10">
    {/* All page content */}
  </div>
</div>
```

## Visual Effect

### Background Layers (bottom to top):
1. **Fixed background image** - The current billboard backdrop
2. **Blur layer** - `backdrop-blur-3xl` creates heavy blur effect
3. **Dark overlay** - `bg-black/70` adds 70% black opacity for readability
4. **Page content** - All content (navbar, billboard, movie lists) sits on top with `z-10`

### Transitions:
- **Duration**: 1 second (`duration-1000`)
- **Easing**: `ease-in-out` for smooth, natural transitions
- **Trigger**: Automatically whenever billboard changes (manual navigation, auto-rotation, or thumbnail clicks)

## User Experience

✨ **Immersive Feel**: Background color scheme matches the current featured content
✨ **Smooth Transitions**: 1-second fade between backdrops prevents jarring changes
✨ **Readable Content**: Heavy blur + dark overlay ensures text and cards remain crisp
✨ **Dynamic Adaptation**: Background updates automatically with billboard rotation (5 seconds in auto-mode)
✨ **Performance**: Uses CSS backdrop-filter for GPU-accelerated blur

## Technical Details

### Positioning Strategy:
- Background: `fixed` - stays in place during scroll
- Content wrapper: `relative` with `z-10` - floats above background
- Billboard and sections: Normal flow within content wrapper

### Blur Intensity:
- `backdrop-blur-3xl` = 64px blur radius
- Combined with 70% black overlay prevents distraction
- Ensures movie cards and text have perfect contrast

### Image Loading:
- Uses same backdrop URLs already loaded by Billboard
- No additional network requests
- Instant updates via Zustand state

## Browser Support

✅ Modern browsers (Chrome, Firefox, Safari, Edge)
✅ Backdrop-filter supported in all major browsers
✅ Graceful degradation: solid black background if backdrop-filter unsupported

## Files Modified

1. ✅ `hooks/useBillboardBackdrop.ts` - NEW: Zustand store for backdrop state
2. ✅ `components/Billboard.tsx` - Publishes backdrop URL changes
3. ✅ `pages/index.tsx` - Consumes backdrop URL and renders blurred background

## Build Status

✅ Build passes successfully
✅ No TypeScript errors
✅ No runtime errors
