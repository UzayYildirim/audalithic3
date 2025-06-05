'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface EditContextType {
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}

const EditContext = createContext<EditContextType | undefined>(undefined);

export function useEdit() {
  const context = useContext(EditContext);
  if (context === undefined) {
    throw new Error('useEdit must be used within an EditProvider');
  }
  return context;
}

interface EditProviderProps {
  children: ReactNode;
}

export function EditProvider({ children }: EditProviderProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <EditContext.Provider value={{ isEditing, setIsEditing }}>
      {children}
    </EditContext.Provider>
  );
} 