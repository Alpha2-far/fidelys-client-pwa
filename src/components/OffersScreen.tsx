import React, { useEffect, useState } from 'react';
import { RewardTier, Promotion } from '../types';
import { useShop } from '../contexts/ShopContext';

export function OffersScreen() {
  const { shop, customer, tier } = useShop();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch promotions et tiers
  useEffect(() => {
    async function fetchData() {
      if (!shop) return;

      try {
        // Fetch promotions actives
        const now = new Date().toISOString();
        const promoUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/promotions?shop_id=eq.${shop.id}&active=eq.true&start_date=lte.${now}&end_date=gte.${now}&order=start_date.asc`;

        const promoRes = await fetch(promoUrl, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        });

        if (promoRes.ok) {
          const promoData = await promoRes.json() as Promotion[];
          setPromotions(promoData);
        }

        // Fetch tous les tiers
        const tiersUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/reward_tiers?shop_id=eq.${shop.id}&order=points_required.asc`;

        const tiersRes = await fetch(tiersUrl, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        });

        if (tiersRes.ok) {
          const tiersData = await tiersRes.json() as RewardTier[];
          setTiers(tiersData);
        }
      } catch (error) {
        console.error('Erreur fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [shop]);

  // Format des points
  const formatPoints = (points: number) => {
    return points.toLocaleString('fr-FR');
  };

  return (
    <div className="h-full overflow-y-auto px-4 pb-20 with-bottom-nav">
      <h2 className="text-xl font-bold text-white mb-4 pt-4 safe-top">
        Offres et Récompenses
      </h2>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-600/30 border-t-violet-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400 text-sm">Chargement...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Promotions actives */}
          {promotions.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">
                Promotions en cours
              </h3>
              <div className="space-y-3">
                {promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="bg-gradient-to-r from-violet-600/20 to-pink-600/20 rounded-xl p-4 border border-violet-500/20"
                  >
                    <h4 className="text-white font-semibold mb-1">
                      {promo.title}
                    </h4>
                    <p className="text-gray-300 text-sm mb-2">
                      {promo.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-violet-400">
                      <span>
                        {promo.discount_type === 'percentage'
                          ? `${promo.discount_value}% de réduction`
                          : promo.discount_type === 'fixed'
                            ? `${promo.discount_value} FCFA de réduction`
                            : `x${promo.discount_value} points`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tous les paliers */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">
              Paliers de fidélité
            </h3>
            <div className="space-y-3">
              {tiers.map((t, index) => {
                const isCurrentTier = tier?.id === t.id;
                const isLocked = customer && t.points_required > customer.points_balance;
                const progress = customer
                  ? Math.min(100, (customer.points_balance / t.points_required) * 100)
                  : 0;

                return (
                  <div
                    key={t.id}
                    className={`rounded-xl p-4 border ${
                      isCurrentTier
                        ? 'bg-violet-600/20 border-violet-500/50'
                        : isLocked
                          ? 'bg-dark-100 border-white/5 opacity-60'
                          : 'bg-dark-100 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {index === 0 ? '🥉' : index === 1 ? '🥈' : index === 2 ? '🥇' : '💎'}
                        </span>
                        <span className="text-white font-semibold">
                          {t.name}
                        </span>
                      </div>
                      {isCurrentTier && (
                        <span className="text-xs px-2 py-1 bg-violet-500 text-white rounded-full">
                          Actuel
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-400 mb-2">
                      {formatPoints(t.points_required)} points requis
                    </div>

                    {!isCurrentTier && customer && (
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Notifications récentes */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">
              Notifications
            </h3>
            <div className="bg-dark-100 rounded-xl p-4 border border-white/5">
              <p className="text-gray-400 text-sm text-center">
                Aucune notification récente
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
