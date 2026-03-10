# Background Search Enrichment

## Overview

The search system now includes **background enrichment** - it returns database results instantly, then fetches additional content from TMDB in the background to continuously improve the database.

## How It Works

```
User searches "inception"
         ↓
┌─────────────────────────────────┐
│ 1. Query MongoDB (10-20ms)      │
│    Find matching titles          │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 2. Return Results Immediately   │
│    User sees results instantly   │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 3. Background Enrichment         │
│    (Fire and forget)             │
│    • Fetch 5 more movies         │
│    • Fetch 5 more TV shows       │
│    • Cache in MongoDB            │
│    • Skip duplicates             │
└─────────────────────────────────┘
         ↓
Next search finds even more results!
```

## Benefits

### 1. Instant Results ⚡
- Users always get results in <20ms
- No waiting for TMDB API
- Better user experience

### 2. Self-Improving Database 🌱
- Database grows organically
- Popular searches get more content
- No manual intervention needed

### 3. Smart Caching 🧠
- Only caches new content (skips duplicates)
- Limits to 5 items per type to avoid rate limits
- Runs in background without blocking response

### 4. No Timeouts ✅
- Main response returns immediately
- Background process can take its time
- Vercel serverless limits not an issue

## Example Flowokay, make the background search to show the results authomatically until it shows the result show a movie card skeleton for the next movie loads

### First Search: "adventure time"
```json
{
  "query": "adventure time",
  "results": [
    { "title": "Adventure Time", ... }
  ],
  "count": 1,
  "source": "database",
  "enriching": true,
  "performance": {
    "totalTime": "18ms"
  }
}
```

**Background**: Fetches 5 more Adventure Time related shows from TMDB

### Second Search: "adventure time" (30 seconds later)
```json
{
  "query": "adventure time",
  "results": [
    { "title": "Adventure Time", ... },
    { "title": "Adventure Time: Distant Lands", ... },
    { "title": "Adventure Time: Fionna and Cake", ... },
    ...
  ],
  "count": 6,
  "source": "database",
  "enriching": true,
  "performance": {
    "totalTime": "19ms"
  }
}
```

**Background**: Continues to fetch more related content

## Implementation Details

### Background Function

```typescript
async function cacheAdditionalResults(
  query: string,
  type: string,
  existingIds: string[]
) {
  // Fetch 5 movies from TMDB
  // Fetch 5 TV shows from TMDB
  // Skip items already in existingIds
  // Cache new items in MongoDB
  // Log progress
}
```

### Key Features

1. **Fire and Forget**
   ```typescript
   cacheAdditionalResults(query, type, existingIds).catch(err => {
     console.error('Background enrichment error:', err);
   });
   ```
   - Doesn't block response
   - Errors don't affect user

2. **Duplicate Prevention**
   ```typescript
   if (existingIds.includes(imdbId)) continue;
   ```
   - Skips content already returned
   - Avoids wasting API calls

3. **Rate Limit Protection**
   ```typescript
   await new Promise(resolve => setTimeout(resolve, 300));
   ```
   - 300ms delay between items
   - Respects TMDB rate limits

4. **Limited Scope**
   ```typescript
   for (const movie of movieResults.results.slice(0, 5))
   ```
   - Only fetches 5 items per type
   - Keeps background work minimal

## Monitoring

### Check Logs

**Vercel Dashboard → Functions → Logs**

Look for:
```
🔄 Background: Fetching additional results for "query"
✅ Background: Cached movie "Title"
✅ Background: Cached TV show "Title"
✅ Background: Enrichment complete for "query"
```

### Response Indicator

```json
{
  "enriching": true  // Background fetch is happening
}
```

## Performance Impact

### User-Facing
- **Response time**: 10-20ms (unchanged)
- **User experience**: Instant results
- **No blocking**: Background work invisible

### Background
- **Time**: 2-5 seconds per enrichment
- **API calls**: 5-10 per search
- **Database writes**: 5-10 per search
- **Rate limit**: Safe (300ms delays)

## Database Growth

### Organic Growth Pattern

```
Day 1: 2,000 titles (initial population)
Week 1: 2,500 titles (+500 from searches)
Month 1: 4,000 titles (+2,000 from searches)
Month 3: 8,000 titles (+6,000 from searches)
```

### Growth Rate Factors

1. **Search frequency**: More searches = faster growth
2. **Search diversity**: Unique queries add more content
3. **Popular content**: Already cached, minimal growth
4. **Obscure content**: New additions, faster growth

## Configuration

### Adjust Items Per Search

In `pages/api/movies/search.ts`:

```typescript
// Current: 5 items per type
for (const movie of movieResults.results.slice(0, 5))

// More aggressive: 10 items
for (const movie of movieResults.results.slice(0, 10))

// Conservative: 3 items
for (const movie of movieResults.results.slice(0, 3))
```

### Adjust Delay

```typescript
// Current: 300ms
await new Promise(resolve => setTimeout(resolve, 300));

// Faster: 200ms (higher rate limit risk)
await new Promise(resolve => setTimeout(resolve, 200));

// Safer: 500ms (slower but safer)
await new Promise(resolve => setTimeout(resolve, 500));
```

### Disable Enrichment

```typescript
// Comment out the background call
// cacheAdditionalResults(query, type, existingIds).catch(err => {
//   console.error('Background enrichment error:', err);
// });
```

## Best Practices

### 1. Monitor Database Size
```bash
# Check size regularly
db.stats()
```

### 2. Watch Rate Limits
- TMDB: 40 requests per 10 seconds
- Current config: ~20 requests per minute (safe)

### 3. Clean Up Old Content
```javascript
// Remove unpopular content older than 6 months
db.Movie.deleteMany({
  popularity: { $lt: 10 },
  updatedAt: { $lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
})
```

### 4. Track Enrichment Success
```typescript
// Add metrics
let enrichmentCount = 0;
let enrichmentErrors = 0;
```

## Troubleshooting

### Issue: Background enrichment not working

**Check logs for:**
```
🔄 Background: Fetching additional results
```

**If missing:**
1. Check TMDB_API_KEY is set
2. Check DATABASE_URL is correct
3. Check Vercel function logs for errors

### Issue: Rate limit errors

**Symptoms:**
```
❌ Background: Error 429 Too Many Requests
```

**Solution:**
1. Increase delay between requests
2. Reduce items per search
3. Add exponential backoff

### Issue: Database growing too fast

**Solution:**
1. Reduce items per search (5 → 3)
2. Add conditional enrichment (only if < 5 results)
3. Implement cleanup job

### Issue: Duplicate content

**Check:**
```typescript
if (existingIds.includes(imdbId)) continue;
```

**Verify:**
- Upsert is using correct unique field (imdbId)
- existingIds array is populated correctly

## Future Enhancements

### Phase 1: Smart Enrichment
- [ ] Only enrich if < 5 results found
- [ ] Prioritize by search frequency
- [ ] Skip enrichment for popular queries

### Phase 2: Analytics
- [ ] Track enrichment success rate
- [ ] Monitor database growth rate
- [ ] Identify popular search terms

### Phase 3: Optimization
- [ ] Batch database writes
- [ ] Parallel TMDB fetches
- [ ] Redis queue for background jobs

### Phase 4: Advanced Features
- [ ] Related content suggestions
- [ ] Trending searches
- [ ] Personalized enrichment

## Summary

✅ **Instant results** - Users never wait
✅ **Self-improving** - Database grows automatically
✅ **Smart caching** - No duplicates
✅ **Rate limit safe** - Respects API limits
✅ **Zero impact** - Background work invisible
✅ **Scalable** - Handles high traffic

**The search gets better with every query!** 🚀
