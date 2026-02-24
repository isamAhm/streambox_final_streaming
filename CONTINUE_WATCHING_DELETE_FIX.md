# Continue Watching Delete Fix

## Critical Issue Found and Fixed

### Root Cause: User ID Mismatch
**Problem**: The delete API was using Clerk's `userId` (e.g., "user_abc123") while the watch history records were stored with Prisma's `currentUser.id` (MongoDB ObjectId). This caused the delete query to find 0 records, so nothing was actually deleted from the database.

**Solution**: Changed the delete API to use `serverAuth` (like all other APIs) which returns the correct Prisma user ID.

## Issues Fixed

### 1. Database Deletion Not Working (CRITICAL)
**Problem**: 
- Delete API used `getAuth(req).userId` which returns Clerk user ID
- Watch history records stored with `currentUser.id` (Prisma MongoDB ObjectId)
- Query matched 0 records, so nothing was deleted
- On refresh, all "deleted" items reappeared

**Solution**: 
- Changed delete API to use `serverAuth(req)` 
- Now uses `currentUser.id` matching the stored userId
- Deletions now persist in the database

### 2. Continue Watching Not Updating Without Refresh
**Problem**: When you watch a new movie, it doesn't appear in "Continue Watching" until you refresh the page.

**Solution**:
- Added SWR cache mutation in watch page after recording watch history
- Enabled `revalidateIfStale` and `revalidateOnMount` in the hook
- Added automatic revalidation when returning to home page
- Continue watching updates immediately when you start watching a movie

### 3. React Hooks Error: "Rendered fewer hooks than expected"
**Problem**: The `ContinueWatchingList` component was returning `null` early before all hooks were called, violating React's Rules of Hooks.

**Solution**: Moved all hook calls (useState, useEffect, useMemo) to the top of the component before any conditional returns.

### 4. Session Expired Toast
**Problem**: Full-screen error blocking the UI when Clerk session expires.

**Solution**: 
- Updated `ClerkErrorBoundary` to show toast notifications instead of full-screen errors
- Added global unhandled promise rejection handler in `_app.tsx`
- Toast includes "Refresh" and "Sign Out" action buttons

## Files Modified

1. **pages/api/watch-history/delete.ts** (CRITICAL FIX)
   - Changed from `getAuth(req).userId` to `serverAuth(req).currentUser.id`
   - Now uses correct Prisma user ID for database queries
   - Deletions now persist correctly

2. **pages/watch/[movieId].tsx** (NEW - Real-time Updates)
   - Added SWR mutate import
   - Calls `mutate('/api/watch-history')` after recording watch start
   - Updates cache in background during progress updates
   - Continue watching updates immediately without refresh

3. **hooks/useContinueWatching.ts** (UPDATED)
   - Enabled `revalidateIfStale` to fetch fresh data when stale
   - Enabled `revalidateOnMount` to fetch on component mount
   - Reduced deduping interval to 2 seconds
   - Keeps `revalidateOnFocus` disabled to prevent unwanted refetches

4. **pages/index.tsx** (UPDATED)
   - Added `mutate` function from `useContinueWatching` hook
   - Calls `mutateContinueWatching()` on component mount
   - Ensures fresh data when navigating back from watch page

5. **components/ContinueWatchingCard.tsx**
   - Added SWR mutate import
   - Optimistic UI update before API call
   - Proper cache revalidation after deletion
   - Error handling with cache restoration

6. **components/ContinueWatchingList.tsx**
   - Fixed hooks order (all hooks before conditional return)
   - Added useMemo for isEmpty check
   - Proper TypeScript typing for items state
   - Removed lodash isEmpty dependency

7. **pages/api/watch-history/index.ts**
   - Added console logging for debugging
   - Logs user ID, entry count, and results

8. **components/ClerkErrorBoundary.tsx**
   - Shows toast notification instead of full-screen error
   - Allows app to continue rendering
   - Persistent toast with action buttons

9. **pages/_app.tsx**
   - Added global unhandled rejection handler
   - Catches Clerk token refresh errors
   - Shows dismissible toast with refresh option

## Authentication Flow

The app uses a hybrid authentication system:
- **Clerk**: Handles authentication and session management
- **Prisma**: Stores user data in MongoDB with email as the unique identifier

**serverAuth Flow**:
1. Gets Clerk userId from request
2. Fetches Clerk user to get primary email
3. Finds or creates Prisma user by email
4. Returns `currentUser` with Prisma MongoDB ObjectId as `id`

**Why This Matters**:
- All database operations must use `currentUser.id` (Prisma ID)
- Never use Clerk's `userId` directly for database queries
- The two IDs are completely different and not interchangeable

## How It Works Now

### Watching a Movie:
1. User clicks play on a movie
2. Watch page loads and immediately records watch start (progress: 0)
3. SWR cache is mutated to include the new watch history entry
4. **Continue watching section updates immediately** ✅
5. Progress updates every 30 seconds in the background
6. When user navigates back to home, data is revalidated

### Deleting from Continue Watching:
1. User clicks the X button on a continue watching card
2. UI optimistically removes the card immediately
3. DELETE request sent to `/api/watch-history/delete`
4. API uses `serverAuth` to get correct Prisma user ID
5. Database record is actually deleted (not just UI update)
6. SWR cache is mutated to reflect the deletion
7. If error occurs, cache is revalidated to restore correct state
8. Toast notification confirms success or shows error
9. **On page refresh, deleted items stay deleted** ✅

## Testing

### Test Real-time Updates:
1. Go to home page
2. Click play on any movie
3. Immediately click back button
4. **Movie should appear in Continue Watching section** ✅
5. No refresh needed!

### Test Deletion:
1. Add some movies to continue watching by watching them partially
2. Click the X button on a card to remove it
3. Verify the card disappears immediately
4. **Reload the page - card should STAY removed** ✅
5. Check browser console for "Deleted 1 watch history entries"
6. Try removing all cards - section should disappear without errors

## Debugging

If continue watching doesn't update immediately:
1. Check browser console for "Recording watch start" or similar logs
2. Check Network tab for POST to `/api/watch-history/update`
3. Verify the response is successful (200 status)
4. Check if SWR cache is being mutated (look for mutate calls in console)

If deletions still don't persist:
1. Check browser console for "Deleted X watch history entries" - should be 1, not 0
2. Check server logs for the userId being used
3. Verify the userId matches what's stored in WatchHistory collection
4. Check MongoDB WatchHistory collection directly

## Session Error Handling

When session expires:
1. Toast appears in top-right corner
2. User can click "Refresh" to reload and get new tokens
3. User can click "Sign Out" to clear session and go to auth page
4. Toast doesn't block the UI
5. Multiple errors won't create multiple toasts
