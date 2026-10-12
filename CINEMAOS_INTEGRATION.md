# CinemaOS Streaming Integration

## Overview
Integrated **CinemaOS** as the primary streaming provider, replacing VidKing. CinemaOS offers zero-setup streaming with automatic link updates and no API key requirement.

## Why CinemaOS?

### ✅ Advantages
- **Zero Setup**: No API key or signup required
- **Auto-Updated Links**: Automatically refreshes with best available quality
- **TMDB Compatible**: Works directly with TMDB IDs (perfect for our setup)
- **Responsive**: Works on all devices - desktop, mobile, tablet
- **PostMessage API**: Control playback and track progress
- **Free Forever**: No cost, no limits
- **Reliable**: Professional player with good uptime

### 📊 vs Other Providers
| Feature | CinemaOS | VidKing | VidSrc |
|---------|----------|---------|--------|
| API Key Required | ❌ No | ❌ No | ❌ No |
| Uses TMDB ID | ✅ Yes | ✅ Yes | ❌ No (IMDB) |
| Auto-Updates | ✅ Yes | ❌ No | ❌ No |
| Setup Time | 0 min | 0 min | 0 min |
| PostMessage API | ✅ Yes | ❌ No | ❌ No |
| Responsive | ✅ Yes | ✅ Yes | ✅ Yes |

## Implementation

### Endpoints

**Movies:**
```
https://cinemaos.tech/player/{tmdb_id}?theme=ffffff
```

**TV Shows:**
```
https://cinemaos.tech/player/{tmdb_id}/{season}/{episode}?theme=ffffff
```

### Usage Examples

#### Movies
```typescript
import { streamingService } from '@/libs/streaming';

// Get CinemaOS URL for a movie
const url = streamingService.getStreamUrlByTMDB(550, 'movie');
// Returns: https://cinemaos.tech/player/550?theme=ffffff

// Or get all sources with fallbacks
const sources = streamingService.getMovieStreamSources('tt0137523', 550);
// Returns array with CinemaOS first, then fallbacks
```

#### TV Shows
```typescript
// Get CinemaOS URL for TV show episode
const url = streamingService.getStreamUrlByTMDB(
  1396, // Breaking Bad TMDB ID
  'tv',
  1,    // Season 1
  1     // Episode 1
);
// Returns: https://cinemaos.tech/player/1396/1/1?theme=ffffff

// Or get all sources
const sources = streamingService.getTVShowStreamSources('tt0903747', 1, 1, 1396);
```

### React/JSX Integration

```jsx
<div className="relative w-full pt-[56.25%]">
  <iframe
    src={`https://cinemaos.tech/player/${tmdbId}?theme=ffffff`}
    className="absolute top-0 left-0 w-full h-full"
    frameBorder="0"
    allowFullScreen
    allow="encrypted-media"
  />
</div>
```

## Streaming Service API

### Methods

#### `getStreamUrlByTMDB(tmdbId, type, season?, episode?, theme?)`
Generate CinemaOS streaming URL using TMDB ID.

**Parameters:**
- `tmdbId` (number): TMDB ID
- `type` ('movie' | 'tv'): Content type
- `season` (number, optional): Season number for TV shows
- `episode` (number, optional): Episode number for TV shows
- `theme` (string, optional): Theme color (hex without #), default: 'ffffff'

**Returns:** `string` - CinemaOS embed URL

#### `getMovieStreamSources(imdbId, tmdbId?)`
Get all available streaming sources for a movie with fallbacks.

**Returns:** `StreamingSource[]` - Array sorted by priority

#### `getTVShowStreamSources(imdbId, season, episode, tmdbId?)`
Get all available streaming sources for a TV episode with fallbacks.

**Returns:** `StreamingSource[]` - Array sorted by priority

## Fallback Chain

CinemaOS uses a priority-based fallback system:

### Movies
1. **CinemaOS** (TMDB) - Primary
2. VidSrc.xyz (IMDB)
3. VidSrc.to (IMDB)
4. VidSrc.me (IMDB)
5. 2Embed (IMDB)

### TV Shows
1. **CinemaOS** (TMDB) - Primary
2. 2Embed (IMDB)
3. VidSrc.xyz (IMDB)
4. VidSrc.to (IMDB)
5. VidSrc.me (IMDB)

## Parameters

### Theme Parameter
Customize player appearance:
```
?theme=ffffff  // White theme
?theme=000000  // Black theme
?theme=3B82F6  // Blue theme (your brand color)
```

## PostMessage API (Advanced)

CinemaOS supports PostMessage API for controlling playback:

```javascript
const iframe = document.querySelector('iframe');

// Play video
iframe.contentWindow.postMessage({ action: 'play' }, '*');

// Pause video
iframe.contentWindow.postMessage({ action: 'pause' }, '*');

// Seek to time (seconds)
iframe.contentWindow.postMessage({ action: 'seek', time: 60 }, '*');

// Get current time
iframe.contentWindow.postMessage({ action: 'getTime' }, '*');

// Listen for events
window.addEventListener('message', (event) => {
  if (event.data.type === 'timeupdate') {
    console.log('Current time:', event.data.time);
  }
});
```

## Watch Page Integration

The watch page (`/watch/[movieId].tsx`) automatically uses CinemaOS:

```typescript
const streamUrl = streamingService.getStreamUrlByTMDB(
  movie.tmdbId,
  movie.type,
  currentSeason,
  currentEpisode
);
```

## Benefits for Your App

1. **Works with TMDB Integration**: Since we're fetching data from TMDB API, CinemaOS is the perfect match
2. **No Database IMDB IDs Needed**: Don't need to store IMDB IDs anymore
3. **Always Updated**: Links auto-refresh, no broken streams
4. **Better UX**: Responsive player works great on mobile
5. **Track Progress**: PostMessage API allows custom progress tracking
6. **Zero Maintenance**: No API keys to manage or update

## Migration from VidKing

All existing functionality works the same:
- Same `streamingService` API
- Same fallback system
- Just better primary source (CinemaOS instead of VidKing)

No code changes needed in components - just works!

## Testing

Test CinemaOS with different content:

```bash
# Movie
https://cinemaos.tech/player/550

# TV Show
https://cinemaos.tech/player/1396/1/1

# With custom theme
https://cinemaos.tech/player/550?theme=3B82F6
```

## Notes

- CinemaOS requires TMDB ID (we have this from TMDB integration!)
- Fallbacks use IMDB ID (still supported for backwards compatibility)
- Works best with modern browsers (Chrome, Firefox, Safari, Edge)
- Automatically handles quality selection
- Mobile-optimized player

---

**Status**: ✅ Integrated  
**Build Status**: ✅ Passing  
**Primary Provider**: CinemaOS  
**Fallbacks**: 4 sources  
**Date**: December 2024
