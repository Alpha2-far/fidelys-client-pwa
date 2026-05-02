// Types pour Fidelys Client PWA

export interface Shop {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
}

export interface CustomerProfile {
  id: string;
  shop_id: string;
  phone: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  current_tier_id: string | null;
  points_balance: number;
  lifetime_points: number;
  last_visit_at: string | null;
  created_at: string;
}

export interface RewardTier {
  id: string;
  shop_id: string;
  name: string;
  points_required: number;
  badge_color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  customer_id: string;
  shop_id: string;
  type: 'purchase' | 'redemption' | 'bonus' | 'adjustment';
  points: number;
  amount: number | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Promotion {
  id: string;
  shop_id: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed' | 'points_multiplier';
  discount_value: number;
  start_date: string;
  end_date: string;
  active: boolean;
  created_at: string;
}

export interface WalletCard {
  customer: CustomerProfile;
  shop: Shop;
  tier: RewardTier | null;
}

export interface OTPRequest {
  phone: string;
}

export interface OTPVerification {
  phone: string;
  code: string;
}

export interface AuthToken {
  token: string;
  phone: string;
  expires_at: string;
}

// Tier colors mapping
export const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Bronze: {
    bg: 'bg-amber-700/20',
    text: 'text-amber-500',
    border: 'border-amber-600/50'
  },
  Argent: {
    bg: 'bg-gray-400/20',
    text: 'text-gray-300',
    border: 'border-gray-400/50'
  },
  Or: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/50'
  },
  Platine: {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-400',
    border: 'border-cyan-500/50'
  }
};
