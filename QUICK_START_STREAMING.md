# Quick Start: Streaming API Integration

## ✅ What's Done

1. ✅ Database schema updated with IMDB ID, TMDB ID, ratings, year, and type fields
2. ✅ TMDB API service created (`libs/tmdb.ts`)
3. ✅ Streaming service created (`libs/streaming.ts`)
4. ✅ Sync API endpoint created (`/api/movies/sync`)
5. ✅ Search API endpoint created (`/api/movies/search`)
6. ✅ Test movies removed from database
7. ✅ Prisma schema pushed to MongoDB

## 🚀 Next Steps

### Step 1: Get TMDB API Key (Required)

1. Go to https://www.themoviedb.org/signup
2. Create a free account
3. Go to Settings → API → Create → Developer
4. Fill out the form (use "localhost" for development)
5. Copy your **API Key (v3 auth)**

### Step 2: Add API Key to Environment

Open `.env.local` and replace:
```env
TMDB_API_KEY=your_tmdb_api_key_here
```

With your actual API key:
```env
TMDB_API_KEY=abc123your_actual_key_here
```

### Step 3: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Sync Movies to Your Database

Open your browser and visit:
```
http://localhost:3000/api/movies/sync?type=trending&count=20
```

This will:
- Fetch 20 trending movies/shows from TMDB
- Get their IMDB IDs
- Generate streaming URLs
- Save them to your MongoDB database

**Response will look like:**
```json
{
  "success": true,
  "synced": 20,
  "content": [...]
}
```

### Step 5: Verify Movies Are Synced

Visit your main app:
```
http://localhost:3000
```

You should now see real movies with streaming capabilities!

## 📚 API Endpoints

### Sync Content
```
GET /api/movies/sync?type=trending&count=20
```

**Parameters:**
- `type`: `trending`, `popular`, `movies`, or `tv`
- `count`: Number of items to sync (default: 20)

**Examples:**
- Trending movies & shows: `/api/movies/sync?type=trending&count=30`
- Only movies: `/api/movies/sync?type=movies&count=50`
- Only TV shows: `/api/movies/sync?type=tv&count=20`
- Popular content: `/api/movies/sync?type=popular&count=40`

### Search Content
```
GET /api/movies/search?query=inception&type=movie
```

**Parameters:**
- `query`: Search term (required)
- `type`: `movie`, `tv`, or `all` (default: all)
- `page`: Page number (default: 1)

**Examples:**
- Search movies: `/api/movies/search?query=batman&type=movie`
- Search TV shows: `/api/movies/search?query=breaking%20bad&type=tv`
- Search all: `/api/movies/search?query=star%20wars`

### Get All Movies (existing)
```
GET /api/movies
```

Returns all movies from your database.

### Get Movie by ID (existing)
```
GET /api/movies/[movieId]
```

Returns a specific movie.

## 🎬 How Streaming Works

### Movie Streaming URL Format:
```
https://vidsrc.to/embed/movie/tt1375666
```
(Where `tt1375666` is the IMDB ID for Inception)

### TV Show Streaming URL Format:
```
https://vidsrc.to/embed/tv/tt0944947/1/1
```
(Where `tt0944947` is Game of Thrones, Season 1, Episode 1)

### In Your Components:

The `videoUrl` field in your database already contains the full streaming URL:

```typescript
// In your watch page or player component
<iframe
  src={movie.videoUrl}
  className="w-full h-full"
  allowFullScreen
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
/>
```

## 🔧 Troubleshooting

### "TMDB_API_KEY is not defined"
- Make sure you added the key to `.env.local`
- Restart your dev server after adding the key
- Check there are no extra spaces or quotes

### "No movies showing up"
- Run the sync endpoint first: `/api/movies/sync?type=trending&count=20`
- Check the response to see if movies were synced
- Verify in MongoDB Atlas that movies exist

### "Streaming not working"
- Check if the movie has an IMDB ID
- Try alternative streaming sources (see STREAMING_API_SETUP.md)
- Some content may not be available on all streaming services

### "Rate limit exceeded"
- TMDB has a rate limit of 40 requests per 10 seconds
- Sync smaller batches (e.g., count=10)
- Wait a few seconds between syncs

## 📊 Database Structure

Your movies now have these fields:

```typescript
{
  id: string;           // MongoDB ObjectId
  title: string;        // Movie/show title
  description: string;  // Plot summary
  videoUrl: string;     // Streaming embed URL
  thumbnailUrl: string; // Poster image URL
  genre: string;        // Genres (comma-separated)
  duration: string;     // Runtime
  imdbId: string;       // IMDB ID (unique, required)
  tmdbId: number;       // TMDB ID (optional)
  year: number;         // Release year (optional)
  rating: number;       // TMDB rating (optional)
  type: string;         // "movie" or "tv"
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

## 🎯 Recommended Workflow

1. **Initial Setup:**
   - Get TMDB API key
   - Add to `.env.local`
   - Restart server

2. **Populate Database:**
   - Sync trending content: `/api/movies/sync?type=trending&count=50`
   - Sync popular movies: `/api/movies/sync?type=movies&count=30`
   - Sync popular TV shows: `/api/movies/sync?type=tv&count=20`

3. **Test:**
   - Visit your homepage
   - Click on a movie
   - Watch it stream!

4. **Maintain:**
   - Sync new content weekly/monthly
   - Update existing content periodically
   - Monitor TMDB API usage

## 🔄 Automatic Sync (Optional)

You can set up automatic syncing:

### Option 1: Cron Job (Linux/Mac)
```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * curl http://localhost:3000/api/movies/sync?type=trending&count=20
```

### Option 2: Vercel Cron (if deploying to Vercel)
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/movies/sync?type=trending&count=50",
    "schedule": "0 0 * * *"
  }]
}
```

## 📖 Full Documentation

For detailed information, see:
- `STREAMING_API_SETUP.md` - Complete API documentation
- `libs/tmdb.ts` - TMDB service methods
- `libs/streaming.ts` - Streaming URL generation

## 🎉 You're Ready!

Your streaming platform is now integrated with:
- ✅ Real movie/TV show data from TMDB
- ✅ High-quality posters and metadata
- ✅ Working streaming URLs
- ✅ Search functionality
- ✅ Automatic sync capabilities

Just get your TMDB API key and start syncing content! 🚀
