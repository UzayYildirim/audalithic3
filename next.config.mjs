import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

// Here we use the @cloudflare/next-on-pages next-dev module to allow us to use bindings during local development
// (when running the application with `next dev`), for more information see:
// https://github.com/cloudflare/next-on-pages/blob/2d4b0b1/internal-packages/next-dev/README.md
if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable image optimization for Cloudflare Pages compatibility
  images: {
    unoptimized: true
  },
  
  // Ensure trailing slashes are handled correctly
  trailingSlash: true,
  
  // Disable automatic static optimization for API routes
  experimental: {
    // This helps with edge runtime compatibility
    serverComponentsExternalPackages: [],
  },
}

export default nextConfig; 