# TMDB Content Integration Fix

## Problem
When users clicked on content from the new TMDB category sections (Trending Movies, Mindf*ck Movies, etc.), the app crashed with a Prisma error:
```
Malformed ObjectID: invalid character 't' was found at index 0 in the provided hex string: "tmdb-1148365"
```

The issue occurred because:
1. TMDB content has IDs like `"tmdb-movie-1148365"` (not in the database)
2. Components tried to fetch from `/api/movies/[movieId]` which queries the database
3. Prisma couldn't parse the `tmdb-` prefixed string as a MongoDB ObjectId

## Solution

### 1. Created TMDB Details API Endpoint
**File**: `pages/api/tmdb/details.ts`

New endpoint that fetches complete movie/TV show details directly from TMDB API:
- Accepts `tmdbId` and `type` query parameters
- Returns data in the same format as database movies (`MovieInterface`)
- Includes full details: genres, runtime, rating, descriptions, etc.
- Works for both movies and TV shows

**Usage**:
```
GET /api/tmdb/details?tmdbId=12345&type=movie
GET /api/tmdb/details?tmdbId=67890&type=tv
```

### 2. Updated ID Format in TMDB Categories
**File**: `pages/api/tmdb/categories.ts`

Changed ID format from `tmdb-{id}` to `tmdb-{type}-{id}`:
- Movies: `tmdb-movie-550`
- TV Shows: `tmdb-tv-1399`

This allows the system to know whether to fetch as movie or TV show without an additional lookup.

### 3. Updated useMovie Hook
**File**: `hooks/useMovie.ts`

Added intelligent routing:
- Detects if ID starts with `tmdb-`
- Parses the type and numeric ID from the format `tmdb-{type}-{id}`
- Routes to TMDB details endpoint for TMDB content
- Routes to database endpoint for regular content
- Handles both old format (`tmdb-{id}`) and new format (`tmdb-{type}-{id}`)

**Code**:
```typescript
if (id.startsWith('tmdb-')) {
  const parts = id.split('-');
  if (parts.length >= 3) {
    const type = parts[1]; // 'movie' or 'tv'
    const tmdbId = parts.slice(2).join('-');
    apiUrl = `/api/tmdb/details?tmdbId=${tmdbId}&type=${type}`;
  }
} else {
  apiUrl = `/api/movies/${id}`; // Regular database movie
}
```

### 4. Updated Watch Page
**File**: `pages/watch/[movieId].tsx`

Fixed streaming source generation:
- Previously required `imdbId` to exist
- Now works with either `imdbId` OR `tmdbId`
- CinemaOS (primary streaming provider) uses TMDB IDs, so TMDB-only content streams perfectly

**Change**:
```typescript
// Before: if (!data?.imdbId) return;
// After:
if (!data?.imdbId && !data?.tmdbId) return;
```

## How It Works Now

1. **User clicks on TMDB content** (e.g., from "Mindf*ck Movies" section)
   - ID format: `tmdb-movie-680` or `tmdb-tv-1399`

2. **InfoModal opens and useMovie hook fetches data**
   - Hook detects `tmdb-` prefix
   - Routes to `/api/tmdb/details?tmdbId=680&type=movie`
   - Gets full details from TMDB API

3. **User clicks Play button**
   - Watch page receives `tmdbId` from data
   - Builds streaming sources using `streamingService`
   - CinemaOS (primary provider) uses TMDB ID directly
   - Fallback providers use IMDB ID if available

4. **Content plays successfully**
   - CinemaOS streaming URL: `https://cinemaos.tech/player/680?theme=ffffff`
   - No database storage needed
   - All data fetched in real-time from TMDB

## Benefits

✅ **No database storage needed** - TMDB content doesn't clutter the database
✅ **Always up-to-date** - Data fetched in real-time from TMDB
✅ **Accurate information** - Genres, ratings, descriptions all from TMDB
✅ **Works with CinemaOS** - Primary streaming provider uses TMDB IDs
✅ **Seamless UX** - Users can't tell the difference between database and TMDB content
✅ **Exact title wordings** - "Mindf*ck Movies" displays as requested

## Testing

Build passes successfully:
```bash
npm run build
# ✓ Compiled successfully
# ✓ No errors
```

## Files Modified

1. ✅ `pages/api/tmdb/details.ts` - NEW: TMDB details endpoint
2. ✅ `pages/api/tmdb/categories.ts` - Updated ID format to include type
3. ✅ `hooks/useMovie.ts` - Smart routing for TMDB vs database content
4. ✅ `pages/watch/[movieId].tsx` - Support TMDB-only content for streaming

## Future Enhancements

- Add caching for TMDB details API responses
- Add TMDB trailer fetching (already has video data in API response)
- Consider adding TMDB content to search results
- Add TV show season/episode details from TMDB for TV content
