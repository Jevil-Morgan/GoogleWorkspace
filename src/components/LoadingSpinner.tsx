import React from 'react';
import { GeminiIcon } from './icons/GoogleIcons';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center animate-pulse-soft">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-google-blue via-purple-500 to-google-red flex items-center justify-center mx-auto mb-4 shadow-google-lg">
          <GeminiIcon className="w-10 h-10" />
        </div>
        <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">Loading your workspace...</p>
      </div>
    </div>
  );
};
