#!/usr/bin/env node

/**
 * Deployment Readiness Verification Script
 * Run this before deploying to production
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking deployment readiness...\n');

let errors = [];
let warnings = [];
let passed = [];

// Check 1: Environment file exists
try {
  if (fs.existsSync('.env.local') || fs.existsSync('.env')) {
    passed.push('✅ Environment file found');
  } else {
    errors.push('❌ No .env or .env.local file found');
  }
} catch (err) {
  errors.push('❌ Error checking environment file');
}

// Check 2: Read environment variables
let envContent = '';
try {
  if (fs.existsSync('.env.local')) {
    envContent = fs.readFileSync('.env.local', 'utf8');
  } else if (fs.existsSync('.env')) {
    envContent = fs.readFileSync('.env', 'utf8');
  }
} catch (err) {
  errors.push('❌ Error reading environment file');
}

// Check 3: Clerk keys
if (envContent.includes('pk_test_')) {
  warnings.push('⚠️  Using Clerk TEST keys - MUST upgrade to production keys (pk_live_...)');
} else if (envContent.includes('pk_live_')) {
  passed.push('✅ Using Clerk production keys');
} else {
  errors.push('❌ No Clerk publishable key found');
}

if (envContent.includes('sk_test_')) {
  warnings.push('⚠️  Using Clerk TEST secret - MUST upgrade to production secret (sk_live_...)');
} else if (envContent.includes('sk_live_')) {
  passed.push('✅ Using Clerk production secret');
} else {
  errors.push('❌ No Clerk secret key found');
}

// Check 4: Database URL
if (envContent.includes('DATABASE_URL')) {
  passed.push('✅ Database URL configured');
} else {
  errors.push('❌ DATABASE_URL not found');
}

// Check 5: NextAuth secrets
if (envContent.includes('NEXTAUTH_JWT_SECRET')) {
  if (envContent.includes('NEXTAUTH_JWT_SECRET="NEXT-JWT-SECRET"') || 
      envContent.includes("NEXTAUTH_JWT_SECRET='NEXT-JWT-SECRET'")) {
    warnings.push('⚠️  Using default NEXTAUTH_JWT_SECRET - should generate random secret for production');
  } else {
    passed.push('✅ Custom NEXTAUTH_JWT_SECRET configured');
  }
} else {
  errors.push('❌ NEXTAUTH_JWT_SECRET not found');
}

if (envContent.includes('NEXTAUTH_SECRET')) {
  if (envContent.includes('NEXTAUTH_SECRET="NEXT-SECRET"') || 
      envContent.includes("NEXTAUTH_SECRET='NEXT-SECRET'")) {
    warnings.push('⚠️  Using default NEXTAUTH_SECRET - should generate random secret for production');
  } else {
    passed.push('✅ Custom NEXTAUTH_SECRET configured');
  }
} else {
  errors.push('❌ NEXTAUTH_SECRET not found');
}

// Check 6: TMDB API Key
if (envContent.includes('TMDB_API_KEY')) {
  passed.push('✅ TMDB API key configured');
} else {
  warnings.push('⚠️  TMDB_API_KEY not found - movies may not load');
}

// Check 7: Prisma schema
try {
  const schemaPath = path.join('prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    if (schema.includes('model Watchlist')) {
      passed.push('✅ Watchlist model found in schema');
    } else {
      errors.push('❌ Watchlist model not found in schema');
    }
    
    if (schema.includes('model Notification')) {
      passed.push('✅ Notification model found in schema');
    } else {
      errors.push('❌ Notification model not found in schema');
    }
  } else {
    errors.push('❌ Prisma schema file not found');
  }
} catch (err) {
  errors.push('❌ Error reading Prisma schema');
}

// Check 8: Package.json scripts
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts.build) {
    passed.push('✅ Build script configured');
  } else {
    errors.push('❌ Build script not found in package.json');
  }
  
  if (packageJson.scripts && packageJson.scripts.postinstall) {
    passed.push('✅ Postinstall script configured (Prisma generate)');
  } else {
    warnings.push('⚠️  No postinstall script - may need to run prisma generate manually');
  }
} catch (err) {
  errors.push('❌ Error reading package.json');
}

// Check 9: .gitignore
try {
  if (fs.existsSync('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    
    if (gitignore.includes('.env')) {
      passed.push('✅ .env files in .gitignore');
    } else {
      errors.push('❌ .env files not in .gitignore - SECURITY RISK!');
    }
    
    if (gitignore.includes('node_modules')) {
      passed.push('✅ node_modules in .gitignore');
    } else {
      warnings.push('⚠️  node_modules not in .gitignore');
    }
  } else {
    warnings.push('⚠️  No .gitignore file found');
  }
} catch (err) {
  errors.push('❌ Error reading .gitignore');
}

// Check 10: Next.js config
try {
  if (fs.existsSync('next.config.js')) {
    passed.push('✅ Next.js config found');
  } else {
    warnings.push('⚠️  No next.config.js found');
  }
} catch (err) {
  warnings.push('⚠️  Error checking Next.js config');
}

// Print results
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (passed.length > 0) {
  console.log('✅ PASSED CHECKS:\n');
  passed.forEach(item => console.log(`   ${item}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS (Recommended to fix):\n');
  warnings.forEach(item => console.log(`   ${item}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ ERRORS (Must fix before deployment):\n');
  errors.forEach(item => console.log(`   ${item}`));
  console.log('');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Summary
const total = passed.length + warnings.length + errors.length;
const score = ((passed.length / total) * 100).toFixed(0);

console.log(`📊 DEPLOYMENT READINESS SCORE: ${score}%\n`);

if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 All checks passed! You\'re ready to deploy!\n');
  console.log('Next steps:');
  console.log('1. Run: npx prisma generate');
  console.log('2. Run: npx prisma db push');
  console.log('3. Run: npm run build (to test)');
  console.log('4. Deploy to your hosting platform\n');
  process.exit(0);
} else if (errors.length === 0) {
  console.log('⚠️  You can deploy, but should address warnings first.\n');
  console.log('Critical actions before deploying:');
  console.log('1. Upgrade Clerk to production keys');
  console.log('2. Generate production secrets for NextAuth');
  console.log('3. Run: npx prisma generate');
  console.log('4. Run: npx prisma db push');
  console.log('5. Set environment variables in hosting platform\n');
  process.exit(0);
} else {
  console.log('❌ Please fix errors before deploying.\n');
  console.log('See PRE_DEPLOYMENT_CHECKLIST.md for detailed instructions.\n');
  process.exit(1);
}
