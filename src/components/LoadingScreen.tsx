import React from 'react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-200">
      {/* Logo animé */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-violet-600/30 rounded-full"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-violet-500 border-r-pink-500 rounded-full animate-spin"></div>
      </div>

      {/* Texte de chargement */}
      <p className="mt-4 text-gray-400 text-sm font-medium animate-pulse">
        Chargement de votre carte...
      </p>
    </div>
  );
}
