import React, { useEffect, useState } from 'react';
import { useShop } from '../contexts/ShopContext';
import { TIER_COLORS } from '../types';

interface LoyaltyCardProps {
  onFlip?: () => void;
}

export function LoyaltyCard({ onFlip }: LoyaltyCardProps) {
  const { shop, customer, tier, nextTier, progressToNextTier } = useShop();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Animation flip au chargement
  useEffect(() => {
    const timer = setTimeout(() => setIsFlipped(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Vérifier si nouveau tier débloqué
  useEffect(() => {
    if (tier && customer) {
      const isNewTier = customer.points_balance >= (tier.points_required || 0);
      if (isNewTier) {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [tier, customer]);

  if (!shop || !customer) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Aucune carte disponible</p>
      </div>
    );
  }

  // Déterminer les couleurs du tier
  const tierName = tier?.name || 'Bronze';
  const tierColors = TIER_COLORS[tierName] || TIER_COLORS.Bronze;

  // Calculer le nombre d'étoiles basé sur le tier
  const starCount = tierName === 'Or' ? 3 : tierName === 'Argent' ? 2 : 1;

  return (
    <div className="relative w-full max-w-md mx-auto perspective-1000">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#7C3AED'][Math.floor(Math.random() * 4)],
                animationDelay: `${Math.random() * 0.5}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Carte */}
      <div
        className={`relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden gpu-accelerated transition-transform duration-700 transform-style-3d ${
          isFlipped ? 'rotate-y-0' : 'rotate-y-180'
        } flip-in`}
        style={{
          background: `linear-gradient(135deg, ${shop.primary_color}40 0%, ${shop.secondary_color}20 100%)`,
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Bordure brillante */}
        <div className="absolute inset-0 rounded-2xl border border-white/10"></div>

        {/* Contenu de la carte */}
        <div className="absolute inset-0 p-5 flex flex-col">
          {/* Header: Logo + Nom boutique */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {shop.logo_url ? (
                <img
                  src={shop.logo_url}
                  alt={shop.name}
                  className="w-8 h-8 object-contain rounded"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: shop.primary_color }}
                >
                  {shop.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-white font-semibold text-sm truncate max-w-[150px]">
                {shop.name}
              </span>
            </div>

            {/* Badge tier avec shimmer */}
            <div className={`relative px-3 py-1 rounded-full ${tierColors.bg} ${tierColors.text} border ${tierColors.border} overflow-hidden`}>
              <div className="shimmer absolute inset-0"></div>
              <div className="relative flex items-center gap-1 text-xs font-semibold">
                {'★'.repeat(starCount)}
                <span>{tierName}</span>
              </div>
            </div>
          </div>

          {/* Points en gros au centre */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-1">
                {customer.points_balance.toLocaleString()}
              </div>
              <div className="text-sm text-gray-300 font-medium">points</div>
            </div>
          </div>

          {/* Barre de progression */}
          {nextTier && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progression</span>
                <span>{Math.round(progressToNextTier)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${progressToNextTier}%`,
                    background: `linear-gradient(90deg, ${shop.primary_color}, ${shop.secondary_color})`
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Prochain : {nextTier.name} ({nextTier.points_required.toLocaleString()} pts)
              </div>
            </div>
          )}

          {/* Footer: Nom client + Fidelys */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="text-white text-sm font-medium">
              {(customer.first_name || customer.last_name)
                ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim().toUpperCase()
                : 'CLIENT FIDELYS'}
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <span>Powered by</span>
              <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
                <text x="0" y="15" fill="url(#gradient)" fontSize="12" fontWeight="bold">
                  Fidelys ♦
                </text>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Effet de brillance */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none"></div>
      </div>
    </div>
  );
}
