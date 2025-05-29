import { NextRequest, NextResponse } from 'next/server';
import { getSongsByLanguages } from '@/utils/audioManager';

export async function POST(request: NextRequest) {
  try {
    const { languages } = await request.json();
    
    if (!languages || !Array.isArray(languages)) {
      return NextResponse.json(
        { 
          error: 'Languages parameter must be an array',
          success: false 
        },
        { status: 400 }
      );
    }

    if (languages.length === 0) {
      return NextResponse.json({ 
        songs: [],
        success: true 
      });
    }

    const songs = await getSongsByLanguages(languages);
    return NextResponse.json({ 
      songs,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching songs:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch songs';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Music server URL is not configured')) {
        errorMessage = 'Music server URL is not configured. Please check environment variables.';
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('Cannot connect to music server')) {
        errorMessage = 'Cannot connect to music server. Please check if the server is accessible.';
        statusCode = 503;
      } else if (error.message.includes('Music server error')) {
        errorMessage = 'Music server returned an error. Please try again later.';
        statusCode = 502; // Bad Gateway
      } else if (error.message.includes('No songs available')) {
        errorMessage = 'No songs available for the selected languages.';
        statusCode = 404; // Not Found
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: statusCode }
    );
  }
} 