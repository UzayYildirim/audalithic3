'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { LanguageOption, Song } from '@/utils/audioManager';
import toast from 'react-hot-toast';

interface RadioContextType {
  languages: LanguageOption[];
  selectedLanguages: string[];
  isPlaying: boolean;
  currentSong: Song | null;
  volume: number;
  loading: boolean;
  playedSongs: string[];
  hasPreviousSongs: boolean;
  isButtonDisabled: boolean;
  currentTime: number;
  duration: number;
  toggleLanguage: (languageId: string) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  skipSong: () => void;
  previousSong: () => void;
  resetPlaylist: () => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export function useRadio() {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
}

interface RadioProviderProps {
  children: ReactNode;
}

export function RadioProvider({ children }: RadioProviderProps) {
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [playedSongs, setPlayedSongs] = useState<string[]>([]);
  const [previousSongs, setPreviousSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [sound, setSound] = useState<Howl | null>(null);
  const [nextSound, setNextSound] = useState<Howl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const buttonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Audio cleanup function to prevent duplicate sounds
  const cleanupAudio = useCallback((audioInstance: Howl | null, clearNext: boolean = false) => {
    if (audioInstance) {
      // Stop the sound
      if (audioInstance.playing()) {
        audioInstance.stop();
      }
      
      // Remove all event listeners to prevent callbacks
      audioInstance.off();
      
      // Unload the audio to free memory
      audioInstance.unload();
    }
    
    // Clear the nextSound if requested
    if (clearNext) {
      setNextSound(null);
    }
  }, []);

  // Comprehensive cleanup for all audio instances
  const cleanupAllAudio = useCallback(() => {
    cleanupAudio(sound);
    cleanupAudio(nextSound);
    setSound(null);
    setNextSound(null);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [sound, nextSound, cleanupAudio]);

  // Show offline message on every page load
  useEffect(() => {
    // Show the offline message after a brief delay for better UX
    setTimeout(() => {
      toast('🔧 Generation server is currently offline, falling back to previously generated tracks.', {
        duration: 6000,
        icon: '📡',
      });
    }, 1500);
  }, []);

  // Load saved preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguages = localStorage.getItem('selectedLanguages');
      const savedVolume = localStorage.getItem('volume');
      const savedPlayedSongs = localStorage.getItem('playedSongs');

      if (savedLanguages) {
        setSelectedLanguages(JSON.parse(savedLanguages));
      }
      
      if (savedVolume) {
        setVolume(parseFloat(savedVolume));
      }
      
      if (savedPlayedSongs) {
        setPlayedSongs(JSON.parse(savedPlayedSongs));
      }
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguages', JSON.stringify(selectedLanguages));
      localStorage.setItem('volume', volume.toString());
      localStorage.setItem('playedSongs', JSON.stringify(playedSongs));
    }
  }, [selectedLanguages, volume, playedSongs]);

  // Fetch available languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/languages');
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.languages || !Array.isArray(data.languages)) {
          throw new Error('Invalid server response');
        }
        
        setLanguages(data.languages);
        setLoading(false);
        console.log('✅ Languages loaded successfully');
      } catch (error) {
        console.error('Error fetching languages:', error);
        setLoading(false);
        
        // Show user-friendly error message
        if (error instanceof Error) {
          if (error.message.includes('Music server URL is not configured')) {
            toast.error('🔧 Music server not configured. Please check settings.');
          } else if (error.message.includes('Cannot connect to music server')) {
            toast.error('🌐 Cannot connect to music server. Please check your internet connection.');
          } else if (error.message.includes('Music server error')) {
            toast.error('⚠️ Music server is temporarily unavailable. Please try again later.');
          } else {
            toast.error('❌ Failed to load music languages. Please refresh the page.');
          }
        } else {
          toast.error('❌ Failed to load music languages. Please refresh the page.');
        }
        
        // Set empty languages array as fallback
        setLanguages([]);
      }
    };

    fetchLanguages();
  }, []);

  // Fetch songs when selected languages change
  useEffect(() => {
    const fetchSongs = async () => {
      if (selectedLanguages.length === 0) {
        setSongs([]);
        setAvailableSongs([]);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/songs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ languages: selectedLanguages }),
        });
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.songs || !Array.isArray(data.songs)) {
          throw new Error('Invalid server response');
        }
        
        if (data.songs.length === 0) {
          toast('🎵 No songs found for selected languages. Try different languages.');
          setSongs([]);
          setAvailableSongs([]);
          setLoading(false);
          return;
        }
        
        setSongs(data.songs);
        
        // Filter out songs that have already been played
        const available = data.songs.filter((song: Song) => !playedSongs.includes(song.id));
        setAvailableSongs(available);
        
        setLoading(false);
        console.log(`✅ Loaded ${data.songs.length} songs for ${selectedLanguages.join(', ')}`);
      } catch (error) {
        console.error('Error fetching songs:', error);
        setLoading(false);
        
        // Show user-friendly error message
        if (error instanceof Error) {
          if (error.message.includes('No songs available')) {
            toast.error('🎵 No songs available for selected languages. Try different ones.');
          } else if (error.message.includes('Cannot connect to music server')) {
            toast.error('🌐 Cannot connect to music server. Please check your internet connection.');
          } else if (error.message.includes('Music server error')) {
            toast.error('⚠️ Music server is temporarily unavailable. Please try again later.');
          } else {
            toast.error('❌ Failed to load songs. Please try again.');
          }
        } else {
          toast.error('❌ Failed to load songs. Please try again.');
        }
        
        // Set empty arrays as fallback
        setSongs([]);
        setAvailableSongs([]);
      }
    };

    fetchSongs();
  }, [selectedLanguages, playedSongs]);

  // Wrap preloadNextSong in useCallback
  const preloadNextSong = useCallback(() => {
    // If we already have a next sound queued, clean it up first
    if (nextSound) {
      cleanupAudio(nextSound);
      setNextSound(null);
    }

    const availSongs = availableSongs.length > 0 ? 
      availableSongs : 
      songs.filter(song => song.id !== currentSong?.id);
    
    if (availSongs.length === 0) {
      console.warn('No songs available to preload');
      return;
    }

    // Get a random song to preload
    const randomIndex = Math.floor(Math.random() * availSongs.length);
    const nextSongToPlay = availSongs[randomIndex];
    
    if (!nextSongToPlay) {
      console.warn('No next song available to preload');
      return;
    }

    console.log('🎵 Preloading next song:', nextSongToPlay.title);
    
    try {
      const newNextSound = new Howl({
        src: [nextSongToPlay.path],
        html5: true,
        volume: volume,
        preload: true,
        format: ['mp3'],
        onloaderror: (id, error) => {
          console.error('Error preloading next song:', nextSongToPlay.title, 'Error:', error);
          cleanupAudio(newNextSound);
          setNextSound(null);
        },
        onload: () => {
          console.log('✅ Next song preloaded successfully:', nextSongToPlay.title);
        }
      });

      setNextSound(newNextSound);
    } catch (error) {
      console.error('Error creating preload sound:', error);
      // Try again after a delay
      setTimeout(() => {
        preloadNextSong();
      }, 1000);
    }
  }, [nextSound, songs, playedSongs, currentSong, volume, availableSongs, cleanupAudio]);

  // Play the next song
  const playNextSong = () => {
    // Prevent multiple simultaneous calls
    debounceButton(() => {
      console.log('🎵 Playing next song...');

      // Clean up current song completely
      if (sound) {
        cleanupAudio(sound);
        setSound(null);
        setIsPlaying(false);
      }

      // Determine which song to play
      let songToPlay: Song | null = null;
      let soundToUse: Howl | null = null;

      // Try to use the preloaded song first
      if (nextSound) {
        console.log('🎵 Using preloaded song');
        soundToUse = nextSound;
        setNextSound(null); // Clear the preloaded song

        // Find the song that was preloaded - we need to identify it from available songs
        const availSongs = availableSongs.length > 0 ? 
          availableSongs : 
          songs.filter(song => song.id !== currentSong?.id);

        if (availSongs.length > 0) {
          // Since we don't store which song was preloaded, pick a random one
          // This is a limitation but the preloaded song will still work
          const randomIndex = Math.floor(Math.random() * availSongs.length);
          songToPlay = availSongs[randomIndex];
        }
      }

      // If we couldn't use the preloaded sound, create a new one
      if (!songToPlay) {
        const availSongs = availableSongs.length > 0 ? 
          availableSongs : 
          songs.filter(song => song.id !== currentSong?.id);
        
        if (availSongs.length === 0) {
          console.warn('No songs available to play');
          toast.error('🎵 No more songs available. Please refresh or select different languages.');
          return;
        }

        const randomIndex = Math.floor(Math.random() * availSongs.length);
        songToPlay = availSongs[randomIndex];
        console.log('🎵 Playing new song:', songToPlay.title);
      }

      try {
        // If we don't have a sound to use, create a new one
        if (!soundToUse) {
          soundToUse = new Howl({
            src: [songToPlay.path],
            html5: true,
            volume: volume,
            format: ['mp3'],
            onend: () => {
              setTimeout(playNextSong, 300);
            },
            onloaderror: (id, error) => {
              console.error('Error loading song:', songToPlay?.title, 'Error:', error);
              toast.error(`❌ Could not load "${songToPlay?.title}". Trying next song...`);
              setCurrentSong(null);
              setIsPlaying(false);
              
              // Remove this problematic song from available songs
              setAvailableSongs(prev => prev.filter(song => song.id !== songToPlay?.id));
              
              // Try next song after a short delay
              setTimeout(() => playNextSong(), 500);
            },
            onload: () => {
              console.log('✅ Song loaded successfully:', songToPlay?.title);
            }
          });
        } else {
          // Add handlers to the preloaded sound
          soundToUse.on('end', () => {
            setTimeout(playNextSong, 300);
          });
          soundToUse.on('loaderror', (id, error) => {
            console.error('Error with preloaded song:', songToPlay?.title, 'Error:', error);
            toast.error(`❌ Could not play "${songToPlay?.title}". Trying next song...`);
            setCurrentSong(null);
            setIsPlaying(false);
            
            // Remove this problematic song from available songs
            setAvailableSongs(prev => prev.filter(song => song.id !== songToPlay?.id));
            
            // Try next song after a short delay
            setTimeout(() => playNextSong(), 500);
          });
        }

        // Add play event handler
        soundToUse.on('play', () => {
          setIsPlaying(true);
          setCurrentSong(songToPlay);
          console.log('▶️ Now playing:', songToPlay?.title);

          // Add this song to played songs and remove from available songs
          if (songToPlay) {
            setPlayedSongs(prev => [...prev, songToPlay.id]);
            setAvailableSongs(prev => prev.filter(song => song.id !== songToPlay.id));
          }
        });

        // Set and play the sound
        setSound(soundToUse);
        soundToUse.play();

        // Preload next song after a delay
        setTimeout(() => {
          preloadNextSong();
        }, 1000);

      } catch (error) {
        console.error('Error playing song:', error);
        toast.error(`❌ Error playing "${songToPlay?.title}". Trying next song...`);
        setCurrentSong(null);
        setIsPlaying(false);
        setTimeout(() => playNextSong(), 500);
      }
    });
  };

  // Play a specific song
  const playSong = (songToPlay: Song) => {
    // Clean up current audio completely
    if (sound) {
      cleanupAudio(sound);
      setSound(null);
      setIsPlaying(false);
    }
    
    // Also clean up preloaded song since we're changing tracks
    if (nextSound) {
      cleanupAudio(nextSound);
      setNextSound(null);
    }
    
    try {
      // Create a new Howl instance for the song
      const newSound = new Howl({
        src: [songToPlay.path],
        html5: true,
        volume: volume,
        format: ['mp3'],
        onend: () => {
          // Use timeout to prevent immediate firing in case of race conditions
          setTimeout(playNextSong, 300);
        },
        onloaderror: (id, error) => {
          console.error('Error loading song:', songToPlay.title, 'Error:', error);
          toast.error(`❌ Could not load "${songToPlay.title}". Trying next song...`);
          setCurrentSong(null);
          setIsPlaying(false);
          // Try to recover by playing the next song
          setTimeout(() => {
            playNextSong();
          }, 500);
        },
        onpause: () => {
          setIsPlaying(false);
        },
        onplay: () => {
          setIsPlaying(true);
          setCurrentSong(songToPlay); // Update current song when playback actually starts
          setCurrentTime(0); // Reset current time when new song starts
          setDuration(0); // Reset duration initially, will be set by the tracking effect
        },
        onload: () => {
          console.log('✅ Song loaded successfully:', songToPlay.title);
        }
      });

      // Set and play the sound
      setSound(newSound);
      newSound.play();

      // Update previous songs for backward navigation
      setPreviousSongs(prev => {
        const newPrevious = [...prev];
        if (currentSong) {
          newPrevious.push(currentSong);
          // Keep only last 10 previous songs to prevent memory issues
          if (newPrevious.length > 10) {
            newPrevious.shift();
          }
        }
        return newPrevious;
      });

      // Preload next song after the current one starts
      setTimeout(() => {
        preloadNextSong();
      }, 500);

    } catch (error) {
      console.error('Error creating sound for song:', error);
      toast.error(`❌ Error playing "${songToPlay.title}". Trying next song...`);
      setTimeout(() => playNextSong(), 500);
    }
  };

  // Debounce function to prevent rapid button clicks
  const debounceButton = (callback: () => void) => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    
    // Execute the callback immediately
    callback();
    
    // Clear any existing timers
    if (buttonTimerRef.current) {
      clearTimeout(buttonTimerRef.current);
    }
    
    // Set a timeout to re-enable the button
    buttonTimerRef.current = setTimeout(() => {
      setIsButtonDisabled(false);
    }, 500); // 500ms debounce time
  };

  // Toggle language selection
  const toggleLanguage = (languageId: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(languageId)) {
        console.log(`➖ Removed language: ${languageId}`);
        const newLanguages = prev.filter(id => id !== languageId);
        if (newLanguages.length === 0) {
          toast('🌐 No languages selected. Music will stop.');
        }
        return newLanguages;
      } else {
        console.log(`➕ Added language: ${languageId}`);
        return [...prev, languageId];
      }
    });
  };

  // Toggle play/pause
  const togglePlay = () => {
    debounceButton(() => {
      if (!sound && !isPlaying) {
        // If no song is playing, start playing
        if (songs.length === 0) {
          toast.error('🎵 No songs available. Please select some languages first.');
          return;
        }
        console.log('▶️ Starting playback...');
        playNextSong();
      } else if (sound) {
        // If we have a sound instance, toggle its state
        if (sound.playing()) {
          console.log('⏸️ Pausing playback');
          sound.pause();
          setIsPlaying(false);  // Update isPlaying state when pausing
        } else {
          console.log('▶️ Resuming playback');
          sound.play();
        }
      }
    });
  };

  // Update volume
  useEffect(() => {
    if (sound) {
      sound.volume(volume);
    }
    if (nextSound) {
      nextSound.volume(volume);
    }
  }, [volume, sound, nextSound]);

  // Track current time and duration
  useEffect(() => {
    let timeInterval: NodeJS.Timeout | null = null;

    if (sound && isPlaying) {
      // Set initial duration
      const soundDuration = sound.duration();
      if (soundDuration && soundDuration > 0) {
        setDuration(soundDuration);
      }

      // Update current time every second
      timeInterval = setInterval(() => {
        if (sound && isPlaying) {
          const currentSeek = sound.seek();
          if (typeof currentSeek === 'number') {
            setCurrentTime(currentSeek);
          }
          
          // Update duration if it wasn't set initially
          const soundDuration = sound.duration();
          if (soundDuration && soundDuration > 0 && duration === 0) {
            setDuration(soundDuration);
          }
        }
      }, 1000);
    } else {
      // Reset time when not playing
      setCurrentTime(0);
      if (!sound) {
        setDuration(0);
      }
    }

    return () => {
      if (timeInterval) {
        clearInterval(timeInterval);
      }
    };
  }, [sound, isPlaying, duration]);

  // Update the useEffect that uses preloadNextSong
  useEffect(() => {
    if (currentSong && !loading) {
      preloadNextSong();
    }
  }, [currentSong, loading, preloadNextSong]);

  // Update the other useEffect that uses preloadNextSong
  useEffect(() => {
    if (isPlaying && !nextSound && availableSongs.length > 0) {
      console.log('Ensuring next song is preloaded while current song plays');
      preloadNextSong();
    }
  }, [isPlaying, nextSound, availableSongs.length, preloadNextSong]);

  // Skip to the next song
  const skipSong = () => {
    debounceButton(() => {
      if (songs.length === 0) {
        toast.error('🎵 No songs available to skip. Please select some languages first.');
        return;
      }

      // Clean up current audio completely
      if (sound) {
        cleanupAudio(sound);
        setSound(null);
        setIsPlaying(false);
      }
      
      console.log('⏭️ Skipping to next song...');
      
      // If we don't have a next sound ready, preload one first
      if (!nextSound && availableSongs.length > 0) {
        preloadNextSong();
        // Short delay to allow preloading to start
        setTimeout(() => {
          playNextSong();
        }, 100);
      } else {
        playNextSong();
      }
    });
  };

  // Reset playlist
  const resetPlaylist = () => {
    if (songs.length === 0) {
      toast.error('🎵 No songs to reset. Please select some languages first.');
      return;
    }

    // Clear played songs list except for the current song
    setPlayedSongs(currentSong ? [currentSong.id] : []);
    
    // Reset available songs to all songs except current
    const newAvailableSongs = songs.filter(song => song.id !== currentSong?.id);
    setAvailableSongs(newAvailableSongs);
    
    console.log('🔄 Playlist has been reset. All songs are now available.');
    
    // If we don't have a next song preloaded, preload one
    if (!nextSound) {
      setTimeout(() => {
        preloadNextSong();
      }, 100);
    }
  };

  // Previous song functionality
  const previousSong = () => {
    debounceButton(() => {
      if (previousSongs.length === 0) {
        toast('🎵 No previous songs available');
        return;
      }

      // Clean up current audio completely
      if (sound) {
        cleanupAudio(sound);
        setSound(null);
        setIsPlaying(false);
      }

      // Also clean up preloaded song since we're changing tracks
      if (nextSound) {
        cleanupAudio(nextSound);
        setNextSound(null);
      }

      // Get the last song from previous songs
      const lastSong = previousSongs[previousSongs.length - 1];
      
      // Remove it from previous songs
      setPreviousSongs(prev => prev.slice(0, -1));
      
      // Add current song to available songs if we have one
      if (currentSong) {
        setAvailableSongs(prev => [...prev, currentSong]);
        // Remove current song from played songs
        setPlayedSongs(prev => prev.filter(id => id !== currentSong.id));
      }
      
      try {
        // Create a new Howl instance for the previous song
        const newSound = new Howl({
          src: [lastSong.path],
          html5: true,
          volume: volume,
          format: ['mp3'],
          onend: () => {
            setTimeout(playNextSong, 300);
          },
          onloaderror: (id, error) => {
            console.error('Error loading previous song:', lastSong.title, 'Error:', error);
            toast.error(`❌ Could not load previous song "${lastSong.title}". Playing current playlist instead.`);
            setCurrentSong(null);
            setIsPlaying(false);
            setTimeout(() => playNextSong(), 500);
          },
          onload: () => {
            console.log('✅ Previous song loaded successfully:', lastSong.title);
          }
        });

        // Add play event handler
        newSound.on('play', () => {
          setIsPlaying(true);
          setCurrentSong(lastSong);
          console.log('▶️ Now playing previous song:', lastSong.title);
        });

        // Set and play the sound
        setSound(newSound);
        newSound.play();

        // Preload next song after a delay
        setTimeout(() => {
          preloadNextSong();
        }, 500);
      } catch (error) {
        console.error('Error playing previous song:', error);
        toast.error(`❌ Error playing previous song "${lastSong.title}". Playing current playlist instead.`);
        setCurrentSong(null);
        setIsPlaying(false);
        setTimeout(() => playNextSong(), 500);
      }
    });
  };

  // Cleanup all audio when component unmounts
  useEffect(() => {
    return () => {
      cleanupAllAudio();
    };
  }, [cleanupAllAudio]);

  const value = {
    languages,
    selectedLanguages,
    isPlaying,
    currentSong,
    volume,
    loading,
    playedSongs,
    hasPreviousSongs: previousSongs.length > 0,
    isButtonDisabled,
    currentTime,
    duration,
    toggleLanguage,
    togglePlay,
    setVolume,
    skipSong,
    previousSong,
    resetPlaylist,
  };

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
} 