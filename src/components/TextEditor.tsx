'use client';

import { useState, useRef, useEffect } from 'react';

interface TextBox {
  id: string;
  text: string;
  position: { x: number, y: number };
  scale: number;
}

interface CountdownBox {
  id: string;
  duration: number;
  timeLeft: number;
  isRunning: boolean;
  position: { x: number, y: number };
  scale: number;
}

interface ImageBox {
  id: string;
  imageUrl: string;
  position: { x: number, y: number };
  scale: number;
}

type EditorElement = TextBox | CountdownBox | ImageBox;

// Type guards
const isCountdownBox = (element: EditorElement): element is CountdownBox => {
  return 'duration' in element;
};

const isTextBox = (element: EditorElement): element is TextBox => {
  return 'text' in element && !('imageUrl' in element);
};

const isImageBox = (element: EditorElement): element is ImageBox => {
  return 'imageUrl' in element;
};

export default function TextEditor() {
  const [isEditing, setIsEditing] = useState(false);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [activeTextBox, setActiveTextBox] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [countdownInput, setCountdownInput] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const elementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const countdownIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Resize element
  const resizeElement = (id: string, scaleChange: number) => {
    setElements(elements.map(element => {
      if (element.id === id) {
        // Apply scale change with limits (0.2 to 3.0)
        const newScale = Math.min(3.0, Math.max(0.2, element.scale + scaleChange));
        return {
          ...element,
          scale: newScale
        };
      }
      return element;
    }));
  };
  
  // Update countdown timers
  useEffect(() => {
    elements.forEach(element => {
      if (isCountdownBox(element) && element.isRunning && element.timeLeft > 0) {
        // Clear any existing interval for this element
        if (countdownIntervals.current.has(element.id)) {
          clearInterval(countdownIntervals.current.get(element.id));
        }
        
        // Set a new interval
        const intervalId = setInterval(() => {
          setElements(prevElements => 
            prevElements.map(el => {
              if (el.id === element.id && isCountdownBox(el)) {
                const newTimeLeft = Math.max(0, el.timeLeft - 1);
                // Stop the timer if it reaches 0
                if (newTimeLeft === 0) {
                  clearInterval(countdownIntervals.current.get(element.id));
                  countdownIntervals.current.delete(element.id);
                  return { ...el, timeLeft: newTimeLeft, isRunning: false };
                }
                return { ...el, timeLeft: newTimeLeft };
              }
              return el;
            })
          );
        }, 1000);
        
        countdownIntervals.current.set(element.id, intervalId);
      }
    });
    
    // Cleanup intervals when component unmounts
    return () => {
      countdownIntervals.current.forEach(interval => clearInterval(interval));
    };
  }, [elements]);

  // Handle drag actions
  const handleDrag = (e: MouseEvent) => {
    if (!isDragging || !draggedElement) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setElements(elements.map(element => {
      if (element.id === draggedElement) {
        // Calculate new position
        const newX = element.position.x + deltaX;
        const newY = element.position.y + deltaY;
        
        // Get window height and limit vertical position
        const windowHeight = window.innerHeight;
        const maxY = windowHeight * 0.6; // Limit to 60% of screen height, keeping element above player
        
        return {
          ...element,
          position: {
            x: newX,
            y: Math.min(newY, maxY),
          }
        };
      }
      return element;
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const startDrag = (e: React.MouseEvent, id: string) => {
    // Only allow dragging in edit mode
    if (!isEditing) return;
    
    // Always ensure focus is set when dragging
    setFocusedElement(id);
    
    setIsDragging(true);
    setDraggedElement(id);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    // Prevent default to avoid any browser focus handling
    e.preventDefault();
    e.stopPropagation();
  };

  const stopDrag = () => {
    setIsDragging(false);
    setDraggedElement(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', stopDrag);
    } else {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', stopDrag);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, [isDragging, dragStart, elements, draggedElement]);

  // Add new elements
  const addNewTextBox = () => {
    const newId = `textbox-${Date.now()}`;
    const newTextBox: TextBox = {
      id: newId,
      text: '',
      position: { x: 0, y: 0 },
      scale: 1.0
    };
    
    setElements([...elements, newTextBox]);
    setActiveTextBox(newId);
    setEditingText('');
  };
  
  const addNewCountdown = () => {
    setAddingCountdown(true);
  };
  
  const addNewImage = () => {
    setUploadingImage(true);
    // Focus happens after render in useEffect
  };
  
  useEffect(() => {
    if (uploadingImage && imageInputRef.current) {
      imageInputRef.current.click();
    }
  }, [uploadingImage]);
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadingImage(false);
      return;
    }
    
    // Create a URL for the uploaded image
    const imageUrl = URL.createObjectURL(file);
    
    const newId = `image-${Date.now()}`;
    const newImage: ImageBox = {
      id: newId,
      imageUrl,
      position: { x: 0, y: 0 },
      scale: 0.5 // Images start at 50% of their original size
    };
    
    setElements([...elements, newImage]);
    setUploadingImage(false);
    
    // Reset the input value so the same file can be selected again
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };
  
  const [addingCountdown, setAddingCountdown] = useState(false);
  
  const createCountdown = () => {
    if (!countdownInput) return;
    
    const seconds = parseInt(countdownInput);
    if (isNaN(seconds) || seconds <= 0) return;
    
    const newId = `countdown-${Date.now()}`;
    const newCountdown: CountdownBox = {
      id: newId,
      duration: seconds,
      timeLeft: seconds,
      isRunning: true,
      position: { x: 0, y: 0 },
      scale: 1.0
    };
    
    setElements([...elements, newCountdown]);
    setCountdownInput('');
    setAddingCountdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTextBox) {
      setElements(elements.map(element => {
        if (element.id === activeTextBox && isTextBox(element)) {
          return {
            ...element,
            text: editingText
          };
        }
        return element;
      }));
    }
    
    setActiveTextBox(null);
  };

  const editTextBox = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (element && isTextBox(element)) {
      setActiveTextBox(id);
      setEditingText(element.text);
    }
  };

  const deleteElement = (id: string) => {
    // Clear any countdown interval if it's a countdown
    if (countdownIntervals.current.has(id)) {
      clearInterval(countdownIntervals.current.get(id));
      countdownIntervals.current.delete(id);
    }
    
    // Release Object URL if it's an image
    const element = elements.find(el => el.id === id);
    if (element && isImageBox(element)) {
      URL.revokeObjectURL(element.imageUrl);
    }
    
    setElements(elements.filter(element => element.id !== id));
    if (activeTextBox === id) {
      setActiveTextBox(null);
    }
    if (focusedElement === id) {
      setFocusedElement(null);
    }
  };
  
  const toggleCountdown = (id: string, e?: React.MouseEvent) => {
    // Make sure this action doesn't cause focus loss if event is provided
    if (e) {
      e.stopPropagation();
    }
    
    setElements(elements.map(element => {
      if (element.id === id && isCountdownBox(element)) {
        const newIsRunning = !element.isRunning;
        
        // If we're stopping and there's an interval, clear it
        if (!newIsRunning && countdownIntervals.current.has(id)) {
          clearInterval(countdownIntervals.current.get(id));
          countdownIntervals.current.delete(id);
        }
        
        return {
          ...element,
          isRunning: newIsRunning
        };
      }
      return element;
    }));
  };
  
  const resetCountdown = (id: string, e?: React.MouseEvent) => {
    // Make sure this action doesn't cause focus loss if event is provided
    if (e) {
      e.stopPropagation();
    }
    
    setElements(elements.map(element => {
      if (element.id === id && isCountdownBox(element)) {
        // If there's an interval running, clear it
        if (countdownIntervals.current.has(id)) {
          clearInterval(countdownIntervals.current.get(id));
          countdownIntervals.current.delete(id);
        }
        
        return {
          ...element,
          timeLeft: element.duration,
          isRunning: false
        };
      }
      return element;
    }));
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clean up any object URLs to prevent memory leaks
      elements.forEach(element => {
        if (isImageBox(element)) {
          URL.revokeObjectURL(element.imageUrl);
        }
      });
    };
  }, []);

  // When edit mode changes, clear focused element
  useEffect(() => {
    if (!isEditing) {
      setFocusedElement(null);
    }
  }, [isEditing]);

  // Handle element click to focus
  const handleElementClick = (e: React.MouseEvent, id: string) => {
    if (!isEditing) return;
    
    // Set this as the focused element, regardless of current state
    // This ensures focus is maintained consistently
    setFocusedElement(id);
  };

  // Click outside to clear focus - use mousedown for better reliability
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!isEditing || !focusedElement) return;
      
      // Check if clicked on an element or a button
      const target = e.target as HTMLElement;
      
      // Check if clicked on an element
      const elementContainers = Array.from(elementsRef.current.values());
      const clickedOnElement = elementContainers.some(el => el.contains(target));
      
      // Check if clicked on a button
      const clickedOnButton = target.closest('button') !== null;
      
      // If clicked outside elements and buttons, clear focus
      if (!clickedOnElement && !clickedOnButton) {
        setFocusedElement(null);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isEditing, focusedElement]);

  return (
    <>
      {/* Hidden file input for image upload */}
      <input 
        type="file"
        ref={imageInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        aria-hidden="true"
      />
      
      {/* Elements - TextBoxes, Countdowns, and Images */}
      {elements.map((element) => (
        <div 
          key={element.id}
          ref={(el) => {
            if (el) elementsRef.current.set(element.id, el);
            else elementsRef.current.delete(element.id);
          }}
          className="fixed inline-block text-center"
          style={{ 
            top: `calc(40% + ${element.position.y}px)`,
            left: `calc(50% + ${element.position.x}px)`,
            transform: 'translate(-50%, -50%)',
            transition: 'padding 0.2s ease, background-color 0.2s ease'
          }}
          onMouseDown={(e) => {
            if (isEditing) {
              // First set focus
              handleElementClick(e, element.id);
              // Then start drag if we're in edit mode
              startDrag(e, element.id);
            }
          }}
        >
          <div 
            className={`relative ${isDragging && draggedElement === element.id ? 'cursor-grabbing' : isEditing ? 'cursor-grab' : ''}`}
            style={{
              transform: `scale(${element.scale})`,
              transformOrigin: 'center center',
              padding: isEditing && focusedElement === element.id ? '8px' : '0'
            }}
          >
            <div className={`${isEditing && focusedElement === element.id ? 'ring-2 ring-purple-500 ring-opacity-80 rounded-md bg-purple-500/5' : ''}`}>
              {/* Text Box Content */}
              {isTextBox(element) && element.text && activeTextBox !== element.id && (
                <h1 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-balance select-none"
                >
                  {element.text}
                </h1>
              )}
              
              {/* Countdown Box Content */}
              {isCountdownBox(element) && activeTextBox !== element.id && (
                <div
                  className="flex flex-col items-center select-none"
                >
                  <div 
                    className="text-5xl md:text-6xl lg:text-7xl font-mono font-bold text-white"
                  >
                    {formatTime(element.timeLeft)}
                  </div>
                  
                  {isEditing && (
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={(e) => toggleCountdown(element.id, e)}
                        className="px-3 py-1 rounded-md bg-black/30 hover:bg-black/50 text-sm text-white backdrop-blur-md border border-white/20"
                      >
                        {element.isRunning ? 'Pause' : 'Start'}
                      </button>
                      <button
                        onClick={(e) => resetCountdown(element.id, e)}
                        className="px-3 py-1 rounded-md bg-black/30 hover:bg-black/50 text-sm text-white backdrop-blur-md border border-white/20"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Image Box Content */}
              {isImageBox(element) && activeTextBox !== element.id && (
                <div
                  className="relative select-none"
                >
                  <img
                    src={element.imageUrl}
                    alt="User uploaded content"
                    className="max-w-[50vw] w-auto h-auto rounded-md shadow-lg object-contain"
                    style={{ 
                      maxHeight: '50vh'
                    }}
                  />
                </div>
              )}

              {/* Editing Text Box */}
              {isTextBox(element) && activeTextBox === element.id && (
                <form onSubmit={handleSubmit} className="relative w-full">
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full px-4 py-2 text-lg bg-black/30 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                    placeholder="Type your text here..."
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Element Controls */}
          {isEditing && activeTextBox !== element.id && focusedElement === element.id && (
            <div className="absolute inset-0 z-10" style={{ transform: `scale(${element.scale})`, transformOrigin: 'center center' }}>
              {/* Resize Controls */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[calc(100%+8px)] flex space-x-1">
                <button
                  onClick={(e) => { e.stopPropagation(); resizeElement(element.id, -0.1); }}
                  className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md border border-white/20 hover:border-purple-500 transition-colors duration-200 flex items-center justify-center text-white/70 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); resizeElement(element.id, 0.1); }}
                  className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md border border-white/20 hover:border-purple-500 transition-colors duration-200 flex items-center justify-center text-white/70 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              
              {/* Edit/Delete Controls */}
              <div className="absolute top-0 right-0 translate-x-[calc(100%+8px)] flex space-x-1">
                {isTextBox(element) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); editTextBox(element.id); }}
                    className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md border border-white/20 hover:border-purple-500 transition-colors duration-200 flex items-center justify-center text-white/70 hover:text-white"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteElement(element.id); }}
                  className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md border border-white/20 hover:border-red-500 transition-colors duration-200 flex items-center justify-center text-white/70 hover:text-red-400"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Countdown Input Modal */}
      {addingCountdown && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setAddingCountdown(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 backdrop-blur-md p-4 rounded-lg border border-white/20 w-72 z-50">
            <h3 className="text-white text-lg mb-4">Add Countdown Timer</h3>
            <form onSubmit={(e) => { e.preventDefault(); createCountdown(); }}>
              <div className="mb-4">
                <label className="block text-white text-sm mb-1">Duration (seconds)</label>
                <input
                  type="number"
                  min="1"
                  value={countdownInput}
                  onChange={(e) => setCountdownInput(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 rounded border border-white/20 text-white"
                  placeholder="Enter seconds"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddingCountdown(false)}
                  className="px-3 py-1 rounded text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Edit Mode Toggle Button */}
      <button
        onClick={() => {
          // Clear focus when exiting edit mode
          if (isEditing) {
            setFocusedElement(null);
          }
          setIsEditing(!isEditing);
        }}
        className="fixed bottom-0 right-[120px] mb-[88px] w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/20 hover:border-purple-500 transition-colors duration-200 flex items-center justify-center text-white/70 hover:text-white z-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>

      {/* Toolbar shown in edit mode */}
      {isEditing && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 mb-[88px] px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/20 flex items-center gap-3 z-50">
          <button
            onClick={addNewTextBox}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-sm text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Text
          </button>
          
          <button
            onClick={addNewCountdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-sm text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Add Countdown
          </button>
          
          <button
            onClick={addNewImage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-sm text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add Image
          </button>
        </div>
      )}
    </>
  );
} 