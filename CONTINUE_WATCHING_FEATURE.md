# Continue Watching Feature

## Overview
Implemented a Netflix-style "Continue Watching" feature that tracks user viewing history and displays partially watched content with progress indicators.

## Features

### 1. Watch History Tracking
- **Automatic Tracking**: Starts tracking when user begins watching
- **Progress Updates**: Updates every 30 seconds while watching
- **Progress Estimation**: Estimates progress based on watch duration
- **Completion Detection**: Marks as completed when 95% or more watched
- **User-Specific**: Each user has their own watch history

### 2. Database Schema
Added `WatchHistory` model to Prisma schema:
```prisma
model WatchHistory {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String
  movieId      String   @db.ObjectId
  progress     Float    @default(0) // Progress percentage (0-100)
  lastWatched  DateTime @default(now())
  completed    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([userId, movieId])
  @@index([userId, lastWatched])
}
```

### 3. API Endpoints

#### GET /api/watch-history
- Fetches user's continue watching list
- Returns only incomplete items (< 95% watched)
- Ordered by last watched (most recent first)
- Limited to 20 items
- Includes movie details with progress

#### POST /api/watch-history/update
- Updates or creates watch history entry
- Parameters:
  - `movieId`: Movie ID (required)
  - `progress`: Progress percentage 0-100 (required)
- Automatically marks as completed if progress >= 95%
- Updates `lastWatched` timestamp

### 4. Components

#### ContinueWatchingCard
- Similar to MovieCard but with progress bar
- Shows red progress bar at bottom of poster
- Displays "X% watched" on hover
- Netflix-style hover effect with 150% scale
- Smooth transitions and animations

#### ContinueWatchingList
- Horizontal scrolling list with navigation arrows
- Netflix-style sliding algorithm
- Cards translate left/right when hovering adjacent cards
- Shows/hides arrows based on scroll position
- Responsive card sizing

### 5. Progress Tracking Logic

**In Watch Page:**
```typescript
// Records initial watch
- POST /api/watch-history/update with progress: 0

// Updates every 30 seconds
- Calculates watch duration
- Estimates progress: (watchDuration / 7200) * 100
- Caps at 95% to avoid auto-completion
- POST /api/watch-history/update with estimated progress

// Cleanup on unmount
- Clears interval timer
```

**Progress Estimation:**
- Based on watch time, not actual video progress
- Assumes 2-hour (7200 seconds) average duration
- 30 seconds of watching ≈ 0.4% progress
- Capped at 95% to require manual completion

### 6. UI/UX Features

**Progress Bar:**
- Red bar (Netflix style) at bottom of poster
- Visible on both normal and hover states
- Smooth width transition
- Height: 1px normal, 1.5px on hover

**Card Hover:**
- Scales to 150% (same as regular MovieCard)
- Shows action buttons (Play, More Info)
- Displays progress percentage in green text
- Shows metadata (year, duration, genre)

**List Behavior:**
- Only shows if user has watch history
- Positioned below Billboard, above Trending
- Horizontal scrolling with smooth animations
- Arrow navigation on hover

### 7. Data Flow

```
User starts watching
    ↓
Watch page loads
    ↓
POST /api/watch-history/update (progress: 0)
    ↓
Every 30 seconds:
    - Calculate watch duration
    - Estimate progress
    - POST /api/watch-history/update
    ↓
User leaves page
    - Cleanup interval
    ↓
Home page loads
    ↓
GET /api/watch-history
    ↓
Display Continue Watching section
```

### 8. Responsive Design
- **Mobile (< 640px)**: 140px card width
- **Small (640px - 768px)**: 160px card width
- **Medium (768px - 1024px)**: 180px card width
- **Large (1024px+)**: 200px card width

### 9. Performance Optimizations
- SWR for data fetching with automatic revalidation
- Debounced scroll position checks
- Transform-based animations for 60fps
- Interval cleanup on component unmount
- Unique constraint prevents duplicate entries

### 10. Future Enhancements
- [ ] Actual video progress tracking (requires player API)
- [ ] Resume from exact timestamp
- [ ] Remove from continue watching option
- [ ] Episode tracking for TV shows
- [ ] Watch history page with all items
- [ ] Progress sync across devices
- [ ] Completion notifications
- [ ] Watch time analytics

## Technical Details

### Files Created
1. `prisma/schema.prisma` - Added WatchHistory model
2. `pages/api/watch-history/index.ts` - Get watch history
3. `pages/api/watch-history/update.ts` - Update watch progress
4. `hooks/useContinueWatching.ts` - SWR hook for fetching
5. `components/ContinueWatchingCard.tsx` - Card with progress bar
6. `components/ContinueWatchingList.tsx` - Horizontal list component

### Files Modified
1. `pages/watch/[movieId].tsx` - Added progress tracking
2. `pages/index.tsx` - Added Continue Watching section

### Dependencies Used
- Prisma Client - Database operations
- SWR - Data fetching and caching
- Axios - HTTP requests
- React Hooks - State and effects management

## Usage

### For Users
1. Start watching any movie/show
2. Leave before finishing
3. Return to home page
4. See "Continue Watching" section below billboard
5. Click to resume watching

### For Developers
```typescript
// Fetch continue watching data
const { data, isLoading } = useContinueWatching();

// Update watch progress
await axios.post('/api/watch-history/update', {
  movieId: 'movie-id',
  progress: 45.5 // 45.5% watched
});

// Get watch history
const response = await axios.get('/api/watch-history');
```

## Database Migration
After adding the WatchHistory model, run:
```bash
npx prisma generate
npx prisma db push  # If using MongoDB Atlas
```

## Security Considerations
- User authentication required for all endpoints
- User ID from session, not client
- Unique constraint prevents data duplication
- Progress validation (0-100 range)
- Movie existence validation

## Browser Compatibility
- Modern browsers with ES6+ support
- Interval API support
- Transform and transition support
- Flexbox and Grid support
