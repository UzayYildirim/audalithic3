export interface Song {
  id: string;
  title: string;
  language: string;
  path: string;
}

export interface LanguageOption {
  id: string;
  name: string;
}

export interface MusicManifest {
  languages: {
    [languageId: string]: string[]; // language -> array of song titles (without .mp3)
  };
}

// Get the base URL for audio files from environment variable
const getAudioBaseUrl = (): string => {
  // For static hosting (like Cloudflare Pages), use NEXT_PUBLIC_ prefix
  // For server-side rendering, AUDIO_BASE_URL can be used as fallback
  const baseUrl = process.env.NEXT_PUBLIC_AUDIO_BASE_URL || process.env.AUDIO_BASE_URL;
  if (!baseUrl) {
    // Provide a helpful error message for development
    console.error('⚠️ NEXT_PUBLIC_AUDIO_BASE_URL environment variable is not set. Please check your .env.local file.');
    throw new Error('Music server URL is not configured. Please set NEXT_PUBLIC_AUDIO_BASE_URL in your environment variables.');
  }
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

// Test if the base URL is reachable
const testConnection = async (baseUrl: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${baseUrl}/manifest.json`, {
      method: 'HEAD', // Just test if manifest exists
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Fetch the music manifest from the server
const fetchMusicManifest = async (): Promise<MusicManifest> => {
  const baseUrl = getAudioBaseUrl();
  
  // Test connection first
  const isReachable = await testConnection(baseUrl);
  if (!isReachable) {
    console.error(`❌ Cannot reach music server at ${baseUrl}`);
    throw new Error(`Cannot connect to music server. Please check if ${baseUrl} is accessible.`);
  }
  
  // Fetch the manifest file
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  const response = await fetch(`${baseUrl}/manifest.json`, {
    signal: controller.signal,
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Audalithic-App/1.0',
    },
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    console.error(`❌ Music server returned ${response.status}: ${response.statusText}`);
    throw new Error(`Music server error (${response.status}). Please try again later.`);
  }

  let manifest: MusicManifest;
  try {
    manifest = await response.json();
  } catch (parseError) {
    console.error('❌ Invalid manifest format from music server');
    throw new Error('Music server returned invalid data. Please contact support.');
  }
  
  // Validate manifest format
  if (!manifest.languages || typeof manifest.languages !== 'object') {
    console.error('❌ Music server manifest missing languages object:', manifest);
    throw new Error('Music server returned unexpected format. Please contact support.');
  }

  const languageCount = Object.keys(manifest.languages).length;
  if (languageCount === 0) {
    console.warn('⚠️ No languages available from music server');
    throw new Error('No music languages are currently available. Please try again later.');
  }

  console.log(`✅ Loaded manifest with ${languageCount} languages from music server`);
  return manifest;
};

// This function will be called to get all available languages
export async function getAvailableLanguages(): Promise<LanguageOption[]> {
  try {
    const manifest = await fetchMusicManifest();
    
    return Object.keys(manifest.languages).map((language: string) => ({
      id: language,
      name: language
    }));
  } catch (error) {
    console.error('Error fetching available languages:', error);
    
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to load music languages. Please check your internet connection and try again.');
  }
}

// This function will be called to get all songs from selected languages
export async function getSongsByLanguages(languages: string[]): Promise<Song[]> {
  try {
    if (!languages || languages.length === 0) {
      return [];
    }

    const manifest = await fetchMusicManifest();
    const baseUrl = getAudioBaseUrl();
    
    let allSongs: Song[] = [];
    
    for (const language of languages) {
      const songTitles = manifest.languages[language];
      
      if (!songTitles || !Array.isArray(songTitles)) {
        console.warn(`⚠️ No songs found for language: ${language}`);
        continue;
      }
      
      const languageSongs = songTitles
        .filter(title => typeof title === 'string' && title.trim().length > 0)
        .map(title => ({
          id: `${language}-${title}`,
          title: title,
          language: language,
          path: `${baseUrl}/audio/${encodeURIComponent(language)}/${encodeURIComponent(title)}.mp3`
        }));
      
      allSongs = [...allSongs, ...languageSongs];
    }

    if (allSongs.length === 0) {
      console.warn('⚠️ No valid songs found for selected languages');
      throw new Error('No songs available for the selected languages. Please try different languages.');
    }

    console.log(`✅ Loaded ${allSongs.length} songs from music server`);
    
    return allSongs;
  } catch (error) {
    console.error('Error fetching songs:', error);
    
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to load songs. Please check your internet connection and try again.');
  }
} 