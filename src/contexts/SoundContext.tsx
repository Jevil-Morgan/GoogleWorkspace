import React, { createContext, useContext, ReactNode } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

type SoundContextType = ReturnType<typeof useSoundEffects>;

const SoundContext = createContext<SoundContextType | null>(null);

export const SoundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const sounds = useSoundEffects();
  
  return (
    <SoundContext.Provider value={sounds}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = (): SoundContextType => {
  const context = useContext(SoundContext);
  if (!context) {
    // Return a no-op version if used outside provider
    return {
      playClick: () => {},
      playSuccess: () => {},
      playError: () => {},
      playNotification: () => {},
      playHover: () => {},
      playTabSwitch: () => {},
      playLoadingStart: () => {},
      playComplete: () => {},
      playDelete: () => {},
      setEnabled: () => {},
      isEnabled: () => true,
    };
  }
  return context;
};
