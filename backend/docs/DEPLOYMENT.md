# 🚀 Guide de Déploiement SLUFE IA

## 🎯 Architecture de Production

```
🎨 Frontend (Vercel)          🚀 Backend (VPS)
├── Vue.js + Quasar          ├── Node.js + Express
├── Interface utilisateur    ├── API complète  
├── https://slufe.vercel.app ├── Requêtes IA longues
└── Gratuit ✅              └── ~6€/mois
```

## 🎨 Frontend - Vercel (✅ Configuré)

### Déploiement automatique
```bash
# Le frontend se déploie automatiquement sur Vercel
git push origin main → Déploiement auto

# Ou manuellement :
npm run deploy:frontend
```

### URL de production
**https://slufe.vercel.app** ✅ Opérationnel

## 🚀 Backend - VPS (À configurer)

### 1. Choisir un hébergeur VPS

**Recommandés :**
- 🌟 **Hetzner Cloud** : 4€/mois (2GB RAM, 1 vCPU)
- 🌟 **DigitalOcean** : 6€/mois (1GB RAM, 1 vCPU)
- 🌟 **Contabo** : 5€/mois (4GB RAM, 2 vCPU)

### 2. Installation sur le VPS

```bash
# Connexion au VPS
ssh root@votre-ip-vps

# Installation Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Clone du projet
git clone https://github.com/hmzoo/slufe.git
cd slufe/backend

# Installation des dépendances
npm install

# Configuration
cp .env.example .env
nano .env  # Configurer les clés API
```

### 3. Configuration des variables d'environnement

```bash
# Dans backend/.env
PORT=3000
NODE_ENV=production

# Clés API
REPLICATE_API_TOKEN=your_token_here
OPENAI_API_KEY=your_key_here
```

### 4. Démarrage du backend

```bash
# Test
npm start

# Production avec PM2
npm install -g pm2
pm2 start server.js --name "slufe-api"
pm2 startup
pm2 save
```

## 🔗 Connexion Frontend ↔ Backend

### 1. Configurer l'URL API dans le frontend

```javascript
// Dans frontend/quasar.config.js
env: ctx.dev 
  ? { API_URL: 'http://localhost:3000/api' }
  : { API_URL: 'https://votre-ip-vps:3000/api' }  // ← Remplacer
```

### 2. Configuration CORS sur le backend

```javascript
// Dans backend/server.js
app.use(cors({
  origin: [
    'http://localhost:9000',       // Dev local
    'https://slufe.vercel.app',    // Frontend production
    'https://slufe-*.vercel.app'   // Prévisualisations
  ]
}));
```

### 3. Redéploiement du frontend

```bash
# Après modification de quasar.config.js
npm run deploy:frontend
```

## 🔧 Maintenance

### Backend VPS
```bash
# Logs
pm2 logs slufe-api

# Redémarrage  
pm2 restart slufe-api

# Mise à jour
git pull origin main
npm install
pm2 restart slufe-api
```

### Frontend Vercel
```bash
# Déploiement automatique via Git
git push origin main

# Ou manuel
vercel --prod
```

## 📊 Monitoring

- **Frontend** : Dashboard Vercel → https://vercel.com/dashboard
- **Backend** : Logs VPS → `pm2 monit`
- **APIs** : Tests → `curl https://votre-ip:3000/api/`

## 💰 Coûts estimés

- **Frontend Vercel** : 0€/mois (gratuit)
- **VPS Backend** : 4-6€/mois
- **APIs externes** : Variable selon usage
- **Total** : ~6€/mois pour une app IA complète

## 🆘 Support

1. **Frontend** : Voir `VERCEL_FRONTEND_ONLY_CONFIG.md`
2. **Backend** : Documentation dans `backend/README.md`  
3. **Architecture** : Voir `VERCEL_ALTERNATIVES_FOR_LONG_REQUESTS.md`