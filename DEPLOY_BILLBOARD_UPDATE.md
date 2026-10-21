# Deploy Billboard Update to Production

## Current Situation
- ✅ Billboard changes made locally
- ✅ Local dev server running (port 3000)
- ❌ Android app doesn't show changes (loads from streamboxx.duckdns.org)

## Quick Deploy Options

### Option 1: Build and Deploy to Production Server

**Step 1: Build the production version**
```bash
npm run build
```

**Step 2: Start production server**
```bash
npm run start
# Or if using PM2:
pm2 restart streambox
```

**Step 3: Upload to your production server**
If your production is on a separate machine:
```bash
# Sync build files to production
rsync -avz .next/ user@streamboxx.duckdns.org:/path/to/app/.next/
rsync -avz components/ user@streamboxx.duckdns.org:/path/to/app/components/

# Then restart the server on production
ssh user@streamboxx.duckdns.org "cd /path/to/app && pm2 restart streambox"
```

### Option 2: Git Push and Pull on Production

**Step 1: Commit changes**
```bash
git add components/Billboard.tsx
git commit -m "feat: mobile-friendly billboard with portrait layout"
git push origin main
```

**Step 2: Pull on production server**
```bash
ssh user@streamboxx.duckdns.org
cd /path/to/streambox
git pull origin main
npm run build
pm2 restart streambox
```

### Option 3: Test Locally First (Recommended)

**Step 1: Test on mobile browser**
- Open `http://localhost:3000` on your phone's browser
- Or use Chrome DevTools mobile emulation
- Verify mobile billboard looks good

**Step 2: Then deploy to production**
Once confirmed, follow Option 1 or 2 above

## Quick Test in Browser (No Deployment Needed)

Open Chrome DevTools:
1. Press F12
2. Click device toolbar icon (or Ctrl+Shift+M)
3. Select a mobile device (e.g., iPhone 12, Pixel 5)
4. Go to http://localhost:3000
5. See mobile billboard immediately!

## Production Server Info

Your Android app loads from: `https://streamboxx.duckdns.org`

To update the app:
1. Deploy changes to streamboxx.duckdns.org
2. Restart the production server
3. Clear app cache or wait for auto-refresh
4. App will load new version

## Check if Production is Running

```bash
# Check if your production server is running
curl https://streamboxx.duckdns.org

# Or check from your phone
# Open browser: https://streamboxx.duckdns.org
```

## After Deployment

1. **Clear browser cache** on your phone
2. **Force refresh** in Android app (pull down to refresh)
3. **Or restart** the Streambox app completely

## Need Help?

If you're not sure how your production is set up:
1. Is it running on this same machine?
2. Do you use PM2, Docker, or direct node?
3. Is there a deployment script?

Let me know and I can provide specific instructions!
