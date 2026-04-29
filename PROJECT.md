# Body Institut — Documentation complète

> Tunnel de conversion ultra-direct pour **Body Institut** — institut minceur premium à Paris 18.
> Hero minimal → simulateur unifié (1 form 3 champs + 5 questions) → résultat personnalisé → lead enregistré.

**Stack** · Next.js 14 (App Router) · TypeScript · TailwindCSS · Framer Motion · SQLite (better-sqlite3) · Nodemailer · Zod
**Statut** · v3.0 — funnel ultra-direct (avril 2026) · form 3 champs · routing automatique · prêt campagnes Meta Ads

---

## 📋 Table des matières

1. [Vue d'ensemble](#-vue-densemble)
2. [Arborescence du projet](#-arborescence-du-projet)
3. [Architecture one-page](#-architecture-one-page)
4. [Stack technique](#-stack-technique)
5. [Design system](#-design-system)
6. [Sections publiques](#-sections-publiques)
7. [Les 3 simulateurs](#-les-3-simulateurs)
8. [Moteur de recommandation](#-moteur-de-recommandation)
9. [Offre duo cures −40 %](#-offre-duo-cures-40)
10. [Pipeline de génération de lead](#-pipeline-de-génération-de-lead)
11. [Base de données SQLite](#-base-de-données-sqlite)
12. [Export CSV](#-export-csv)
13. [Emails transactionnels](#-emails-transactionnels)
14. [Console admin](#-console-admin)
15. [Sécurité & RGPD](#-sécurité--rgpd)
16. [Responsive & mobile UX](#-responsive--mobile-ux)
17. [Démarrage local](#-démarrage-local)
18. [Variables d'environnement](#-variables-denvironnement)
19. [Déploiement](#-déploiement)
20. [Maintenance & évolutions](#-maintenance--évolutions)

---

## 🎯 Vue d'ensemble

### Objectif

Funnel **100 % orienté conversion**. Le visiteur arrive, voit un héros minimal avec un seul gros bouton, scrolle (ou clique) directement sur le simulateur, donne 3 infos, répond à 5 questions et obtient une recommandation chiffrée. Zéro distraction, zéro page secondaire, zéro friction.

Chaque lead enregistré contient :

- le soin recommandé (Adipologie / Esthe Shape / Pressothérapie) — choisi automatiquement
- l'objectif, la zone, l'intensité, le mode de vie
- un budget estimé calculé sur les tarifs réels
- les 3 coordonnées essentielles (prénom, téléphone, email) + RGPD consent
- un email de confirmation automatique
- une notification admin instantanée

### Principes UX (v3 — conversion-first)

- **Un seul gros CTA en hero** — "Commencer la simulation", visible sans scroll
- **3 champs uniquement** au formulaire de lead (prénom + téléphone + email + RGPD)
- **5 questions unifiées** — objectif, zone, intensité, mode de vie, budget
- **Auto-advance** — chaque réponse fait avancer automatiquement (sauf la dernière)
- **Routing automatique** vers le bon soin selon l'objectif (`lib/unified-flow.ts`)
- **Mobile-first** — app-like avec bottom nav + bouton central "Simuler" surbrillance
- **2 minutes max** du clic sur le CTA à la réception du résultat
- **Lead sécurisé dès l'étape 1** — sauvegarde partielle après le formulaire (POST `/api/leads/start`), enrichie ensuite
- **RGPD natif** — consentement bloquant, zéro cookie marketing, données minimales

### Résultats attendus (ordre de grandeur)

| Métrique | Cible |
|---|---|
| Taux de complétion form (3 champs) | > 60 % |
| Taux de complétion simulateur (5 Q) | > 50 % |
| Taux de conversion page → lead | 5 – 10 % |
| Temps moyen du tunnel | < 2 min |
| Leads qualifiés / 100 visiteurs | 5 à 10 |

---

## 🗂 Arborescence du projet

```
bodyinstitut/
├── app/
│   ├── layout.tsx                 Layout racine (Header + Footer + bottom nav + AdminFab)
│   ├── globals.css                Tokens CSS + classes @layer components
│   ├── page.tsx                   Page UNIQUE (Hero ultra-mini + Simulateur inline + Mini About)
│   ├── admin/
│   │   ├── layout.tsx             Wrapper admin (fond clair)
│   │   ├── page.tsx               Dashboard leads (polling 10s + filtres + stats)
│   │   └── login/page.tsx         Login HMAC (avec Suspense pour useSearchParams)
│   └── api/
│       ├── leads/
│       │   ├── start/route.ts     POST étape 1 — création partielle (3 champs + consent)
│       │   └── complete/route.ts  POST étape 2 — enrichissement avec answers + recommandation
│       └── admin/
│           ├── login/route.ts     POST — crée la session HMAC
│           ├── logout/route.ts    POST — efface le cookie
│           ├── me/route.ts        GET  — retourne l'utilisateur connecté
│           └── leads/
│               ├── route.ts       GET liste · POST création manuelle
│               ├── [id]/route.ts  GET · PATCH (statut) · DELETE
│               ├── export/route.ts GET — CSV BOM UTF-8
│               └── import/route.ts POST — import JSON ou CSV
│
├── components/
│   ├── Header.tsx                 Navbar desktop épurée (Accueil · Simulateur · À propos)
│   ├── Footer.tsx                 Footer minimal
│   ├── MobileBottomNav.tsx        Bottom nav mobile (Accueil + Simuler central surbrillance + À propos)
│   ├── AdminFab.tsx               Bouton flottant discret → ouvre AdminLoginModal
│   ├── AdminLoginModal.tsx        ★ Popup login admin (email + password)
│   ├── Reveal.tsx                 Animation d'apparition au scroll
│   ├── SimulatorFlow.tsx          ★ WIZARD unifié (form 3 champs + 5 questions + résultat)
│   ├── BodySilhouette.tsx         Silhouette SVG stylisée avec zone highlight (legacy)
│   ├── EvolutionChart.tsx         Courbe SVG 6 semaines (legacy)
│   └── admin/
│       ├── StatusPill.tsx         Badge statut (6 états)
│       └── LeadDrawer.tsx         Fiche latérale lead
│
├── lib/
│   ├── unified-flow.ts            ★ 5 questions unifiées + smart picker (objective → simulator)
│   ├── simulators.ts              ★ Configs des 3 soins (Adipologie / Esthe Shape / Pressothérapie)
│   ├── recommend.ts               ★ Moteur de recommandation + offre duo − 40 %
│   ├── db.ts                      SQLite (better-sqlite3) + migrations idempotentes
│   ├── validation.ts              Schémas Zod (leadStart 3 champs / leadComplete / login)
│   ├── email.ts                   Confirmation client + notification admin
│   ├── ai.ts                      Analyse textuelle (rule-based + OpenAI optionnel)
│   ├── auth.ts                    HMAC SHA-256 stateless (edge-safe)
│   ├── rate-limit.ts              Sliding-window en mémoire
│   └── types.ts                   Types partagés (LeadRecord, LeadStatus)
│
├── middleware.ts                  Protection /admin/* et /api/admin/*
├── tailwind.config.ts             Tokens couleur, shadows, keyframes
├── next.config.js                 Next config (remotePatterns, externalPackages)
├── tsconfig.json
├── package.json
├── .env.example                   Template des variables d'environnement
├── data/                          SQLite runtime (auto-créé)
│   └── bodyinstitut.db
├── README.md                      Quick start
└── PROJECT.md                     ← Ce fichier
```

★ = fichiers cœur métier

---

## 🏗 Architecture one-page

### Schéma fonctionnel

```
┌────────────────────────────────────────────────────────┐
│                       /  (page unique — 3 sections)          │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  #accueil  Hero ultra-direct — 1 gros CTA              │  │
│  └─────────────────────────────────────┬────────────────────────────┘  │
│                                  │                            │
│                                  ▼  (clic = scroll smooth)   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  #simulator   SimulatorFlow inline (80 % de la page)    │  │
│  │    1. Form 3 champs (POST /api/leads/start → id)        │  │
│  │    2. 5 questions auto-advance                           │  │
│  │    3. Résultat (POST /api/leads/complete → reco serveur)│  │
│  └────────────────────────────────────────────────────────┘  │
│                                  │                            │
│                                  ▼                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  #about     Mini bloc — 3 lignes max + CTA Planity      │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Routes réelles

| URL | Rôle | Type |
|---|---|---|
| `/` | Page unique (Hero + Simulateur inline + Mini About) | Static |
| `/admin/login` | Login admin (page dédiée — fallback) | Static + client |
| `/admin` | Dashboard leads (polling temps réel 10 s) | Static + client |
| `/api/leads/start` | POST public — étape 1 : création partielle (3 champs) | Dynamic |
| `/api/leads/complete` | POST public — étape 2 : enrichissement + recommandation | Dynamic |
| `/api/admin/login` | POST — auth (utilisé par AdminLoginModal) | Dynamic |
| `/api/admin/logout` | POST — efface session | Dynamic |
| `/api/admin/me` | GET — profil courant (auto-redirect AdminFab) | Dynamic |
| `/api/admin/leads` | GET list / POST import | Dynamic |
| `/api/admin/leads/[id]` | GET / PATCH / DELETE | Dynamic |
| `/api/admin/leads/export` | GET CSV (BOM UTF-8) | Dynamic |
| `/api/admin/leads/import` | POST — import JSON ou CSV | Dynamic |

### Navigation

**Desktop**
- Navbar fixe en haut avec logo + 3 liens (`Accueil` · `Simulateur` ★ surbrillance · `À propos`).
- Le bouton "Simulateur" est en gras turquoise au centre, jouant le rôle de CTA permanent.
- Scroll-spy : l'onglet actif est mis en évidence selon la section visible.

**Mobile**
- Navbar haut allégée (logo uniquement).
- **Bottom nav fixe** avec layout `Accueil · [★ Simuler] · À propos`.
- Le bouton central "Simuler" est en surbrillance brand (`bg-brand-500`, surcréneau, ombre), toujours visible — c'est le CTA permanent.
- `AdminFab` (bouton rond discret) positionné à `bottom-[92px]` sur mobile, `bottom-6` sur desktop — ne chevauche jamais la bottom nav.
- Au clic sur le FAB : appel à `/api/admin/me` ; si déjà authentifié → redirect direct vers `/admin`, sinon → ouvre **AdminLoginModal** (popup).

---

## 🧰 Stack technique

| Couche | Lib | Version | Rôle |
|---|---|---|---|
| Framework | `next` | 14.2.x | App Router, RSC, API routes |
| UI | `react` | 18.x | Rendu client |
| Style | `tailwindcss` | 3.4.x | Utility-first, design tokens |
| Animation | `framer-motion` | 11.x | Transitions, reveal on scroll |
| Icônes | `lucide-react` | latest | Stroked icons cohérents |
| Base de données | `better-sqlite3` | 11.x | SQLite synchrone, WAL |
| Validation | `zod` | 3.x | Schémas côté serveur |
| Email | `nodemailer` | 6.x | SMTP |
| IA (optionnel) | `openai` HTTP | — | Analyse textuelle (fallback : rule-based) |

**Node** · 18.17+ (recommandé 20+)
**Native modules** · `better-sqlite3` nécessite un `npm rebuild` après changement de version Node (sinon `NODE_MODULE_VERSION` mismatch).

---

## 🎨 Design system

### Palette (Tailwind `tailwind.config.ts`)

| Nom | Valeurs | Usage |
|---|---|---|
| `brand` | 50 → 900 (turquoise) | **Couleur principale** — CTA, liens, focus |
| `forest` | 50 → 900 (vert foncé) | **Accent** — titres, texte primaire |
| `surface` | 0, 50, 100, 200, 300, 400, 500, 700, 900 | Backgrounds, bordures, gris texte |

**Couleurs clés**

```
brand-500  #27b4ab   ← turquoise primaire (CTA, glow)
brand-600  #1b958d   ← hover
brand-50   #eefbfa   ← fond doux, pill backgrounds
forest-800 #0f2e2a   ← titres, texte primaire
forest-700 #153d37   ← texte body
surface-50  #fafbfb  ← fond section atténué
surface-200 #e7ecec  ← bordures par défaut
```

**Glows par simulateur** (cohérents avec la marque) :

| Simulateur | Glow | Équivalent Tailwind |
|---|---|---|
| Adipologie | `#27b4ab` | `brand-500` |
| Esthe Shape | `#155c58` | `brand-800 / forest-700` |
| Pressothérapie | `#4dcac1` | `brand-400` |

### Typographie

Font stack : **Inter** (+ fallback système Apple / Segoe / system-ui).

Classes utilitaires dans `app/globals.css` :

```css
.display-hero    /* clamp(2.5rem, 8vw, 6.5rem) — titre accueil */
.display-section /* clamp(2rem, 5vw, 4rem)    — titre section */
.eyebrow         /* pill turquoise uppercase tracking-wide    */
```

### Boutons unifiés

Tous les CTAs utilisent les classes :

```css
.btn           /* base : rounded-full px-6 py-3 text-sm transition */
.btn-primary   /* bg-brand-500 text-white shadow-brand-glow       */
.btn-secondary /* border forest-800, fond transparent             */
.btn-ghost     /* border surface-200, fond blanc                  */
.btn-lg        /* px-8 py-4 text-base                              */
.btn-sm        /* px-4 py-2 text-xs                                */
```

### Ombres & effets

```
shadow-brand-glow  0 20px 60px -20px rgba(39,180,171,0.45)
shadow-card-soft   0 10px 40px -12px rgba(15,46,42,0.10)
shadow-card-hover  0 20px 60px -15px rgba(15,46,42,0.18)
```

### Animations

- `Reveal` component — apparition `y: 24 → 0` + `opacity 0 → 1`, déclenchée `whileInView` (once).
- Page wizard — transitions `AnimatePresence` entre chaque écran.
- Silhouette avant/après — scale progressif selon intensité.
- Chart 6 semaines — tracé `pathLength 0 → 1` ease-out.

---

## 🏠 Sections publiques (v3 — conversion-first)

L'arborescence visuelle est volontairement minimale : **3 sections**, aucune page secondaire, zéro distraction.

### 1. Hero `#accueil`

Ultra-direct. Visible entièrement sans scroll, même sur mobile.

- Eyebrow : `Body Institut · Paris 18`
- **Titre** : *Découvrez votre protocole en 2 minutes.* (gradient turquoise sur "2 minutes")
- **Sous-titre** : Analyse personnalisée gratuite · Bilan offert.
- **UN SEUL gros CTA** : `Commencer la simulation` — plein largeur sur mobile, large sur desktop, shadow brand
- Trust line : `2 min · sans engagement · 100 % gratuit`
- Le clic sur le CTA scrolle smoothly vers `#simulator` (pas de modal, pas de redirection).

### 2. Simulateur `#simulator` — 80 % de la page

C'est **la** section principale. Carte blanche cadrée dans un fond `surface-50`. Contient `<SimulatorFlow />` directement (pas de modal, pas de cartes à choisir).

**Phase 1 — Form contact (étape 1)**
- 3 champs uniquement : Prénom, Téléphone, Email.
- Checkbox RGPD obligatoire.
- Bouton : `Démarrer la simulation`.
- Submit → `POST /api/leads/start` → lead ID.

**Phase 2 — 5 questions (étape 2)**
- 1 écran par question, options en grille tap-friendly.
- **Auto-advance** après sélection (sauf dernière question : bouton explicite `Voir mon résultat`).
- 5 questions unifiées :
  1. **Objectif** — Perdre / Raffermir / Drainer (clé du routing)
  2. **Zone** — Ventre / Cuisses / Fessiers / Bras / Jambes / Plusieurs zones
  3. **Intensité** — Léger / Moyen / Important
  4. **Mode de vie** — Sédentaire / Occasionnel / Régulier
  5. **Budget** — < 150 / 150-350 / 350-700 / > 700 €

**Phase 3 — Résultat**
- Submit auto sur la dernière question → `POST /api/leads/complete`.
- Affiche : soin recommandé, prix séance, prix cure, total estimé, résultat estimé.
- Si l'objectif déclenche un soin complémentaire, affiche le bloc **Offre duo − 40 %**.
- 2 CTA : `Réserver mon bilan offert` (Planity) + `Recommencer` (reset l'état).

### 3. Mini À propos `#about`

3 lignes max, optionnel. Sert de rassurance finale.

- Eyebrow : `Body Institut`
- **Titre** : *10 ans d'expertise minceur, à Paris 18.*
- 1 paragraphe court : Cryolipolyse · Radiofréquence · Pressothérapie. Protocoles sur-mesure, suivi personnalisé, bilan offert.
- 1 CTA : `Réserver un bilan offert` (Planity, fallback pour ceux qui sautent le simulateur).

---

## ⚙️ Les 3 simulateurs

Chaque simulateur suit le schéma `SimulatorConfig` (`lib/simulators.ts`) :

```ts
interface SimulatorConfig {
  id: SimulatorId;           // "adipologie" | "estheshape" | "pressotherapie"
  name: string;
  tagline: string;
  promise: string;
  description: string;
  accent: string;            // classe Tailwind texte
  glow: string;              // hex color pour highlights
  hue: string;
  stat: { value, unit, label };
  benefits: string[];
  image: string;
  expectedResult: string;
  pricing: Record<ZoneTier, PricingTier>;
  defaultTier: ZoneTier;
  questions: Question[];
}
```

### ① Adipologie — Cryolipolyse

> *Réduction localisée de la masse adipeuse, sans chirurgie ni éviction sociale.*

**Stat mis en avant** · −6 cm en cure complète
**Résultat attendu** · −4 à −6 cm sur la zone ciblée

**Tarifs**

| Tier | Zones | Séance | Cure (5 séances) |
|---|---|---|---|
| Petite | Bras, genoux | **70 €** | **350 €** |
| Moyenne | Ventre, poignées d'amour, intérieur cuisses, culotte de cheval, mollets | **105 €** | **525 €** |
| Grande | Cuisses entières, ventre étendu | **140 €** | **700 €** |

**Flow (5 étapes)**

1. **Objectif** — Léger / Moyen / Important → définit l'intensité
2. **Zone** — 9 zones mappées à un tier (petite/moyenne/grande)
3. **Cellulite** — Oui / Non → si oui, suggère Pressothérapie en duo
4. **Mode de vie (sport)** — Oui / Non → si non, suggère Esthe Shape en duo
5. **Budget** — < 150 / 150-350 / 350-700 / > 700 → force mode single si < 150

### ② Esthe Shape — Radiofréquence + EMS

> *Tonification musculaire et fermeté de la peau.*

**Stat mis en avant** · +25 % fermeté en 6 séances
**Résultat attendu** · Silhouette tonique, peau raffermie

**Tarifs** (tarif unique quel que soit le tier)

| Mode | Prix |
|---|---|
| Séance | **70 €** |
| Cure 6 séances (dont 1 offerte) | **350 €** |

**Flow (4 étapes)**

1. **Zone** — Ventre / Fessiers / Cuisses / Plusieurs zones
2. **Objectif** — Raffermir / Tonifier / Redessiner / Relancer une activité
3. **Niveau d'intensité** — Léger / Moyen / Important
4. **Mode de vie** — Jamais / Parfois / Régulièrement

### ③ Pressothérapie — Drainage lymphatique

> *Drainage lymphatique, jambes légères, silhouette affinée.*

**Stat mis en avant** · −2 kg d'eau retenue (cure)
**Résultat attendu** · Jambes plus légères, silhouette drainée

**Tarifs**

| Tier | Description | Séance | Cure (5 séances) |
|---|---|---|---|
| Petite | Bras ou abdomen seul | **25 €** | **125 €** |
| Moyenne | Jambes ou ventre | **30 €** | **150 €** |
| Grande | Jambes + ventre + bras | **45 €** | **225 €** |

**Flow (4 étapes)**

1. **Besoin** — Jambes lourdes / Rétention d'eau / Récup sportive / Drainage général / Affinement
2. **Zone** — Petite / Moyenne / Grande
3. **Fréquence des symptômes** — Occasionnel / Régulier / Fréquent → intensité
4. **Objectif final** — Confort / Drainage / Silhouette / Complément

---

## 🧠 Moteur de recommandation

Implémenté dans `lib/recommend.ts`. Trois entrées : `sim`, `answers`. Retourne un objet `Recommendation`.

### Étape 1 — Intensité

```
resolveIntensity(sim, answers)
  → parcourt les questions, trouve l'option avec meta.intensity
  → retourne "leger" | "moyen" | "important"
  → fallback : "moyen"
```

### Étape 2 — Tier de zone

```
resolveZoneTier(sim, answers)
  → trouve la réponse à la question "zone", lit meta.tier
  → retourne "small" | "medium" | "large"
  → fallback : sim.defaultTier
```

### Étape 3 — Mode single vs cure

```
decideMode(sim, answers, intensity)
  ── Si budget (Adipologie) et tier 1 (< 150 €)  → "single"
  ── Si intensity === "leger"                    → "single"
  ── Sinon                                        → "cure"
```

### Étape 4 — Prix primaire

```
primary.pricePerSession  = pricing[tier].pricePerSession
primary.cureTotal        = pricing[tier].cureTotal
primary.recommendedAmount = mode === "cure" ? cureTotal : pricePerSession
```

### Étape 5 — Suggestion complémentaire

Déclenchée **uniquement** si `mode === "cure"` :

| Primaire | Condition | Suggestion |
|---|---|---|
| Adipologie | `cellulite === "oui"` | Pressothérapie (drainage) |
| Adipologie | `sport === "non"` | Esthe Shape (tonification) |
| Esthe Shape | `objective ∈ {raffermir, redessiner}` | Pressothérapie |
| Pressothérapie | `objective === "silhouette"` ou `need === "affinement"` | Adipologie |
| Pressothérapie | `objective === "complement"` | Esthe Shape |

### Étape 6 — Texte résultat

```
protocolText   = `Cure <tierLabel> · <cureSize> séances · <cureTotal> €`
resultText     = sim.expectedResult
answerLabels   = { [step]: optionLabel }
zoneLabel      = label de l'option zone choisie
goalLabel      = label de l'option objectif / besoin
```

---

## 🎁 Offre duo cures −40 %

Si une suggestion complémentaire est retenue :

```
baseTotal    = primaryCure + complementaryCure
cheaper      = min(primaryCure, complementaryCure)
discount     = round(cheaper × 0.40)
finalTotal   = baseTotal - discount
```

### Exemples validés

| Scénario | Calcul | Résultat |
|---|---|---|
| Adipologie ventre/moyen + cellulite=oui → Pressothérapie moyenne | 525 + 150 − (150 × 0.4 = 60) | **615 €** ✓ |
| Esthe Shape multi/raffermir → Pressothérapie grande | 350 + 225 − (225 × 0.4 = 90) | **485 €** ✓ |
| Pressothérapie moyenne/silhouette → Adipologie moyenne | 150 + 525 − (150 × 0.4 = 60) | **615 €** ✓ |
| Adipologie budget < 150 (mode single) | aucune suggestion, mode = séance | **70 €** ✓ |

---

## 🔌 Pipeline de génération de lead (2 étapes — conversion-first)

Le lead est capturé **dès la fin du formulaire** (avant les questions), puis enrichi en fin de simulation. Si l'utilisateur abandonne entre les 2, le lead est déjà dans la base — prospect récupérable.

### Flux complet

```
┌────────────────────────────────────────────────────────────┐
│  1. Visiteur arrive sur /                                    │
│     → voit le hero + bouton géant "Commencer la simulation"  │
├────────────────────────────────────────────────────────────┤
│  2. Clic CTA → scroll smooth vers #simulator                 │
│     → SimulatorFlow chargé inline (pas de modal)             │
├────────────────────────────────────────────────────────────┤
│  3. Phase form — 3 champs (prénom + téléphone + email)        │
│     → Submit → POST /api/leads/start                          │
│        ├─ rate-limit (5 req/min/IP)                            │
│        ├─ honeypot `company` vide                              │
│        ├─ validation Zod (leadStartSchema slim)                │
│        ├─ INSERT SQLite (placeholder simulator/goal/zone)      │
│        └─ → retour { ok, id }                                  │
├────────────────────────────────────────────────────────────┤
│  4. Phase questions — 5 écrans, auto-advance                 │
│     → état local answers : { objective, zone, intensity,     │
│        lifestyle, budget }                                    │
├────────────────────────────────────────────────────────────┤
│  5. Clic "Voir mon résultat" → POST /api/leads/complete      │
│     ├─ rate-limit (10 req/min/IP)                             │
│     ├─ validation Zod (leadCompleteSchema)                    │
│     ├─ pickRecommendedSimulator(answers) → simulatorId        │
│     ├─ mapToSimulatorAnswers(answers, simulatorId)            │
│     ├─ recommend(sim, answers) → prix + duo (coté serveur)    │
│     ├─ generateAnalysis() (rule-based ou OpenAI)              │
│     ├─ updateLeadSimulation(id, ...) → enrichit le row SQLite │
│     ├─ Email confirmation client (HTML)                       │
│     └─ Email notification admin (texte)                       │
├────────────────────────────────────────────────────────────┤
│  6. Réponse { ok, id, simulator, recommendation, analysis }  │
│     → ResultStep : soin + prix + résultat estimé + duo        │
│     → CTA Planity + Recommencer                              │
└────────────────────────────────────────────────────────────┘
```

### Routing automatique du soin (`lib/unified-flow.ts`)

```ts
pickRecommendedSimulator(answers):
  objective === "perdre"     → "adipologie"        // cryolipolyse
  objective === "raffermir"  → "estheshape"        // radiofréquence + EMS
  objective === "drainer"    → "pressotherapie"   // drainage lymphatique
```

Une fois le soin choisi, `mapToSimulatorAnswers()` traduit les réponses unifiées vers le schéma spécifique du soin (ex : `cellulite`, `sport`, `level`, `tier`...) avant d'appeler `recommend()` qui produit le prix réel et la suggestion duo.

### Validation Zod (`lib/validation.ts`)

**Étape 1 — `leadStartSchema` (ULTRA-SLIM)**

```ts
  company       honeypot  max(0)  // vide obligatoire
  firstName     string    trim min(1) max(80)
  email         string    email max(160)
  phone         regex     /^[+0-9 .\-()]{6,20}$/
  consent       literal(true)  // RGPD bloquant
  // Optionnels (legacy / import) :
  lastName?     string    max(80)
  city?         string    max(80)
  age?          number    int min(15) max(99)
  sex?          enum      ["femme","homme","autre"]
  simulator?    string    max(40)   // défaut "auto"
```

**Étape 2 — `leadCompleteSchema`**

```ts
  id            uuid      // retourné par /start
  simulator?    string    // défaut "auto" → router automatique
  answers       record    { string → string max(60) }
  message?      string    max(2000)
```

### Rate limiting

Implémenté dans `lib/rate-limit.ts` (sliding-window mémoire).

- **/api/leads/start** : 5 requêtes / 60 s / IP
- **/api/leads/complete** : 10 requêtes / 60 s / IP
- **/api/admin/login** : 8 requêtes / 60 s / IP
- En cas de dépassement → HTTP 429 + header `Retry-After`

---

## 💾 Base de données SQLite

### Chemin

`data/bodyinstitut.db` — créé automatiquement au premier lancement.
**WAL mode** activé (meilleure concurrence lectures/écritures).

### Table `leads`

```sql
CREATE TABLE leads (
  id            TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,

  -- Identité
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT NOT NULL,
  city          TEXT,
  age           INTEGER,
  sex           TEXT,              -- "femme" | "homme" | "autre"
  height_cm     INTEGER,
  weight_kg     INTEGER,

  -- Simulation
  simulator     TEXT NOT NULL,     -- nom affiché
  simulator_id  TEXT,              -- "adipologie" | "estheshape" | "pressotherapie"
  goal          TEXT NOT NULL,
  zone          TEXT NOT NULL,
  zone_tier     TEXT,              -- "small" | "medium" | "large"
  intensity     TEXT,              -- "leger" | "moyen" | "important"
  sport         TEXT,
  cellulite     TEXT,
  budget        INTEGER NOT NULL,  -- legacy (= price_total)
  budget_client TEXT,              -- libellé du palier budget client
  availability  TEXT,
  message       TEXT,

  -- Prix & recommandation
  mode                     TEXT,    -- "single" | "cure"
  price_session            INTEGER,
  price_cure               INTEGER,
  price_total              INTEGER, -- après remise duo
  duo_applied              INTEGER NOT NULL DEFAULT 0,
  complementary_simulator  TEXT,
  complementary_reason     TEXT,
  protocol                 TEXT,
  result                   TEXT,
  ai_notes                 TEXT,
  analysis                 TEXT,

  -- RGPD & suivi
  consent     INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'nouveau',
  source_ip   TEXT
);

CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_status     ON leads(status);
CREATE INDEX idx_leads_simulator  ON leads(simulator);
CREATE INDEX idx_leads_email      ON leads(email);
```

### Migrations idempotentes

`lib/db.ts::bootstrap()` lit `PRAGMA table_info(leads)` et ajoute les colonnes manquantes avec `ALTER TABLE ADD COLUMN` — sans casser les bases existantes.

### 6 statuts lead

| Code | Libellé | Couleur badge |
|---|---|---|
| `nouveau` | Nouveau | brand (turquoise) |
| `a_rappeler` | À rappeler | amber |
| `contacte` | Contacté | sky |
| `rdv_pris` | RDV pris | indigo |
| `converti` | Converti | emerald |
| `perdu` | Perdu | gris |

---

## 📤 Export CSV

**Endpoint** · `GET /api/admin/leads/export?...`
**Encoding** · UTF-8 + BOM (Excel friendly)
**Nom fichier** · `body-institut-leads-YYYY-MM-DD.csv`

### 28 colonnes (ordre exact)

```
Date, Prénom, Nom, Email, Téléphone, Ville, Âge, Sexe, Taille (cm),
Poids (kg), Objectif, Zone, Intensité, Sport, Cellulite, Budget client,
Simulateur, Soin recommandé, Prix séance, Prix cure, Prix total estimé,
Offre duo, Soin complémentaire, Disponibilités, Message, Statut, Analyse, ID
```

Chaque champ est échappé (`escapeCsv`) : guillemets doublés si le contenu contient `,`, `"` ou retour-ligne.

Les filtres passés en query string de l'URL sont répercutés sur l'export (recherche, statut, simulateur, plage de dates, min/max budget).

---

## ✉️ Emails transactionnels

### Configuration

Variables d'environnement :

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Body Institut <no-reply@bodyinstitut.fr>"
BRAND_REPLY_TO=contact@bodyinstitut.fr
ADMIN_NOTIFY_EMAIL=contact@bodyinstitut.fr
BRAND_NAME="Body Institut"
BOOKING_URL=https://www.planity.com/...
```

Si `SMTP_HOST` absent → les emails sont **loggués en console** (utile en dev).
Si `ADMIN_NOTIFY_EMAIL` absent → l'email admin est skip.

### Email client (HTML)

- Titre : "Body Institut — Votre analyse personnalisée est prête"
- Contenu : prénom, soin recommandé, zone, protocole, prix séance, prix cure, total estimé, message perso si fourni, CTA Planity.
- Design responsive HTML table (compatible Gmail / Outlook).

### Email admin (texte)

- Subject : "[Body Institut] Nouveau lead · Prénom Nom"
- Contenu : toutes les infos du lead + recommandation pour prise de contact immédiate.

### Fire-and-forget

Les deux envois sont **non bloquants** : ils sont lancés en parallèle et le `catch` log les erreurs sans jamais faire échouer la réponse API au client.

---

## 🧑‍💼 Console admin

### Accès

1. Bouton `AdminFab` (cadenas discret bottom-right) → clic → `/admin`
2. Middleware Next intercepte, check le cookie `bi_admin`
3. Pas de session → redirect `/admin/login?from=/admin`
4. Login réussi → cookie HMAC signé 7 jours → redirect `from`

### Dashboard `/admin`

**4 StatCards** en haut :

- Total leads (all-time)
- 7 derniers jours
- Convertis
- Pipeline en € (somme des `price_total`)

**Toolbar**
- Recherche full-text (nom, email, téléphone, objectif, zone)
- Filtre statut (6 + "Tous")
- Filtre simulateur
- Tri (created_at / budget / last_name × asc/desc)
- **Bouton Export CSV** turquoise

**Tableau** (paginé 25 par page)
- Date · Contact · Soin · Objectif · Budget · Statut
- Clic sur une ligne → ouvre `LeadDrawer` (fiche latérale droite)

### `LeadDrawer`

Fiche détaillée complète :
- Identité + morphologie (Ville / Âge / Sexe / Taille-Poids)
- Simulation : Soin · Total estimé (accent) · Objectif · Zone · Intensité · Sport · Cellulite · Budget client · Prix séance · Prix cure · Protocole · Résultat attendu · Offre duo
- Actions rapides : mailto + tel
- **Status switcher** (6 boutons) — mise à jour en temps réel
- Analyse IA
- Note client (message libre)
- Bouton supprimer (rouge) avec `confirm()`

### API admin

| Endpoint | Méthode | Rôle |
|---|---|---|
| `/api/admin/leads` | GET | Liste + stats (filtres via query string) |
| `/api/admin/leads` | POST | Création manuelle d'un lead |
| `/api/admin/leads/[id]` | GET | Récupérer un lead |
| `/api/admin/leads/[id]` | PATCH | Changer le statut |
| `/api/admin/leads/[id]` | DELETE | Supprimer |
| `/api/admin/leads/export` | GET | CSV |
| `/api/admin/leads/import` | POST | Import JSON array ou CSV |

---

## 🛡 Sécurité & RGPD

### Authentification admin

- **HMAC SHA-256** signé (edge-safe, WebCrypto)
- Format du cookie : `body.sig`
  - `body` = JSON base64url `{ sub, iat, exp }`
  - `sig` = HMAC(secret, body)
- TTL : **7 jours**
- Secret dérivé de `AUTH_SECRET` (32+ chars) ou fallback depuis `ADMIN_PASSWORD` en dev
- `checkCredentials()` — comparaison timing-safe

### Validation serveur

Tous les endpoints publics passent par Zod — **jamais** de confiance dans le payload client. La recommandation est recalculée côté serveur indépendamment de ce que le client a pu calculer.

### Anti-spam

- **Honeypot** : champ `company` doit être vide (`z.string().max(0)`)
- **Rate limit** : 5 requêtes / 60 s / IP (sliding window mémoire)
- **Bots qui rempliraient un champ caché** → rejetés silencieusement avec 400

### Protection routes admin

`middleware.ts` matcher `/admin/:path*` et `/api/admin/:path*` — redirect ou 401 si pas de session.
Les routes `/admin/login` et `/api/admin/login` sont publiques.

### RGPD

- **Consent checkbox obligatoire** — `z.literal(true)` sur `consent`, sans quoi 400.
- Pas de cookie marketing, pas de tracking tiers.
- Pas de `localStorage` pour des données personnelles.
- Les données stockées sont **minimales** et liées au protocole (pas de données sensibles type origine, santé hors contexte médical léger).
- `source_ip` stocké uniquement pour audit anti-abus.

### HTTPS

Géré par le hosting (Vercel / Netlify automatique). Les cookies sont `Secure` en production, `HttpOnly`, `SameSite=Lax`.

---

## 📱 Responsive & mobile UX

### Approche

**Mobile-first**. Toutes les classes Tailwind de base ciblent mobile, les breakpoints `md:` / `lg:` ajoutent les variants desktop.

### Padding bas dynamique

```css
@media (max-width: 767px) {
  body { padding-bottom: calc(72px + env(safe-area-inset-bottom)); }
}
```

→ garantit que la bottom nav n'écrase jamais le contenu.

### Modal simulateur

- `SimulatorModal` ajoute `modal-open` sur `html` + `body` → `overflow: hidden` (lock scroll body)
- Escape ou clic sur X ferme
- Le modal lui-même a son propre scroll vertical

### Silhouette

Responsive SVG (max-width 240px). Affichée uniquement en sidebar desktop pour les questions `zone` et `need`. Sur mobile, la silhouette apparaît toujours dans le résultat (avant/après).

### Tap targets

Tous les boutons / liens font **≥ 44 × 44 px** (recommandation Apple HIG). Les pills et badges acceptent tap.

---

## 🚀 Démarrage local

```bash
git clone <url>
cd bodyinstitut

# Installation
npm install

# Si better-sqlite3 râle (mismatch Node) :
npm rebuild better-sqlite3

# Configuration
cp .env.example .env.local
# → éditer au moins AUTH_SECRET

# Dev server
npm run dev       # http://localhost:3000

# Production
npm run build
npm run start
```

### Login admin par défaut

- URL : `http://localhost:3000/admin/login`
- Identifiant : `admin`
- Mot de passe : `bodyinstitut`

> ⚠️ À changer avant toute mise en production via `ADMIN_USERNAME` et `ADMIN_PASSWORD`.

### Test manuel du pipeline

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Léa","lastName":"Martin",
    "email":"lea@test.fr","phone":"0612345678",
    "city":"Paris","age":34,"sex":"femme",
    "heightCm":168,"weightKg":68,
    "simulator":"adipologie",
    "answers":{
      "objective":"moyen","zone":"ventre",
      "cellulite":"oui","sport":"non","budget":"350_700"
    },
    "consent":true,"company":""
  }'
```

Réponse attendue : `{ ok: true, id, recommendation: { estimatedTotal: 615, ... }, analysis: "..." }`

---

## 🔧 Variables d'environnement

Fichier `.env.local` (non versionné) :

```bash
# ── Admin authentication ─────────────────────────────────────
ADMIN_USERNAME=admin
ADMIN_PASSWORD=bodyinstitut
# 32+ chars random (génère : openssl rand -base64 48)
AUTH_SECRET=

# ── Booking (CTA Planity) ────────────────────────────────────
BOOKING_URL=https://www.planity.com/votre-page
NEXT_PUBLIC_BOOKING_URL=https://www.planity.com/votre-page

# ── Branding ─────────────────────────────────────────────────
BRAND_NAME=Body Institut
BRAND_REPLY_TO=contact@bodyinstitut.fr

# ── SMTP (optionnel — sinon logs console) ────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Body Institut <no-reply@bodyinstitut.fr>"
ADMIN_NOTIFY_EMAIL=contact@bodyinstitut.fr

# ── IA (optionnel — fallback rule-based) ─────────────────────
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

### Clés NEXT_PUBLIC_*

Seules les variables préfixées `NEXT_PUBLIC_` sont exposées au client.
Actuellement : **une seule** → `NEXT_PUBLIC_BOOKING_URL` (utilisée dans le CTA Planity côté client).

---

## 📦 Déploiement

### Vercel (recommandé)

```bash
git init && git add . && git commit -m "Body Institut v2"
git remote add origin <url-github>
git push -u origin main
```

Sur vercel.com :
1. Import repository
2. Framework Preset : Next.js (détection auto)
3. **Environment Variables** : reporter tout le contenu de `.env.local`
4. Deploy

#### ⚠️ SQLite sur Vercel

Le système de fichiers Vercel est **éphémère** — les données SQLite seront perdues à chaque redéploiement.

**Solutions** :
- Migrer vers **Turso** (SQLite managé, compatible better-sqlite3 via HTTP)
- Migrer vers **Neon** (Postgres serverless)
- Utiliser un **VPS** (voir ci-dessous)

La migration ne touche qu'un seul fichier : `lib/db.ts`.

### VPS (Hetzner, DigitalOcean, OVH…)

```bash
# Sur le serveur
git clone <url>
cd bodyinstitut
cp .env.example .env.local && nano .env.local

npm ci --production=false
npm run build
npm run start               # port 3000

# + reverse-proxy nginx
# + certbot pour HTTPS
# + pm2 ou systemd pour gérer le process
```

SQLite est parfait sur VPS : un seul fichier (`data/bodyinstitut.db`), versionnable par snapshot, sauvegardes faciles avec `cron + rsync`.

### Netlify

Possible avec l'adapter Next.js, mais SQLite pose le même problème que sur Vercel. Privilégier Turso ou Postgres.

---

## 🔄 Maintenance & évolutions

### Où modifier quoi ?

| Besoin | Fichier |
|---|---|
| Changer un tarif | `lib/simulators.ts` — `pricing.*.cureTotal` / `pricePerSession` |
| Ajouter une question | `lib/simulators.ts` — tableau `questions[]` du simulateur |
| Modifier la logique duo | `lib/recommend.ts` — `suggestComplementary()` |
| Changer la palette | `tailwind.config.ts` — sections `brand` / `forest` / `surface` |
| Changer les textes de la page | `app/page.tsx` (Hero, About, Simulator, CTA) |
| Ajouter un statut lead | `lib/types.ts` → `LeadStatus` + `components/admin/StatusPill.tsx` |
| Exporter des colonnes supplémentaires | `app/api/admin/leads/export/route.ts` |
| Activer l'IA réelle | Définir `OPENAI_API_KEY` — `lib/ai.ts` appellera OpenAI |

### Évolutions post-MVP (roadmap)

- [ ] Migration SQLite → Turso ou Postgres pour Vercel
- [ ] Meta Pixel + Google Tag Manager (avec consentement)
- [ ] A/B test sur le hero (Vercel Edge Config)
- [ ] Intégration Planity API (créneau en direct au lieu d'un lien)
- [ ] Notifications admin Slack / Telegram via webhook
- [ ] Internationalisation FR / EN
- [ ] Tests Playwright sur le pipeline complet
- [ ] Dashboard analytics (leads/jour, CR par simulateur, CA potentiel)

### Tests de non-régression rapides

```bash
# Build
npm run build                                         # doit passer sans erreur

# Type-check seul
npx tsc --noEmit

# Étape 1 — création lead (9 champs : contact + profil)
curl -s -X POST http://localhost:3000/api/leads/start \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Camille","lastName":"Dupont","email":"a@b.fr","phone":"0612345678","city":"Paris","age":32,"sex":"femme","heightCm":170,"weightKg":62,"consent":true,"company":""}'
# → { ok: true, id: "<uuid>" }

# Étape 2 — enrichissement (auto-routing + projet + message)
curl -s -X POST http://localhost:3000/api/leads/complete \
  -H "Content-Type: application/json" \
  -d '{"id":"<uuid>","simulator":"auto",
       "answers":{"objective":"perdre","zone":"ventre","intensity":"important",
                  "lifestyle":"sedentaire","budget":"700_1500",
                  "timeframe":"asap","availability":"matin","source":"google"},
       "message":"Souhaite commencer rapidement","company":""}'
# → { ok: true, simulator:{ id:"adipologie", name:"Adipologie" }, recommendation:{...} }

# Consent manquant → 400
curl -X POST http://localhost:3000/api/leads/start \
  -H "Content-Type: application/json" \
  -d '{"firstName":"X","lastName":"Y","email":"x@x.fr","phone":"0612345678","city":"Paris","age":30,"sex":"femme","heightCm":170,"weightKg":62,"consent":false,"company":""}'

# Protection admin → 307 redirect /admin/login
curl -I http://localhost:3000/admin
```

---

## 🆘 Support & troubleshooting

### Erreur `NODE_MODULE_VERSION ... requires ...`

`better-sqlite3` a été compilé pour une autre version de Node.

```bash
npm rebuild better-sqlite3
```

### `useSearchParams() should be wrapped in a suspense boundary`

Déjà corrigé dans `app/admin/login/page.tsx` (wrapper `<Suspense>`). Si tu ajoutes de nouveaux hooks Next côté client, pense à envelopper.

### Emails non envoyés

Vérifie :
1. `SMTP_HOST` et `SMTP_PORT` sont définis
2. Les credentials SMTP sont valides
3. Regarde les logs : `[email]` → si "SMTP not configured" = fallback console (pas une erreur)

### Lead non stocké

1. Vérifier `data/bodyinstitut.db` existe et est writable
2. Check les logs : rejets Zod sont loggués
3. Rate limit : 6ᵉ requête en < 60 s retourne 429

### Admin login ne fonctionne pas

1. Vérifier `ADMIN_USERNAME` / `ADMIN_PASSWORD` dans `.env.local`
2. Vider le cookie `bi_admin` si ancien
3. Rate limit login : 9ᵉ tentative en < 60 s → 429

---

## 📚 Fichiers clés à lire pour comprendre le projet

Ordre recommandé :

1. `app/page.tsx` — **point d'entrée visuel** de tout le site
2. `components/SimulatorFlow.tsx` — **wizard** (questions + résultat + form)
3. `lib/simulators.ts` — **configuration** des 3 soins
4. `lib/recommend.ts` — **moteur métier** (duo, pricing)
5. `app/api/leads/route.ts` — **pipeline backend** (validation, insert, emails)
6. `lib/db.ts` — **schéma SQLite** + migrations
7. `app/admin/page.tsx` — **dashboard**

---

**Body Institut** · v2.1 — Apple-style edition · Avril 2026

> v2.1 highlights : palette warm-neutral (beige / noir / gris), funnel single-page 17 questions, hero parallax 3D/glass, admin dashboard temps réel par soin, robots.ts + sitemap.ts + JSON-LD LocalBusiness, favicon mono-noir + accent sand.
Refactor one-page · design cohérent · pipeline testé · prêt production · prêt Meta Ads
