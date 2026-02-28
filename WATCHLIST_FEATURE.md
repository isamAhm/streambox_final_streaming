# Watchlist Feature with Categories

## Overview
A comprehensive watchlist system that allows users to categorize their movies and shows into three statuses: Watching, Completed, and Plan to Watch.

## Features

### User-Facing Features
- **Add to List Modal**: Beautiful modal that appears when clicking the + button
- **Three Categories**:
  - 📺 Watching - Currently watching
  - ✅ Completed - Finished watching
  - 📌 Plan to Watch - Want to watch later
- **My List Page**: Organized tabs to view items by category
- **Quick Remove**: Click the checkmark to remove from list
- **Status Counts**: See how many items in each category

### Technical Features
- Replaces the old favorites system with a more robust watchlist
- Database-backed with Prisma
- SWR for efficient data fetching
- Optimistic UI updates
- Toast notifications for feedback

## Database Schema

### Watchlist Model
```prisma
model Watchlist {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String
  movieId   String   @db.ObjectId
  status    String   // "watching", "completed", "plan_to_watch"
  addedAt   DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, movieId])
  @@index([userId, status])
}
```

## Setup Instructions

### 1. Update Database
```bash
npx prisma generate
npx prisma db push
```

### 2. Files Created

**Components:**
- `components/WatchlistModal.tsx` - Modal for selecting status
- `components/WatchlistButton.tsx` - Button to add/remove from list

**Hooks:**
- `hooks/useWatchlist.ts` - SWR hook for fetching watchlist

**API Endpoints:**
- `pages/api/watchlist/index.ts` - GET (fetch) and POST (add/update)
- `pages/api/watchlist/remove.ts` - DELETE to remove from list

**Pages:**
- `pages/myList.tsx` - Updated with category tabs

**Updated Files:**
- `components/MovieCard.tsx` - Uses WatchlistButton
- `components/InfoModal.tsx` - Uses WatchlistButton
- `prisma/schema.prisma` - Added Watchlist model

## API Usage

### Fetch Watchlist
```typescript
GET /api/watchlist
GET /api/watchlist?status=watching
GET /api/watchlist?status=completed
GET /api/watchlist?status=plan_to_watch
```

### Add/Update Item
```typescript
POST /api/watchlist
Body: {
  movieId: string,
  status: "watching" | "completed" | "plan_to_watch"
}
```

### Remove Item
```typescript
DELETE /api/watchlist/remove?movieId=<id>
```

## Component Usage

### WatchlistButton
```tsx
import WatchlistButton from '@/components/WatchlistButton';

<WatchlistButton 
  movieId={movie.id} 
  movieTitle={movie.title} 
/>
```

### WatchlistModal
```tsx
import WatchlistModal from '@/components/WatchlistModal';

<WatchlistModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  movieId={movieId}
  movieTitle={movieTitle}
  currentStatus={currentStatus}
  onSuccess={() => mutate()}
/>
```

## User Flow

1. **Adding to List:**
   - User clicks + button on movie card
   - Modal appears with three status options
   - User selects a status
   - Item is added to watchlist
   - Button changes to checkmark
   - Toast notification confirms

2. **Removing from List:**
   - User clicks checkmark button
   - Item is removed immediately
   - Button changes back to +
   - Toast notification confirms

3. **Viewing My List:**
   - Navigate to My List page
   - See tabs: All, Watching, Completed, Plan to Watch
   - Click tabs to filter by status
   - Each tab shows count badge
   - Empty states with helpful messages

## Migration from Favorites

The old `favoriteIds` array in the User model is still present but no longer used. The new Watchlist system is completely separate and more flexible.

To migrate existing favorites to watchlist:
```typescript
// Migration script (optional)
const users = await prismadb.user.findMany();
for (const user of users) {
  for (const movieId of user.favoriteIds) {
    await prismadb.watchlist.create({
      data: {
        userId: user.id,
        movieId,
        status: 'plan_to_watch', // Default status
      },
    });
  }
}
```

## Styling

- Dark theme matching the app
- Smooth transitions and animations
- Responsive design
- Icon indicators for each status
- Count badges on tabs
- Empty state illustrations

## Future Enhancements

- Drag and drop to reorder
- Custom lists/collections
- Share lists with friends
- Export list to CSV
- Import from other services
- Progress tracking for TV shows
- Ratings and reviews
- Watch history integration
