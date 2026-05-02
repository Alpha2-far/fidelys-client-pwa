# Handoff Phase 4 — PWA Client + Portefeuille Multi-boutiques

**Date:** 2026-05-01
**Statut:** ✅ Terminé

---

## Résumé

La Phase 4 implémente la PWA client de fidélité avec :
- Routing par sous-domaine pour chaque boutique
- Carte de fidélité digitale design "carte bancaire"
- QR code plein écran pour scan en boutique
- Historique des transactions
- Écran des offres et promotions
- Portefeuille multi-boutiques avec authentification OTP

---

## Architecture

### Routing par sous-domaine

**Extraction du slug :**
```typescript
const slug = window.location.hostname.split('.')[0];
```

**URL pattern :**
- `[slug].fidelys.app/c/[customer_id]` — Carte individuelle
- `fidelys.app/wallet` — Portefeuille multi-boutiques

**Requête boutique :**
```sql
SELECT * FROM shops WHERE slug = '[slug]'
```

---

## Composants implémentés

### 1. ShopContext (`src/contexts/ShopContext.tsx`)

**Rôle :** Gère l'état global de la boutique et du client.

**Fonctionnalités :**
- Extraction automatique du slug depuis le hostname
- Fetch des données boutique depuis Supabase
- Application des couleurs CSS custom properties
- Cache localStorage pour données boutique et client
- Calcul de la progression vers le prochain tier

**Custom properties appliquées :**
```javascript
document.documentElement.style.setProperty('--shop-primary', shop.primary_color);
document.documentElement.style.setProperty('--shop-secondary', shop.secondary_color);
```

---

### 2. LoyaltyCard (`src/components/LoyaltyCard.tsx`)

**Design "carte bancaire" premium :**

```
╭─────────────────────────────────╮
│  [LOGO]     NOM BOUTIQUE       │
│                                 │
│        ★ ★ ★  OR  ★ ★ ★       │
│                                 │
│           450                   │
│          points                 │
│                                 │
│  ████████████░░░ 90%           │
│  Prochain : Platine (500 pts)  │
│                                 │
│  AMINA KOSSOU                  │
│                    Fidelys ♦    │
╰─────────────────────────────────╯
```

**Animations :**
- Flip 3D au chargement (`rotateY`)
- Barre de progression animée (ease-out 1s)
- Shimmer effect sur le badge tier
- Confetti lors du déblocage d'un nouveau tier

**Couleurs des tiers :**
- Bronze : `#b45f06` (cuivre)
- Argent : `#9ca3af` (gris)
- Or : `#eab308` (doré)
- Platine : `#06b6d4` (cyan)

---

### 3. QRCodeDisplay (`src/components/QRCodeDisplay.tsx`)

**Fonctionnalités :**
- QR code = `{ customer_id, shop_id }` encodé en JSON base64
- Mode plein écran avec fond blanc (contraste maximum)
- Nom du client au-dessus du QR
- Tap anywhere pour fermer

**Bibliothèque :** `qrcode` (léger, ~15Ko)

---

### 4. TransactionHistory (`src/components/TransactionHistory.tsx`)

**Affichage :**
- Liste chronologique (récent en haut)
- Scroll infini avec pagination (20 items par page)
- Icônes et couleurs par type :
  - 🟢 Achat (vert)
  - 🟡 Récompense (or)
  - 🔵 Bonus (bleu)
  - ⚪ Ajustement (gris)

**Formatage :**
- Dates relatives avec `date-fns` (locale française)
- Ex: "+12 pts • 6 000 FCFA • il y a 2h"

---

### 5. OffersScreen (`src/components/OffersScreen.tsx`)

**Sections :**
1. Promotions en cours (filtrées par dates)
2. Paliers de fidélité avec barres de progression
3. Notifications récentes

---

### 6. BottomNav (`src/components/BottomNav.tsx`)

**4 onglets :**
- 🃏 Carte
- 📱 QR
- 📊 Points
- 🎁 Offres

**Caractéristiques :**
- Fixe en bas de l'écran
- Safe area pour les devices avec encoche
- Animation de l'onglet actif (scale + couleur)

---

### 7. Wallet (`src/pages/Wallet.tsx`)

**Flux d'authentification :**

1. **Écran téléphone :**
   - Saisie numéro (+229XXXXXXXX)
   - Validation format

2. **Écran OTP :**
   - Envoi code par SMS (Edge Function `verify-phone`)
   - Countdown 30s avant renvoi
   - Validation code 6 chiffres

3. **Écran portefeuille :**
   - Toutes les cartes empilées verticalement
   - Tri par dernière visite
   - Tap sur une carte → ouvre `[slug].fidelys.app/c/[customer_id]`

**Requête cross-shop :**
```sql
SELECT c.*, s.name, s.logo_url, s.primary_color, s.slug, rt.name as tier_name
FROM customers c
JOIN shops s ON c.shop_id = s.id
LEFT JOIN reward_tiers rt ON c.current_tier_id = rt.id
WHERE c.phone = '+229XXXXXXXX'
ORDER BY c.last_visit_at DESC;
```

**Stockage :**
- Token auth dans `localStorage`
- Phone dans `localStorage` pour pré-remplir

---

## PWA et Mode Hors-ligne

### manifest.json (via vite-plugin-pwa)

Généré dynamiquement dans `vite.config.ts` :

```json
{
  "name": "[Nom boutique] - Fidélité",
  "short_name": "[Nom court]",
  "theme_color": "[primary_color]",
  "background_color": "#0F0F14",
  "display": "standalone",
  "start_url": "/c/[customer_id]",
  "icons": [...]
}
```

### Service Worker

**Stratégies de cache :**

| Type | Stratégie | Durée |
|------|-----------|-------|
| Assets (JS/CSS) | Cache-First | 7 jours |
| Données Supabase | Network-First | 24 heures |
| Images boutiques | Cache-First | 7 jours |

**Fonctionnalités offline :**
- Carte de fidélité consultable sans internet
- QR code affichable sans connexion
- Badge "Mode hors-ligne" discret
- Sync auto au retour de connexion

---

## Performance

### Objectifs atteints

- ✅ Bundle total < 500 Ko (code-splitting activé)
- ✅ Animations GPU-accelerated (`transform` + `opacity` uniquement)
- ✅ Police Inter en subset latin
- ✅ Pas de librairies lourdes (lodash, moment.js)

### Optimisations

1. **Code-splitting manuel :**
   ```typescript
   manualChunks: {
     vendor: ['react', 'react-dom', 'react-router-dom'],
     utils: ['qrcode', 'date-fns']
   }
   ```

2. **Images :**
   - Logos en WebP si possible
   - Taille max 100 Ko

3. **CSS :**
   - `will-change: transform` pour animations
   - `backdrop-filter: blur()` pour effets de verre

4. **Cache :**
   - Données boutique : 24h
   - Données client : jusqu'à expiration

---

## Fichiers créés

```
fidelys-client-pwa/
├── public/
│   ├── favicon.svg
│   └── masked-icon.svg
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── ErrorPage.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── LoyaltyCard.tsx
│   │   ├── QRCodeDisplay.tsx
│   │   ├── TransactionHistory.tsx
│   │   └── OffersScreen.tsx
│   ├── contexts/
│   │   └── ShopContext.tsx
│   ├── pages/
│   │   ├── ClientDashboard.tsx
│   │   └── Wallet.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── README.md
└── 04-handoff-phase4.md
```

---

## Prérequis Phase 5

Pour la phase suivante, il faudra :

1. **Edge Function `verify-phone`** — Envoi et vérification OTP
2. **Table `promotions`** — Stockage des offres boutiques
3. **Table `transactions`** — Historique complet
4. **Table `reward_tiers`** — Paliers de fidélité
5. **Web Push** — Notifications push pour promos

---

## Commandes

```bash
# Installation
npm install

# Développement
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

---

## Variables d'environnement

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

---

**Prochaine phase :** Phase 5 — Push Notifications + Analytics
