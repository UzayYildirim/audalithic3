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
  const [volume, setVolume] = useState(0.7);
  const [loading, setLoading] = useState(true);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const buttonTimerRef = useRef<NodeJS.Timeout | null>(null);
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
    
    // Determine format array based on the song's format
    let formatArray = ['mp3', 'opus'];
    if (nextSongToPlay.format === 'opus') {
      // For OPUS files, try OPUS first, then fallback to mp3 if available
      formatArray = ['opus', 'mp3'];
    } else if (nextSongToPlay.format === 'mp3') {
      // For MP3 files, prefer mp3
      formatArray = ['mp3'];
    }
    
    try {
      const newNextSound = new Howl({
        src: [nextSongToPlay.path],
        html5: true,
        preload: true,
        volume: volume,
        format: formatArray,
        onend: () => {
          // This will only be called if this preloaded song becomes the current song
          setTimeout(playNextSong, 300);
        },
        onloaderror: (id, error) => {
          console.error('Error preloading next song:', nextSongToPlay.title, 'Format:', nextSongToPlay.format, 'Error:', error);
          setNextSound(null);
          
          // Don't show toast for preload errors to avoid spam, just log
          console.warn(`⚠️ Could not preload next song (${nextSongToPlay.format} format), will try another when needed`);
          
          // Try again with a different song after a delay
          setTimeout(() => {
            preloadNextSong();
          }, 1000);
        },
        onload: () => {
          console.log('✅ Next song preloaded:', nextSongToPlay.title, 'Format:', nextSongToPlay.format);
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
  }, [nextSound, songs, playedSongs, currentSong, volume, availableSongs, setAvailableSongs, setPlayedSongs, setNextSound]);

  // Play the next song
  const playNextSong = () => {
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
        // Determine format array based on the song's format
        let formatArray = ['mp3', 'opus'];
        if (songToPlay.format === 'opus') {
          formatArray = ['opus', 'mp3'];
        } else if (songToPlay.format === 'mp3') {
          formatArray = ['mp3'];
        }
        
        soundToUse = new Howl({
          src: [songToPlay.path],
          html5: true,
          volume: volume,
          format: formatArray,
          onend: () => {
            setTimeout(playNextSong, 300);
          },
          onloaderror: (id, error) => {
            console.error('Error loading song:', songToPlay?.title, 'Format:', songToPlay?.format, 'Error:', error);
            toast.error(`❌ Could not load "${songToPlay?.title}" (${songToPlay?.format} format). Trying next song...`);
            setCurrentSong(null);
            setIsPlaying(false);
            
            // Remove this problematic song from available songs
            setAvailableSongs(prev => prev.filter(song => song.id !== songToPlay?.id));
            
            // Try next song after a short delay
            setTimeout(() => playNextSong(), 500);
          },
          onload: () => {
            console.log('✅ Song loaded successfully:', songToPlay?.title, 'Format:', songToPlay?.format);
          }
        });
      }

      // Add play event handler
      soundToUse.on('play', () => {
        setIsPlaying(true);
        setCurrentSong(songToPlay);
        setCurrentTime(0); // Reset current time when new song starts
        setDuration(0); // Reset duration initially, will be set by the tracking effect
        console.log('▶️ Now playing:', songToPlay?.title);
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
      
      setTimeout(() => playNextSong(), 500);
    }
  };

  // Play a specific song
  const playSong = (songToPlay: Song) => {
    // If there is already a sound playing, stop and unload it
    if (sound) {
      sound.stop();
      sound.unload(); // Completely unload the sound to ensure it doesn't interfere
      setSound(null); // Clear sound reference
      setIsPlaying(false); // Ensure playing state is reset
    }
    
    // Determine format array based on the song's format
    let formatArray = ['mp3', 'opus'];
    if (songToPlay.format === 'opus') {
      formatArray = ['opus', 'mp3'];
    } else if (songToPlay.format === 'mp3') {
      formatArray = ['mp3'];
    }
    
    try {
      // Create a new Howl instance for the song
      const newSound = new Howl({
        src: [songToPlay.path],
        html5: true,
        volume: volume,
        format: formatArray,
        onend: () => {
          // Use timeout to prevent immediate firing in case of race conditions
          setTimeout(playNextSong, 300);
        },
        onloaderror: (id, error) => {
          console.error('Error loading song:', songToPlay.title, 'Format:', songToPlay.format, 'Error:', error);
          toast.error(`❌ Could not load "${songToPlay.title}" (${songToPlay.format} format). Trying next song...`);
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
          console.log('✅ Song loaded successfully:', songToPlay.title, 'Format:', songToPlay.format);
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
        // Determine format array based on the song's format
        let formatArray = ['mp3', 'opus'];
        if (lastSong.format === 'opus') {
          formatArray = ['opus', 'mp3'];
        } else if (lastSong.format === 'mp3') {
          formatArray = ['mp3'];
        }
        
        // Create a new Howl instance for the previous song
        const newSound = new Howl({
          src: [lastSong.path],
          html5: true,
          volume: volume,
          format: formatArray,
          onend: () => {
            setTimeout(playNextSong, 300);
          },
          onloaderror: (id, error) => {
            console.error('Error loading previous song:', lastSong.title, 'Format:', lastSong.format, 'Error:', error);
            toast.error(`❌ Could not load previous song "${lastSong.title}" (${lastSong.format} format). Playing current playlist instead.`);
            setCurrentSong(null);
            setIsPlaying(false);
            setTimeout(() => playNextSong(), 500);
          },
          onload: () => {
            console.log('✅ Previous song loaded successfully:', lastSong.title, 'Format:', lastSong.format);
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