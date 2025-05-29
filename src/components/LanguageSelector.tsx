'use client';

import React, { useState } from 'react';
import { useRadio } from '@/contexts/RadioContext';

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { languages, selectedLanguages, toggleLanguage } = useRadio();

  const selectedCount = selectedLanguages.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="button-base flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
        </svg>
        Languages {selectedCount > 0 && `(${selectedCount})`}
        <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm glass-morphism rounded-lg p-3 space-y-2 z-50">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-medium text-gray-300">Select Languages</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-0.5 rounded-full hover:bg-gray-800/50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-1.5">
              {languages.map((language) => (
                <button
                  key={language.id}
                  onClick={() => toggleLanguage(language.id)}
                  className={`
                    button-base
                    py-1 px-1.5
                    rounded-md 
                    text-[11px]
                    font-medium
                    transition-all
                    ${
                      selectedLanguages.includes(language.id)
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/25 hover:bg-purple-500'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    }
                  `}
                >
                  {language.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 