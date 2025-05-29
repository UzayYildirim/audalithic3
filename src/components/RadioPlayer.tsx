'use client';

import React from 'react';
import { useRadio } from '@/contexts/RadioContext';

export default function RadioPlayer() {
  const { 
    isPlaying, 
    togglePlay, 
    skipSong,
    previousSong,
    volume, 
    setVolume, 
    currentSong, 
    selectedLanguages,
    hasPreviousSongs,
    isButtonDisabled,
    currentTime,
    duration
  } = useRadio();

  // Format time in mm:ss format
  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If no languages are selected, show a message
  if (selectedLanguages.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
          Select a language to start listening
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-4">
      <div className="flex items-center gap-4 h-16 px-2">
        {/* Duration Display */}
        <div className="flex items-center text-xs text-gray-400 font-mono w-16 flex-shrink-0">
          {currentSong ? (
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          ) : (
            <span>--:-- / --:--</span>
          )}
        </div>

        {/* Play Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={previousSong}
            disabled={!hasPreviousSongs || isButtonDisabled}
            className={`button-base w-8 h-8 rounded-full ${
              hasPreviousSongs && !isButtonDisabled
                ? 'bg-gray-800 hover:bg-gray-700 hover:scale-105 active:scale-95' 
                : 'bg-gray-800/25 cursor-not-allowed'
            } text-white flex items-center justify-center transition-all duration-200`}
            aria-label="Previous"
          >
            <svg className={`w-4 h-4 ${!hasPreviousSongs || isButtonDisabled ? 'opacity-50' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953L9.567 7.71a1.125 1.125 0 011.683.977v8.123z" />
            </svg>
          </button>

          <button 
            onClick={togglePlay}
            disabled={isButtonDisabled}
            style={{ 
              background: isButtonDisabled 
                ? 'linear-gradient(135deg, var(--accent-purple-dim, #9c27b074), var(--accent-pink-dim, #e91e6374))' 
                : 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))' 
            }}
            className={`button-base w-10 h-10 rounded-full ${
              !isButtonDisabled ? 'hover:scale-105 active:scale-95' : 'cursor-not-allowed'
            } text-white flex items-center justify-center shadow-lg transition-all duration-200`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className={`w-5 h-5 ${isButtonDisabled ? 'opacity-75' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            ) : (
              <svg className={`w-5 h-5 ${isButtonDisabled ? 'opacity-75' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            )}
          </button>
          
          <button 
            onClick={skipSong}
            disabled={isButtonDisabled}
            className={`button-base w-8 h-8 rounded-full ${
              !isButtonDisabled 
                ? 'bg-gray-800 hover:bg-gray-700 hover:scale-105 active:scale-95' 
                : 'bg-gray-800/25 cursor-not-allowed'
            } text-white flex items-center justify-center transition-all duration-200`}
            aria-label="Skip"
          >
            <svg className={`w-4 h-4 ${isButtonDisabled ? 'opacity-50' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
            </svg>
          </button>
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          {currentSong ? (
            <div className="truncate flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
              <div>
                <div className="text-sm font-semibold text-white truncate">
                  {currentSong.title}
                </div>
                <div className="text-xs font-medium truncate flex items-center gap-1" style={{ color: 'var(--accent-pink)' }}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                  </svg>
                  {currentSong.language}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-300 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              Ready to play
            </div>
          )}
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 w-24">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider flex-grow"
          />
        </div>
      </div>

      {/* Version and Credits */}
      <div className="absolute bottom-0 right-0 mb-2 text-xs text-gray-500 font-bold flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
        v0.1.0 ALPHA - Created by Uzay Yildirim
      </div>
    </div>
  );
} 