import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Shop, CustomerProfile, RewardTier } from '../types';

interface ShopContextType {
  shop: Shop | null;
  customer: CustomerProfile | null;
  tier: RewardTier | null;
  nextTier: RewardTier | null;
  isLoading: boolean;
  error: string | null;
  progressToNextTier: number;
  applyShopColors: (shop: Shop) => void;
  refreshData: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

// Supabase client léger (sans la librairie complète pour économiser du bundle)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function supabaseQuery<T>(query: string, params: unknown[] = []): Promise<T> {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${query}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ params: params.reduce((acc, p, i) => ({ ...acc, [`p${i}`]: p }), {}) })
  });

  if (!response.ok) {
    throw new Error(`Supabase error: ${response.statusText}`);
  }

  return response.json();
}

// Fonction pour fetch les données d'une boutique par slug
async function fetchShopBySlug(slug: string): Promise<Shop | null> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/shops?slug=eq.${slug}&select=*`;
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data[0] || null;
  } catch {
    return null;
  }
}

// Fonction pour fetch les données client
async function fetchCustomerData(customerId: string, shopId: string): Promise<{
  customer: CustomerProfile | null;
  tier: RewardTier | null;
  nextTier: RewardTier | null;
}> {
  try {
    // Fetch customer profile
    const customerUrl = `${SUPABASE_URL}/rest/v1/customer_profiles?id=eq.${customerId}&shop_id=eq.${shopId}&select=*`;
    const customerRes = await fetch(customerUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!customerRes.ok) {
      return { customer: null, tier: null, nextTier: null };
    }

    const customerData = await customerRes.json();
    const customer = customerData[0] || null;

    if (!customer) {
      return { customer: null, tier: null, nextTier: null };
    }

    // Fetch current tier
    let tier: RewardTier | null = null;
    let nextTier: RewardTier | null = null;

    if (customer.current_tier_id) {
      const tierUrl = `${SUPABASE_URL}/rest/v1/reward_tiers?id=eq.${customer.current_tier_id}&select=*`;
      const tierRes = await fetch(tierUrl, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (tierRes.ok) {
        const tierData = await tierRes.json();
        tier = tierData[0] || null;
      }
    }

    // Fetch next tier
    const allTiersUrl = `${SUPABASE_URL}/rest/v1/reward_tiers?shop_id=eq.${shopId}&select=*&order=points_required.asc`;
    const allTiersRes = await fetch(allTiersUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (allTiersRes.ok) {
      const allTiers = await allTiersRes.json() as RewardTier[];
      const currentTierIndex = allTiers.findIndex(t => t.id === customer.current_tier_id);
      if (currentTierIndex >= 0 && currentTierIndex < allTiers.length - 1) {
        nextTier = allTiers[currentTierIndex + 1];
      }
    }

    return { customer, tier, nextTier };
  } catch {
    return { customer: null, tier: null, nextTier: null };
  }
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [tier, setTier] = useState<RewardTier | null>(null);
  const [nextTier, setNextTier] = useState<RewardTier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Appliquer les couleurs CSS custom properties
  const applyShopColors = useCallback((shopData: Shop) => {
    document.documentElement.style.setProperty('--shop-primary', shopData.primary_color);
    document.documentElement.style.setProperty('--shop-secondary', shopData.secondary_color);
  }, []);

  // Calculer la progression vers le prochain tier
  const progressToNextTier = React.useMemo(() => {
    if (!customer || !nextTier) return 100;
    if (nextTier.points_required <= customer.points_balance) return 100;

    const prevTierPoints = tier?.points_required || 0;
    const pointsNeeded = nextTier.points_required - prevTierPoints;
    const pointsEarned = customer.points_balance - prevTierPoints;

    return Math.min(100, Math.max(0, (pointsEarned / pointsNeeded) * 100));
  }, [customer, tier, nextTier]);

  // Charger les données depuis le cache ou le réseau
  const refreshData = useCallback(async () => {
    if (!shop) return;

    const customerId = localStorage.getItem('fidelys_customer_id');
    if (!customerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { customer: customerData, tier: tierData, nextTier: nextTierData } =
        await fetchCustomerData(customerId, shop.id);

      setCustomer(customerData);
      setTier(tierData);
      setNextTier(nextTierData);

      // Mettre à jour le cache
      if (customerData) {
        localStorage.setItem('fidelys_customer_data', JSON.stringify({
          customer: customerData,
          tier: tierData,
          nextTier: nextTierData,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [shop]);

  // Initialisation au montage
  useEffect(() => {
    async function initShop() {
      // Extraire le slug depuis le hostname
      const hostname = window.location.hostname;
      const slug = hostname.split('.')[0];

      // Vérifier si on a un slug valide
      if (!slug || slug === 'www' || slug === 'fidelys') {
        setError('Boutique introuvable');
        setIsLoading(false);
        return;
      }

      // Essayer de charger depuis le cache d'abord
      const cachedData = localStorage.getItem(`fidelys_shop_${slug}`);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (parsed.shop && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setShop(parsed.shop);
            applyShopColors(parsed.shop);
            setIsLoading(false);
            refreshData();
            return;
          }
        } catch {
          // Cache invalide, continuer avec le fetch
        }
      }

      // Fetch depuis Supabase
      try {
        const shopData = await fetchShopBySlug(slug);

        if (!shopData) {
          setError('Boutique introuvable');
          setIsLoading(false);
          return;
        }

        setShop(shopData);
        applyShopColors(shopData);

        // Sauvegarder dans le cache
        localStorage.setItem(`fidelys_shop_${slug}`, JSON.stringify({
          shop: shopData,
          timestamp: Date.now()
        }));

        // Charger les données client
        await refreshData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    }

    initShop();
  }, [applyShopColors, refreshData]);

  const value = {
    shop,
    customer,
    tier,
    nextTier,
    isLoading,
    error,
    progressToNextTier,
    applyShopColors,
    refreshData
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
