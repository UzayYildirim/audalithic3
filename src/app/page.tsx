'use client';

import { RadioProvider } from '@/contexts/RadioContext';
import LanguageSelector from '@/components/LanguageSelector';
import RadioPlayer from '@/components/RadioPlayer';
import GradientBackground from '@/components/GradientBackground';
import Particles from '@/components/Particles';
import TextEditor from '@/components/TextEditor';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if the screen is large enough on mount and on resize
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint (1024px)
    };
    
    // Initial check
    checkScreenSize();
    
    // Set up listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Set loaded state after a small delay to trigger animations
    const timer = setTimeout(() => setIsLoaded(true), 100);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <RadioProvider>
      {isLargeScreen && (
        <>
          <GradientBackground />
          <Particles />
          <TextEditor />
        </>
      )}
      
      <main className={`min-h-screen w-full flex flex-col ${isLargeScreen ? 'justify-end' : 'items-center justify-center'} p-4`}>
        {!isLargeScreen && (
          <div className="w-full max-w-4xl glass-morphism p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <header className="flex items-center">
                  <div>
                    <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600">
                      Audalithic
                    </h1>
                    <p className="text-xs text-gray-400">Your Real-Time AI Radio</p>
                  </div>
                </header>

                <div className="flex items-center gap-4">
                  <LanguageSelector />
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 max-w-[200px]">
                      Content is AI-generated and may contain inaccuracies or potentially sensitive material
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <RadioPlayer />
              </div>
            </div>
          </div>
        )}
        
        {isLargeScreen && (
          <div 
            className={`w-full glass-morphism backdrop-blur-lg p-4 sm:p-6 border-t border-white/10 shadow-[0_-4px_12px_rgba(0,0,0,0.2)] transition-all duration-700 bottom-player-container ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
          >
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                  <header className="flex items-center">
                    <div>
                      <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600">
                        Audalithic
                      </h1>
                      <p className="text-xs text-gray-400">Your Real-Time AI Radio</p>
                    </div>
                  </header>

                  <div className="flex items-center gap-4">
                    <LanguageSelector />
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 max-w-[200px]">
                        Content is AI-generated and may contain inaccuracies or potentially sensitive material
                      </p>
                    </div>
                  </div>
                </div>
                
                <RadioPlayer />
              </div>
            </div>
          </div>
        )}
      </main>
    </RadioProvider>
  );
}

