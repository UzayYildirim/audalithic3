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

// Helper function to save current playback position
const savePlaybackPosition = (sound: Howl | null) => {
  if (sound && typeof window !== 'undefined') {
    const position = sound.seek();
    if (typeof position === 'number' && position > 0) {
      localStorage.setItem('audioPosition', position.toString());
      localStorage.setItem('audioPositionTimestamp', Date.now().toString());
    }
  }
};

// Helper function to save current song state
const saveCurrentSongState = (song: Song | null, isPlaying: boolean) => {
  if (typeof window !== 'undefined') {
    if (song) {
      localStorage.setItem('currentSong', JSON.stringify(song));
      localStorage.setItem('wasPlaying', isPlaying.toString());
    } else {
      localStorage.removeItem('currentSong');
      localStorage.removeItem('wasPlaying');
      localStorage.removeItem('audioPosition');
      localStorage.removeItem('audioPositionTimestamp');
    }
  }
};

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
  const [volume, setVolume] = useState(0.7);
  const [loading, setLoading] = useState(true);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [shouldRestoreAudio, setShouldRestoreAudio] = useState(false);
  const buttonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const positionSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Show offline message when user first visits
  useEffect(() => {
    // Check if this is the first visit by checking localStorage
    const hasVisited = localStorage.getItem('audalithic-visited');
    if (!hasVisited) {
      // Show the offline message after a brief delay for better UX
      setTimeout(() => {
        toast('🔧 Generation server is currently offline, falling back to previously generated tracks.', {
          duration: 6000,
          icon: '📡',
        });
      }, 1500);
      localStorage.setItem('audalithic-visited', 'true');
    }
  }, []);

  // Time tracking effect - update current time every second when playing
  useEffect(() => {
    if (isPlaying && sound && currentSong) {
      // Update time every second
      timeUpdateInterval.current = setInterval(() => {
        if (sound && sound.playing()) {
          const current = sound.seek();
          if (typeof current === 'number') {
            setCurrentTime(current);
          }
        }
      }, 1000);

      return () => {
        if (timeUpdateInterval.current) {
          clearInterval(timeUpdateInterval.current);
        }
      };
    } else {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
      
      // Reset time when not playing
      if (!isPlaying && !currentSong) {
        setCurrentTime(0);
        setDuration(0);
      }
    }
  }, [isPlaying, sound, currentSong]);

  // Reset time when current song changes (but not during restoration)
  useEffect(() => {
    if (currentSong) {
      // Don't reset time if we're restoring audio state
      if (!shouldRestoreAudio) {
        setCurrentTime(0);
      }
      // Duration will be set when the sound loads
    } else {
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentSong, shouldRestoreAudio]);

  // Load saved preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguages = localStorage.getItem('selectedLanguages');
      const savedVolume = localStorage.getItem('volume');
      const savedPlayedSongs = localStorage.getItem('playedSongs');
      const savedCurrentSong = localStorage.getItem('currentSong');
      const wasPlaying = localStorage.getItem('wasPlaying');

      if (savedLanguages) {
        setSelectedLanguages(JSON.parse(savedLanguages));
      }
      
      if (savedVolume) {
        setVolume(parseFloat(savedVolume));
      }
      
      if (savedPlayedSongs) {
        setPlayedSongs(JSON.parse(savedPlayedSongs));
      }

      // Check if we should restore audio state (whether it was playing or paused)
      if (savedCurrentSong) {
        try {
          const song = JSON.parse(savedCurrentSong);
          
          // Check if the save is recent (within last 24 hours)
          const savedTimestamp = localStorage.getItem('audioPositionTimestamp');
          const now = Date.now();
          const dayInMs = 24 * 60 * 60 * 1000;
          
          if (!savedTimestamp || (now - parseInt(savedTimestamp)) < dayInMs) {
            setCurrentSong(song);
            setShouldRestoreAudio(true);
            console.log('🔄 Preparing to restore audio state:', song.title, 'wasPlaying:', wasPlaying);
            
            // Ensure the saved song's language is selected so it can be found
            if (song.language && !selectedLanguages.includes(song.language)) {
              console.log('🔄 Adding saved song language to selection:', song.language);
              setSelectedLanguages(prev => [...prev, song.language]);
            }
          } else {
            // Clear old saved state
            console.log('🗑️ Clearing old saved state (older than 24 hours)');
            localStorage.removeItem('currentSong');
            localStorage.removeItem('wasPlaying');
            localStorage.removeItem('audioPosition');
            localStorage.removeItem('audioPositionTimestamp');
          }
        } catch (error) {
          console.error('Error restoring saved song state:', error);
          // Clear corrupted data
          localStorage.removeItem('currentSong');
          localStorage.removeItem('wasPlaying');
          localStorage.removeItem('audioPosition');
          localStorage.removeItem('audioPositionTimestamp');
        }
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

  // Save current song state whenever it changes
  useEffect(() => {
    saveCurrentSongState(currentSong, isPlaying);
  }, [currentSong, isPlaying]);

  // Save audio position periodically when playing
  useEffect(() => {
    if (isPlaying && sound && currentSong) {
      // Save position every 5 seconds while playing
      positionSaveInterval.current = setInterval(() => {
        savePlaybackPosition(sound);
      }, 5000);

      // Also save when visibility changes (user switching tabs/minimizing)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          savePlaybackPosition(sound);
        }
      };

      // Save on beforeunload (page refresh/close)
      const handleBeforeUnload = () => {
        savePlaybackPosition(sound);
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        if (positionSaveInterval.current) {
          clearInterval(positionSaveInterval.current);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    } else {
      if (positionSaveInterval.current) {
        clearInterval(positionSaveInterval.current);
      }
    }
  }, [isPlaying, sound, currentSong]);

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

  // Preload next song function
  const preloadNextSong = useCallback(() => {
    // If we already have a next sound queued, don't try to preload another
    if (nextSound) {
      return;
    }

    // If we have no songs at all, don't try to preload
    if (songs.length === 0) {
      console.warn('No songs in playlist');
      return;
    }

    // Check if we've played all songs
    const unplayedSongs = songs.filter(song => 
      !playedSongs.includes(song.id) && song.id !== currentSong?.id
    );
    
    // Determine songs to pick from
    let songsToPickFrom;
    
    if (unplayedSongs.length > 0) {
      // We have unplayed songs, use them
      songsToPickFrom = unplayedSongs;
    } else if (availableSongs.length > 0) {
      // No unplayed songs but we have available songs
      songsToPickFrom = availableSongs;
    } else {
      // Reset the playlist if all songs have been played
      console.log('All songs have been played, resetting available songs for preloading');
      
      // Reset available songs to all songs except current
      const newAvailableSongs = songs.filter(song => song.id !== currentSong?.id);
      setAvailableSongs(newAvailableSongs);
      
      // Only keep current song in played list
      setPlayedSongs(currentSong ? [currentSong.id] : []);
      
      // Use new available songs
      songsToPickFrom = newAvailableSongs;
    }
    
    // If we have no songs to pick from even after resetting (very unlikely)
    if (songsToPickFrom.length === 0) {
      console.warn('No songs available for preloading');
      return;
    }
    
    // Select a random song
    const randomIndex = Math.floor(Math.random() * songsToPickFrom.length);
    const nextSongToPlay = songsToPickFrom[randomIndex];
    
    try {
      const newNextSound = new Howl({
        src: [nextSongToPlay.path],
        html5: true,
        preload: true,
        volume: volume,
        format: ['mp3'],
        onend: () => {
          setTimeout(() => {
            playNextSong();
          }, 300);
        },
        onloaderror: (id, error) => {
          console.error('Error preloading next song:', nextSongToPlay.title, error);
          setNextSound(null);
          
          // Don't show toast for preload errors to avoid spam, just log
          console.warn('⚠️ Could not preload next song, will try another when needed');
          
          // Try again with a different song after a delay
          setTimeout(() => {
            preloadNextSong();
          }, 1000);
        },
        onload: () => {
          console.log('✅ Next song preloaded:', nextSongToPlay.title);
        }
      });
      setNextSound(newNextSound);
    } catch (error) {
      console.error('Error creating Howl instance for preload:', error);
      setNextSound(null);
      
      // Try again after a delay
      setTimeout(() => {
        preloadNextSong();
      }, 1000);
    }
  }, [nextSound, songs, playedSongs, currentSong, volume, availableSongs]);

  // Play the next song function
  const playNextSong = useCallback(() => {
    // If we have no songs at all, don't try to play
    if (songs.length === 0) {
      console.warn('No songs available in the playlist');
      toast.error('🎵 No songs available. Please select some languages first.');
      return;
    }

    // If there is already a sound playing, stop it and clean up listeners
    if (sound) {
      sound.stop();
      sound.unload(); // Completely unload the sound to ensure it doesn't interfere
      setSound(null); // Clear the sound reference
      setIsPlaying(false); // Ensure playing state is reset
    }

    // Check if we've played all songs and need to reset
    if (playedSongs.length >= songs.length - 1) {
      console.log('All songs have been played, resetting playlist');
      // Keep only current song in played songs list
      setPlayedSongs(currentSong ? [currentSong.id] : []);
      // Reset available songs to all songs except current
      setAvailableSongs(songs.filter(song => song.id !== currentSong?.id));
    }

    let songToPlay: Song | null = null;
    let soundToUse: Howl | null = null;

    // First try to use the preloaded next sound if available
    if (nextSound) {
      // Get the source URL from the next sound
      const nextSoundSrc = (nextSound as any)._src?.[0] || '';
      
      // Find the corresponding song
      songToPlay = availableSongs.find(song => 
        song.path === nextSoundSrc
      ) || null;

      if (songToPlay) {
        soundToUse = nextSound;
        setNextSound(null); // Clear the next sound as we're using it
        console.log('✅ Using preloaded song:', songToPlay.title);
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
            setTimeout(() => {
              playNextSong();
            }, 300);
          },
          onloaderror: (id, error) => {
            console.error('Error loading song:', songToPlay?.title, error);
            toast.error(`❌ Could not load "${songToPlay?.title}". Trying next song...`);
            setCurrentSong(null);
            setIsPlaying(false);
            
            // Remove this problematic song from available songs
            setAvailableSongs(prev => prev.filter(song => song.id !== songToPlay?.id));
            
            // Try next song after a short delay
            setTimeout(() => {
              playNextSong();
            }, 500);
          },
          onload: () => {
            console.log('✅ Song loaded successfully:', songToPlay?.title);
            // Set duration with retry mechanism
            const setDurationWithRetry = (attempt = 0) => {
              const soundDuration = soundToUse?.duration();
              if (typeof soundDuration === 'number' && soundDuration > 0) {
                setDuration(soundDuration);
                console.log(`🎵 Duration set: ${soundDuration.toFixed(2)}s`);
              } else if (attempt < 3) {
                // Retry up to 3 times for regular playback
                setTimeout(() => setDurationWithRetry(attempt + 1), 200 * (attempt + 1));
              }
            };
            setDurationWithRetry();
          },
          onplay: () => {
            // Update current time when playing starts
            const current = soundToUse?.seek();
            if (typeof current === 'number') {
              setCurrentTime(current);
            }
          },
          onpause: () => {
            // Update current time when paused
            const current = soundToUse?.seek();
            if (typeof current === 'number') {
              setCurrentTime(current);
            }
          }
        });
      }

      // Add play event handler
      soundToUse.on('play', () => {
        setIsPlaying(true);
        setCurrentSong(songToPlay);
        console.log('▶️ Now playing:', songToPlay?.title);
        
        // Set duration if not already set
        const soundDuration = soundToUse?.duration();
        if (typeof soundDuration === 'number' && soundDuration > 0) {
          setDuration(soundDuration);
        }
        
        // Update current time
        const current = soundToUse?.seek();
        if (typeof current === 'number') {
          setCurrentTime(current);
        }
      });

      // Update the current song in previous songs list
      if (currentSong) {
        setPreviousSongs(prev => [...prev, currentSong]);
      }
      
      // Update played and available songs
      setPlayedSongs(prev => [...prev, songToPlay!.id]);
      setAvailableSongs(prev => prev.filter(song => song.id !== songToPlay!.id));
      
      // Set and play the sound
      setSound(soundToUse);
      soundToUse.play();
      
      // Preload next song after a delay
      setTimeout(() => {
        if (!nextSound) {
          preloadNextSong();
        }
      }, 500);
    } catch (error) {
      console.error('Error playing song:', error);
      toast.error(`❌ Error playing "${songToPlay?.title}". Trying next song...`);
      setCurrentSong(null);
      setIsPlaying(false);
      
      // Remove this problematic song from available songs
      setAvailableSongs(prev => prev.filter(song => song.id !== songToPlay?.id));
      
      setTimeout(() => {
        playNextSong();
      }, 500);
    }
  }, [songs, sound, playedSongs, currentSong, availableSongs, nextSound, volume, preloadNextSong]);

  // Update preloadNextSong dependencies to include playNextSong properly
  const preloadNextSongUpdated = useCallback(() => {
    // If we already have a next sound queued, don't try to preload another
    if (nextSound) {
      return;
    }

    // If we have no songs at all, don't try to preload
    if (songs.length === 0) {
      console.warn('No songs in playlist');
      return;
    }

    // Check if we've played all songs
    const unplayedSongs = songs.filter(song => 
      !playedSongs.includes(song.id) && song.id !== currentSong?.id
    );
    
    // Determine songs to pick from
    let songsToPickFrom;
    
    if (unplayedSongs.length > 0) {
      // We have unplayed songs, use them
      songsToPickFrom = unplayedSongs;
    } else if (availableSongs.length > 0) {
      // No unplayed songs but we have available songs
      songsToPickFrom = availableSongs;
    } else {
      // Reset the playlist if all songs have been played
      console.log('All songs have been played, resetting available songs for preloading');
      
      // Reset available songs to all songs except current
      const newAvailableSongs = songs.filter(song => song.id !== currentSong?.id);
      setAvailableSongs(newAvailableSongs);
      
      // Only keep current song in played list
      setPlayedSongs(currentSong ? [currentSong.id] : []);
      
      // Use new available songs
      songsToPickFrom = newAvailableSongs;
    }
    
    // If we have no songs to pick from even after resetting (very unlikely)
    if (songsToPickFrom.length === 0) {
      console.warn('No songs available for preloading');
      return;
    }
    
    // Select a random song
    const randomIndex = Math.floor(Math.random() * songsToPickFrom.length);
    const nextSongToPlay = songsToPickFrom[randomIndex];
    
    try {
      const newNextSound = new Howl({
        src: [nextSongToPlay.path],
        html5: true,
        preload: true,
        volume: volume,
        format: ['mp3'],
        onend: () => {
          // Now we can safely call playNextSong
          setTimeout(playNextSong, 300);
        },
        onloaderror: (id, error) => {
          console.error('Error preloading next song:', nextSongToPlay.title, error);
          setNextSound(null);
          
          // Don't show toast for preload errors to avoid spam, just log
          console.warn('⚠️ Could not preload next song, will try another when needed');
          
          // Try again with a different song after a delay
          setTimeout(() => {
            preloadNextSongUpdated();
          }, 1000);
        },
        onload: () => {
          console.log('✅ Next song preloaded:', nextSongToPlay.title);
        }
      });
      setNextSound(newNextSound);
    } catch (error) {
      console.error('Error creating Howl instance for preload:', error);
      setNextSound(null);
      
      // Try again after a delay
      setTimeout(() => {
        preloadNextSongUpdated();
      }, 1000);
    }
  }, [nextSound, songs, playedSongs, currentSong, volume, availableSongs, playNextSong]);

  // Remove the old effect that was causing issues
  // Update the useEffect that uses preloadNextSongUpdated
  useEffect(() => {
    if (currentSong && !loading) {
      preloadNextSongUpdated();
    }
  }, [currentSong, loading, preloadNextSongUpdated]);

  // Update the other useEffect that uses preloadNextSongUpdated
  useEffect(() => {
    if (isPlaying && !nextSound && availableSongs.length > 0) {
      console.log('Ensuring next song is preloaded while current song plays');
      preloadNextSongUpdated();
    }
  }, [isPlaying, nextSound, availableSongs.length, preloadNextSongUpdated]);

  // Audio restoration effect - restore audio when songs are loaded and we have a saved state
  useEffect(() => {
    if (shouldRestoreAudio && currentSong && songs.length > 0 && !loading) {
      const restoreAudio = async () => {
        try {
          // Check if the saved song still exists in the current song list
          const songExists = songs.some(song => song.id === currentSong.id);
          
          if (!songExists) {
            console.log('🔄 Saved song no longer available in current languages');
            setShouldRestoreAudio(false);
            setCurrentSong(null);
            // Clear saved state
            localStorage.removeItem('currentSong');
            localStorage.removeItem('wasPlaying');
            localStorage.removeItem('audioPosition');
            localStorage.removeItem('audioPositionTimestamp');
            return;
          }

          const savedPosition = localStorage.getItem('audioPosition');
          const wasPlayingStr = localStorage.getItem('wasPlaying');
          const wasPlaying = wasPlayingStr === 'true';

          console.log('🔄 Restoring audio state for:', currentSong.title);

          // Create Howl instance for the saved song
          const restoredSound = new Howl({
            src: [currentSong.path],
            html5: true,
            volume: volume,
            format: ['mp3'],
            onend: () => {
              setTimeout(playNextSong, 300);
            },
            onloaderror: (id, error) => {
              console.error('Error loading restored song:', currentSong.title, error);
              toast.error(`❌ Could not restore "${currentSong.title}". Starting fresh.`);
              setShouldRestoreAudio(false);
              setCurrentSong(null);
              setIsPlaying(false);
              
              // Clear saved state
              localStorage.removeItem('currentSong');
              localStorage.removeItem('wasPlaying');
              localStorage.removeItem('audioPosition');
              localStorage.removeItem('audioPositionTimestamp');
            },
            onload: () => {
              console.log('✅ Restored song loaded successfully:', currentSong.title);
              
              // Set duration with retry mechanism
              const setDurationWithRetry = (attempt = 0) => {
                const soundDuration = restoredSound?.duration();
                console.log(`🔄 Duration attempt ${attempt + 1}:`, soundDuration);
                
                if (typeof soundDuration === 'number' && soundDuration > 0) {
                  setDuration(soundDuration);
                  console.log(`🔄 Duration set: ${soundDuration.toFixed(2)}s`);
                } else if (attempt < 5) {
                  // Retry up to 5 times with increasing delay
                  setTimeout(() => setDurationWithRetry(attempt + 1), 200 * (attempt + 1));
                } else {
                  console.warn('🔄 Could not get duration after 5 attempts');
                }
              };
              
              // Start duration setting process
              setDurationWithRetry();
              
              // Restore position if available
              if (savedPosition && parseFloat(savedPosition) > 0) {
                const position = parseFloat(savedPosition);
                // Get current duration for validation
                const currentDuration = restoredSound?.duration() || 0;
                const validPosition = currentDuration > 0 ? Math.min(position, currentDuration) : position;
                
                // Delay seeking to ensure audio is ready
                setTimeout(() => {
                  restoredSound.seek(validPosition);
                  setCurrentTime(validPosition);
                  console.log(`🔄 Restored position: ${validPosition.toFixed(2)}s`);
                }, 300);
              } else {
                setCurrentTime(0);
              }

              // Restore playing state
              if (wasPlaying) {
                // Delay play to ensure everything is set up
                setTimeout(() => {
                  restoredSound.play();
                  setIsPlaying(true);
                  console.log('▶️ Resumed playback from saved state');
                  toast.success(`🔄 Resumed "${currentSong.title}" from where you left off`, {
                    duration: 3000,
                  });
                }, 400);
              } else {
                setIsPlaying(false);
                console.log('⏸️ Restored in paused state');
                toast.success(`🔄 Restored "${currentSong.title}" (paused)`, {
                  duration: 3000,
                });
              }

              // Mark restoration as complete after a small delay to ensure timing is correct
              setTimeout(() => {
                setShouldRestoreAudio(false);
                console.log('🔄 Audio restoration completed');
              }, 600);
            },
            onplay: () => {
              setIsPlaying(true);
              console.log('🔄 Restoration - audio playing');
              // Update current time when playing
              const current = restoredSound?.seek();
              if (typeof current === 'number') {
                setCurrentTime(current);
              }
            },
            onpause: () => {
              setIsPlaying(false);
              console.log('🔄 Restoration - audio paused');
              // Update current time when paused
              const current = restoredSound?.seek();
              if (typeof current === 'number') {
                setCurrentTime(current);
              }
            }
          });

          setSound(restoredSound);

          // Preload next song after restoration
          setTimeout(() => {
            if (!nextSound) {
              preloadNextSong();
            }
          }, 1000);
          
        } catch (error) {
          console.error('Error during audio restoration:', error);
          setShouldRestoreAudio(false);
          setCurrentSong(null);
          setIsPlaying(false);
          
          // Clear corrupted saved state
          localStorage.removeItem('currentSong');
          localStorage.removeItem('wasPlaying');
          localStorage.removeItem('audioPosition');
          localStorage.removeItem('audioPositionTimestamp');
          
          toast.error('❌ Could not restore previous session. Starting fresh.');
        }
      };

      // Small delay to ensure everything is properly initialized
      setTimeout(restoreAudio, 500);
    }
  }, [shouldRestoreAudio, currentSong, songs, loading, volume, preloadNextSong, nextSound, playNextSong]);

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
        // If we're in restoration mode, don't start a new random song
        if (shouldRestoreAudio) {
          console.log('⏸️ Restoration in progress, waiting for audio to restore...');
          toast('🔄 Restoring your previous session...', { duration: 2000 });
          return;
        }
        
        // If we have a current song but no sound (restoration might have failed), play the current song
        if (currentSong && songs.length > 0) {
          console.log('▶️ Playing current song:', currentSong.title);
          playSong(currentSong);
          return;
        }
        
        // If no current song and no songs available, show error
        if (songs.length === 0) {
          toast.error('🎵 No songs available. Please select some languages first.');
          return;
        }
        
        // Only start a new random song if there's no current song
        console.log('▶️ Starting playback...');
        playNextSong();
      } else if (sound) {
        // If we have a sound instance, toggle its state
        if (sound.playing()) {
          console.log('⏸️ Pausing playback');
          sound.pause();
          setIsPlaying(false);  // Update isPlaying state when pausing
          
          // Update current time when pausing
          const current = sound.seek();
          if (typeof current === 'number') {
            setCurrentTime(current);
          }
        } else {
          console.log('▶️ Resuming playback');
          sound.play();
          // isPlaying will be updated by the onplay event handler
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

  // Skip to the next song
  const skipSong = () => {
    debounceButton(() => {
      if (songs.length === 0) {
        toast.error('🎵 No songs available to skip. Please select some languages first.');
        return;
      }

      if (sound) {
        sound.off('end'); // Remove the event listener to avoid duplicate calls
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
        toast('🎵 No previous songs available.');
        return;
      }
      
      console.log('⏮️ Going to previous song...');
      
      // Get the last song from previous songs
      const lastSong = previousSongs[previousSongs.length - 1];
      
      // Remove it from previous songs
      setPreviousSongs(prev => prev.slice(0, -1));
      
      // If there is a current song, add it back to available songs
      if (currentSong) {
        setAvailableSongs(prev => [currentSong, ...prev]);
        setPlayedSongs(prev => prev.filter(id => id !== currentSong.id));
      }
      
      // If there is already a sound playing, stop it and remove listeners
      if (sound) {
        sound.off(); // Remove all event listeners
        sound.stop();
        sound.unload(); // Completely unload the sound to ensure it doesn't interfere
        setSound(null); // Clear the sound reference to prevent it from continuing to play
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
            console.error('Error loading previous song:', lastSong.title, error);
            toast.error(`❌ Could not load previous song "${lastSong.title}". Playing current playlist instead.`);
            setCurrentSong(null);
            setIsPlaying(false);
            setTimeout(() => playNextSong(), 500);
          },
          onload: () => {
            console.log('✅ Previous song loaded successfully:', lastSong.title);
            // Set duration with retry mechanism
            const setDurationWithRetry = (attempt = 0) => {
              const soundDuration = newSound?.duration();
              if (typeof soundDuration === 'number' && soundDuration > 0) {
                setDuration(soundDuration);
                console.log(`🎵 Duration set: ${soundDuration.toFixed(2)}s`);
              } else if (attempt < 3) {
                // Retry up to 3 times for regular playback
                setTimeout(() => setDurationWithRetry(attempt + 1), 200 * (attempt + 1));
              }
            };
            setDurationWithRetry();
          },
          onpause: () => {
            setIsPlaying(false);
            // Update current time when paused
            const current = newSound?.seek();
            if (typeof current === 'number') {
              setCurrentTime(current);
            }
          }
        });

        // Add play event handler
        newSound.on('play', () => {
          setIsPlaying(true);
          setCurrentSong(lastSong);
          console.log('▶️ Now playing previous song:', lastSong.title);
          
          // Set duration if not already set
          const soundDuration = newSound?.duration();
          if (typeof soundDuration === 'number' && soundDuration > 0) {
            setDuration(soundDuration);
          }
          
          // Update current time
          const current = newSound?.seek();
          if (typeof current === 'number') {
            setCurrentTime(current);
          }
        });

        // Set and play the sound
        setSound(newSound);
        newSound.play();

        // Preload next song after a delay
        setTimeout(() => {
          if (!nextSound) {
            preloadNextSong();
          }
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

  // Play a specific song
  const playSong = useCallback((songToPlay: Song) => {
    // If there is already a sound playing, stop and unload it
    if (sound) {
      sound.stop();
      sound.unload(); // Completely unload the sound to ensure it doesn't interfere
      setSound(null); // Clear sound reference
      setIsPlaying(false); // Ensure playing state is reset
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
        onloaderror: () => {
          console.error('Error loading song:', songToPlay.title);
          setCurrentSong(null);
          setIsPlaying(false);
          // Try to recover by playing the next song
          setTimeout(() => {
            playNextSong();
          }, 500);
        },
        onload: () => {
          console.log('✅ Song loaded successfully:', songToPlay.title);
          // Set duration with retry mechanism
          const setDurationWithRetry = (attempt = 0) => {
            const soundDuration = newSound?.duration();
            if (typeof soundDuration === 'number' && soundDuration > 0) {
              setDuration(soundDuration);
              console.log(`🎵 Duration set: ${soundDuration.toFixed(2)}s`);
            } else if (attempt < 3) {
              // Retry up to 3 times for regular playback
              setTimeout(() => setDurationWithRetry(attempt + 1), 200 * (attempt + 1));
            }
          };
          setDurationWithRetry();
        },
        onpause: () => {
          setIsPlaying(false);
          // Update current time when paused
          const current = newSound?.seek();
          if (typeof current === 'number') {
            setCurrentTime(current);
          }
        },
        onplay: () => {
          setIsPlaying(true);
          setCurrentSong(songToPlay); // Update current song when playback actually starts
          
          // Set duration if not already set
          const soundDuration = newSound?.duration();
          if (typeof soundDuration === 'number' && soundDuration > 0) {
            setDuration(soundDuration);
          }
          
          // Update current time
          const current = newSound?.seek();
          if (typeof current === 'number') {
            setCurrentTime(current);
          }
        }
      });
      
      // Set the current sound
      setSound(newSound);
      
      // Play the sound
      newSound.play();
      
      // Immediately preload the next song
      setTimeout(() => {
        if (!nextSound) {
          preloadNextSong();
        }
      }, 100);
    } catch (error) {
      console.error('Error creating or playing sound:', error);
      setCurrentSong(null);
      setIsPlaying(false);
      // Try to recover
      setTimeout(() => {
        playNextSong();
      }, 500);
    }
  }, [sound, volume, playNextSong, preloadNextSong, nextSound]);

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