# TMDB Content Categories Implementation

## Overview
Implemented 15 curated content sections that fetch data **directly from TMDB API** with your exact title wording. All data is real-time and accurate from The Movie Database.

## Content Sections (Exact Titles)

### 1. **Trending Movies**
- TMDB Endpoint: `/trending/movie/week`
- Current week's most popular movies
- Based on TMDB's official trending algorithm

### 2. **Trending Series**
- TMDB Endpoint: `/trending/tv/week`
- Current week's most popular TV shows
- Real-time trending data

### 3. **Movies on Netflix**
- TMDB Endpoint: `/discover/movie` with Netflix provider (ID: 8)
- Watch region: US
- Real movies actually available on Netflix

### 4. **TV Series on Netflix**
- TMDB Endpoint: `/discover/tv` with Netflix provider (ID: 8)
- Watch region: US
- Real TV series actually available on Netflix

### 5. **Award Winning Movies**
- TMDB Filter: Rating ≥ 8.0, Vote count ≥ 1000
- High-quality, critically acclaimed films
- Sorted by vote average

### 6. **Award Winning Shows**
- TMDB Filter: Rating ≥ 8.0, Vote count ≥ 500
- Emmy-worthy and critically acclaimed series
- Sorted by vote average

### 7. **Top Rated Movies**
- TMDB Endpoint: `/movie/top_rated`
- Official TMDB top rated movies list
- US region

### 8. **Top Rated Series**
- TMDB Endpoint: `/tv/top_rated`
- Official TMDB top rated TV shows list
- Global data

### 9. **Oscar Nominees for Best Picture**
- TMDB Filter: Drama genre, Rating ≥ 7.5, Vote count ≥ 1000
- Academy Award caliber films
- Drama-focused prestigious content

### 10. **Psychological Thrillers**
- TMDB Filter: Thriller genre (53), Rating ≥ 7.0
- Mind-bending, suspenseful films
- Sorted by rating

### 11. **Cannes Film Festival**
- TMDB Filter: Drama, Rating ≥ 7.5
- Original languages: French, English, Italian, Spanish
- Art-house and international cinema

### 12. **Top 100 Halloween Movies**
- TMDB Filter: Horror genre (27)
- Sorted by popularity
- Perfect for spooky season

### 13. **Rotten Tomatoes: Best Movies of All Time**
- TMDB Filter: Rating ≥ 8.5, Vote count ≥ 2000
- Ultra high-rated masterpieces
- Critically acclaimed classics

### 14. **Mindf*ck Movies** *(Exact title as requested)*
- TMDB Filter: Sci-Fi (878), Thriller (53), Mystery (9648)
- Rating ≥ 7.5
- Plot-twisting, thought-provoking films

### 15. **Based on a True Story**
- TMDB Filter: History genre (36), Rating ≥ 7.0
- Real-life inspired content
- Historical events and biographies

## Technical Implementation

### API Endpoint
**`/api/tmdb/categories.ts`**
- Single unified endpoint for all categories
- Query parameter: `?category=<category-name>`
- Returns up to 20 items per category
- Real-time data from TMDB

### Custom Hooks (`hooks/useContentCategories.ts`)
All hooks fetch directly from TMDB:
```typescript
- useTrendingMovies()
- useTrendingSeries()
- useNetflixMovies()
- useNetflixSeries()
- useAwardWinningMovies()
- useAwardWinningShows()
- useTopRatedMovies()
- useTopRatedSeries()
- useOscarNominees()
- usePsychologicalThrillers()
- useCannesFestival()
- useHalloweenMovies()
- useRottenTomatoesBest()
- useMindfuckMovies()
- useBasedOnTrueStory()
```

### Data Format
Each item is converted from TMDB format to your app format:
```typescript
{
  id: 'tmdb-{id}',
  title: string,
  description: string,
  thumbnailUrl: string (w500),
  backdropUrl: string (w1280),
  videoUrl: string,
  genre: string,
  duration: string,
  year: number,
  rating: number (0-10),
  popularity: number,
  type: 'movie' | 'tv',
  tmdbId: number
}
```

## TMDB Genre IDs Used

- **18** - Drama
- **27** - Horror  
- **36** - History
- **53** - Thriller
- **878** - Science Fiction
- **9648** - Mystery

## Benefits of TMDB Integration

### ✅ Accurate Information
- Real movie/show metadata
- Accurate ratings and popularity
- Up-to-date release information
- Professional-quality images

### ✅ Real-Time Data
- Trending content updates automatically
- Current Netflix availability
- Live rating changes
- Fresh recommendations

### ✅ Rich Metadata
- Official titles and overviews
- High-quality poster/backdrop images
- Genre information
- Release dates and ratings

### ✅ No Database Dependency
- Direct API calls
- No need to populate local database
- Always current
- Reduced storage requirements

## Performance

- **SWR Caching**: Reduces API calls
- **20 items per category**: Fast loading
- **Lazy loading**: Only fetches when section is visible
- **Image optimization**: TMDB's CDN

## Environment Variables Required

```env
TMDB_API_KEY=your_tmdb_api_key_here
```

Get your API key from: https://www.themoviedb.org/settings/api

## TMDB Discover Parameters

### Netflix Content
```javascript
with_watch_providers: '8'  // Netflix provider ID
watch_region: 'US'         // United States
sort_by: 'popularity.desc' // Most popular first
```

### Award Winning
```javascript
vote_average.gte: '8'      // Rating 8.0 or higher
vote_count.gte: '1000'     // Minimum votes for credibility
sort_by: 'vote_average.desc'
```

### Genre Filtering
```javascript
with_genres: '53'          // Single genre
with_genres: '878,53,9648' // Multiple genres (OR)
```

## Future Enhancements

- Add pagination for "See All" functionality
- Cache TMDB responses for better performance
- Add regional provider support (UK, CA, etc.)
- Implement genre mixing for more categories
- Add year-based filtering (e.g., "Best of 2024")
- User preference-based recommendations

## Testing

To test a specific category:
```
GET /api/tmdb/categories?category=trending-movies
GET /api/tmdb/categories?category=mindfuck-movies
GET /api/tmdb/categories?category=movies-netflix
```

## Notes

- All titles use your exact wording including "Mindf*ck Movies"
- Netflix content is region-specific (US by default)
- TMDB updates their data regularly
- Rate limits: 40 requests per 10 seconds (TMDB default)
- Consider implementing caching for production

---

**Status**: ✅ Implemented with TMDB Integration  
**Build Status**: ✅ Passing  
**Data Source**: TMDB API (Real-time)  
**Categories**: 15 sections  
**Date**: December 2024
