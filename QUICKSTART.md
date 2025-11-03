# Guide de démarrage rapide

## Installation express

```bash
# Rendre le script exécutable (Linux/Mac)
chmod +x setup.sh

# Lancer l'installation
./setup.sh
```

## Ou manuellement

```bash
# Installation
npm run setup

# Démarrage
npm run dev
```

## Accès

- Backend API : http://localhost:3000/api
- Frontend : http://localhost:9000

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
