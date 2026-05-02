# Fidelys Client PWA

Application client de fidélité multi-boutiques pour Fidelys.

## Fonctionnalités

- **Carte de fidélité individuelle** par boutique ([slug].fidelys.app)
- **QR Code** de scan en boutique
- **Historique des transactions** avec scroll infini
- **Offres et promotions** des boutiques
- **Portefeuille multi-boutiques** (fidelys.app/wallet)
- **Mode hors-ligne** complet avec Service Worker
- **Animations premium** optimisées pour mobile

## Installation

```bash
npm install
```

## Configuration

Copier `.env.example` vers `.env` et remplir avec vos credentials Supabase :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Développement

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Structure

```
src/
├── components/
│   ├── BottomNav.tsx         # Navigation bottom bar
│   ├── ErrorPage.tsx         # Page d'erreur
│   ├── LoadingScreen.tsx     # Écran de chargement
│   ├── LoyaltyCard.tsx       # Carte de fidélité
│   ├── QRCodeDisplay.tsx     # Affichage QR code
│   ├── TransactionHistory.tsx # Historique transactions
│   └── OffersScreen.tsx      # Écran offres/promos
├── contexts/
│   └── ShopContext.tsx       # Contexte boutique + client
├── pages/
│   ├── ClientDashboard.tsx   # Dashboard client
│   └── Wallet.tsx            # Portefeuille multi-boutiques
├── types/
│   └── index.ts              # Types TypeScript
├── App.tsx                   # Composant principal
├── main.tsx                  # Point d'entrée
└── index.css                 # Styles globaux
```

## Routing

- `[slug].fidelys.app/c/[customer_id]` - Carte de fidélité client
- `fidelys.app/wallet` - Portefeuille multi-boutiques

## PWA

Le manifest.json est généré dynamiquement via `vite-plugin-pwa` dans `vite.config.ts`.

## Performance

- Bundle total < 500 Ko (code-splitting activé)
- Animations GPU-accelerated (transform/opacity only)
- Images optimisées WebP
- First Contentful Paint < 2s sur 3G
