import React, { createContext, useContext, useState } from 'react';

const ModeContext = createContext();

export const useMode = () => {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be inside ModeProvider');
  return ctx;
};

export const MODES = [
  { key: 'personal',  label: 'Personal' },
  { key: 'tarjetas',  label: 'Tarjetas' },
];

export const ModeProvider = ({ children }) => {
  const [mode, setModeState] = useState(
    () => localStorage.getItem('appMode') || 'personal'
  );

  const switchMode = (m) => {
    setModeState(m);
    localStorage.setItem('appMode', m);
  };

  return (
    <ModeContext.Provider value={{ mode, switchMode }}>
      {children}
    </ModeContext.Provider>
  );
};
