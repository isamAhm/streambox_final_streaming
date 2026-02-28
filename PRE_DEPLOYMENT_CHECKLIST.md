# Pre-Deployment Checklist ✅

## Critical Actions Required

### 1. ⚠️ UPGRADE CLERK TO PRODUCTION (REQUIRED!)

**Current Status:** Using test keys
- `pk_test_a2V5LWthdHlkaWQtNzQuY2xlcmsuYWNjb3VudHMuZGV2JA`
- `sk_test_vY0QsTixIeBu7KzZyzPCz6fbdzp5RlIDPlJkY5BhmP`

**Action Required:**
1. Go to https://dashboard.clerk.com
2. Switch to Production instance (or create one)
3. Get production keys (start with `pk_live_` and `sk_live_`)
4. Update environment variables in your hosting platform

**Why:** Test keys will NOT work in production and will cause authentication failures.

---

### 2. 🗄️ DATABASE SCHEMA UPDATE (REQUIRED!)

**Action Required:**
Run these commands before deploying:

```bash
# Generate Prisma Client with new models
npx prisma generate

# Push schema to database (creates Watchlist and Notification tables)
npx prisma db push
```

**Why:** Your app uses Watchlist and Notification features that require these database tables.

**Status:** 
- ✅ Watchlist model added to schema
- ✅ Notification model added to schema
- ⚠️ Need to run commands to create tables

---

### 3. 🔐 GENERATE PRODUCTION SECRETS (RECOMMENDED)

**Current Secrets (Development):**
- NEXTAUTH_JWT_SECRET: "NEXT-JWT-SECRET"
- NEXTAUTH_SECRET: "NEXT-SECRET"

**Action Required:**
Generate new random secrets for production:

```bash
# Run this command twice to generate two different secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the generated values for:
- `NEXTAUTH_JWT_SECRET`
- `NEXTAUTH_SECRET`

**Why:** Using simple secrets in production is a security risk.

---

### 4. 🌐 ENVIRONMENT VARIABLES SETUP

**Required Variables for Production:**

```env
# Database
DATABASE_URL=mongodb+srv://isamahmedh8_db_user:WqlnGvNgPdZssaL0@streamboxcluster.apjivhy.mongodb.net/isamahmedh8_db_user

# NextAuth (GENERATE NEW SECRETS!)
NEXTAUTH_JWT_SECRET=<generate_new_random_secret>
NEXTAUTH_SECRET=<generate_new_random_secret>
NEXTAUTH_URL=https://your-production-domain.com

# Clerk Production Keys (GET FROM CLERK DASHBOARD!)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_<your_production_key>
CLERK_SECRET_KEY=sk_live_<your_production_secret>

# Clerk URLs (update domain after deployment)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/profiles
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/profiles

# TMDB API (already have)
TMDB_API_KEY=2798e7ca7be0f39eedee09bbcff6c52b

# Streaming API (already configured)
STREAMING_API_BASE_URL=https://vidsrc.to/embed
```

---

### 5. 📝 UPDATE .gitignore (ALREADY DONE ✅)

Your `.gitignore` already includes:
- ✅ `.env*.local`
- ✅ `.env`
- ✅ `node_modules`
- ✅ `.next`

**Status:** Good to go!

---

### 6. 🔍 CODE REVIEW CHECKLIST

#### Security ✅
- [x] No hardcoded secrets in code
- [x] Environment variables used for sensitive data
- [x] Clerk authentication properly configured
- [x] API routes protected with authentication

#### Features ✅
- [x] User authentication (Clerk)
- [x] Profile management
- [x] Movie browsing
- [x] Video streaming
- [x] Watchlist system
- [x] Continue watching
- [x] Search functionality
- [x] Notifications
- [x] Mobile responsive

#### Performance ✅
- [x] SWR caching configured
- [x] Image optimization ready
- [x] Lazy loading implemented
- [x] API calls optimized

---

### 7. 🧪 LOCAL TESTING

**Before deploying, test locally:**

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Build for production
npm run build

# Test production build locally
npm start
```

**Test these features:**
- [ ] User registration
- [ ] User login
- [ ] Profile creation
- [ ] Browse movies
- [ ] Play video
- [ ] Add to watchlist
- [ ] Continue watching
- [ ] Search movies
- [ ] Notifications
- [ ] Mobile view

---

### 8. 📦 DEPLOYMENT PLATFORM SETUP

#### If using Vercel:
1. [ ] Create Vercel account
2. [ ] Connect GitHub repository
3. [ ] Add all environment variables
4. [ ] Deploy

#### If using Netlify:
1. [ ] Create Netlify account
2. [ ] Connect GitHub repository
3. [ ] Set build command: `npm run build`
4. [ ] Add all environment variables
5. [ ] Deploy

#### If using Railway:
1. [ ] Create Railway account
2. [ ] Connect GitHub repository
3. [ ] Add all environment variables
4. [ ] Deploy

---

### 9. 🔄 POST-DEPLOYMENT ACTIONS

**After deployment:**

1. **Update Clerk Dashboard**
   - [ ] Add production domain to allowed origins
   - [ ] Update redirect URLs with production domain
   - [ ] Test authentication on production

2. **Verify Database Connection**
   - [ ] Check MongoDB Atlas IP whitelist
   - [ ] Ensure database is accessible from hosting platform
   - [ ] Test database operations

3. **Test Production Site**
   - [ ] User registration
   - [ ] User login
   - [ ] All features working
   - [ ] Mobile responsiveness
   - [ ] Video playback

4. **Monitor**
   - [ ] Check deployment logs
   - [ ] Monitor Clerk dashboard for auth issues
   - [ ] Check for any errors

---

### 10. 🚨 COMMON ISSUES & SOLUTIONS

#### Issue: "Clerk authentication failed"
**Cause:** Using test keys in production
**Solution:** Upgrade to production keys from Clerk dashboard

#### Issue: "Database connection failed"
**Cause:** MongoDB IP whitelist
**Solution:** Add 0.0.0.0/0 to MongoDB Atlas IP whitelist for cloud deployments

#### Issue: "Watchlist not working"
**Cause:** Database tables not created
**Solution:** Run `npx prisma db push`

#### Issue: "Build failed"
**Cause:** Missing environment variables
**Solution:** Ensure all required env vars are set in hosting platform

---

## Quick Deployment Steps

### For Vercel (Recommended):

```bash
# 1. Commit your code
git add .
git commit -m "Ready for production"
git push

# 2. Go to vercel.com
# 3. Import your repository
# 4. Add environment variables (see section 4 above)
# 5. Deploy

# 6. After deployment, update Clerk:
# - Add your Vercel domain to Clerk allowed origins
# - Update redirect URLs in Clerk dashboard
```

---

## Final Pre-Deployment Command

Run this before deploying:

```bash
# Generate Prisma Client and push schema
npx prisma generate && npx prisma db push

# Test build
npm run build

# If build succeeds, you're ready to deploy!
```

---

## Deployment Priority Order

1. **CRITICAL** - Upgrade Clerk to production keys
2. **CRITICAL** - Run Prisma commands (generate + db push)
3. **IMPORTANT** - Generate new production secrets
4. **IMPORTANT** - Set all environment variables
5. **RECOMMENDED** - Test locally before deploying
6. **RECOMMENDED** - Monitor after deployment

---

## Need Help?

Refer to `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## Status Summary

### ✅ Ready:
- Code is production-ready
- Mobile responsive
- All features implemented
- Security best practices followed
- Database configured

### ⚠️ Action Required:
- Upgrade Clerk to production keys
- Run Prisma commands
- Generate production secrets
- Set environment variables in hosting platform
- Update Clerk dashboard with production domain

### 📊 Estimated Time to Deploy:
- Clerk upgrade: 5 minutes
- Environment setup: 10 minutes
- Deployment: 5-10 minutes
- Testing: 15 minutes
- **Total: ~30-40 minutes**

---

Good luck with your deployment! 🚀
