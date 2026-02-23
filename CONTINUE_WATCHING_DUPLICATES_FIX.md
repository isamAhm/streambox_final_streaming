# Continue Watching Duplicates Fix

## Problem
Continue Watching section was showing duplicate entries for the same movie when users watched and returned to home page.

## Root Cause
The unique constraint `@@unique([userId, movieId])` in the Prisma schema was defined but not properly synced to the MongoDB database. This allowed duplicate watch history entries to be created.

## Solution Applied

### 1. Added Deduplication Logic to API
Updated `/api/watch-history/index.ts` to deduplicate results:
```typescript
// Deduplicate by movie ID (just in case)
const uniqueMovies = validMovies.reduce((acc, movie) => {
  if (movie && !acc.find(m => m.id === movie.id)) {
    acc.push(movie);
  }
  return acc;
}, [] as any[]);
```

### 2. Created Cleanup Script
Created `scripts/check-watch-history-duplicates.ts` to:
- Find duplicate watch history entries
- Keep the most recent entry
- Delete older duplicates
- Report cleanup results

**Results:**
- Found 2 duplicate groups
- Cleaned up 2 duplicate entries
- Final count: 3 unique entries

### 3. Synced Database Indexes
Ran `npx prisma db push` to ensure unique constraint is enforced:
```
[+] Unique index `WatchHistory_userId_movieId_key` on ({"userId":1,"movieId":1})
```

## How It Works Now

### Unique Constraint
```prisma
model WatchHistory {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String
  movieId      String   @db.ObjectId
  progress     Float    @default(0)
  lastWatched  DateTime @default(now())
  completed    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([userId, movieId])  // Prevents duplicates
  @@index([userId, lastWatched])
}
```

### Upsert Logic
The update API uses `upsert` with the unique constraint:
```typescript
await prismadb.watchHistory.upsert({
  where: {
    userId_movieId: {
      userId: currentUser.id,
      movieId: movieId
    }
  },
  update: { /* update fields */ },
  create: { /* create fields */ }
});
```

This ensures:
- If entry exists → Update it
- If entry doesn't exist → Create it
- Never creates duplicates

## Testing

### Check for Duplicates
```bash
npx ts-node scripts/check-watch-history-duplicates.ts
```

### Manual Database Check
```typescript
// In MongoDB shell or script
db.WatchHistory.aggregate([
  {
    $group: {
      _id: { userId: "$userId", movieId: "$movieId" },
      count: { $sum: 1 }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
])
```

## Prevention

### Database Level
- ✅ Unique index enforced in MongoDB
- ✅ Prevents duplicate inserts at database level

### Application Level
- ✅ Upsert operation instead of insert
- ✅ Deduplication in API response
- ✅ Proper error handling

### API Level
- ✅ Single source of truth for updates
- ✅ Atomic operations
- ✅ Transaction-safe upserts

## Files Modified
1. `pages/api/watch-history/index.ts` - Added deduplication
2. `prisma/schema.prisma` - Already had unique constraint
3. `scripts/check-watch-history-duplicates.ts` - New cleanup script

## Files Checked
1. `pages/api/watch-history/update.ts` - Upsert logic verified ✅
2. `pages/watch/[movieId].tsx` - Progress tracking verified ✅
3. `components/ContinueWatchingList.tsx` - Display logic verified ✅

## Future Improvements
- [ ] Add optimistic locking with version field
- [ ] Implement retry logic for failed upserts
- [ ] Add monitoring for duplicate detection
- [ ] Create automated cleanup job
- [ ] Add unit tests for upsert logic

## Verification Steps
1. ✅ Cleaned existing duplicates
2. ✅ Synced unique index to database
3. ✅ Added deduplication to API
4. ✅ Verified upsert logic

## Expected Behavior Now
1. User watches a movie → Creates watch history entry
2. User watches same movie again → Updates existing entry
3. User returns to home → Shows single entry in Continue Watching
4. No duplicates possible due to unique constraint

## Monitoring
Watch for these in logs:
- Unique constraint violation errors (expected, means it's working)
- Multiple entries for same user+movie (should not happen)
- Failed upsert operations (investigate if occurs)
