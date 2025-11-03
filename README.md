# 🤖 SLUFE IA - Application de Génération par IA

Application complète avec **backend Node.js/Express** et **frontend Vue.js/Quasar** pour la génération d'images et de vidéos par IA.

## 🏗️ Architecture

- **🎨 Frontend** : Déployé sur Vercel → https://slufe.vercel.app
- **🚀 Backend** : À déployer sur VPS (requêtes IA longues > 30s)
- **🤖 IA Services** : Replicate, OpenAI, etc.

## 📋 Prérequis

- Node.js >= 16.x
- npm >= 6.13.4

## 🚀 Installation

### Installation rapide

```bash
npm run setup
```

Cette commande va :
1. Installer les dépendances du projet racine
2. Installer les dépendances du backend
3. Installer les dépendances du frontend
4. Créer le fichier `.env` dans le backend

### Installation manuelle

```bash
# Installer les dépendances racine
npm install

# Installer les dépendances du backend
cd backend
npm install
cp .env.example .env

# Installer les dépendances du frontend
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend

Éditez le fichier `backend/.env` pour configurer les variables d'environnement :

```env
PORT=3000
NODE_ENV=development

# Clés API pour services IA (à configurer ultérieurement)
OPENAI_API_KEY=your_openai_api_key_here
STABILITY_API_KEY=your_stability_api_key_here
```

## 🏃 Démarrage

### Mode développement (recommandé)

Lance simultanément le backend et le frontend :

```bash
npm run dev
```

- Backend : http://localhost:3000
- Frontend : http://localhost:9000 (ou autre port si 9000 est occupé)

### Lancer séparément

**Backend uniquement :**
```bash
npm run dev:backend
```

**Frontend uniquement :**
```bash
npm run dev:frontend
```

## 🏗️ Build pour production

```bash
# Build du frontend
npm run build

# Démarrer le serveur de production
npm start
```

Le serveur servira alors l'application frontend buildée depuis `backend/` sur http://localhost:3000

## 📁 Structure du projet

```
slufe/
├── backend/                    # Backend Node.js/Express
│   ├── routes/
│   │   └── ai.js              # Routes API (/api/prompt, /api/status)
│   ├── middleware/            # Middleware personnalisés
│   ├── server.js              # Point d'entrée du serveur
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # Frontend Vue.js/Quasar
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUploader.vue    # Upload d'images
│   │   │   ├── PromptInput.vue      # Saisie du prompt
│   │   │   └── ResultDisplay.vue    # Affichage résultats
│   │   ├── stores/
│   │   │   └── useMainStore.js      # Store Pinia
│   │   ├── pages/
│   │   │   └── HomePage.vue         # Page principale
│   │   ├── layouts/
│   │   │   └── MainLayout.vue       # Layout principal
│   │   └── App.vue
│   ├── quasar.config.js
│   └── package.json
│
├── package.json               # Scripts racine
└── README.md
```

## 🔌 API Endpoints

### `GET /api/status`
Retourne le statut du serveur

**Réponse :**
```json
{
  "status": "ok",
  "timestamp": "2025-11-02T...",
  "version": "1.0.0"
}
```

### `POST /api/prompt`
Traite un prompt avec des images

**Paramètres :**
- `prompt` (string) : Description de ce qui doit être généré
- `images` (files[]) : Jusqu'à 10 images (max 10MB chacune)

**Réponse :**
```json
{
  "success": true,
  "type": "image",
  "resultUrl": "https://...",
  "message": "Résultat généré pour: ...",
  "processedImages": 2,
  "timestamp": "2025-11-02T..."
}
```

## 🎨 Fonctionnalités

### Frontend
- ✅ Upload multiple d'images (drag & drop)
- ✅ Capture d'images depuis la caméra
- ✅ Liste d'images avec aperçu et suppression
- ✅ Zone de texte pour le prompt
- ✅ Amélioration de prompt
- ✅ Affichage des résultats (image ou vidéo)
- ✅ Téléchargement des résultats
- ✅ Réutilisation d'images générées
- ✅ Interface responsive (mobile & desktop)
- ✅ Thème Quasar Material Design

### Backend
- ✅ API REST avec Express
- ✅ Upload de fichiers avec Multer
- ✅ CORS configuré
- ✅ Validation des fichiers
- ✅ Réponses mock pour le développement
- ✅ Service de fichiers statiques pour le frontend build

## 🔮 Prochaines étapes

- [ ] Intégration avec OpenAI DALL-E
- [ ] Intégration avec Stability AI
- [ ] Système d'authentification
- [ ] Historique des générations
- [ ] Partage de résultats
- [ ] Mode batch pour traiter plusieurs prompts

## 🛠️ Technologies utilisées

**Backend :**
- Node.js
- Express.js
- Multer (upload de fichiers)
- dotenv (variables d'environnement)
- CORS

**Frontend :**
- Vue 3 (Composition API avec script setup)
- Quasar Framework 2
- Pinia (state management)
- Axios (HTTP client)
- Vue Router

## 📝 Notes de développement

- Le backend fournit actuellement des réponses mock
- Les clés API pour les services IA doivent être ajoutées dans `.env`
- Le proxy `/api` est configuré dans `quasar.config.js` pour le développement
- En production, le backend sert les fichiers statiques du frontend

## 🐛 Troubleshooting

**Port déjà utilisé :**
```bash
# Changer le port dans backend/.env
PORT=3001
```

**Erreur de CORS :**
Vérifiez que le proxy est bien configuré dans `frontend/quasar.config.js`

**Problème d'upload :**
Vérifiez que la taille des images ne dépasse pas 10MB

## 📄 Licence

ISC

---

**Développé avec ❤️ pour SLUFE IA**
