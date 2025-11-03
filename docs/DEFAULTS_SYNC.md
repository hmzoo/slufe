# Configuration des paramètres par défaut

Ce document explique comment les paramètres par défaut sont synchronisés entre le frontend et le backend.

## 📋 Fichiers de configuration

### Backend
- **Fichier** : `/backend/config/defaults.js`
- **Exports** : `IMAGE_DEFAULTS`, `VIDEO_DEFAULTS`, `EDIT_DEFAULTS`, `VALID_OPTIONS`, `CONSTRAINTS`
- **Utilisé par** :
  - `/backend/services/imageGenerator.js`
  - `/backend/services/videoGenerator.js`
  - `/backend/services/videoImageGenerator.js`

### Frontend
- **Fichier** : `/frontend/src/config/defaults.js`
- **Exports** : `IMAGE_DEFAULTS`, `VIDEO_DEFAULTS`, `EDIT_DEFAULTS`, `VALID_OPTIONS`, `CONSTRAINTS`
- **Utilisé par** :
  - `/frontend/src/components/PromptInput.vue`
  - (Peut être étendu à d'autres composants)

## 🎯 Paramètres synchronisés

### Images (`IMAGE_DEFAULTS`)
| Paramètre | Valeur par défaut | Description |
|-----------|------------------|-------------|
| `aspectRatio` | `'16:9'` | Format paysage standard |
| `guidance` | `3` | Guidance scale (2-4 recommandé) |
| `numInferenceSteps` | `30` | Nombre d'étapes (28-50 recommandé) |
| `imageSize` | `'optimize_for_quality'` | Optimisation qualité vs vitesse |
| `outputFormat` | `'jpg'` | Format de sortie |
| `outputQuality` | `90` | Qualité (0-100) |
| `enhancePrompt` | `false` | Amélioration automatique du prompt |
| `disableSafetyChecker` | `true` | Désactivation du filtre de sécurité |
| `negativePrompt` | `'blurry, low quality...'` | Ce qu'on ne veut pas |

### Vidéos (`VIDEO_DEFAULTS`)
| Paramètre | Valeur par défaut | Description |
|-----------|------------------|-------------|
| `aspectRatio` | `'16:9'` | Format paysage standard |
| `numFrames` | `81` | Nombre de frames (81-121) |
| `resolution` | `'480p'` | Résolution (480p ou 720p) |
| `framesPerSecond` | `16` | FPS (5-30) |
| `interpolateOutput` | `true` | Interpoler à 30 FPS |
| `goFast` | `true` | Mode rapide |
| `sampleShift` | `12` | Intensité du mouvement (1-20) |
| `disableSafetyChecker` | `true` | Désactivation du filtre |
| `optimizePrompt` | `false` | Optimisation en chinois |

### Édition (`EDIT_DEFAULTS`)
| Paramètre | Valeur par défaut | Description |
|-----------|------------------|-------------|
| `outputFormat` | `'webp'` | Format WebP optimal |
| `outputQuality` | `95` | Haute qualité pour édition |

## 🔄 Comment modifier les valeurs par défaut

### ⚠️ IMPORTANT : Synchronisation obligatoire

Les deux fichiers (`backend/config/defaults.js` et `frontend/src/config/defaults.js`) doivent **toujours être synchronisés** :

1. **Modifier le backend** : `/backend/config/defaults.js`
2. **Modifier le frontend** : `/frontend/src/config/defaults.js`
3. **Vérifier** que les valeurs sont identiques

### Exemple de modification

Pour changer l'aspect ratio par défaut à `'1:1'` (carré) :

**Backend** :
```javascript
export const IMAGE_DEFAULTS = {
  aspectRatio: '1:1',  // ← Changé de '16:9' à '1:1'
  // ... reste identique
};
```

**Frontend** :
```javascript
export const IMAGE_DEFAULTS = {
  aspectRatio: '1:1',  // ← Même changement
  // ... reste identique
};
```

## ✅ Validation automatique

Pour vérifier la synchronisation, tu peux créer un test :

```bash
# Script de validation (à créer)
node scripts/validate-defaults.js
```

Ce script comparerait les deux fichiers et signalerait toute différence.

## 📝 Notes

- **Format par défaut `'16:9'`** : Choisi car c'est le format standard pour les vidéos et images web
- **Alternative portrait** : Utilise `'9:16'` pour des contenus type stories/reels
- **Format carré** : Utilise `'1:1'` pour Instagram/social media
- Les services backend utilisent ces valeurs **uniquement si le frontend ne spécifie pas de valeur**
- Le workflow automatique (`/api/workflow/execute`) appelle les services avec le prompt uniquement, donc utilise **toutes** les valeurs par défaut

## 🎨 Options valides

Les options valides sont définies dans `VALID_OPTIONS` :

- **aspectRatio** : `'16:9'`, `'9:16'`, `'1:1'`, `'4:3'`, `'3:4'`, `'21:9'`, `'9:21'`
- **resolution** : `'480p'`, `'720p'`
- **outputFormat** : `'jpg'`, `'png'`, `'webp'`
- **imageSize** : `'optimize_for_quality'`, `'optimize_for_speed'`

## 🔧 Contraintes

Les contraintes (min/max) sont définies dans `CONSTRAINTS` :

| Paramètre | Min | Max | Recommandé |
|-----------|-----|-----|------------|
| `guidance` | 1 | 20 | 2-4 |
| `numInferenceSteps` | 1 | 100 | 28-50 |
| `outputQuality` | 0 | 100 | 80-95 |
| `numFrames` | 81 | 121 | - |
| `framesPerSecond` | 5 | 30 | - |
| `sampleShift` | 1 | 20 | - |
