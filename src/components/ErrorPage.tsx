import React from 'react';

interface ErrorPageProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorPage({ message = 'Boutique introuvable', onRetry }: ErrorPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-200 px-6">
      {/* Logo Fidelys */}
      <div className="mb-8">
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto"
        >
          <circle cx="50" cy="50" r="45" stroke="url(#gradient)" strokeWidth="3" fill="none" />
          <path
            d="M35 65L50 35L65 65"
            stroke="url(#gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="50" cy="25" r="5" fill="url(#gradient)" />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Message d'erreur */}
      <h1 className="text-2xl font-bold text-white mb-2 text-center">
        {message}
      </h1>

      <p className="text-gray-400 text-center mb-8 max-w-xs">
        Cette boutique n'est pas inscrite sur Fidelys ou l'URL est incorrecte.
      </p>

      {/* Bouton retour */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 rounded-full font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Réessayer
        </button>
      )}

      {/* Lien vers Fidelys */}
      <a
        href="https://fidelys.app"
        className="mt-8 text-gray-500 text-sm hover:text-gray-300 transition-colors"
      >
        Retour à Fidelys →
      </a>
    </div>
  );
}
