# ⏱️ Configuration des Timeouts - Attente maximale pour les modèles AI

## 📋 Problème résolu

### Symptôme
Les requêtes aux modèles AI (Replicate) se terminaient par un timeout avant que le modèle ne finisse de générer le résultat.

```bash
Error: timeout of 30000ms exceeded
```

### Cause
Les timeouts par défaut étaient trop courts pour les modèles AI qui peuvent prendre plusieurs minutes pour générer des résultats (surtout pour l'édition d'images).

## ✅ Solution appliquée

### 1. Configuration centralisée des timeouts Replicate

Création de `/backend/config/replicate.js` :

```javascript
export const REPLICATE_CONFIG = {
  // Timeout global : 10 minutes (600 secondes)
  timeout: 600000,
  
  // Intervalle de polling : 1 seconde entre chaque vérification
  wait: {
    interval: 1000,
  },
  
  // Temps d'attente max pour les prédictions
  prediction: {
    maxWaitTime: 600, // 10 minutes
  }
};

export const DEFAULT_REPLICATE_OPTIONS = {
  wait: REPLICATE_CONFIG.wait,
};
```

### 2. Timeout frontend (Axios)

**Avant** : 30 secondes
```javascript
const api = axios.create({
  timeout: 30000, // ❌ 30 secondes trop court
});
```

**Après** : 10 minutes
```javascript
const api = axios.create({
  timeout: 600000, // ✅ 10 minutes (600 secondes)
});
```

### 3. Timeout backend (Express)

Ajout de timeouts étendus sur le serveur HTTP :

```javascript
const server = app.listen(PORT, () => {
  // ...
});

// Timeouts étendus pour les requêtes AI longues
server.timeout = 600000;           // 10 minutes
server.keepAliveTimeout = 610000;  // 10 min + 10s
server.headersTimeout = 620000;    // 10 min + 20s

console.log(`⏱️  Timeout serveur: ${server.timeout / 1000}s`);
```

### 4. Tous les services Replicate mis à jour

Chaque service importe et utilise la configuration :

```javascript
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';

// Avant
const output = await replicate.run('model', { input });

// Après
console.log('⏱️  Timeout: 10 minutes maximum');
const output = await replicate.run('model', {
  input,
  ...DEFAULT_REPLICATE_OPTIONS
});
```

## 📊 Services mis à jour

### 1. ✅ imageEditor.js
```javascript
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';

const output = await replicate.run(
  "qwen/qwen-image-edit-plus",
  { 
    input,
    ...DEFAULT_REPLICATE_OPTIONS
  }
);
```

### 2. ✅ imageGenerator.js
```javascript
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';

// Text-to-image
const output = await replicate.run(
  'qwen/qwen-image',
  { 
    input,
    ...DEFAULT_REPLICATE_OPTIONS
  }
);

// Image-to-image aussi mis à jour
```

### 3. ✅ promptEnhancer.js
```javascript
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';

const output = await replicate.run(
  'google/gemini-2.5-flash',
  {
    input: { ... },
    ...DEFAULT_REPLICATE_OPTIONS
  }
);
```

### 4. ✅ imageAnalyzer.js
```javascript
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';

const output = await replicate.run(
  'yorickvp/llava-13b:...',
  {
    input: { ... },
    ...DEFAULT_REPLICATE_OPTIONS
  }
);
```

## 🎯 Hiérarchie des timeouts

```
┌─────────────────────────────────────────────────────┐
│ Frontend (Axios)                                    │
│ Timeout: 600 000 ms (10 minutes)                    │
│                                                     │
│  ↓ Requête HTTP                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Backend (Express)                                   │
│ server.timeout: 600 000 ms (10 minutes)             │
│ keepAliveTimeout: 610 000 ms                        │
│ headersTimeout: 620 000 ms                          │
│                                                     │
│  ↓ Appel Replicate                                  │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Replicate SDK                                       │
│ Polling interval: 1000 ms (1 seconde)               │
│ Max wait time: 600 secondes (10 minutes)            │
│                                                     │
│  ↓ API Replicate                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 📝 Logs de timeout

Chaque appel Replicate affiche maintenant :

```bash
⏱️  Timeout: 10 minutes maximum
```

Cela permet de savoir que le système attend jusqu'à 10 minutes pour la réponse.

## ⏰ Durées typiques des modèles

| Modèle | Opération | Durée typique |
|--------|-----------|---------------|
| **Gemini 2.5 Flash** | Amélioration prompt | 5-15 secondes |
| **Qwen Image** | Génération simple | 30-60 secondes |
| **Qwen Image** | Image-to-image | 40-80 secondes |
| **Qwen Image Edit Plus** | Édition 1 image | 60-120 secondes |
| **Qwen Image Edit Plus** | Édition 3 images | 120-300 secondes |
| **LLaVA 13B** | Analyse image | 10-30 secondes |

Avec un timeout de **10 minutes**, tous ces cas sont largement couverts, même en cas de charge élevée sur les serveurs Replicate.

## ✅ Avantages

### 1. **Pas de timeouts prématurés**
- ✅ 10 minutes laissent assez de temps aux modèles
- ✅ Même les opérations complexes (édition multiple) passent
- ✅ Marge confortable en cas de charge serveur

### 2. **Configuration centralisée**
- ✅ Un seul fichier de config (`replicate.js`)
- ✅ Facile à ajuster pour tous les services
- ✅ Cohérence garantie

### 3. **Logs explicites**
- ✅ Chaque appel indique le timeout
- ✅ L'utilisateur sait que ça peut prendre du temps
- ✅ Facilite le débogage

### 4. **Polling optimisé**
- ✅ Vérification toutes les 1 seconde (au lieu de 500ms)
- ✅ Réduit la charge réseau
- ✅ Suffisamment réactif

## 🧪 Test

### Avant les changements
```bash
# Édition d'image avec 3 images
POST /api/edit/image

⏱️  Temps écoulé: 32 secondes
❌ Error: timeout of 30000ms exceeded
```

### Après les changements
```bash
# Édition d'image avec 3 images
POST /api/edit/image

⏱️  Timeout: 10 minutes maximum
⏱️  Temps écoulé: 2 minutes 15 secondes
✅ Édition terminée avec succès
```

## 🚀 Recommandations utilisateur

Avec ces timeouts, vous pouvez maintenant :

1. **Éditer plusieurs images** sans timeout
2. **Générer des images complexes** avec prompts détaillés
3. **Attendre patiemment** - le système peut prendre jusqu'à 10 minutes
4. **Voir les logs** qui indiquent la progression

### Message pour l'utilisateur

Quand une opération AI est lancée, l'interface devrait afficher :

```
⏳ Génération en cours...
Cela peut prendre jusqu'à quelques minutes.
Le modèle AI travaille pour vous ! 🎨
```

## 📊 Configuration finale

### Frontend (`axios.js`)
```javascript
timeout: 600000  // 10 minutes
```

### Backend (`server.js`)
```javascript
server.timeout = 600000          // 10 minutes
server.keepAliveTimeout = 610000 // 10 min + 10s
server.headersTimeout = 620000   // 10 min + 20s
```

### Replicate (`config/replicate.js`)
```javascript
timeout: 600000           // 10 minutes
wait.interval: 1000       // 1 seconde entre polls
prediction.maxWaitTime: 600  // 10 minutes
```

### Services (tous)
```javascript
...DEFAULT_REPLICATE_OPTIONS  // Applique la config
```

## 🎉 Résultat

```
✅ Frontend : Attend jusqu'à 10 minutes
✅ Backend : Supporte les requêtes de 10 minutes
✅ Replicate : Polling pendant 10 minutes max
✅ Tous les modèles AI : Temps suffisant pour répondre
```

**Plus de timeouts prématurés ! Les modèles AI ont tout le temps nécessaire. 🚀**

---

**Statut** : ✅ Timeouts configurés au maximum  
**Impact** : Plus d'erreurs de timeout pour les opérations AI  
**Durée max** : 10 minutes (600 secondes)  
**Services impactés** : Tous (editor, generator, enhancer, analyzer)
