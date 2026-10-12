# CinemaOS Pages Integration

## Overview
Added three new pages that embed CinemaOS content directly into StreamBox, providing access to Live Sports, Live TV channels, and curated Collections.

## New Pages

### 1. Live Sports (`/live-sports`)
**File**: `pages/live-sports.tsx`
- Embeds `https://cinemaos.live/livesports`
- Full-screen iframe with StreamBox navbar
- Back button to return to home
- Access to live sports events and streams

### 2. Live TV (`/live-tv`)
**File**: `pages/live-tv.tsx`
- Embeds `https://cinemaos.live/iptv`
- IPTV channels from around the world
- Live streaming channels
- Full-screen viewing experience

### 3. Collections (`/collections`)
**File**: `pages/collections.tsx`
- Embeds `https://cinemaos.live/collection`
- Curated movie and TV show collections
- Organized content by themes/categories
- Easy browsing and discovery

## Navigation Updates

### Desktop Navigation (Navbar)
**File**: `components/Navbar.tsx`

Added three new navigation items after "Anime":
- Live Sports
- Live TV
- Collections

**New Order**:
1. Home
2. Series
3. Movies
4. My List
5. Anime
6. **Live Sports** ← NEW
7. **Live TV** ← NEW
8. **Collections** ← NEW
9. Cinema Room

### Mobile Navigation (MobileMenu)
**File**: `components/MobileMenu.tsx`

Same navigation items added to mobile menu for consistent experience across all devices.

## Page Structure

Each page follows the same pattern:
```tsx
- Full-screen container (h-screen w-screen)
- StreamBox Navbar at top
- Back button (absolute positioned, top-left)
- Full-screen iframe embedding CinemaOS content
```

### Features:
- ✅ Maintains StreamBox branding and navbar
- ✅ Back button to return to home
- ✅ Full-screen iframe for immersive experience
- ✅ Responsive design
- ✅ Seamless integration with existing navigation

## User Experience

### Desktop:
- Navigation links in top navbar
- Click to access CinemaOS content
- Full-screen viewing
- Back button or navbar to navigate away

### Mobile:
- Navigation via hamburger menu
- Same full-screen experience
- Touch-friendly back button

## Technical Details

### Iframe Configuration:
```tsx
<iframe
  src="https://cinemaos.live/[page]"
  className="w-full h-full"
  allowFullScreen
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  title="[Page Title]"
/>
```

### Permissions Enabled:
- Autoplay - for video content
- Encrypted media - for DRM content
- Fullscreen - for immersive viewing
- Picture-in-picture - for multitasking
- Clipboard write - for copying links/info

## CinemaOS Content

### Live Sports:
- Live sporting events
- Multiple sports categories
- Real-time streams
- Sports schedules

### Live TV:
- International TV channels
- News, entertainment, sports
- 24/7 live streams
- Channel guide

### Collections:
- Curated movie collections
- Themed content groups
- Organized by genre, mood, era
- Easy content discovery

## Benefits

✅ **Expanded Content** - Access to live TV and sports alongside on-demand content
✅ **No Additional APIs** - Uses CinemaOS's existing infrastructure
✅ **Seamless Integration** - Feels like native StreamBox pages
✅ **Zero Maintenance** - CinemaOS handles content updates
✅ **Professional Experience** - Full-screen, responsive design
✅ **Easy Navigation** - Integrated into main navigation menu

## Files Created/Modified

### New Files:
1. ✅ `pages/live-sports.tsx` - Live Sports page
2. ✅ `pages/live-tv.tsx` - Live TV page
3. ✅ `pages/collections.tsx` - Collections page

### Modified Files:
1. ✅ `components/Navbar.tsx` - Added 3 navigation links
2. ✅ `components/MobileMenu.tsx` - Added 3 mobile navigation items

## Build Status

✅ Build passes successfully
✅ No TypeScript errors
✅ All pages accessible
✅ Navigation working correctly

## Usage

Users can now:
1. Click "Live Sports" in navbar → Watch live sporting events
2. Click "Live TV" in navbar → Browse live TV channels
3. Click "Collections" in navbar → Explore curated content
4. Use back button or navbar to return to StreamBox content
