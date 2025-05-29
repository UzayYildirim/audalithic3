import { NextResponse } from 'next/server';
import { getAvailableLanguages } from '@/utils/audioManager';

// Configure this route to use Edge Runtime for Cloudflare Pages compatibility
export const runtime = 'edge';

export async function GET() {
  try {
    const languages = await getAvailableLanguages();
    return NextResponse.json({ 
      languages,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch languages';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('NEXT_PUBLIC_AUDIO_BASE_URL not configured for build')) {
        // This is expected during build time
        errorMessage = 'Build-time error: Environment variable not available during build';
        statusCode = 503;
      } else if (error.message.includes('Music server URL is not configured')) {
        errorMessage = 'Music server URL is not configured. Please check environment variables.';
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('Cannot connect to music server')) {
        errorMessage = 'Cannot connect to music server. Please check if the server is accessible.';
        statusCode = 503;
      } else if (error.message.includes('Music server error')) {
        errorMessage = 'Music server returned an error. Please try again later.';
        statusCode = 502; // Bad Gateway
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      success: false 
    }, { status: statusCode });
  }
} 