# Généalogie

Je ne trouvais aucune application d'arbre généalogique qui tenait la route, alors j'ai fait la mienne

![Aperçu](screenshot.png)

## Architecture

```
┌──────────────────────────────────────────┐
│              Electron Window             │
│  ┌────────────────────────────────────┐  │
│  │      React + Vite + Tailwind       │  │
│  │  (frontend/)                       │  │
│  └──────────────┬─────────────────────┘  │
│                 │ HTTP (localhost)       │
│  ┌──────────────▼─────────────────────┐  │
│  │      Spring Boot 3 (backend/)      │  │
│  │  API REST /api/*                   │  │
│  │  Persistance JSON ~/.genealogie/   │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

- **Backend** : Java 21+, Spring Boot 3.3.5, Gson
- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS 4, Zustand
- **Desktop** : Electron 33

## Prérequis

- **Java 21+** (JRE, pas besoin du JDK — le backend est pré-compilé)
- **Node.js 18+**

## Installation & Utilisation

```bash
# 1. Cloner
git clone https://github.com/<votre-user>/genealogie.git
cd genealogie

# 2. Installer les dépendances
cd frontend && npm install && cd ..
cd electron && npm install && cd ..

# 3. Build complet (frontend + backend JAR)
npm run build

# 4. Lancer l'application
npm start
```

L'application s'ouvre dans une fenêtre Electron autonome.

## Développement

Trois terminaux à lancer en parallèle :

```bash
# Terminal 1 — Backend Spring Boot (port 8080)
cd backend && mvn spring-boot:run

# Terminal 2 — Frontend Vite HMR (port 5173)
cd frontend && npm run dev

# Terminal 3 — Electron en mode dev (pointe sur Vite)
cd electron && GENEALOGIE_DEV=true npm start
```

Le mode développement utilise le Hot Module Replacement de Vite : les modifications CSS/React sont visibles instantanément.

## Build de production

```bash
npm run build
```

Ce script :
1. Compile le frontend React (`frontend/`)
2. Compile le backend Spring Boot en JAR (`backend/`)
3. Copie le JAR dans `electron/`

## Persistance

Les arbres généalogiques sont stockés dans `~/.genealogie/trees.json` (format JSON).

## Fonctionnalités

- Création et gestion d'arbres généalogiques multiples
- Ajout de personnes, familles, conjoints, enfants, parents, fratrie
- Placement libre des nœuds par glisser-déposer
- Auto-layout des arbres
- Liens familiaux visuels (parents → enfants, unions)
- Export GEDCOM
- Thème sombre natif
- Interface en français

## Structure du projet

```
genealogie/
├── backend/                     # Spring Boot (Java)
│   └── src/main/java/com/genealogie/
│       ├── controller/          # REST API
│       ├── model/               # Entités
│       ├── store/               # Persistance
│       ├── io/                  # GEDCOM import/export
│       └── layout/              # Auto-layout
├── frontend/                    # React + Vite (TypeScript)
│   └── src/
│       ├── components/          # Composants React
│       ├── hooks/               # Hooks personnalisés
│       ├── store/               # Zustand store
│       ├── utils/               # Utilitaires
│       └── types/               # Types TypeScript
├── electron/                    # Application de bureau
├── scripts/                     # Scripts de build
├── package.json                 # Scripts racine
└── README.md
```

## Stack technique

| Couche | Technologie |
|--------|------------|
| Desktop | Electron 33 |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| State | Zustand 5 |
| Backend | Spring Boot 3.3.5, Java 21+ |
| Persistance | Gson (fichier JSON) |
| Build | Maven, Vite, electron-builder |

## Licence

MIT

## Auteur

**Maxime**
