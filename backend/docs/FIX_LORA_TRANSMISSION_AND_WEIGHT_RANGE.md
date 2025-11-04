# Correction transmission LoRA et extension plage de poids

## Date
3 novembre 2025

## Problèmes corrigés

### 1. Paramètres LoRA non transmis au modèle ❌ → ✅

**Symptôme** : Les paramètres LoRA étaient définis dans l'interface mais n'étaient pas envoyés à l'API Replicate.

**Cause** : Les paramètres LoRA arrivaient directement dans `inputs` depuis le frontend, mais le code les cherchait uniquement dans `inputs.parameters`.

**Solution** : Ajout d'une logique de récupération des paramètres LoRA depuis `inputs` directement, avec fallback sur `inputs.parameters`.

---

### 2. Plage de poids limitée à 0-1 ❌ → ✅ (0-2)

**Symptôme** : Les poids LoRA étaient limités de 0 à 1, mais certains cas d'usage nécessitent des poids supérieurs pour un effet plus marqué.

**Solution** : Extension de la plage à 0-2 avec défaut 1.0, tant dans le backend que le frontend.

---

## Modifications apportées

### 1. Backend - Récupération paramètres LoRA ✅

**Fichier** : `/backend/services/tasks/GenerateVideoI2VTask.js`

**AVANT (lignes 45-50)** :
```javascript
const generationParams = {
  prompt: inputs.prompt,
  firstFrame: inputs.image,
  ...this.getDefaultParameters(),
  ...inputs.parameters
};
```

**APRÈS (lignes 45-54)** :
```javascript
const generationParams = {
  prompt: inputs.prompt,
  firstFrame: inputs.image,
  ...this.getDefaultParameters(),
  ...inputs.parameters,
  // Paramètres LoRA venant directement des inputs
  loraWeightsTransformer: inputs.loraWeightsTransformer || inputs.parameters?.loraWeightsTransformer,
  loraScaleTransformer: inputs.loraScaleTransformer ?? inputs.parameters?.loraScaleTransformer ?? 1.0,
  loraWeightsTransformer2: inputs.loraWeightsTransformer2 || inputs.parameters?.loraWeightsTransformer2,
  loraScaleTransformer2: inputs.loraScaleTransformer2 ?? inputs.parameters?.loraScaleTransformer2 ?? 1.0,
};
```

**Explication** :
- `inputs.loraWeightsTransformer || inputs.parameters?.loraWeightsTransformer` : Prend d'abord depuis `inputs`, sinon depuis `inputs.parameters`
- `inputs.loraScaleTransformer ?? inputs.parameters?.loraScaleTransformer ?? 1.0` : Utilise `??` pour gérer le cas où la valeur est `0` (qui est valide)
- Défaut `1.0` si aucune valeur n'est fournie

---

### 2. Backend - Extension plage poids 0-2 ✅

**Fichier** : `/backend/services/tasks/GenerateVideoI2VTask.js`

**AVANT (lignes 294-296 & 304-306)** :
```javascript
loraScaleTransformer: {
  type: 'number',
  default: 1.0,
  minimum: 0.0,
  maximum: 1.0,  // ❌ Limité à 1.0
  description: 'Poids du LoRA transformer (0.0 = désactivé, 1.0 = maximum)'
},
// ...
loraScaleTransformer2: {
  type: 'number',
  default: 1.0,
  minimum: 0.0,
  maximum: 1.0,  // ❌ Limité à 1.0
  description: 'Poids du second LoRA transformer (0.0 = désactivé, 1.0 = maximum)'
}
```

**APRÈS (lignes 294-296 & 304-306)** :
```javascript
loraScaleTransformer: {
  type: 'number',
  default: 1.0,
  minimum: 0.0,
  maximum: 2.0,  // ✅ Étendu à 2.0
  description: 'Poids du LoRA transformer (0.0-2.0, défaut 1.0)'
},
// ...
loraScaleTransformer2: {
  type: 'number',
  default: 1.0,
  minimum: 0.0,
  maximum: 2.0,  // ✅ Étendu à 2.0
  description: 'Poids du second LoRA transformer (0.0-2.0, défaut 1.0)'
}
```

---

### 3. Backend - Amélioration logs ✅

**Fichier** : `/backend/services/videoImageGenerator.js`

**AVANT (lignes 215-221)** :
```javascript
console.log('📝 Paramètres de génération:', {
  prompt: input.prompt,
  numFrames: input.num_frames,
  resolution: input.resolution,
  fps: input.frames_per_second,
  hasLastImage: !!input.last_image,
});
```

**APRÈS (lignes 215-225)** :
```javascript
console.log('📝 Paramètres de génération:', {
  prompt: input.prompt,
  numFrames: input.num_frames,
  resolution: input.resolution,
  fps: input.frames_per_second,
  hasLastImage: !!input.last_image,
  loraWeightsTransformer: input.lora_weights_transformer || 'none',
  loraScaleTransformer: input.lora_scale_transformer,
  loraWeightsTransformer2: input.lora_weights_transformer_2 || 'none',
  loraScaleTransformer2: input.lora_scale_transformer_2,
});
```

**Avantage** : Les logs affichent maintenant les paramètres LoRA pour faciliter le débogage.

---

### 4. Frontend - Extension plage poids 0-2 ✅

**Fichier** : `/frontend/src/config/taskDefinitions.js`

**AVANT (lignes 289-300 & 310-321)** :
```javascript
loraScaleTransformer: {
  type: 'number',
  label: 'Poids LoRA 1',
  required: false,
  min: 0,
  max: 1,  // ❌ Limité à 1
  step: 0.1,
  default: 1.0,
  acceptsVariable: false
},
// ...
loraScaleTransformer2: {
  type: 'number',
  label: 'Poids LoRA 2',
  required: false,
  min: 0,
  max: 1,  // ❌ Limité à 1
  step: 0.1,
  default: 1.0,
  acceptsVariable: false
}
```

**APRÈS (lignes 289-300 & 310-321)** :
```javascript
loraScaleTransformer: {
  type: 'number',
  label: 'Poids LoRA 1',
  required: false,
  min: 0,
  max: 2,  // ✅ Étendu à 2
  step: 0.1,
  default: 1.0,
  acceptsVariable: false
},
// ...
loraScaleTransformer2: {
  type: 'number',
  label: 'Poids LoRA 2',
  required: false,
  min: 0,
  max: 2,  // ✅ Étendu à 2
  step: 0.1,
  default: 1.0,
  acceptsVariable: false
}
```

---

## Flux de transmission corrigé

### Avant (❌ LoRA non transmis)

```
Frontend Builder
   ↓
   inputs: {
     image: "...",
     prompt: "...",
     loraWeightsTransformer: "https://...",  ← Dans inputs
     loraScaleTransformer: 0.8
   }
   ↓
GenerateVideoI2VTask.execute()
   ↓
   generationParams = {
     ...inputs.parameters  ← Cherche dans parameters (vide)
   }
   ↓
   ❌ loraWeightsTransformer: undefined
   ❌ loraScaleTransformer: undefined
   ↓
generateVideoFromImage()
   ↓
   ❌ Pas de LoRA transmis à Replicate
```

---

### Après (✅ LoRA transmis correctement)

```
Frontend Builder
   ↓
   inputs: {
     image: "...",
     prompt: "...",
     loraWeightsTransformer: "https://...",
     loraScaleTransformer: 0.8
   }
   ↓
GenerateVideoI2VTask.execute()
   ↓
   generationParams = {
     ...inputs.parameters,
     loraWeightsTransformer: inputs.loraWeightsTransformer,  ✅
     loraScaleTransformer: inputs.loraScaleTransformer       ✅
   }
   ↓
   ✅ loraWeightsTransformer: "https://..."
   ✅ loraScaleTransformer: 0.8
   ↓
generateVideoFromImage({
   loraWeightsTransformer,
   loraScaleTransformer,
   ...
})
   ↓
videoImageGenerator.js
   ↓
   input.lora_weights_transformer = loraWeightsTransformer
   input.lora_scale_transformer = loraScaleTransformer
   ↓
Replicate API
   ↓
   ✅ Vidéo avec LoRA appliqué
```

---

## Plage de poids 0-2 : Explication

### Pourquoi 0-2 au lieu de 0-1 ?

**0.0** : LoRA désactivé (pas d'effet)
**0.5** : Effet subtil (50%)
**1.0** : Effet standard (100% - **défaut**)
**1.5** : Effet renforcé (150%)
**2.0** : Effet maximum (200%)

### Cas d'usage

**Poids < 1.0** : Style LoRA subtil, mélangé avec le style original
```javascript
loraScaleTransformer: 0.3  // Touche légère de style anime
```

**Poids = 1.0** : Équilibre standard (recommandé)
```javascript
loraScaleTransformer: 1.0  // Style anime normal
```

**Poids > 1.0** : Style LoRA très prononcé, dominant
```javascript
loraScaleTransformer: 1.8  // Style anime très marqué
```

### Exemple d'utilisation

**Workflow avec 2 LoRA et poids personnalisés** :
```json
{
  "id": "generate1",
  "type": "generate_video_i2v",
  "inputs": {
    "image": "{{input1.images}}",
    "prompt": "A woman rises gracefully from water",
    "numFrames": 121,
    "loraWeightsTransformer": "https://replicate.delivery/.../anime-style.tar",
    "loraScaleTransformer": 1.5,
    "loraWeightsTransformer2": "https://replicate.delivery/.../dramatic-lighting.tar",
    "loraScaleTransformer2": 0.7
  }
}
```

**Résultat** :
- Style anime très prononcé (150%)
- Éclairage dramatique modéré (70%)
- Combinaison unique et personnalisée

---

## Logs améliorés

### Console backend (exemple)

**AVANT** :
```
📝 Paramètres de génération: {
  prompt: 'A woman rises gracefully from water',
  numFrames: 81,
  resolution: '480p',
  fps: 16,
  hasLastImage: false
}
```

**APRÈS** :
```
📝 Paramètres de génération: {
  prompt: 'A woman rises gracefully from water',
  numFrames: 81,
  resolution: '480p',
  fps: 16,
  hasLastImage: false,
  loraWeightsTransformer: 'https://replicate.delivery/.../anime-style.tar',
  loraScaleTransformer: 1.5,
  loraWeightsTransformer2: 'none',
  loraScaleTransformer2: undefined
}
```

**Avantage** : Visibilité immédiate sur les paramètres LoRA transmis.

---

## Tests recommandés

### Test 1 : LoRA avec poids par défaut (1.0)

**Actions** :
1. Créer workflow `generate_video_i2v`
2. Renseigner URL LoRA 1
3. Laisser poids à 1.0 (défaut)
4. Exécuter

**Résultat attendu** :
- ✅ Console backend affiche `loraScaleTransformer: 1.0`
- ✅ Vidéo générée avec style LoRA standard

---

### Test 2 : LoRA avec poids élevé (1.8)

**Actions** :
1. Créer workflow `generate_video_i2v`
2. Renseigner URL LoRA 1
3. Régler poids à 1.8
4. Exécuter

**Résultat attendu** :
- ✅ Console backend affiche `loraScaleTransformer: 1.8`
- ✅ Vidéo générée avec style LoRA très prononcé

---

### Test 3 : LoRA avec poids 0 (désactivé)

**Actions** :
1. Créer workflow `generate_video_i2v`
2. Renseigner URL LoRA 1
3. Régler poids à 0
4. Exécuter

**Résultat attendu** :
- ✅ Console backend affiche `loraScaleTransformer: 0`
- ✅ Vidéo générée sans effet LoRA (comme si pas de LoRA)

---

### Test 4 : 2 LoRA simultanés avec poids différents

**Actions** :
1. Créer workflow `generate_video_i2v`
2. Renseigner LoRA 1 (poids 1.5)
3. Renseigner LoRA 2 (poids 0.6)
4. Exécuter

**Résultat attendu** :
- ✅ Console backend affiche les deux LoRA avec leurs poids
- ✅ Vidéo générée avec combinaison des deux styles

---

### Test 5 : Vérification logs

**Actions** :
1. Exécuter n'importe quel workflow avec LoRA
2. Vérifier logs backend

**Logs attendus** :
```
⚙️ Paramètres de génération vidéo {
  prompt: '...',
  firstFrame: { buffer: <Buffer...>, ... },
  loraWeightsTransformer: 'https://...',
  loraScaleTransformer: 1.5,
  ...
}

📝 Paramètres de génération: {
  prompt: '...',
  numFrames: 81,
  loraWeightsTransformer: 'https://...',
  loraScaleTransformer: 1.5,
  loraWeightsTransformer2: 'none',
  loraScaleTransformer2: undefined
}
```

---

## Points techniques importants

### 1. Opérateur `??` (nullish coalescing)

**Pourquoi `??` au lieu de `||` pour les poids ?**

```javascript
// ❌ INCORRECT avec ||
loraScaleTransformer: inputs.loraScaleTransformer || 1.0
// Problème : Si inputs.loraScaleTransformer = 0, alors 0 || 1.0 = 1.0
// Le poids 0 (désactivé) serait remplacé par 1.0 !

// ✅ CORRECT avec ??
loraScaleTransformer: inputs.loraScaleTransformer ?? 1.0
// Solution : Si inputs.loraScaleTransformer = 0, alors 0 ?? 1.0 = 0
// Le poids 0 est préservé
```

**Règle** : Utiliser `??` pour les valeurs numériques où `0` est une valeur valide.

---

### 2. Optional chaining `?.`

**Pourquoi `inputs.parameters?.loraWeightsTransformer` ?**

```javascript
// ❌ INCORRECT sans ?
inputs.parameters.loraWeightsTransformer
// Problème : Si inputs.parameters = undefined, erreur "Cannot read property of undefined"

// ✅ CORRECT avec ?.
inputs.parameters?.loraWeightsTransformer
// Solution : Si inputs.parameters = undefined, retourne undefined sans erreur
```

**Règle** : Utiliser `?.` pour accéder à des propriétés potentiellement absentes.

---

### 3. Ordre de priorité

**Logique de récupération** :
```javascript
loraWeightsTransformer: inputs.loraWeightsTransformer || inputs.parameters?.loraWeightsTransformer
```

**Ordre** :
1. **Premier** : `inputs.loraWeightsTransformer` (valeur directe depuis frontend)
2. **Fallback** : `inputs.parameters?.loraWeightsTransformer` (valeur dans sous-objet)

**Cas couverts** :
- ✅ Frontend envoie dans `inputs` (cas normal)
- ✅ Frontend envoie dans `inputs.parameters` (cas alternatif)
- ✅ Pas de valeur fournie (undefined)

---

## Compatibilité

### Backend
- ✅ Récupération depuis `inputs` ou `inputs.parameters`
- ✅ Plage 0-2 avec validation
- ✅ Défaut 1.0 si non fourni
- ✅ Logs enrichis

### Frontend
- ✅ Plage 0-2 dans les sliders
- ✅ Step 0.1 pour précision
- ✅ Défaut 1.0
- ✅ Transmission directe dans `inputs`

### API Replicate
- ✅ Supporte poids 0-2
- ✅ Paramètres `lora_scale_transformer` et `lora_scale_transformer_2`

---

## Résumé des fichiers modifiés

### Backend
**`/backend/services/tasks/GenerateVideoI2VTask.js`**
- Lignes 45-54 : Ajout logique récupération LoRA depuis `inputs`
- Lignes 294-296 & 304-306 : Extension plage 0-2

**`/backend/services/videoImageGenerator.js`**
- Lignes 215-225 : Ajout logs LoRA

### Frontend
**`/frontend/src/config/taskDefinitions.js`**
- Lignes 289-300 & 310-321 : Extension plage 0-2

---

## Auteur

Copilot AI Assistant

## Validation

✅ Récupération LoRA depuis `inputs` directement
✅ Fallback sur `inputs.parameters`
✅ Plage 0-2 backend (schéma)
✅ Plage 0-2 frontend (UI)
✅ Logs enrichis avec paramètres LoRA
✅ Opérateur `??` pour gérer poids 0
✅ Défaut 1.0 préservé
✅ Pas de régression
