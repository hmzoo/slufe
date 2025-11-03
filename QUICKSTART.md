# ⚡ Guide de démarrage rapide

## 🚀 Frontend (Déjà déployé)

**URL de production** : https://slufe.vercel.app ✅

## 🛠️ Développement local

### Installation rapide
```bash
# Installation complète
npm run setup

# Démarrage dev (frontend + backend)
npm run dev
```

### Accès local
- **Backend API** : http://localhost:3000/api
- **Frontend** : http://localhost:9000

## 🎯 Production

### Frontend ✅ 
Déjà configuré sur Vercel

### Backend ⚠️
À déployer sur VPS - Voir `DEPLOYMENT.md`

## Test de l'API

```bash
# Vérifier le statut
curl http://localhost:3000/api/status
```

## Fonctionnalités disponibles

✅ Upload d'images (drag & drop + caméra)  
✅ Saisie de prompt avec amélioration  
✅ Génération mock (image/vidéo)  
✅ Téléchargement des résultats  
✅ Réutilisation d'images  
✅ Interface responsive  

## Configuration IA

Pour connecter de vrais services IA, éditer `backend/.env` :

```env
OPENAI_API_KEY=sk-...
STABILITY_API_KEY=sk-...
```

Puis modifier `backend/routes/ai.js` pour intégrer les appels API réels.
