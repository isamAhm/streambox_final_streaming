# Streaming API Integration Guide

## Overview

Your StreamBox application now integrates with:
1. **TMDB (The Movie Database)** - For movie/TV show metadata, posters, descriptions
2. **VidSrc** - For streaming video content using IMDB IDs

## Setup Instructions

### 1. Get TMDB API Key

1. Go to https://www.themoviedb.org/
2. Create a free account
3. Go to Settings → API → Create → Developer
4. Fill out the form (you can use your website URL or "localhost" for development)
5. Copy your API Key (v3 auth)
6. Add it to your `.env.local` file:

```env
TMDB_API_KEY=your_actual_api_key_here
```

### 2. Update Prisma Database

Run these commands to update your database schema:

```bash
npx prisma generate
npx prisma db push
```

This adds new fields to your Movie model:
- `imdbId` - IMDB identifier for streaming
- `tmdbId` - TMDB identifier
- `year` - Release year
- `rating` - Movie rating
- `type` - "movie" or "tv"

### 3. Sync Movies to Your Database

Once you have the TMDB API key configured, you can sync movies:

**Option A: Using the API endpoint**

Make a GET request to:
```
http://localhost:3000/api/movies/sync?type=trending&count=20
```

Parameters:
- `type`: `trending`, `popular`, `movies`, or `tv`
- `count`: Number of items to sync (default: 20)

**Option B: Create a sync script**

Create `scripts/sync-movies.ts`:

```typescript
import { tmdbService } from '../libs/tmdb';
import { streamingService } from '../libs/streaming';
import prismadb from '../libs/prismadb';

async function syncMovies() {
  console.log('Fetching trending movies from TMDB...');
  
  const { results } = await tmdbService.getTrendingMovies('week');
  
  for (const movie of results.slice(0, 20)) {
    const details = await tmdbService.getMovieDetails(movie.id);
    
    if (!details.imdb_id) continue;
    
    const movieData = tmdbService.convertToMovie(details);
    const streamUrl = streamingService.getMovieStreamUrl(details.imdb_id);
    
    await prismadb.movie.upsert({
      where: { imdbId: details.imdb_id },
      update: { ...movieData, videoUrl: streamUrl },
      create: { ...movieData, videoUrl: streamUrl }
    });
    
    console.log(`Synced: ${details.title}`);
  }
  
  console.log('Sync complete!');
}

syncMovies();
```

Run it with:
```bash
npx ts-node scripts/sync-movies.ts
```

## API Endpoints

### 1. Sync Movies/TV Shows
```
GET /api/movies/sync?type=trending&count=20
```

Fetches content from TMDB and saves to your database with streaming URLs.

**Parameters:**
- `type`: `trending`, `popular`, `movies`, `tv`
- `count`: Number of items (default: 20)

**Response:**
```json
{
  "success": true,
  "synced": 20,
  "content": [...]
}
```

### 2. Search Movies/TV Shows
```
GET /api/movies/search?query=inception&type=movie
```

Search TMDB for movies and TV shows.

**Parameters:**
- `query`: Search term (required)
- `type`: `movie`, `tv`, or `all` (default: all)
- `page`: Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "query": "inception",
  "results": [...],
  "page": 1
}
```

### 3. Get All Movies (existing)
```
GET /api/movies
```

Returns all movies from your database.

### 4. Get Movie by ID (existing)
```
GET /api/movies/[movieId]
```

Returns a specific movie by database ID.

## Streaming URLs

The streaming service generates embed URLs for video players:

### Movies:
```
https://vidsrc.to/embed/movie/tt1375666
```

### TV Shows:
```
https://vidsrc.to/embed/tv/tt0944947/1/1
```
(Season 1, Episode 1)

## Usage in Components

### Get streaming URL for a movie:

```typescript
import { streamingService } from '@/libs/streaming';

// For a movie
const streamUrl = streamingService.getMovieStreamUrl('tt1375666');

// For a TV show episode
const tvStreamUrl = streamingService.getTVShowStreamUrl('tt0944947', 1, 1);
```

### Search for content:

```typescript
import { tmdbService } from '@/libs/tmdb';

const results = await tmdbService.searchMovies('inception');
const movies = results.results;
```

### Get movie details:

```typescript
const movieDetails = await tmdbService.getMovieDetails(27205);
const posterUrl = tmdbService.getImageUrl(movieDetails.poster_path);
```

## Video Player Integration

Update your video player component to use the streaming URLs:

```typescript
// In your watch page or player component
<iframe
  src={movie.videoUrl}
  className="w-full h-full"
  allowFullScreen
  frameBorder="0"
/>
```

## Alternative Streaming Sources

If VidSrc doesn't work, you can use alternatives:

```typescript
const alternatives = streamingService.getAlternativeStreamUrl(imdbId, 'movie');
// Returns array of alternative streaming URLs
```

Available alternatives:
- vidsrc.to
- vidsrc.me
- vidsrc.xyz
- 2embed.cc

## Automatic Sync (Optional)

You can set up a cron job or scheduled task to automatically sync new content:

1. Create a cron job that calls `/api/movies/sync` daily
2. Or use Vercel Cron Jobs (if deploying to Vercel)
3. Or use a service like GitHub Actions

Example with Vercel Cron:

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/movies/sync?type=trending&count=50",
    "schedule": "0 0 * * *"
  }]
}
```

## Testing

1. **Test TMDB connection:**
   ```bash
   curl "http://localhost:3000/api/movies/search?query=inception"
   ```

2. **Test sync:**
   ```bash
   curl "http://localhost:3000/api/movies/sync?type=trending&count=5"
   ```

3. **Check database:**
   ```bash
   npx prisma studio
   ```

## Troubleshooting

### TMDB API Key Error
- Make sure `TMDB_API_KEY` is set in `.env.local`
- Restart your dev server after adding the key
- Verify the key is valid at https://www.themoviedb.org/settings/api

### No IMDB ID Found
- Some content may not have IMDB IDs
- The sync process skips content without IMDB IDs
- This is normal and expected

### Streaming URL Not Working
- Try alternative streaming sources
- Some content may not be available on all streaming services
- Check if the IMDB ID is correct

### Database Schema Issues
- Run `npx prisma generate` after schema changes
- Run `npx prisma db push` to update MongoDB
- Check for any migration errors

## Rate Limiting

TMDB API has rate limits:
- 40 requests per 10 seconds
- The sync endpoint includes delays to avoid hitting limits
- For large syncs, consider batching requests

## Production Deployment

1. Add `TMDB_API_KEY` to your production environment variables
2. Run database migrations
3. Sync initial content
4. Set up automatic sync schedule
5. Monitor API usage and costs

## Legal Considerations

- TMDB API is free but requires attribution
- Add TMDB attribution to your site: "This product uses the TMDB API but is not endorsed or certified by TMDB"
- Streaming content must comply with copyright laws
- Ensure you have rights to stream the content
- Consider adding terms of service and privacy policy

## Next Steps

1. Get your TMDB API key
2. Update `.env.local` with the key
3. Run `npx prisma db push`
4. Test the sync endpoint
5. Update your UI components to display the new content
6. Implement search functionality
7. Add TV show episode selection
8. Implement user favorites with the new content

## Support

For issues:
- TMDB API: https://www.themoviedb.org/talk
- VidSrc: Check their documentation
- Your app: Check console logs and error messages
