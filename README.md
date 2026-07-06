# 🌳 Généalogie

Je ne trouvais aucune application d'arbre généalogique moderne, fluide ou simplement agréable à utiliser visuellement. Alors j'ai développé ma propre solution : une application de bureau complète, propre, et sans fioritures.

## 🏗️ Architecture

Encapsuler une stack Web moderne dans une application de bureau native via Electron,  backend local robuste en Java pour gérer la logique lourde et les exports.

```
┌──────────────────────────────────────────┐
│              Electron Window             │
│  ┌────────────────────────────────────┐  │
│  │       React + Vite + Tailwind      │  │
│  │   (frontend/)                      │  │
│  └──────────────┬─────────────────────┘  │
│                 │ HTTP (localhost)       │
│  ┌──────────────▼─────────────────────┐  │
│  │       Spring Boot 3 (backend/)     │  │
│  │   API REST /api/*                  │  │
│  │   Persistance JSON ~/.genealogie/  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

- **Backend** : Java 21+, Spring Boot 3.3.5, Gson
- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS 4, Zustand
- **Desktop** : Electron 33

## 🛠️ Prérequis

- **Java 21+** (Le JRE suffit, j'ai pré-compilé le backend)
- **Node.js 18+**

## 🚀 Installation & Lancement rapide

```bash
# 1. Cloner le projet
git clone https://github.com/<votre-user>/genealogie.git
cd genealogie

# 2. Installer (Front & Desktop)
cd frontend && npm install && cd ..
cd electron && npm install && cd ..

# 3. Lancer le build complet (Frontend + JAR Backend)
npm run build

# 4. Démarrer l'application
npm start
```

## 💻 Développement

Mode developpement :

```bash
# Terminal 1 : Backend Spring Boot (port 8080)
cd backend && mvn spring-boot:run

# Terminal 2 : Frontend Vite avec HMR (port 5173)
cd frontend && npm run dev

# Terminal 3 : Fenêtre Electron en direct sur Vite
cd electron && GENEALOGIE_DEV=true npm start
```

Utilisation du Hot Module Replacement (HMR) de Vite, chaque modification de style ou de composant React est visible instantanément dans Electron.

### Build de production

Pour packager l'application proprement, le script racine compile le front, génère le JAR exécutable et rassemble le tout dans le dossier `electron/` :

```bash
npm run build
```

### 📦 Distribuer un exécutable

```bash
npm run dist
```

Génère un fichier autonome dans `electron/dist/` selon ta plateforme :

| Plateforme | Fichier | Type |
|---|---|---|
| Linux | `Généalogie-1.0.0.AppImage` | Portable — un seul fichier, zéro installation |
| macOS | `Généalogie-1.0.0.dmg` | Image disque à monter |
| Windows | `Généalogie Setup 1.0.0.exe` | Installateur |
| Windows | `Généalogie 1.0.0.exe` | Portable — comme une AppImage, cliques et ça marche |

L'option **portable** (Windows) fonctionne comme l'AppImage Linux : aucun installeur, aucun répertoire système modifié, tu le poses où tu veux et tu le lances.

## 💾 Stockage des données

Pas de base de données lourde à installer. Les arbres généalogiques sont stockés localement, au format JSON, directement dans le dossier utilisateur :

```
~/.genealogie/trees.json
```
Le format .gnlgy : Format natif JSON embarquant l'intégralité d'un arbre (personnes, familles, positions, photos, notes) sans perte — idéal pour sauvegarde et transfert entre sessions.

C'est transparent et facile à sauvegarder.

## ✨ Fonctionnalités

- **Gestion multi-arbres** : Tu peux créer et gérer plusieurs généalogies en parallèle.
- **Édition intuitive** : Ajout rapide de personnes, familles, conjoints, enfants, parents et fratries.
- **Placement libre** : Tu peux glisser-déposer les nœuds où tu veux sur la grille.
- **Auto-layout** : J'ai intégré un algorithme pour aligner et positionner l'arbre automatiquement si besoin.
- **Export GEDCOM** : Ton arbre reste compatible avec les autres logiciels du marché.
- **Format natif .gnlgy** : Export/import complet avec positions, photos, notes — aucune perte.
- **Interface propre** : Thème sombre natif et interface entièrement en français.

## 📂 Organisation du code

```
genealogie/
├── backend/                  # Logique Java (Spring Boot)
│   └── src/main/java/com/genealogie/
│       ├── controller/          # Endpoints de l'API REST
│       ├── model/               # Structures de données
│       ├── store/               # Gestion de la persistance JSON
│       ├── io/                  # Moteur d'import/export GEDCOM
│       └── layout/              # Algo d'auto-layout
├── frontend/                 # Interface utilisateur (React + Vite)
│   └── src/
│       ├── components/          # Composants UI
│       ├── hooks/               # Hooks personnalisés
│       ├── store/               # Store global (Zustand)
│       └── types/               # Types TypeScript
├── electron/                 # Wrapper Desktop (process principal, cycle de vie)
├── scripts/                  # Scripts d'automatisation de build
└── package.json              # Scripts globaux d'orchestration
```

---

Fait avec ☕ par **Maxime** — Distribué sous licence **MIT**.
