<!-- # Cahier des charges DESIGN UI – Style Luma (2025)  
**Objectif : reproduction visuelle à 100 % du look & feel de Luma (lu.ma)**  
Pas de description de fonctionnalités, uniquement l’apparence, les couleurs, les formes, les animations et les détails visuels.

### 1. Philosophie visuelle globale
- Ultra-moderne, lumineux, généreusement arrondi
- Sensation « premium yet playful » : propre mais jamais froid
- Beaucoup d’espace blanc, respirant
- Visuels hero (grandes images d’événements) au centre de l’expérience
- Légères touches de fun subtiles (confettis occasionnels, micro-animations)

### 2. Palette de couleurs exacte (mode clair uniquement – Luma n’utilise presque jamais le dark)

| Usage                            | Nom                | Code Hex       |
|----------------------------------|--------------------|----------------|
| Fond principal                   | Blanc pur          | `#FFFFFF`      |
| Fond de cartes et sections       | Blanc cassé très léger | `#FDFDFF` ou `#FAFAFA` |
| Texte principal                  | Noir profond       | `#0F0F0F` ou `#111111` |
| Texte secondaire / dates         | Gris anthracite    | `#555555`      |
| Texte désactivé                  | Gris moyen         | `#999999`      |
| Couleur primaire (boutons, liens)| Bleu Luma signature| `#0062FF`      |
| Bleu hover / focus               | Bleu légèrement plus clair | `#0055EE` |
| Succès / badge                   | Vert vif           | `#00C853`      |
| Fond hover carte                 | Bleu extrêmement pâle | `#F5F8FF`   |
| Bordures très fines              | Gris perle         | `#EEEEEE`      |

### 3. Typographie (identique à Luma)

**Police principale** :  
`SF Pro Display` (Apple) → fallback web :  
`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`

| Niveau                  | Taille mobile | Taille desktop | Weight       |
|-------------------------|---------------|----------------|--------------|
| Titre événement (H1)    | 28px → 36px   | 42px → 48px    | 700          |
| Sous-titre / organisateur| 18px → 20px   | 22px           | 600          |
| Corps de texte          | 16px          | 17px           | 400          |
| Meta (date, lieu)       | 14px          | 15px           | 500          |
| Boutons / labels        | 15px → 16px   | 16px           | 600          |
| Petit texte             | 13px          | 13px           | 400          |

Line-height généreuse : 1.5 → 1.6

### 4. Espacements & rayons
- Unité de base : 8px (mobile) – 12px (desktop)
- Border-radius dominant :
  - Cartes, boutons, inputs → **16px**
  - Petits éléments (badges, tags) → **12px**
  - Coins très arrondis partout (jamais < 12px)
- Padding cartes : 20px – 24px
- Espacement entre cartes : 20px mobile / 32px desktop
- Ombres douces :
  - Cartes au repos : `0 8px 24px rgba(0,0,0,0.08)`
  - Hover/lift : `0 16px 40px rgba(0,0,0,0.12)`

### 5. Détails visuels signature Luma (à reproduire à l’identique)
- Grandes images hero recadrées en 3:2 ou 16:9 avec coins arrondis 16px
- Overlay gradient sombre léger (20 %) sur les images quand il y a du texte par-dessus
- Boutons primaires : fond `#0062FF`, texte blanc, radius 16px, hauteur 48–52px mobile
- Boutons au hover : légère montée + ombre plus forte + brightness 105%
- Badges « Live », « Sold Out », « Free » : petit rectangle fond coloré + texte blanc + radius 8px
- Icônes : SF Symbols style (fine, ligne 1.5–2px) en gris `#666`
- Séparateurs très fins : 1px `#EEEEEE`
- Scrollbars invisibles ou très discrètes

### 6. Animations visuelles précises
- Durée standard : 240ms – 320ms
- Easing : `cubic-bezier(0.16, 1, 0.3, 1)` (springy moderne)
- Hover carte : scale(1.02) + translateY(-4px) + ombre renforcée
- Clic bouton : scale(0.96) très rapide puis retour
- Apparition page : fade + translateY(16px → 0)
- Confettis très discrets sur certaines actions réussies (petits points colorés qui tombent 1 seconde)

### 7. Éléments de thème personnalisé (visuel uniquement)
- Possibilité de changer la couleur primaire (remplace le `#0062FF`)
- Option emoji de fond animé (léger parallax)
- Option « Celebration » : bordures et fonds légèrement irisés ou avec micro-confettis statiques

### 8. Références visuelles impératives
- Page principale : https://lu.ma
- Page découverte : https://lu.ma/discover
- Galerie de 151 écrans réels : https://nicelydone.club/apps/luma
- Captures mobiles : https://refero.design/apps/63
- Vidéo des animations : https://60fps.design/apps/luma

### 9. Livrables design attendus
- Figma file complet avec :
  - Color styles
  - Text styles
  - Component library (cartes, boutons, inputs, badges, headers)
  - Auto-layout parfait
  - Variants (hover, active, disabled)
- Tokens JSON (pour Tailwind ou CSS variables)
- 3 breakpoints : Mobile (375px), Tablet (768px), Desktop (1280px+)

**Phrase à mettre en gros**  
« Quand un utilisateur qui connaît Luma voit l’interface, il doit penser que c’est une nouvelle page de lu.ma ou une version bêta de l’app. »

— Fin du cahier des charges DESIGN UI Luma — -->