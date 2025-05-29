# Cloudflare Pages Deployment Guide

## Automatic Deployment Setup

### 1. Cloudflare Pages Dashboard Configuration

In your Cloudflare Pages dashboard, set the following:

**Build Configuration:**
- Framework preset: `Next.js (Static Export)` or `Next.js`
- Build command: `npm run build`
- Build output directory: `.vercel/output/static`
- Root directory: `/` (leave empty)

**Environment Variables:**
Add this environment variable in the Cloudflare Pages dashboard:
- Variable name: `NEXT_PUBLIC_AUDIO_BASE_URL`
- Value: `https://aiaudio.uzay.me` (or your music server URL)

### 2. Repository Setup

Make sure your repository is connected to Cloudflare Pages and set to auto-deploy on push to your main branch.

## Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# Install Cloudflare adapter
pnpm add @cloudflare/next-on-pages

# Build for Cloudflare Pages
pnpm run pages:build

# Deploy using Wrangler
npx wrangler pages deploy .vercel/output/static --project-name audalithic
```

## Build-time Errors

During build, you might see errors like:
```
❌ Cannot reach music server at https://aiaudio.uzay.me
```

This is **normal and expected** because:
1. The build process tries to prerender some pages
2. Your music server might not be reachable during build time
3. The app will work correctly at runtime when deployed

These errors don't prevent the build from succeeding.

## Environment Variables for Different Environments

### Development (.env.local)
```bash
NEXT_PUBLIC_AUDIO_BASE_URL=https://your-music-server.com
```

### Production (Cloudflare Pages Dashboard)
Set in the environment variables section:
- `NEXT_PUBLIC_AUDIO_BASE_URL` = `https://aiaudio.uzay.me`

## Troubleshooting

### Build Fails
- Make sure you have `@cloudflare/next-on-pages` installed
- Check that your build command is `npm run build` not `pnpm run build` if using the dashboard

### App Doesn't Load Music
- Verify the `NEXT_PUBLIC_AUDIO_BASE_URL` environment variable is set in production
- Check that your music server is accessible from the deployed app
- Ensure CORS is enabled on your music server

### Deployment Command Errors
If you see "Missing entry-point to Worker script", you're probably using the wrong command. Use:
```bash
npx wrangler pages deploy .vercel/output/static --project-name audalithic
```

Not: `npx wrangler deploy` (that's for Workers, not Pages) 