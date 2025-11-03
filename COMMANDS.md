# Commandes utiles - SLUFE IA

## 🚀 Installation et démarrage

### Installation complète (recommandé)
```bash
npm run setup
```

### Installation manuelle
```bash
# Racine
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### Démarrage développement
```bash
# Les deux serveurs en parallèle
npm run dev

# Backend seul (port 3000)
npm run dev:backend

# Frontend seul (port 9000)
npm run dev:frontend
```

## 🏗️ Build et production

```bash
# Build du frontend
npm run build

# Lancer en production (sert le frontend buildé)
npm start
```

## 🧪 Tests et développement

### Tester l'API backend

```bash
# Vérifier le statut
curl http://localhost:3000/api/status

# Tester avec un prompt (nécessite jq pour formater)
curl -X POST http://localhost:3000/api/prompt \
  -F "prompt=Un paysage de montagne" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" | jq
```

### Inspecter les logs

```bash
# Backend (si lancé séparément)
cd backend && npm run dev

# Frontend (si lancé séparément)
cd frontend && npm run dev
```

## 📝 Développement

### Ajouter une dépendance

```bash
# Backend
cd backend && npm install nom-du-package

# Frontend
cd frontend && npm install nom-du-package
```

### Linter et formatter (frontend)

```bash
cd frontend

# Linter
npm run lint

# Formatter
npm run format
```

## 🔧 Configuration

### Changer le port du backend

Éditez `backend/.env` :
```env
PORT=3001
```

### Configurer les clés API IA

Éditez `backend/.env` :
```env
OPENAI_API_KEY=sk-votre-clé
STABILITY_API_KEY=sk-votre-clé
```

## 🐛 Troubleshooting

### Port déjà utilisé

```bash
# Trouver le processus sur le port 3000
lsof -i :3000
# ou
netstat -ano | grep 3000

# Tuer le processus
kill -9 <PID>
```

### Réinstaller les dépendances

```bash
# Supprimer tous les node_modules
rm -rf node_modules backend/node_modules frontend/node_modules

# Réinstaller
npm run install:all
```

### Nettoyer le cache

```bash
# Frontend
cd frontend
rm -rf .quasar dist node_modules
npm install

# Backend
cd ../backend
rm -rf node_modules
npm install
```

## 📦 Scripts disponibles

### Racine
- `npm run dev` - Lance backend + frontend
- `npm run dev:backend` - Lance le backend seul
- `npm run dev:frontend` - Lance le frontend seul
- `npm run build` - Build le frontend
- `npm start` - Lance en production
- `npm run install:all` - Installe toutes les dépendances
- `npm run setup` - Installation complète + création .env

### Backend
- `npm start` - Lance le serveur en production
- `npm run dev` - Lance avec nodemon (hot reload)

### Frontend
- `npm run dev` - Lance le serveur de dev Quasar
- `npm run build` - Build pour production
- `npm run lint` - Linter le code
- `npm run format` - Formatter le code

## 🔍 Vérifications rapides

```bash
# Versions
node --version    # Doit être >= 16
npm --version     # Doit être >= 6.13.4

# Structure des dossiers
ls -la backend frontend

# Vérifier les fichiers de config
cat backend/.env
cat frontend/quasar.config.js

# Tester la connexion API depuis le frontend
# (après démarrage avec npm run dev)
curl http://localhost:9000/api/status
```

## 🎨 Personnalisation

### Changer le titre de l'app

Éditez `frontend/src/layouts/MainLayout.vue` :
```vue
<q-toolbar-title>
  Votre Titre
</q-toolbar-title>
```

### Modifier le port du frontend dev

Éditez `frontend/quasar.config.js` :
```js
devServer: {
  port: 8080,  // Changez ici
  ...
}
```

### Activer HTTPS en dev

```bash
# Frontend
cd frontend
quasar dev --https

# Backend (nécessite certificat)
# À configurer dans server.js
```

## 📊 Monitoring

### Voir les requêtes en temps réel

Backend : Les logs apparaissent dans la console où vous avez lancé `npm run dev:backend`

Frontend : Ouvrez les DevTools du navigateur (F12) > Onglet Network

## 🚢 Déploiement

### Préparer pour la production

```bash
# 1. Build le frontend
npm run build

# 2. Les fichiers sont dans frontend/dist/spa/
# 3. Le backend les servira automatiquement

# 4. Sur le serveur de production
PORT=80 NODE_ENV=production npm start
```

### Variables d'environnement production

```env
NODE_ENV=production
PORT=80
OPENAI_API_KEY=sk-prod-...
STABILITY_API_KEY=sk-prod-...
```
