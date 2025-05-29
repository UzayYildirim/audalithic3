# Audalithic - Multilingual Radio

Audalithic is a beautiful, intuitive radio web application that allows users to listen to songs in multiple languages. The player is designed to be embeddable and has a transparent background to seamlessly integrate with any website.

## Features

- Select from multiple language options (English, Spanish, French, Turkish, Tagalog, Nepali, Hindi, Instrumental, Ukrainian, Korean, Chinese)
- Plays songs randomly from selected languages
- Never repeats songs during a session
- Remembers your language preferences and played songs between sessions
- Beautiful, modern UI with a transparent background for embedding

## Environment Variables

Before running the application, you need to set up the following environment variables:

### Required Environment Variables

Create a `.env.local` file in the root directory with:

```bash
# Audio Base URL - The base URL where your music files are hosted
# This should point to your music server (without trailing slash)
# Example: https://music.example.com
NEXT_PUBLIC_AUDIO_BASE_URL=https://your-music-server.com
```

For Cloudflare Pages deployment, set this environment variable in your Cloudflare Pages dashboard.

### Music Server Requirements

Your music server should be a simple file server with the following structure:

```
https://your-music-server.com/
├── manifest.json          # Contains the list of languages and songs
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

**manifest.json format:**
```json
{
  "languages": {
    "English": ["song1", "song2", "song3"],
    "Spanish": ["cancion1", "cancion2"],
    "French": ["chanson1", "chanson2"]
  }
}
```

See `manifest.example.json` in the repository for a complete example.

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
