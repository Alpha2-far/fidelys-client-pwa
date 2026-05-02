import React, { useState, useEffect } from 'react';
import { useShop } from '../contexts/ShopContext';
import { LoyaltyCard } from '../components/LoyaltyCard';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { TransactionHistory } from '../components/TransactionHistory';
import { OffersScreen } from '../components/OffersScreen';
import { BottomNav } from '../components/BottomNav';
import { ErrorPage } from '../components/ErrorPage';
import { LoadingScreen } from '../components/LoadingScreen';

type Tab = 'card' | 'qr' | 'points' | 'offers';

export function ClientDashboard() {
  const { shop, customer, isLoading, error } = useShop();
  const [activeTab, setActiveTab] = useState<Tab>('card');
  const [showQRFullscreen, setShowQRFullscreen] = useState(false);
  const [hasCustomerInUrl, setHasCustomerInUrl] = useState(false);

  // Vérifier si customer_id est dans l'URL
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const customerIndex = pathParts.indexOf('c');
    if (customerIndex >= 0 && pathParts[customerIndex + 1]) {
      const customerId = pathParts[customerIndex + 1];
      localStorage.setItem('fidelys_customer_id', customerId);
      setHasCustomerInUrl(true);
    } else {
      const storedId = localStorage.getItem('fidelys_customer_id');
      if (storedId) {
        setHasCustomerInUrl(true);
      }
    }
  }, []);

  // Gérer le QR fullscreen
  useEffect(() => {
    if (activeTab === 'qr' && !showQRFullscreen) {
      setShowQRFullscreen(true);
    }
  }, [activeTab]);

  // Afficher l'écran de chargement
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Afficher l'erreur
  if (error || !shop) {
    return <ErrorPage message={error || 'Boutique introuvable'} />;
  }

  // Si pas de customer_id, afficher page d'accueil boutique
  if (!hasCustomerInUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-200 px-6">
        <div className="text-center">
          {shop.logo_url ? (
            <img
              src={shop.logo_url}
              alt={shop.name}
              className="w-20 h-20 object-contain rounded-xl mb-4 mx-auto"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-3xl mb-4 mx-auto"
              style={{ backgroundColor: shop.primary_color }}
            >
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}

          <h1 className="text-2xl font-bold text-white mb-2">
            {shop.name}
          </h1>

          <p className="text-gray-400 mb-6">
            Demandez votre carte de fidélité en boutique
          </p>

          <a
            href={`/${shop.slug}`}
            className="inline-block px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 rounded-full font-semibold text-white hover:opacity-90 transition-opacity"
          >
            En savoir plus
          </a>
        </div>
      </div>
    );
  }

  // Si pas de customer, afficher erreur
  if (!customer) {
    return (
      <ErrorPage
        message="Carte introuvable"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-dark-200">
      {/* Contenu principal */}
      <main className="pb-20">
        {activeTab === 'card' && (
          <div className="px-4 pt-6 safe-top">
            {/* Header avec nom boutique */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {shop.logo_url ? (
                  <img
                    src={shop.logo_url}
                    alt={shop.name}
                    className="w-10 h-10 object-contain rounded-lg"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: shop.primary_color }}
                  >
                    {shop.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-bold text-white">
                    {shop.name}
                  </h1>
                  <p className="text-xs text-gray-400">Programme de fidélité</p>
                </div>
              </div>
            </div>

            {/* Carte de fidélité */}
            <LoyaltyCard />

            {/* Bouton QR Code */}
            <div className="mt-6">
              <button
                onClick={() => {
                  setActiveTab('qr');
                  setShowQRFullscreen(true);
                }}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-600 rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6zM7 7h2v2H7zM19 7h2v2h-2zM7 19h2v2H7zM19 19h2v2h-2z" strokeWidth="2" />
                </svg>
                Montrer mon QR Code
              </button>
            </div>
          </div>
        )}

        {activeTab === 'qr' && (
          <QRCodeDisplay fullscreen={showQRFullscreen} onClose={() => {
            setShowQRFullscreen(false);
            setActiveTab('card');
          }} />
        )}

        {activeTab === 'points' && <TransactionHistory />}

        {activeTab === 'offers' && <OffersScreen />}
      </main>

      {/* Navigation */}
      {!showQRFullscreen && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
}
