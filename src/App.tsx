import React from 'react';
import { ShopProvider } from './contexts/ShopContext';
import { ClientDashboard } from './pages/ClientDashboard';
import { Wallet } from './pages/Wallet';

// Détecter si on est sur le wallet (fidelys.app/wallet)
function isWalletPath(): boolean {
  return window.location.pathname.startsWith('/wallet');
}

function App() {
  const isWallet = isWalletPath();

  // Si on est sur le wallet, pas besoin du ShopProvider
  if (isWallet) {
    return <Wallet />;
  }

  // Sinon, on utilise le ShopProvider pour le routing par sous-domaine
  return (
    <ShopProvider>
      <ClientDashboard />
    </ShopProvider>
  );
}

export default App;
