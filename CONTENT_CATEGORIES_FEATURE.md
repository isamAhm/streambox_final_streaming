# Content Categories Feature

## Overview
Added 15 new curated content sections to the main browse page, providing users with a rich, Netflix-style browsing experience with diverse categories including trending content, award-winning titles, genre-specific collections, and special curated lists.

## New Content Sections

### 1. **Trending Movies**
- Displays the most popular movies based on TMDB popularity scores
- Shows top 20 trending movies
- Updated dynamically based on viewing trends

### 2. **Trending Series**
- Features the most popular TV series
- Top 20 trending series based on popularity
- Includes all types of serialized content

### 3. **Movies on Netflix**
- Curated selection of high-quality movies (rating 7.0+)
- Simulates Netflix's movie catalog
- Shows 20 top-rated movies

### 4. **TV Series on Netflix**
- Collection of TV series available
- Features series content from the database
- Displays 20 series

### 5. **Award Winning Movies**
- Premium movies with ratings 8.0 and above
- Sorted by rating and popularity
- Typically Oscar, Golden Globe, and other award winners

### 6. **Award Winning Shows**
- High-rated TV series (8.0+)
- Emmy and other award-winning content
- Premium television content

### 7. **Top Rated Movies**
- Movies with ratings 7.5 and above
- Sorted by rating first, then popularity
- Critically acclaimed films

### 8. **Top Rated Series**
- TV series with ratings 7.5+
- Best-reviewed television content
- Quality serialized storytelling

### 9. **Oscar Nominees for Best Picture**
- Drama, Biography, and Historical films (7.5+ rating)
- Content typically recognized at the Academy Awards
- Prestige cinema

### 10. **Psychological Thrillers**
- Thriller genre films with 7.0+ ratings
- Mind-bending, suspenseful content
- Includes mystery and psychological elements

### 11. **Cannes Film Festival**
- Art-house and critically acclaimed films
- Drama, Romance, and Mystery genres (7.5+)
- International cinema recognition

### 12. **Top 100 Halloween Movies**
- Horror, Thriller, and Mystery genres
- Perfect for spooky season
- All rating levels for diverse scary content

### 13. **Rotten Tomatoes: Best Movies of All Time**
- Ultra high-rated content (8.5+)
- Critically acclaimed masterpieces
- Certified fresh content

### 14. **Mindf*ck Movies**
- Thriller, Mystery, Sci-Fi with 7.5+ ratings
- Plot-twisting, thought-provoking films
- Content that challenges perception

### 15. **Based on a True Story**
- Biography, Documentary, Historical genres (7.0+)
- Real-life inspired content
- Crime and historical events

## Technical Implementation

### API Endpoints Created

1. `/api/movies/trending-movies.ts` - Fetches trending movies
2. `/api/movies/trending-series.ts` - Fetches trending series
3. `/api/movies/award-winning.ts` - Fetches award-winning content (movies/series)
4. `/api/movies/top-rated-movies.ts` - Fetches top-rated movies
5. `/api/movies/top-rated-series.ts` - Fetches top-rated series
6. `/api/movies/by-genre.ts` - Fetches content by genre
7. `/api/movies/by-criteria.ts` - Fetches content by various criteria

### Custom Hooks (`hooks/useContentCategories.ts`)

```typescript
- useTrendingMovies()
- useTrendingSeries()
- useAwardWinning(type)
- useTopRatedMovies()
- useTopRatedSeries()
- useByGenre(genre, type)
- useByCriteria(category, type)
```

### Database Queries

All queries utilize:
- **type** field: 'movie' or 'tv'
- **rating** field: For quality filtering
- **popularity** field: For trending/popular sorting
- **genre** field: For category-specific filtering

### Sorting Logic

1. **Trending**: Sorted by popularity DESC
2. **Award Winning**: Sorted by rating DESC, then popularity DESC
3. **Top Rated**: Sorted by rating DESC, then popularity DESC
4. **Genre-based**: Sorted by popularity DESC, then rating DESC
5. **Criteria-based**: Sorted by rating DESC, then popularity DESC

## User Experience

### Layout
- Horizontal scrollable rows (Netflix-style)
- Each section shows up to 20 items
- Smooth scrolling with mouse or touch
- Responsive design for all screen sizes

### Loading
- Uses SWR for efficient data fetching
- Cached responses for better performance
- Graceful loading states
- Only displays sections with available content

### Navigation
- Each movie card is clickable
- Leads to detail page
- Hover effects for interactivity
- Play and info buttons on hover

## Performance Optimizations

1. **SWR Caching**: Reduces API calls
2. **Conditional Rendering**: Only renders sections with data
3. **Lazy Loading**: Content loads as needed
4. **Database Indexing**: Fast queries on type, rating, popularity

## Future Enhancements

- Add "See All" button to view full category
- Implement personalized recommendations
- Add user preference learning
- Create dynamic categories based on watch history
- Add filter options within each category
- Implement infinite scroll for each section

## Data Requirements

For optimal display, ensure your database has:
- Movies with proper `type` field ('movie' or 'tv')
- Accurate `rating` values (0-10 scale)
- `popularity` scores from TMDB
- Proper `genre` categorization
- `year` information for time-based filtering

## Maintenance

### Adding New Categories

1. Define criteria in `/api/movies/by-criteria.ts`
2. Add switch case for new category
3. Create hook in `useContentCategories.ts`
4. Add section to `pages/index.tsx`

### Updating Existing Categories

1. Modify query logic in respective API endpoint
2. Adjust filtering/sorting parameters
3. Test with various dataset sizes

---

**Status**: ✅ Implemented and Tested  
**Build Status**: ✅ Passing  
**Sections Added**: 15  
**Date**: December 2024
