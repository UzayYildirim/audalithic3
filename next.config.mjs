import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
import TerserPlugin from 'terser-webpack-plugin';
import WebpackObfuscator from 'webpack-obfuscator';

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

  webpack: (config, { dev, isServer }) => {
    // Only apply minification and obfuscation in production builds for client-side code
    if (!dev && !isServer) {
      // Configure TerserPlugin for better minification
      config.optimization.minimizer.push(
        new TerserPlugin({
          terserOptions: {
            mangle: true,
            compress: {
              drop_console: true, // Remove console.logs in production
              drop_debugger: true,
            },
          },
        })
      );

      // Add basic obfuscation (light obfuscation to not break functionality)
      config.plugins.push(
        new WebpackObfuscator({
          rotateStringArray: true,
          reservedStrings: ['^(react|next|__webpack|__next)',], // Preserve framework strings
          reservedNames: ['^(React|__webpack|__next)',], // Preserve framework names
          stringArray: true,
          stringArrayThreshold: 0.5, // Only obfuscate some strings to maintain stability
          transformObjectKeys: false, // Keep object keys intact to prevent API issues
          unicodeEscapeSequence: false,
          deadCodeInjection: false, // Disable to prevent bloat
          debugProtection: false, // Disable to prevent debugging issues
        }, ['*.tsx', '*.ts', '*.jsx', '*.js'])
      );
    }

    return config;
  },
}

export default nextConfig; 