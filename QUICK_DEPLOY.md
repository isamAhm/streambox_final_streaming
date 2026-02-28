# Quick Deploy Guide - TL;DR 🚀

## 5-Minute Deployment to Vercel

### Step 1: Upgrade Clerk (2 minutes)
1. Go to https://dashboard.clerk.com
2. Click "Development" dropdown → "Create Production Instance"
3. Go to API Keys → Copy production keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_`)
   - `CLERK_SECRET_KEY` (starts with `sk_live_`)

### Step 2: Prepare Database (1 minute)
```bash
npx prisma generate
npx prisma db push
```

### Step 3: Deploy to Vercel (2 minutes)
1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Add these environment variables:

```env
DATABASE_URL=mongodb+srv://isamahmedh8_db_user:WqlnGvNgPdZssaL0@streamboxcluster.apjivhy.mongodb.net/isamahmedh8_db_user
NEXTAUTH_JWT_SECRET=NEXT-JWT-SECRET
NEXTAUTH_SECRET=NEXT-SECRET
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_live_YOUR_SECRET_HERE
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/profiles
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/profiles
TMDB_API_KEY=2798e7ca7be0f39eedee09bbcff6c52b
STREAMING_API_BASE_URL=https://vidsrc.to/embed
```

5. Click "Deploy"

### Step 4: Update Clerk (1 minute)
1. Go back to Clerk Dashboard
2. Add your Vercel URL to "Allowed origins"
3. Update redirect URLs with your Vercel domain

### Done! 🎉

Your app is now live at: `https://your-project.vercel.app`

---

## Verification Script

Before deploying, run:
```bash
npm run verify-deploy
```

This checks if everything is ready for production.

---

## Full Preparation Command

Run this to prepare everything:
```bash
npm run prepare-deploy
```

This will:
1. Generate Prisma Client
2. Push schema to database
3. Test production build

---

## Critical Reminders

⚠️ **MUST DO:**
- Use production Clerk keys (`pk_live_` and `sk_live_`)
- Run `npx prisma db push` before deploying
- Add all environment variables to Vercel

⚠️ **SHOULD DO:**
- Generate new random secrets for NEXTAUTH_JWT_SECRET and NEXTAUTH_SECRET
- Test locally with `npm run build` before deploying
- Update Clerk dashboard with production domain

---

## After Deployment

Test these:
- [ ] User registration
- [ ] User login
- [ ] Browse movies
- [ ] Play video
- [ ] Watchlist
- [ ] Search

---

## Need More Details?

See `PRODUCTION_DEPLOYMENT_GUIDE.md` for comprehensive instructions.

---

## Troubleshooting

**Auth not working?**
→ Check you're using `pk_live_` and `sk_live_` keys

**Database error?**
→ Run `npx prisma db push`

**Build failed?**
→ Check all environment variables are set

---

## Support

- Clerk: https://clerk.com/docs
- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs
