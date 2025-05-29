# Audalithic Setup Guide

## Quick Start

### 1. Set up Environment Variables

Copy the example environment file and edit it:

```bash
cp .env.example .env.local
```

Edit `.env.local` and replace `https://your-music-server.com` with your actual music server URL.

### 2. Music Server Setup

Your music server needs:

1. **A `manifest.json` file** at the root
2. **Audio files** organized in language folders
3. **CORS enabled** (if hosting on a different domain)

### Example Directory Structure

```
https://your-music-server.com/
├── manifest.json
└── audio/
    ├── English/
    │   ├── song1.mp3
    │   ├── song2.mp3
    │   └── song3.mp3
    ├── Spanish/
    │   ├── cancion1.mp3
    │   └── cancion2.mp3
    └── French/
        ├── chanson1.mp3
        └── chanson2.mp3
```

### manifest.json Format

Create a `manifest.json` file listing all your languages and songs:

```json
{
  "languages": {
    "English": ["song1", "song2", "song3"],
    "Spanish": ["cancion1", "cancion2"],
    "French": ["chanson1", "chanson2"]
  }
}
```

**Important Notes:**
- Song titles in `manifest.json` should NOT include the `.mp3` extension
- File names should match exactly (case-sensitive)
- Use URL-safe characters in file/folder names

### 3. Testing Your Setup

1. Test that your manifest is accessible:
   ```
   curl https://your-music-server.com/manifest.json
   ```

2. Test that audio files are accessible:
   ```
   curl -I https://your-music-server.com/audio/English/song1.mp3
   ```

3. Run the app:
   ```bash
   pnpm dev
   ```

## Deployment

### For Cloudflare Pages

1. Set the environment variable in your Cloudflare Pages dashboard:
   - Variable name: `NEXT_PUBLIC_AUDIO_BASE_URL`
   - Value: `https://your-music-server.com`

2. Deploy your app to Cloudflare Pages

### For Other Platforms

Set the environment variable `NEXT_PUBLIC_AUDIO_BASE_URL` in your deployment platform's settings.

## Troubleshooting

### Common Issues

1. **"Music server URL is not configured"**
   - Make sure you have `.env.local` file with `NEXT_PUBLIC_AUDIO_BASE_URL`
   - For production, set the environment variable in your hosting platform

2. **"Cannot connect to music server"**
   - Check if your music server URL is accessible
   - Verify CORS is enabled on your music server
   - Test the manifest.json endpoint manually

3. **"No songs available"**
   - Check your manifest.json format
   - Verify file names match exactly between manifest and actual files
   - Ensure audio files are publicly accessible

4. **Songs fail to load**
   - Check audio file URLs are accessible
   - Verify CORS headers allow audio streaming
   - Check file formats (MP3 is recommended)

### CORS Setup

If your music server is on a different domain, you need to enable CORS. Add these headers to your server:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Example Music Server (Static Hosting)

You can use any static hosting service for your music files:

- **GitHub Pages**: Free, simple setup
- **Netlify**: Free tier with custom domains
- **Vercel**: Free tier with good performance
- **AWS S3**: Scalable, pay-as-you-go
- **Any CDN**: CloudFlare, DigitalOcean Spaces, etc.

Just upload your files and ensure public access! 