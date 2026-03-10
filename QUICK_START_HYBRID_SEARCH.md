# Quick Start: Hybrid Search System

Get your StreamBox search running in 3 steps!

## Step 1: Setup Database (2 minutes)

```bash
# Update schema and create indexes
npx prisma generate
npx prisma db push
npm run create-indexes
```

**What this does:**
- ✅ Updates Movie model with indexes
- ✅ Creates MongoDB text search indexes
- ✅ Tests search functionality

## Step 2: Populate Content (15-20 minutes)

```bash
# Add 2,000 popular movies and TV shows
npm run populate
```

**What this does:**
- ✅ Fetches 1,000 popular movies from TMDB
- ✅ Fetches 1,000 popular TV shows from TMDB
- ✅ Saves everything to your MongoDB database
- ✅ Includes Adventure Time and other popular content

**Alternative options:**
```bash
npm run populate:small   # 400 titles, 3-5 min (testing)
npm run populate:large   # 10,000 titles, 60-90 min (comprehensive)
```

## Step 3: Deploy (2 minutes)

```bash
git add .
git commit -m "Add hybrid search system"
git push
```

**After deployment:**
1. Go to your production database
2. Run `npm run create-indexes` with production DATABASE_URL

## Test It Out! 🎉

Search for "Adventure Time" on your site - it should be instant!

### Expected Performance:

**First search (database):**
- Response time: 10-20ms ⚡
- Source: "database"

**Uncached search (TMDB fallback):**
- Response time: 2-5 seconds
- Source: "tmdb"
- Automatically cached for next time

## How It Works

```
User searches "Adventure Time"
         ↓
MongoDB search (10-20ms) ← FAST!
         ↓
Found? → YES → Return results
         ↓
        NO
         ↓
TMDB API search (2-5s)
         ↓
Cache in MongoDB
         ↓
Return results
```

## Monitoring

Check your API response for performance metrics:

```json
{
  "source": "database",
  "performance": {
    "totalTime": "18ms",
    "dbSearchTime": "15ms"
  }
}
```

## Storage Usage

| Size | Titles | Storage | % of Free Tier |
|------|--------|---------|----------------|
| Small | 400 | 1.2 MB | 0.2% |
| Default | 2,000 | 6 MB | 1.2% |
| Large | 10,000 | 30 MB | 5.9% |

MongoDB Free Tier: 512 MB - plenty of room! ✅

## Troubleshooting

### "No results found"
- Run `npm run populate` to add content
- Check DATABASE_URL is correct
- Verify TMDB_API_KEY is set

### "Search is slow"
- Run `npm run create-indexes` to create text indexes
- Check if database is populated
- Monitor `performance` metrics in response

### "Database full"
- Check size: `db.stats()` in MongoDB
- Free tier limit: 512 MB
- Current usage should be <30 MB

## Next Steps

1. ✅ Search works instantly for popular content
2. ✅ Automatically caches new searches
3. ✅ Database grows organically
4. ✅ Stays within free tier limits

**You're all set!** 🚀

For detailed documentation, see `HYBRID_SEARCH_SYSTEM.md`
