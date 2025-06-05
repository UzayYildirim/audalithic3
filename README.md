# Audalithic

A modern, real-time AI-powered radio streaming application built with Next.js. Audalithic provides a seamless music listening experience with support for multiple languages and real-time streaming.

## 🌟 Features

- **Real-time Radio Streaming**: Continuous music playback with automatic track transitions
- **Multi-language Support**: Choose from various language tracks
- **Modern UI**: Clean, responsive design with smooth animations
- **Background Particles**: Interactive particle system for visual appeal
- **Volume Control**: Smooth volume adjustment
- **Previous/Next Controls**: Navigate through your listening history
- **Responsive Design**: Works perfectly on desktop and mobile

## 📋 Requirements

### Music Server Setup

You need a remote music server hosting:

1. **Audio files** organized by language:
   ```
   your-music-server.com/
   ├── audio/
   │   ├── English/
   │   │   ├── song1.mp3
   │   │   ├── song2.mp3
   │   │   └── ...
   │   ├── Spanish/
   │   │   ├── song1.mp3
   │   │   ├── song2.mp3
   │   │   └── ...
   │   └── [Other Languages]/
   └── manifest.json
   ```

2. **Manifest file** (`manifest.json`) at the root:
   ```json
   {
     "languages": {
       "English": ["song1", "song2", "song3"],
       "Spanish": ["cancion1", "cancion2", "cancion3"],
       "French": ["chanson1", "chanson2", "chanson3"]
     }
   }
   ```

**Important notes:**
- Song titles in `manifest.json` should NOT include the `.mp3` extension
- Audio files should be accessible at: `{AUDIO_BASE_URL}/audio/{language}/{title}.mp3`
- The server must support CORS if the app is hosted on a different domain
- Both the manifest and audio files should be publicly accessible

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- pnpm (recommended) or npm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/audalithic.git
   cd audalithic
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Set up environment variables
   Create a `.env.local` file with your music server URL:
   ```bash
   NEXT_PUBLIC_AUDIO_BASE_URL=https://your-music-server.com
   ```

4. Start the development server
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

### Building for Production

```bash
pnpm build
```

Then you can start the production server:

```bash
pnpm start
```

## Embedding

To embed Audalithic in your website, you can use an iframe:

```html
<iframe 
  src="https://your-audalithic-deployment.com" 
  width="100%" 
  height="600px" 
  frameborder="0" 
  allow="autoplay"
></iframe>
```

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Howler.js for audio playback

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Music files should be hosted on your remote music server organized by language
- Make sure you have the rights to use any music you host
- The app is designed to work with static hosting platforms like Cloudflare Pages

## Setup

For detailed setup instructions and troubleshooting, see [SETUP.md](SETUP.md).

## Deployment

For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).
