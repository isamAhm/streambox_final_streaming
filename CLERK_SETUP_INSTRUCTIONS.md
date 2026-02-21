# Clerk Authentication Setup Instructions

## Authentication Flow

```
User visits localhost:3000
         ↓
    Not logged in? → Redirect to /home (public landing page)
         ↓
    User clicks "Sign In" or "Sign Up"
         ↓
    Redirect to /auth (custom login page)
         ↓
    User logs in/signs up
         ↓
    Redirect to /profiles (select profile)
         ↓
    User can access / (main app with movies)
```

## What Was Fixed

1. **Updated Authentication Flow**: Fixed the sign-in and sign-up logic to properly use Clerk's `setActive` method after successful authentication
2. **Middleware Configuration**: Updated from deprecated `withClerkMiddleware` to the new `authMiddleware` API
3. **OAuth Redirects**: Created SSO callback page for Google and Apple sign-in redirects
4. **Error Handling**: Improved error messages and validation
5. **Session Management**: Properly set active sessions after login/signup

## Clerk Dashboard Configuration Required

To complete the setup, you need to configure your Clerk dashboard:

### 1. Enable Email/Password Authentication
- Go to https://dashboard.clerk.com
- Select your application
- Navigate to "User & Authentication" → "Email, Phone, Username"
- Enable "Email address" and "Password"
- Enable "Username" (optional but recommended based on your form)

### 2. Configure OAuth Providers (Optional)
If you want Google and Apple sign-in to work:

#### Google OAuth:
- Go to "User & Authentication" → "Social Connections"
- Enable "Google"
- Add your OAuth credentials or use Clerk's development keys for testing

#### Apple OAuth:
- Enable "Apple" in Social Connections
- Configure Apple OAuth credentials

### 3. Configure Redirect URLs
In your Clerk dashboard under "Paths":
- Add `http://localhost:3000/sso-callback` to allowed redirect URLs (for development)
- Add your production domain when deploying

### 4. Email Verification Settings
- Go to "User & Authentication" → "Email, Phone, Username"
- Configure email verification strategy:
  - "Email verification code" (recommended for your current setup)
  - Or "Email verification link"

## Environment Variables

Your `.env` and `.env.local` files should have:

```env
# Clerk Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL="mongodb+srv://..."
```

## Testing the Authentication

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Visit the landing page**:
   - Go to http://localhost:3000 (will redirect to /home)
   - This is your public landing page where users can browse

3. **Test Sign Up**:
   - Click "Sign Up" or "Sign In" button on the home page
   - You'll be taken to http://localhost:3000/auth (your custom login page)
   - Click "Create an account"
   - Fill in email and password (minimum 8 characters)
   - Submit the form
   - Check your email for verification code if required
   - After successful signup, you'll be redirected to /profiles

4. **Test Sign In**:
   - Go to http://localhost:3000/auth
   - Enter your email/username and password
   - Click "Login"
   - You should be redirected to /profiles
   - Then you can access the main app at http://localhost:3000/

5. **Test OAuth** (if configured):
   - On the /auth page, click the Google or Apple icon
   - Complete the OAuth flow
   - You should be redirected back to /profiles

## Common Issues and Solutions

### Issue: "Invalid credentials" error
- **Solution**: Make sure the user exists in Clerk dashboard and password is correct
- Check Clerk dashboard → Users to see registered users

### Issue: Email verification required
- **Solution**: Check your email for verification code
- Or disable email verification in Clerk dashboard for testing

### Issue: OAuth redirect fails
- **Solution**: Verify redirect URLs are configured in Clerk dashboard
- Make sure OAuth providers are properly enabled

### Issue: Session not persisting
- **Solution**: Clear browser cookies and try again
- Check that `setActive` is being called after successful auth

### Issue: Middleware blocking requests
- **Solution**: Check `middleware.ts` - public routes should include `/home`, `/auth`, and `/sso-callback`
- Current config allows unauthenticated access to these routes
- The root path `/` redirects to `/home` for unauthenticated users
- Authenticated users can access `/` (the main app with movies)

## Database Sync

The `serverAuth.ts` file automatically:
- Creates a user in MongoDB when they first sign in via Clerk
- Syncs user data (name, email, image) from Clerk to your database
- Links Clerk userId to your Prisma User model

## Next Steps

1. Configure Clerk dashboard settings as described above
2. Test the authentication flow
3. Customize the auth page styling if needed
4. Add password reset functionality (optional)
5. Configure production environment variables when deploying

## Support

If you encounter issues:
1. Check Clerk dashboard logs for authentication errors
2. Check browser console for client-side errors
3. Check server logs for API errors
4. Verify environment variables are loaded correctly
