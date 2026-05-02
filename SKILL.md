---
name: fidelys-client-pwa
description: >
  Agent Frontend Client pour Fidelys. Construit la PWA installable avec carte de
  fidelite style bancaire, QR code plein ecran, portefeuille multi-boutiques,
  mode hors-ligne complet, et micro-animations premium. Optimise pour smartphones
  bas de gamme Afrique. Utiliser quand on demande "carte client", "PWA Fidelys",
  "portefeuille multi-boutiques", "QR code", ou "mode offline Fidelys".
metadata:
  author: ON AGENCY
  version: 2.0.0
  category: frontend
  tags: [react, pwa, qr-code, offline, wallet, fidelys]
---

# Fidelys Client PWA Agent

Agent responsable de la PWA carte de fidelite et du portefeuille multi-boutiques.

## When to Use This Skill
- PWA carte client [slug].fidelys.app (Phase 4)
- Portefeuille multi-boutiques fidelys.app/wallet
- QR code, mode hors-ligne, push notifications

## Phase 4 : PWA Client

### Routing par sous-domaine
- Extraire slug depuis window.location.hostname
- SELECT * FROM shops WHERE slug = [slug]
- Si non trouve → page erreur elegante avec logo Fidelys
- Appliquer dynamiquement : couleurs CSS custom properties, logo, nom

### Carte de fidelite (ecran principal)
Design "carte bancaire" premium :
- Logo boutique en haut a gauche
- Nom du client en bas a gauche
- Palier actuel avec badge colore (Bronze=cuivre, Argent=gris, Or=dore)
- Solde de points en gros au centre
- Barre de progression animee vers palier suivant
- Fond avec gradient dynamique (couleurs boutique)
- "Powered by Fidelys" discret en bas

**Animations :**
- Flip 3D au chargement (comme une vraie carte qu'on retourne)
- Barre de progression qui s'anime a l'arrivee
- Confetti quand nouveau palier debloque
- Shimmer effect sur le badge palier

### QR Code
- Bouton "Montrer mon QR" → plein ecran fond blanc
- QR = customer_id encode
- Maximum contraste pour scan facile
- Tap anywhere pour revenir

### Historique transactions
- Liste chronologique (recent en haut)
- Icones + couleurs par type (achat=vert, recompense=or, bonus=bleu)
- Pull-to-refresh

### Promotions
- Promotions actives de la boutique
- Notifications recentes

### PORTEFEUILLE MULTI-BOUTIQUES (fidelys.app/wallet)

**URL :** fidelys.app/wallet (pas un sous-domaine)

**Identification :**
- Premier acces : saisir numero de telephone
- Verification OTP par SMS ou WhatsApp
- Stocker le token en localStorage

**Ecran portefeuille :**
- Toutes les cartes du client empilees verticalement
- Chaque carte = mini-carte avec logo boutique, palier, points
- Tap sur une carte → ouvre la carte detaillee en plein ecran
- Swipe horizontal entre les cartes en vue detaillee
- Tri par derniere visite (plus recente en haut)

**Requete cross-shop :**
```sql
SELECT c.*, s.name, s.logo_url, s.primary_color, s.slug,
       rt.name as tier_name
FROM customers c
JOIN shops s ON c.shop_id = s.id
LEFT JOIN reward_tiers rt ON c.current_tier_id = rt.id
WHERE c.phone = '+229XXXXXXXX'
ORDER BY c.last_visit_at DESC;
```

### PWA et hors-ligne
- manifest.json dynamique (nom boutique, couleurs, icone)
- Service Worker : Cache-First assets, Network-First donnees
- Carte + QR consultables sans internet
- Badge "Hors-ligne" discret
- Sync auto au retour connexion
- Bouton "Installer" si pas encore installe

### Performance
- Bundle < 500 Ko total
- Lazy loading des ecrans secondaires
- Images optimisees (WebP, max 100 Ko pour logos)
- Pas d'animations CSS gourmandes (utiliser transform/opacity only)
- Fonctionne sur Android 8+ (Tecno, Infinix, Itel)
- Contraste eleve pour lisibilite en plein soleil
- First Contentful Paint < 2s sur connexion 3G

### Navigation
- Bottom nav bar avec 4 icones max :
  - Carte | QR | Historique | Promos
- Si portefeuille : ajouter icone Portefeuille
