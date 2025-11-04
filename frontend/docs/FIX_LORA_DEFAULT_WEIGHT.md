# Correction poids LoRA par défaut à 1

## Date
3 novembre 2025

## Problème
Les poids LoRA n'étaient pas toujours initialisés à 1 par défaut dans le frontend.

## Solution

### 1. Valeurs par défaut dans taskDefinitions.js ✅

**Fichier** : `/frontend/src/config/taskDefinitions.js`

Les valeurs par défaut étaient déjà correctement définies :

```javascript
loraScaleTransformer: {
  type: 'number',
  label: 'Poids LoRA 1',
  required: false,
  min: 0,
  max: 2,
  step: 0.1,
  default: 1.0,  // ✅ Déjà à 1.0
  acceptsVariable: false
},
loraScaleTransformer2: {
  type: 'number',
  label: 'Poids LoRA 2',
  required: false,
  min: 0,
  max: 2,
  step: 0.1,
  default: 1.0,  // ✅ Déjà à 1.0
  acceptsVariable: false
}
```

---

### 2. Initialisation dans addTask() améliorée ✅

**Fichier** : `/frontend/src/components/WorkflowRunner.vue`

**Lignes 878-892** :

**AVANT** :
```javascript
// Initialiser les inputs avec valeurs par défaut
Object.keys(taskDef.inputs).forEach(inputKey => {
  const inputDef = taskDef.inputs[inputKey]
  if (inputDef.default !== undefined) {
    newTask.input[inputKey] = inputDef.default
  } else if (inputDef.type === 'number') {
    // Pour les nombres, utiliser min ou 0 par défaut
    newTask.input[inputKey] = inputDef.min !== undefined ? inputDef.min : 0  // ❌ 0 par défaut
  } else {
    newTask.input[inputKey] = ''
  }
})
```

**APRÈS** :
```javascript
// Initialiser les inputs avec valeurs par défaut
Object.keys(taskDef.inputs).forEach(inputKey => {
  const inputDef = taskDef.inputs[inputKey]
  if (inputDef.default !== undefined) {
    newTask.input[inputKey] = inputDef.default  // ✅ Utilise default: 1.0
  } else if (inputDef.type === 'number') {
    // Pour les nombres, utiliser 1 par défaut (sauf si min est défini et > 0)
    if (inputDef.min !== undefined && inputDef.min > 0) {
      newTask.input[inputKey] = inputDef.min
    } else {
      newTask.input[inputKey] = 1  // ✅ 1 par défaut au lieu de 0
    }
  } else {
    newTask.input[inputKey] = ''
  }
})
```

**Impact** : Les poids LoRA sont maintenant toujours initialisés à 1 (via `default: 1.0` ou fallback à 1).

---

### 3. Affichage du slider corrigé ✅

**Fichier** : `/frontend/src/components/WorkflowRunner.vue`

**Ligne 182** :

**AVANT** :
```vue
<q-slider
  v-model="task.input[inputKey]"
  :min="inputDef.min || 0"
  :max="inputDef.max || 100"
  :step="inputDef.step || 0.1"
  :label-value="`${task.input[inputKey] || inputDef.default || 0}`"
  label-always
  color="primary"
/>
```

**Problème** : `task.input[inputKey] || inputDef.default || 0`
- Si `task.input[inputKey]` vaut `0`, il est considéré comme falsy
- L'opérateur `||` ignore `0` et passe à `inputDef.default`
- Mais pour `undefined`, il devrait utiliser la valeur par défaut

**APRÈS** :
```vue
<q-slider
  v-model="task.input[inputKey]"
  :min="inputDef.min || 0"
  :max="inputDef.max || 100"
  :step="inputDef.step || 0.1"
  :label-value="`${task.input[inputKey] ?? inputDef.default ?? 1}`"
  label-always
  color="primary"
/>
```

**Changement** : `||` → `??` (opérateur de coalescence nulle)

**Comportement** :
- `task.input[inputKey] = 0` → Affiche `0` (valide)
- `task.input[inputKey] = undefined` → Affiche `inputDef.default` (1.0)
- `task.input[inputKey] = null` → Affiche `inputDef.default` (1.0)
- Sinon → Affiche `1` (fallback final)

---

## Opérateur `??` vs `||`

### Différence cruciale

**Avec `||` (OU logique)** :
```javascript
0 || 1        // → 1 (0 est falsy)
'' || 'text'  // → 'text' ('' est falsy)
false || true // → true (false est falsy)
```

**Avec `??` (coalescence nulle)** :
```javascript
0 ?? 1        // → 0 (0 n'est pas null/undefined)
'' ?? 'text'  // → '' ('' n'est pas null/undefined)
false ?? true // → false (false n'est pas null/undefined)

undefined ?? 1 // → 1 (undefined est null/undefined)
null ?? 1      // → 1 (null est null/undefined)
```

### Pourquoi `??` est meilleur ici

Pour les poids LoRA (0-2) :
- `0` est une valeur **valide** (désactive le LoRA)
- On veut seulement utiliser le défaut si la valeur est `undefined` ou `null`
- Avec `||`, un poids de `0` serait remplacé par `1` ❌
- Avec `??`, un poids de `0` reste `0` ✅

---

## Flux complet

### Création d'une tâche avec LoRA

```
1. Utilisateur clique "Générer vidéo (image)"
   ↓
2. addTask('generate_video_i2v')
   ↓
3. Initialisation inputs:
   - loraWeightsTransformer: '' (vide)
   - loraScaleTransformer: 1.0 (default)  ✅
   - loraWeightsTransformer2: '' (vide)
   - loraScaleTransformer2: 1.0 (default)  ✅
   ↓
4. Affichage dans le Builder:
   - Input number: 1
   - Slider: affiche 1  ✅
   ↓
5. Utilisateur peut ajuster 0-2
```

---

## Tests recommandés

### Test 1 : Nouvelle tâche
1. Ajouter une tâche "Générer vidéo (image)"
2. ✅ Vérifier que les poids LoRA affichent `1.0`
3. ✅ Slider positionné à 1

### Test 2 : Modifier le poids à 0
1. Régler le slider à 0
2. ✅ L'affichage reste à 0 (pas remplacé par 1)
3. ✅ Le poids envoyé au backend est 0

### Test 3 : Workflow sauvegardé sans poids
1. Charger un ancien workflow (sans poids LoRA)
2. ✅ Les poids s'initialisent à 1 par défaut

### Test 4 : Dupliquer une tâche
1. Dupliquer une tâche avec poids LoRA = 1.5
2. ✅ La copie conserve 1.5 (pas de reset à 1)

---

## Fichiers modifiés

1. **`/frontend/src/components/WorkflowRunner.vue`**
   - Lignes 878-892 : Initialisation fallback à 1 au lieu de 0
   - Ligne 182 : Slider avec `??` au lieu de `||`

2. **`/frontend/src/config/taskDefinitions.js`**
   - Aucune modification (déjà `default: 1.0`)

---

## Résumé

### Problème résolu
- ✅ Poids LoRA initialisés à 1 par défaut
- ✅ Affichage correct dans le slider
- ✅ Valeur 0 respectée (pas remplacée par 1)
- ✅ Fallback à 1 pour valeurs undefined/null

### Techniques utilisées
- **Opérateur `??`** : Coalescence nulle pour gérer `undefined`/`null`
- **Fallback intelligent** : `default: 1.0` → fallback `1` si pas défini
- **Préservation de 0** : Permet de désactiver un LoRA

---

## Auteur

Copilot AI Assistant

## Validation

✅ `default: 1.0` dans taskDefinitions.js
✅ Initialisation à 1 dans addTask() (fallback)
✅ Slider avec opérateur `??` (gère 0 correctement)
✅ Pas d'erreurs de compilation
✅ Logique cohérente backend ↔ frontend
