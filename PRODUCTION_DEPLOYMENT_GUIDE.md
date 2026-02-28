# Production Deployment Guide 🚀

## Overview
This guide will help you deploy your streaming platform to production. You're currently using Clerk test keys, which need to be upgraded to production keys.

---

## Pre-Deployment Checklist

### 1. Database Setup ✅
Your MongoDB is already configured and ready for production.
- Database URL: Already set in environment variables
- Connection: Stable and working

### 2. Required Actions Before Deployment

#### A. Run Prisma Commands (IMPORTANT!)
Before deploying, ensure your database schema is up to date:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates Watchlist and Notification tables)
npx prisma db push
```

#### B. Upgrade Clerk to Production

**Current Status:** You're using test keys (`pk_test_...` and `sk_test_...`)

**Steps to Upgrade:**

1. **Go to Clerk Dashboard**
   - Visit: https://dashboard.clerk.com
   - Select your application

2. **Switch to Production Instance**
   - In the top-right corner, you'll see "Development" dropdown
   - Click it and select "Create Production Instance" or switch to existing production instance
   - OR go to: Settings → Instances → Create Production Instance

3. **Get Production API Keys**
   - Go to: API Keys section
   - Copy your production keys:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_...`)
     - `CLERK_SECRET_KEY` (starts with `sk_live_...`)

4. **Configure Production URLs**
   - Go to: Paths section in Clerk Dashboard
   - Set your production domain URLs
   - Configure redirect URLs for your production domain

5. **Update Environment Variables** (see below)

---

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

#### Step 1: Prepare Your Repository
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for production deployment"

# Push to GitHub/GitLab/Bitbucket
git remote add origin YOUR_REPO_URL
git push -u origin main
```

#### Step 2: Deploy to Vercel

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Sign up/Login with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   Click "Environment Variables" and add:

   ```env
   # Database
   DATABASE_URL=mongodb+srv://isamahmedh8_db_user:WqlnGvNgPdZssaL0@streamboxcluster.apjivhy.mongodb.net/isamahmedh8_db_user

   # NextAuth (keep these)
   NEXTAUTH_JWT_SECRET=NEXT-JWT-SECRET
   NEXTAUTH_SECRET=NEXT-SECRET
   NEXTAUTH_URL=https://your-domain.vercel.app

   # Clerk Production Keys (REPLACE WITH PRODUCTION KEYS!)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
   CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET

   # Clerk URLs (update with your production domain)
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/profiles
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/profiles

   # TMDB API
   TMDB_API_KEY=2798e7ca7be0f39eedee09bbcff6c52b

   # Streaming API
   STREAMING_API_BASE_URL=https://vidsrc.to/embed
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (3-5 minutes)
   - Your site will be live at: `https://your-project.vercel.app`

5. **Update Clerk with Production Domain**
   - Go back to Clerk Dashboard
   - Add your Vercel domain to allowed origins
   - Update redirect URLs to use your Vercel domain

#### Step 3: Custom Domain (Optional)
1. In Vercel: Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Clerk URLs to use custom domain

---

### Option 2: Netlify

#### Step 1: Prepare Build Command
Update `package.json` if needed (already correct):
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

#### Step 2: Deploy to Netlify

1. **Go to Netlify**
   - Visit: https://netlify.com
   - Sign up/Login

2. **Import Project**
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Add environment variables (same as Vercel list above)

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete

---

### Option 3: Railway

1. **Go to Railway**
   - Visit: https://railway.app
   - Sign up/Login

2. **New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"

3. **Add Environment Variables**
   - Same as Vercel list above

4. **Deploy**
   - Railway will auto-deploy
   - Get your production URL

---

## Post-Deployment Steps

### 1. Update Clerk Production Settings

In Clerk Dashboard:

**Allowed Origins:**
- Add your production domain
- Example: `https://your-app.vercel.app`

**Redirect URLs:**
- Sign-in redirect: `https://your-app.vercel.app/profiles`
- Sign-up redirect: `https://your-app.vercel.app/profiles`
- Sign-out redirect: `https://your-app.vercel.app/home`

**Session Settings:**
- Review session timeout settings
- Configure multi-session handling if needed

### 2. Test Your Production Site

Test these features:
- [ ] User registration
- [ ] User login
- [ ] Profile creation
- [ ] Movie browsing
- [ ] Video playback
- [ ] Watchlist functionality
- [ ] Continue watching
- [ ] Search functionality
- [ ] Notifications
- [ ] Mobile responsiveness

### 3. Monitor and Optimize

**Vercel Analytics** (if using Vercel):
- Enable Web Analytics in Vercel dashboard
- Monitor performance and errors

**Error Tracking:**
- Consider adding Sentry for error tracking
- Monitor Clerk dashboard for auth issues

---

## Environment Variables Summary

### Required for Production:

```env
# Database (Production MongoDB)
DATABASE_URL=your_mongodb_connection_string

# NextAuth
NEXTAUTH_JWT_SECRET=generate_random_secret
NEXTAUTH_SECRET=generate_random_secret
NEXTAUTH_URL=https://your-production-domain.com

# Clerk Production Keys (MUST CHANGE!)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/profiles
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/profiles

# TMDB API
TMDB_API_KEY=your_tmdb_api_key

# Streaming API
STREAMING_API_BASE_URL=https://vidsrc.to/embed
```

---

## Security Recommendations

### 1. Generate Strong Secrets
For production, generate new random secrets:

```bash
# Generate random secrets (run in terminal)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use these for:
- `NEXTAUTH_JWT_SECRET`
- `NEXTAUTH_SECRET`

### 2. Environment Variables
- ✅ Never commit `.env` files to Git (already in .gitignore)
- ✅ Use different secrets for production vs development
- ✅ Rotate secrets periodically

### 3. Clerk Security
- Enable MFA for admin accounts
- Configure rate limiting
- Review security settings in Clerk dashboard

### 4. Developer Tools Protection ✅
- **Automatically enabled in production**
- Blocks F12, right-click, and DevTools access
- Disables console in production
- Protects content from casual copying
- See `DEVTOOLS_PROTECTION.md` for details

**Note:** This deters casual users but is not foolproof. Always implement proper server-side security.

---

## Troubleshooting

### Issue: "Clerk authentication failed"
**Solution:** 
- Verify you're using production keys (`pk_live_` and `sk_live_`)
- Check that your domain is added to Clerk's allowed origins
- Ensure redirect URLs match your production domain

### Issue: "Database connection failed"
**Solution:**
- Verify MongoDB connection string is correct
- Check MongoDB Atlas IP whitelist (allow all: 0.0.0.0/0 for cloud deployments)
- Ensure database user has proper permissions

### Issue: "Build failed on Vercel/Netlify"
**Solution:**
- Run `npm run build` locally to test
- Check build logs for specific errors
- Ensure all environment variables are set
- Run `npx prisma generate` before build (already in postinstall script)

### Issue: "Movies not loading"
**Solution:**
- Verify TMDB_API_KEY is set correctly
- Check STREAMING_API_BASE_URL is accessible
- Review browser console for API errors

---

## Performance Optimization

### 1. Enable Next.js Image Optimization
Already configured, but ensure images are optimized in production.

### 2. Enable Caching
Vercel automatically handles caching for Next.js apps.

### 3. Monitor Performance
- Use Vercel Analytics
- Monitor Core Web Vitals
- Check loading times

---

## Maintenance

### Regular Tasks:
1. **Monitor Clerk Dashboard** - Check for auth issues
2. **Update Dependencies** - Run `npm update` monthly
3. **Database Backups** - MongoDB Atlas handles this automatically
4. **Review Logs** - Check Vercel/Netlify logs for errors
5. **Security Updates** - Keep Next.js and dependencies updated

---

## Quick Start Deployment (Vercel)

```bash
# 1. Install Vercel CLI (optional)
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Deploy to production
vercel --prod
```

---

## Support Resources

- **Clerk Documentation:** https://clerk.com/docs
- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas/

---

## Final Checklist Before Going Live

- [ ] Upgraded Clerk to production keys
- [ ] Set all environment variables in hosting platform
- [ ] Ran `npx prisma generate` and `npx prisma db push`
- [ ] Updated Clerk dashboard with production domain
- [ ] Tested user registration and login
- [ ] Tested all major features
- [ ] Verified mobile responsiveness
- [ ] Set up custom domain (optional)
- [ ] Enabled analytics/monitoring
- [ ] Reviewed security settings

---

## Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review deployment platform logs
3. Check Clerk dashboard for auth errors
4. Verify all environment variables are set correctly

Good luck with your deployment! 🎉
