# 🔧 Correction de l'API Templates - Backend vs LocalStorage

## 🐛 Problème Identifié

L'API `/api/templates` du backend ne fonctionne correctement **QUE sur localhost**, ce qui pose plusieurs problèmes :

1. ❌ Les templates ne sont **pas sauvegardés sur le backend** en production
2. ❌ Les templates restent dans le **localStorage du navigateur** (ancienne méthode)
3. ❌ Les templates ne sont **pas partagés** entre différents appareils/navigateurs
4. ❌ Configuration hardcodée en `localhost` dans plusieurs fichiers

## 🔍 Analyse du Problème

### Architecture Actuelle

```
Frontend (localhost:9000)
    ↓
[Proxy Quasar DevServer] → Backend (localhost:3000)
    ↓                            ↓
Templates Store              /api/templates
    ↓                            ↓
localStorage (❌)          data/templates/ (✅)
```

### Fichiers Concernés

#### 1. **Frontend - Configuration API**

**`frontend/src/stores/useTemplateStore.js`**
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
//                                                  ^^^^^^^^^^^^^^^^^^
//                                                  Hardcodé en localhost
```

**`frontend/src/composables/useWorkflowExecution.js`**
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
//                                                  Même problème
```

**`frontend/quasar.config.js`**
```javascript
env: ctx.dev 
  ? { 
      API_URL: 'http://localhost:3000/api'  // ✅ OK en dev
    }
  : {
      API_URL: 'https://your-backend-server.com/api'  // ❌ Placeholder
    }
```

#### 2. **Backend - Routes Templates**

**`backend/routes/templates.js`** ✅ Correctement implémenté
- GET `/api/templates` - Liste tous les templates
- GET `/api/templates/:id` - Récupère un template
- POST `/api/templates` - Crée un template
- PUT `/api/templates/:id` - Met à jour un template
- DELETE `/api/templates/:id` - Supprime un template

**`backend/services/templateManager.js`** ✅ Correctement implémenté
- Sauvegarde dans `backend/data/templates/`
- Charge depuis le filesystem
- Nettoyage des workflows (enlève données utilisateur)

#### 3. **Backend - Configuration CORS**

**`backend/server.js`**
```javascript
app.use(cors());  // ⚠️ CORS ouvert à tous (OK en dev, risqué en prod)
```

## ✅ Solution Complète

### Étape 1 : Configuration Dynamique de l'URL API

Le problème principal est que l'URL de l'API est **hardcodée** en localhost. Il faut utiliser une **URL relative** ou **dynamique**.

#### Solution 1A : Utiliser l'URL Relative (Recommandé)

**Modifier `frontend/src/stores/useTemplateStore.js` :**

```javascript
// ❌ Ancienne version
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// ✅ Nouvelle version - URL relative
const API_URL = import.meta.env.VITE_API_URL || ''
// En développement : proxy Quasar redirige /api → localhost:3000/api
// En production : /api → même serveur que le frontend
```

**Avantages :**
- Fonctionne en dev ET en prod
- Pas de configuration supplémentaire
- Utilise le proxy Quasar en dev
- Même origine en prod (pas de CORS)

#### Solution 1B : Détection Automatique de l'Environnement

```javascript
const getApiUrl = () => {
  // En développement local
  if (import.meta.env.DEV) {
    return 'http://localhost:3000'
  }
  
  // En production, utiliser l'origine courante
  return window.location.origin
}

const API_URL = getApiUrl()
```

### Étape 2 : Utiliser Axios Configuré dans boot/axios.js

**Le fichier `frontend/src/boot/axios.js` est DÉJÀ bien configuré :**

```javascript
const getBaseURL = () => {
  // En développement (localhost:9000), utiliser le proxy
  if (window.location.hostname === 'localhost' && window.location.port === '9000') {
    return '/api';  // ✅ Proxy Quasar
  }
  // En production, utiliser la même origine que le frontend
  return window.location.origin + '/api';  // ✅ Même serveur
};
```

**Solution : Utiliser `api` au lieu d'`axios` direct**

**Dans `useTemplateStore.js` et `useWorkflowExecution.js` :**

```javascript
// ❌ Mauvais - axios direct avec URL hardcodée
import axios from 'axios'
const API_URL = 'http://localhost:3000'
await axios.get(`${API_URL}/api/templates`)

// ✅ Bon - utiliser l'instance configurée
import { api } from 'src/boot/axios'
await api.get('/templates')  // Pas besoin d'API_URL !
```

### Étape 3 : Configuration CORS Backend (Production)

**Pour déploiement en production, configurer CORS correctement :**

**`backend/server.js` :**

```javascript
import cors from 'cors';

// Configuration CORS selon l'environnement
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://your-frontend-domain.com'
    : '*',  // Permissif en développement
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

**Variables d'environnement (`backend/.env`) :**

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com
REPLICATE_API_TOKEN=your_token_here
```

### Étape 4 : Structure de Déploiement

#### Option A : Frontend et Backend sur le même serveur

```
Serveur (VPS)
  ├── /app/frontend/dist/spa/  (fichiers statiques)
  └── /app/backend/server.js    (API)

Nginx:
  - / → frontend (index.html)
  - /api → backend:3000
  - /medias → backend:3000/medias
```

**Configuration Nginx :**

```nginx
server {
  listen 80;
  server_name your-domain.com;
  
  # Frontend - fichiers statiques
  location / {
    root /app/frontend/dist/spa;
    try_files $uri $uri/ /index.html;
  }
  
  # API Backend
  location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
  
  # Fichiers médias
  location /medias {
    proxy_pass http://localhost:3000;
  }
}
```

#### Option B : Frontend et Backend séparés

```
Frontend: Vercel/Netlify (https://app.example.com)
Backend: VPS (https://api.example.com)
```

**Nécessite configuration CORS stricte !**

## 🔨 Modifications à Effectuer

### Fichier 1 : `frontend/src/stores/useTemplateStore.js`

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'  // ✅ Utiliser api configuré

export const useTemplateStore = defineStore('template', () => {
  // Supprimer la ligne API_URL
  // const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  
  // ...
  
  async function loadTemplates() {
    // ❌ Ancienne version
    // const response = await axios.get(`${API_URL}/api/templates`)
    
    // ✅ Nouvelle version
    const response = await api.get('/templates')
    
    // ...
  }
  
  async function createTemplate(templateData) {
    // ✅ Utiliser api
    const response = await api.post('/templates', templateDataToSend)
    // ...
  }
  
  async function updateTemplate(templateId, updates) {
    // ✅ Utiliser api
    const response = await api.put(`/templates/${templateId}`, updates)
    // ...
  }
  
  async function deleteTemplate(templateId) {
    // ✅ Utiliser api
    const response = await api.delete(`/templates/${templateId}`)
    // ...
  }
})
```

### Fichier 2 : `frontend/src/composables/useWorkflowExecution.js`

```javascript
import { ref } from 'vue'
import { api } from 'src/boot/axios'  // ✅ Utiliser api configuré

export function useWorkflowExecution() {
  // Supprimer la ligne API_URL
  // const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  
  // ...
  
  const uploadImage = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    // ✅ Utiliser api
    const response = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    return response.data
  }
  
  const executeWorkflow = async (workflow, inputs) => {
    // ✅ Utiliser api
    const response = await api.post('/workflow/run', {
      workflow,
      inputs
    })
    
    // ...
  }
}
```

### Fichier 3 : `backend/server.js` (Configuration CORS)

```javascript
import cors from 'cors';

// Configuration CORS dynamique
const corsOptions = {
  origin: (origin, callback) => {
    // Liste blanche des origines autorisées
    const allowedOrigins = [
      'http://localhost:9000',  // Dev frontend
      'http://localhost:3000',  // Dev backend
      process.env.FRONTEND_URL  // Production
    ].filter(Boolean)
    
    // Autoriser les requêtes sans origine (mobile apps, Postman)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))
```

## 📊 Résultat Attendu

### Avant (❌)

```
Dev:  localhost:9000 → ✅ Templates backend
Prod: production.com → ❌ Templates localStorage (ancienne méthode)
```

### Après (✅)

```
Dev:  localhost:9000 → ✅ Templates backend (data/templates/)
Prod: production.com → ✅ Templates backend (data/templates/)
```

## 🧪 Tests

### Test 1 : Environnement de Développement

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Navigateur
http://localhost:9000
```

**Vérifications :**
1. Créer un template depuis WorkflowBuilder
2. Vérifier le fichier dans `backend/data/templates/`
3. Recharger la page → Templates toujours présents
4. Ouvrir AppViewer → Templates disponibles

### Test 2 : Production (Build)

```bash
# Build frontend
cd frontend
npm run build
# Génère: frontend/dist/spa/

# Démarrer backend en mode production
cd backend
NODE_ENV=production npm start

# Servir le frontend avec le backend
# Le backend servira automatiquement les fichiers statiques
```

## 🚀 Déploiement

### Option 1 : VPS Unique (Recommandé pour MVP)

```bash
# Sur le serveur
git clone https://github.com/your-repo/slufe.git
cd slufe

# Installer les dépendances
cd backend && npm install
cd ../frontend && npm install

# Builder le frontend
cd frontend
npm run build

# Configurer l'environnement
cd ../backend
cp .env.example .env
nano .env  # Configurer les variables

# Démarrer avec PM2
pm2 start server.js --name slufe-backend
pm2 save

# Configurer Nginx (voir configuration ci-dessus)
```

### Option 2 : Frontend Vercel + Backend VPS

**Déployer frontend sur Vercel :**
- Connecter le repo GitHub
- Build command: `cd frontend && npm run build`
- Output directory: `frontend/dist/spa`
- Environnement : `VITE_API_URL=https://api.your-domain.com`

**Déployer backend sur VPS :**
```bash
cd backend
npm install
pm2 start server.js
```

**Configurer CORS backend :**
```env
FRONTEND_URL=https://your-app.vercel.app
```

## 📝 Checklist de Migration

- [ ] Modifier `frontend/src/stores/useTemplateStore.js` pour utiliser `api`
- [ ] Modifier `frontend/src/composables/useWorkflowExecution.js` pour utiliser `api`
- [ ] Configurer CORS dans `backend/server.js`
- [ ] Créer `.env` backend avec les bonnes variables
- [ ] Tester en développement
- [ ] Tester en production (build)
- [ ] Migrer les templates existants du localStorage vers le backend
- [ ] Documenter l'URL de production
- [ ] Configurer Nginx/reverse proxy si nécessaire

## 🎯 Avantages de la Solution

✅ **Fonctionne en dev et prod** sans changement de code
✅ **Pas de hardcoding** d'URLs
✅ **Templates persistants** côté serveur
✅ **Partagés** entre appareils
✅ **Sauvegardés** dans le filesystem
✅ **Sécurisé** avec CORS configuré
✅ **Scalable** pour production

## 🔗 Fichiers Modifiés

1. `frontend/src/stores/useTemplateStore.js` - Utiliser `api` au lieu d'axios direct
2. `frontend/src/composables/useWorkflowExecution.js` - Utiliser `api` au lieu d'axios direct
3. `backend/server.js` - Configuration CORS dynamique
4. `backend/.env` - Variables d'environnement production
5. Documentation de déploiement
