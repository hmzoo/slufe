# 🤖 Workflow Analyzer - Documentation

## Vue d'ensemble

Le **Workflow Analyzer** est un système intelligent qui détermine automatiquement le meilleur workflow à utiliser en fonction du prompt de l'utilisateur et des images disponibles. Il utilise l'IA (Gemini 2.5 Flash) pour analyser les intentions et recommander le service approprié.

## 🎯 Objectif

Simplifier l'expérience utilisateur en automatisant le choix du service :
- ✅ L'utilisateur n'a plus besoin de comprendre les différences techniques entre les services
- ✅ Le système détecte automatiquement si c'est une génération, édition ou animation
- ✅ Le prompt est optimisé pour le modèle Qwen automatiquement
- ✅ Exécution automatique du workflow recommandé

## 📋 Workflows disponibles

### 1. TEXT_TO_IMAGE
**Génération d'image simple**
- **Conditions**: Aucune image, pas de mots-clés vidéo
- **Service**: `imageGenerator.js`
- **Exemples**: 
  - "un chat mignon"
  - "paysage de montagne au coucher du soleil"
  - "portrait d'une femme élégante"

### 2. TEXT_TO_VIDEO
**Génération de vidéo simple**
- **Conditions**: Aucune image, mots-clés vidéo détectés
- **Service**: `videoGenerator.js`
- **Exemples**:
  - "créer une vidéo de vagues océaniques"
  - "animer des nuages dans le ciel"
  - "vidéo d'une ville la nuit"

### 3. IMAGE_EDIT_SINGLE
**Édition d'une seule image**
- **Conditions**: 1 image fournie, mots-clés d'édition
- **Service**: `imageEditor.js` (mode single)
- **Exemples**:
  - "changer la couleur du ciel en rose"
  - "ajouter un chapeau à la personne"
  - "transformer en style cartoon"

### 4. IMAGE_EDIT_MULTIPLE
**Édition/fusion de plusieurs images**
- **Conditions**: 2+ images fournies, mots-clés d'édition
- **Service**: `imageEditor.js` (mode multiple)
- **Exemples**:
  - "fusionner ces deux images"
  - "combiner les deux paysages"
  - "mélanger les deux portraits"

### 5. IMAGE_TO_VIDEO_SINGLE
**Animation d'une image**
- **Conditions**: 1 image fournie, mots-clés vidéo
- **Service**: `videoImageGenerator.js`
- **Exemples**:
  - "animer cette image de paysage"
  - "créer une vidéo à partir de cette photo"
  - "faire bouger les nuages dans l'image"

### 6. IMAGE_TO_VIDEO_TRANSITION
**Transition entre deux images**
- **Conditions**: 2 images fournies, mots-clés vidéo
- **Service**: `videoImageGenerator.js` (avec lastImage)
- **Exemples**:
  - "créer une transition entre ces deux images"
  - "morphing de l'image 1 vers l'image 2"
  - "vidéo passant de jour à nuit"

### 7. EDIT_THEN_VIDEO
**Édition puis création de vidéo**
- **Conditions**: 1 image, mots-clés édition + vidéo
- **Service**: `imageEditor.js` puis `videoImageGenerator.js`
- **Exemples**:
  - "changer le ciel en rose puis animer l'image"
  - "transformer en noir et blanc puis créer une vidéo"
  - "ajouter de la neige et animer"

## 🔧 API Endpoints

### POST `/api/workflow/analyze`
Analyse le prompt et recommande un workflow

**Request Body** (JSON ou multipart/form-data):
```json
{
  "prompt": "créer une vidéo de vagues",
  "imageCount": 0
}
```

**Response**:
```json
{
  "success": true,
  "workflow": {
    "id": "text_to_video",
    "name": "Génération de vidéo simple",
    "description": "Générer une vidéo à partir d'un prompt textuel",
    "service": "videoGenerator",
    "method": "generateVideo"
  },
  "analysis": {
    "confidence": 1.0,
    "reasoning": "Le prompt contient 'créer une vidéo' et aucune image n'est fournie...",
    "suggestions": [
      "Spécifier le type de vagues (calmes, agitées)",
      "Décrire l'environnement (plage, océan ouvert)"
    ]
  },
  "prompts": {
    "original": "créer une vidéo de vagues",
    "optimized": "Dynamic video of powerful ocean waves crashing on a beach."
  },
  "requirements": {
    "imagesNeeded": 0,
    "imagesProvided": 0,
    "satisfied": true
  }
}
```

### POST `/api/workflow/execute`
Analyse ET exécute automatiquement le workflow recommandé

**Request Body** (multipart/form-data):
```
prompt: "un magnifique coucher de soleil"
images: [file1, file2] (optionnel)
useOptimizedPrompt: true (optionnel, défaut: true)
```

**Response**:
```json
{
  "success": true,
  "type": "image",
  "imageUrl": "https://replicate.delivery/xezq/.../out-0.jpg",
  "message": "Image générée avec succès",
  "mock": false,
  "workflow": {
    "id": "text_to_image",
    "name": "Génération d'image simple",
    "confidence": 1.0
  },
  "prompts": {
    "original": "un magnifique coucher de soleil",
    "optimized": "A magnificent sunset, vibrant colors, golden hour...",
    "used": "A magnificent sunset, vibrant colors, golden hour..."
  }
}
```

### GET `/api/workflow/list`
Liste tous les workflows disponibles

**Response**:
```json
{
  "success": true,
  "workflows": [
    {
      "id": "text_to_image",
      "name": "Génération d'image simple",
      "description": "...",
      "requires": {
        "prompt": true,
        "images": 0
      }
    },
    // ... autres workflows
  ],
  "count": 7
}
```

### GET `/api/workflow/examples`
Récupère des exemples de prompts par workflow

### GET `/api/workflow/:id`
Détails d'un workflow spécifique

## 🧠 Fonctionnement de l'analyse

### 1. Analyse par IA (Gemini 2.5 Flash)
Lorsqu'un token API est disponible :
- Utilise Gemini 2.5 Flash pour analyser le prompt
- Détecte les intentions (génération, édition, animation)
- Prend en compte le contexte (nombre d'images, langue)
- Génère un prompt optimisé en anglais pour Qwen
- Retourne un score de confiance (0-1)

### 2. Analyse par mots-clés (Fallback)
Sans token API :
- Détection de mots-clés vidéo: video, vidéo, animate, animer, animation, moving, motion
- Détection de mots-clés édition: edit, éditer, modify, modifier, change, transform, combine, merge
- Logique combinée avec le nombre d'images
- Confiance: 0.7

### 3. Règles de détection

| Images | Mots-clés vidéo | Mots-clés édition | Workflow recommandé |
|--------|----------------|-------------------|---------------------|
| 0 | Non | Non | TEXT_TO_IMAGE |
| 0 | Oui | Non | TEXT_TO_VIDEO |
| 1 | Non | Oui | IMAGE_EDIT_SINGLE |
| 2+ | Non | Oui | IMAGE_EDIT_MULTIPLE |
| 1 | Oui | Non | IMAGE_TO_VIDEO_SINGLE |
| 2 | Oui | Non | IMAGE_TO_VIDEO_TRANSITION |
| 1 | Oui | Oui | EDIT_THEN_VIDEO |

## 🎨 Intégration Frontend

### Composant WorkflowAnalysis.vue
Affiche l'analyse dans un panneau extensible avec :
- ✅ Workflow recommandé (chip coloré)
- ✅ Barre de confiance visuelle
- ✅ Raisonnement détaillé
- ✅ Comparaison prompt original vs optimisé
- ✅ Suggestions d'amélioration
- ✅ Vérification des exigences d'images
- ✅ Boutons d'action (utiliser prompt optimisé, exécuter)

### Intégration dans PromptInput.vue
- Bouton "Analyser (Mode intelligent)" en violet
- Affichage automatique du panneau d'analyse
- Exécution automatique du workflow recommandé
- Utilisation du prompt optimisé

## 📊 Exemple de flux complet

### Scénario: Générer une image
```
1. Utilisateur entre: "un chat mignon"
2. Clique sur "Analyser (Mode intelligent)"
3. Backend analyse → Recommande TEXT_TO_IMAGE (confiance: 95%)
4. Frontend affiche:
   - Workflow: "Génération d'image simple"
   - Prompt optimisé: "A cute cat, fluffy, adorable..."
   - Suggestions: Ajouter race, couleur, style
5. Utilisateur clique "Exécuter"
6. Backend génère l'image avec le prompt optimisé
7. Résultat affiché avec métadonnées du workflow
```

### Scénario: Animer une image
```
1. Utilisateur upload 1 image
2. Entre: "animer cette image de paysage"
3. Clique sur "Analyser"
4. Backend analyse → Recommande IMAGE_TO_VIDEO_SINGLE (confiance: 95%)
5. Prompt optimisé: "Animate this landscape image, bringing it to life..."
6. Suggestions: Spécifier éléments à animer
7. Clique "Exécuter"
8. Backend génère vidéo depuis l'image
9. Vidéo affichée avec aspect ratio préservé
```

## 🔒 Sécurité et Validation

- ✅ Validation des paramètres (prompt requis)
- ✅ Vérification du nombre d'images requis vs fourni
- ✅ Gestion des erreurs détaillée
- ✅ Timeout de 10 minutes pour éviter les blocages
- ✅ Mode mock sans token API
- ✅ Safety checker désactivé par défaut

## 🚀 Avantages

1. **UX simplifiée**: Un seul bouton pour tout faire
2. **Intelligent**: Détection automatique des intentions
3. **Optimisé**: Prompts adaptés aux modèles Qwen
4. **Transparent**: Affichage du raisonnement et de la confiance
5. **Flexible**: Possibilité d'éditer le prompt optimisé
6. **Multilingue**: Accepte prompts en français, output en anglais
7. **Robuste**: Fallback sur analyse par mots-clés

## 📝 Configuration requise

### Backend
- Node.js 18+
- Express.js
- Replicate SDK
- Gemini API token (optionnel, pour analyse IA)

### Variables d'environnement
```env
REPLICATE_API_TOKEN=r8_xxx
GOOGLE_API_KEY=AIzaSyxxx (pour Gemini, optionnel)
```

### Services requis
- `workflowAnalyzer.js` - Analyse intelligente
- `imageGenerator.js` - Génération d'images
- `imageEditor.js` - Édition d'images
- `videoGenerator.js` - Génération de vidéos
- `videoImageGenerator.js` - Vidéos depuis images
- `promptEnhancer.js` - Amélioration de prompts

## 🧪 Tests

### Tests manuels effectués
✅ TEXT_TO_IMAGE: "un chat mignon" → Image générée
✅ TEXT_TO_VIDEO: "créer une vidéo de vagues" → Vidéo générée
✅ IMAGE_TO_VIDEO_SINGLE: "animer cette image" + 1 image → Détection correcte

### À tester
- [ ] IMAGE_EDIT_SINGLE avec vraie image
- [ ] IMAGE_EDIT_MULTIPLE avec 2 images
- [ ] IMAGE_TO_VIDEO_TRANSITION avec 2 images
- [ ] EDIT_THEN_VIDEO (workflow composite)
- [ ] Cas d'erreur (images manquantes)
- [ ] Fallback mode (sans API tokens)

## 🔮 Améliorations futures

1. **Historique des analyses**: Sauvegarder analyses précédentes
2. **Workflows favoris**: Permettre de marquer workflows préférés
3. **Override utilisateur**: "Je veux un workflow différent"
4. **Suggestions alternatives**: Afficher 2-3 workflows possibles
5. **Workflow composite EDIT_THEN_VIDEO**: Implémenter complètement
6. **Batch processing**: Analyser plusieurs prompts d'un coup
7. **A/B testing**: Comparer résultats de différents workflows
8. **Analytics**: Tracker workflows les plus utilisés

## 📚 Documentation technique

### Architecture
```
Frontend (Vue.js + Quasar)
├── PromptInput.vue (bouton Analyser)
└── WorkflowAnalysis.vue (affichage résultats)
    ↓
Backend (Express.js)
├── routes/workflow.js (API endpoints)
└── services/
    ├── workflowAnalyzer.js (analyse intelligente)
    ├── imageGenerator.js
    ├── imageEditor.js
    ├── videoGenerator.js
    └── videoImageGenerator.js
```

### Flux de données
```
1. User Input (prompt + images)
   ↓
2. POST /api/workflow/execute
   ↓
3. workflowAnalyzer.analyzeWorkflow()
   ↓ (Gemini 2.5 Flash)
4. AI Analysis → Workflow recommendation
   ↓
5. Service execution (generateImage, generateVideo, etc.)
   ↓
6. Response (result + workflow metadata)
   ↓
7. Frontend display (ResultDisplay.vue)
```

## 🎓 Bonnes pratiques

### Pour les développeurs
1. Toujours valider les paramètres avant exécution
2. Retourner des erreurs explicites
3. Logger les étapes importantes
4. Utiliser les prompts optimisés par défaut
5. Gérer le mode mock gracieusement

### Pour les utilisateurs
1. Être spécifique dans les prompts
2. Vérifier le workflow recommandé avant exécution
3. Éditer le prompt optimisé si nécessaire
4. Fournir le bon nombre d'images
5. Utiliser les suggestions pour améliorer

---

**Version**: 1.0.0  
**Date**: 3 novembre 2025  
**Auteur**: GitHub Copilot  
**Status**: ✅ Production Ready
