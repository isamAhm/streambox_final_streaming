# Search Page - Minimalistic Hover Effect

## Overview
Created a new `SearchMovieCard` component with a subtle, minimalistic hover effect specifically designed for grid layouts. The previous MovieCard with 150% scaling was too large and disruptive in a dense grid.

## Changes Made

### 1. New Component: SearchMovieCard
Created a dedicated component for search results with a refined hover interaction.

**Key Features:**
- No scaling or expansion
- Subtle image zoom (105%)
- Darkened overlay on hover
- Centered play button
- Info slides up from bottom
- Smooth transitions

### 2. Hover Effects

**Image:**
- Scales to 105% (very subtle)
- Brightness reduced to 75%
- Smooth 300ms transition

**Overlay:**
- Gradient from black/80% (bottom) to transparent (top)
- Fades in on hover
- Provides contrast for text

**Play Button:**
- White circular button (12px/48px)
- Centered on image
- Scales from 0 to 100% on hover
- Shadow for depth
- Smooth transform animation

**Info Section:**
- Title and year at bottom
- Slides up from below on hover
- 2-line title clamp
- White text with good contrast

**Static Title:**
- Below card when not hovering
- Fades out on hover
- Prevents layout shift

### 3. Visual Design

**Normal State:**
```
┌─────────────┐
│             │
│   Poster    │
│   Image     │
│             │
└─────────────┘
  Title
  Year
```

**Hover State:**
```
┌─────────────┐
│             │
│      ⚪     │  ← Play button
│   (Darker)  │
│   Title     │  ← Info slides up
│   Year      │
└─────────────┘
```

### 4. Comparison: Old vs New

#### Old (MovieCard)
- ❌ Scales to 150% (too large)
- ❌ Expands with details panel
- ❌ Overlaps adjacent cards
- ❌ Disruptive in grid layout
- ❌ Complex hover state

#### New (SearchMovieCard)
- ✅ Stays in place (no scaling)
- ✅ Subtle 105% image zoom
- ✅ Clean overlay design
- ✅ No overlap with other cards
- ✅ Minimalistic and elegant

### 5. Technical Details

**Transitions:**
- All: 300ms duration
- Timing: ease-in-out (default)
- Properties: opacity, transform, scale, brightness

**Z-Index:**
- No z-index changes needed
- Cards stay in their grid position
- No stacking context issues

**Performance:**
- Transform-based animations (GPU accelerated)
- No layout recalculation
- Smooth 60fps animations

### 6. Responsive Grid

**Columns by Screen Size:**
- Mobile (< 640px): 2 columns
- Small (640px - 768px): 3 columns
- Medium (768px - 1024px): 4 columns
- Large (1024px - 1280px): 5 columns
- XL (1280px+): 6 columns

**Gap:**
- Mobile: 12px (gap-3)
- Desktop: 16px (gap-4)

### 7. Accessibility

**Keyboard Navigation:**
- Cards are focusable
- Play button is a proper button element
- Semantic HTML structure

**Screen Readers:**
- Alt text on images
- Descriptive button labels
- Proper heading hierarchy

### 8. Use Cases

**SearchMovieCard (Grid):**
- Search results page
- Browse by genre page
- Any dense grid layout
- When space is limited

**MovieCard (Horizontal List):**
- Home page carousels
- Continue Watching
- Trending sections
- When cards have space to expand

## Files Created
1. `components/SearchMovieCard.tsx` - New minimalistic card

## Files Modified
1. `pages/search.tsx` - Uses SearchMovieCard instead of MovieCard

## CSS Classes Used

**Container:**
- `group` - Parent hover trigger
- `relative` - Positioning context
- `cursor-pointer` - Indicates clickable

**Image:**
- `aspect-[2/3]` - Portrait aspect ratio
- `group-hover:scale-105` - Subtle zoom
- `group-hover:brightness-75` - Darken on hover
- `transition-all duration-300` - Smooth animation

**Overlay:**
- `bg-gradient-to-t` - Bottom to top gradient
- `from-black/80` - Dark at bottom
- `to-transparent` - Fade to clear
- `opacity-0 group-hover:opacity-100` - Fade in

**Play Button:**
- `scale-0 group-hover:scale-100` - Pop in effect
- `bg-white/90` - Semi-transparent white
- `rounded-full` - Circular shape
- `shadow-lg` - Depth

**Info:**
- `translate-y-2 group-hover:translate-y-0` - Slide up
- `line-clamp-2` - Max 2 lines
- `text-sm` - Small text size

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid support required
- Transform and transition support required
- Backdrop-filter not required (no blur)

## Performance Notes
- Lightweight animations
- No JavaScript hover handlers
- Pure CSS transitions
- GPU-accelerated transforms
- No layout thrashing

## Future Enhancements
- [ ] Add rating display
- [ ] Show genre tags on hover
- [ ] Add to favorites button
- [ ] Quick preview on long hover
- [ ] Skeleton loading states
- [ ] Lazy load images
- [ ] Intersection observer for animations
