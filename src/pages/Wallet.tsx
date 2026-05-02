import React, { useState, useEffect, useCallback } from 'react';
import { WalletCard, AuthToken } from '../types';
import { ErrorPage } from '../components/ErrorPage';
import { LoadingScreen } from '../components/LoadingScreen';

// Génération et vérification OTP (simplifié pour le client)
async function sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Appel à l'Edge Function verify-phone
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ phone, action: 'send' })
    });

    if (!response.ok) {
      return { success: false, error: 'Erreur envoi OTP' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Erreur réseau' };
  }
}

async function verifyOTP(phone: string, code: string): Promise<{ success: boolean; token?: AuthToken; error?: string }> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ phone, code, action: 'verify' })
    });

    if (!response.ok) {
      return { success: false, error: 'Code invalide' };
    }

    const data = await response.json();
    return { success: true, token: data };
  } catch {
    return { success: false, error: 'Erreur réseau' };
  }
}

// Fetch des cartes du client
async function fetchWalletCards(phone: string): Promise<WalletCard[]> {
  try {
    // Requête cross-shop pour récupérer tous les customers avec ce phone
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/customer_profiles?phone=eq.${phone}&select=*,shop:shops!inner(name,logo_url,primary_color,secondary_color,slug),tier:reward_tiers(current_tier_id)`;

    const response = await fetch(url, {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data;
  } catch {
    return [];
  }
}

export function Wallet() {
  const [step, setStep] = useState<'phone' | 'otp' | 'cards'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Vérifier si déjà authentifié
  useEffect(() => {
    const storedPhone = localStorage.getItem('fidelys_wallet_phone');
    const storedToken = localStorage.getItem('fidelys_wallet_token');

    if (storedPhone && storedToken) {
      const token = JSON.parse(storedToken);
      if (new Date(token.expires_at) > new Date()) {
        setPhone(storedPhone);
        loadWalletCards(storedPhone);
        setStep('cards');
        return;
      }
    }
  }, []);

  // Countdown pour renvoi OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const loadWalletCards = async (walletPhone: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedCards = await fetchWalletCards(walletPhone);
      setCards(fetchedCards);

      // Sauvegarder dans le cache
      localStorage.setItem('fidelys_wallet_cards', JSON.stringify({
        cards: fetchedCards,
        timestamp: Date.now()
      }));

      setStep('cards');
    } catch {
      setError('Erreur de chargement des cartes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phone.startsWith('+229') || phone.length !== 13) {
      setError('Numéro invalide. Format: +229XXXXXXXX');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await sendOTP(phone);
    if (result.success) {
      setOtpSent(true);
      setStep('otp');
      setCountdown(30);
    } else {
      setError(result.error || 'Erreur envoi OTP');
    }

    setIsLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Code OTP doit avoir 6 chiffres');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await verifyOTP(phone, otp);
    if (result.success && result.token) {
      localStorage.setItem('fidelys_wallet_phone', phone);
      localStorage.setItem('fidelys_wallet_token', JSON.stringify(result.token));
      loadWalletCards(phone);
    } else {
      setError(result.error || 'Code invalide');
    }

    setIsLoading(false);
  };

  const handleResendOTP = () => {
    if (countdown === 0) {
      setOtp('');
      handleSendOTP();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fidelys_wallet_phone');
    localStorage.removeItem('fidelys_wallet_token');
    localStorage.removeItem('fidelys_wallet_cards');
    setPhone('');
    setOtp('');
    setCards([]);
    setStep('phone');
    setOtpSent(false);
  };

  const handleCardClick = (card: WalletCard) => {
    // Ouvrir la carte détaillée de cette boutique
    window.location.href = `https://${card.shop.slug}.fidelys.app/c/${card.customer.id}`;
  };

  // Écran de chargement
  if (isLoading && step === 'cards') {
    return <LoadingScreen />;
  }

  // Écran d'erreur
  if (error && step === 'cards') {
    return <ErrorPage message={error} onRetry={() => loadWalletCards(phone)} />;
  }

  // Écran principal - Portefeuille
  if (step === 'cards') {
    return (
      <div className="min-h-screen bg-dark-200 pb-20">
        {/* Header */}
        <div className="sticky top-0 bg-dark-200/95 backdrop-blur-lg border-b border-white/10 z-10">
          <div className="px-4 py-4 safe-top flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">👛</span>
                Mon Portefeuille Fidelys
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {cards.length} carte{cards.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Déconnexion"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Liste des cartes */}
        <div className="px-4 py-6 space-y-4">
          {cards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Aucune carte trouvée</p>
              <p className="text-gray-500 text-sm mt-2">
                Inscrivez-vous en boutique pour obtenir votre carte
              </p>
            </div>
          ) : (
            cards.map((card) => (
              <button
                key={card.customer.id}
                onClick={() => handleCardClick(card)}
                className="w-full text-left"
              >
                <div
                  className="rounded-xl p-4 border transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${card.shop.primary_color}20 0%, ${card.shop.secondary_color}10 100%)`,
                    borderColor: `${card.shop.primary_color}40`
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Logo boutique */}
                    {card.shop.logo_url ? (
                      <img
                        src={card.shop.logo_url}
                        alt={card.shop.name}
                        className="w-12 h-12 object-contain rounded-lg bg-white/10 p-1"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: card.shop.primary_color }}
                      >
                        {card.shop.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {card.shop.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          card.tier?.name === 'Or' ? 'bg-yellow-500/20 text-yellow-400' :
                          card.tier?.name === 'Argent' ? 'bg-gray-500/20 text-gray-300' :
                          'bg-amber-700/20 text-amber-500'
                        }`}>
                          {card.tier?.name || 'Bronze'}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {card.customer.points_balance} points
                        </span>
                      </div>
                      {card.customer.last_visit_at && (
                        <p className="text-gray-500 text-xs mt-1">
                          Dernière visite : {new Date(card.customer.last_visit_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>

                    {/* Flèche */}
                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // Écran OTP
  if (step === 'otp') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-200 px-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <svg
              width="60"
              height="60"
              viewBox="0 0 100 100"
              fill="none"
              className="mx-auto mb-4"
            >
              <circle cx="50" cy="50" r="45" stroke="url(#gradient)" strokeWidth="3" fill="none" />
              <path d="M35 65L50 35L65 65" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="50" cy="25" r="5" fill="url(#gradient)" />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            <h1 className="text-xl font-bold text-white mb-2">
              Code de vérification
            </h1>
            <p className="text-gray-400 text-sm">
              Entrez le code reçu au {phone}
            </p>
          </div>

          {/* Input OTP */}
          <div className="mb-6">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-4 bg-dark-100 border border-white/10 rounded-xl text-center text-2xl font-mono text-white tracking-[0.5em] focus:outline-none focus:border-violet-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Bouton vérifier */}
          <button
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.length !== 6}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-600 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isLoading ? 'Vérification...' : 'Vérifier'}
          </button>

          {/* Renvoi OTP */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {countdown > 0 ? (
                `Renvoi dans ${countdown}s`
              ) : (
                <button
                  onClick={handleResendOTP}
                  className="text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Renvoyer le code
                </button>
              )}
            </p>
          </div>

          {/* Retour */}
          <button
            onClick={() => {
              setStep('phone');
              setOtp('');
              setOtpSent(false);
            }}
            className="w-full mt-4 py-3 text-gray-400 hover:text-white transition-colors"
          >
            ← Changer de numéro
          </button>
        </div>
      </div>
    );
  }

  // Écran téléphone
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-200 px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <svg
            width="60"
            height="60"
            viewBox="0 0 100 100"
            fill="none"
            className="mx-auto mb-4"
          >
            <circle cx="50" cy="50" r="45" stroke="url(#gradient)" strokeWidth="3" fill="none" />
            <path d="M35 65L50 35L65 65" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="50" cy="25" r="5" fill="url(#gradient)" />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
          <h1 className="text-xl font-bold text-white mb-2">
            Mon Portefeuille Fidelys
          </h1>
          <p className="text-gray-400 text-sm">
            Retrouvez toutes vos cartes de fidélité
          </p>
        </div>

        {/* Input téléphone */}
        <div className="mb-6">
          <label className="block text-gray-400 text-sm mb-2">
            Numéro de téléphone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+229 97 00 00 00"
            className="w-full px-4 py-4 bg-dark-100 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        {/* Bouton continuer */}
        <button
          onClick={handleSendOTP}
          disabled={isLoading || phone.length < 13}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-600 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {isLoading ? 'Envoi...' : 'Continuer'}
        </button>

        {/* Error message */}
        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}

        {/* Info */}
        <p className="mt-6 text-gray-500 text-xs text-center">
          Un code de vérification vous sera envoyé par SMS
        </p>
      </div>
    </div>
  );
}
