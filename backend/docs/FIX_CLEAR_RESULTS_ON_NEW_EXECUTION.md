# Fix: Réinitialisation des résultats lors d'une nouvelle exécution

## Date
3 novembre 2025

## Problème

Lorsqu'un nouveau workflow est lancé dans le Builder, les résultats de l'ancien workflow restaient affichés, créant une confusion pour l'utilisateur.

### Symptôme

**Scénario** :
1. Exécuter workflow A → Résultats affichés ✅
2. Modifier workflow ou créer workflow B
3. Exécuter workflow B → Résultats de A restent visibles ❌
4. Résultats de B s'ajoutent ou remplacent partiellement ❌

**Problème** : L'utilisateur ne sait pas si les résultats affichés correspondent au workflow actuel ou à l'ancien.

---

## Solution implémentée

### Réinitialisation des résultats au début de l'exécution ✅

**Fichier** : `/frontend/src/components/WorkflowRunner.vue`

**Ligne 1137 - Ajout** :
```javascript
async function executeBuilderWorkflow() {
  if (!customWorkflow.value.tasks.length) {
    $q.notify({
      type: 'warning',
      message: 'Ajoutez au moins une tâche',
      position: 'top'
    })
    return
  }
  
  // ✅ Réinitialiser les résultats précédents
  workflowStore.lastResult = null
  
  // Marquer comme en cours d'exécution
  workflowStore.executing = true
  workflowStore.error = null
```

**Avant** : `workflowStore.lastResult` conservait les anciennes valeurs
**Après** : `workflowStore.lastResult = null` efface tout avant la nouvelle exécution

---

## Comportement complet

### Flux d'exécution - Mode Builder

```
1. Utilisateur clique "Exécuter le workflow"
   ↓
2. executeBuilderWorkflow() appelée
   ↓
3. ✅ workflowStore.lastResult = null
   (Résultats précédents effacés)
   ↓
4. workflowStore.executing = true
   (Affiche loader/spinner)
   ↓
5. Préparation des tâches
   ↓
6. Envoi requête POST /workflow/run
   ↓
7. Réception réponse
   ↓
8. workflowStore.lastResult = response.data
   (Nouveaux résultats stockés)
   ↓
9. workflowStore.executing = false
   (Cache loader)
   ↓
10. Affichage des nouveaux résultats
```

### Flux d'exécution - Mode Template

**Déjà géré correctement** dans `/frontend/src/stores/useWorkflowStore.js` ligne 369 :

```javascript
async function executeCurrentWorkflow() {
  executing.value = true
  error.value = null
  lastResult.value = null  // ✅ Déjà présent
  
  // Suite de l'exécution...
}
```

→ Pas de modification nécessaire pour le mode Template

---

## Comparaison Avant / Après

### AVANT la correction

**Exécution 1** :
```
Workflow A: describe_images + enhance_prompt
Résultats: {
  descriptions: ["A woman in dress..."],
  enhanced_prompt: "A crowned woman..."
}
```

**Exécution 2** (nouveau workflow) :
```
Workflow B: generate_image
Affichage:
  ❌ descriptions: ["A woman in dress..."]  // ← Ancien résultat reste
  ❌ enhanced_prompt: "A crowned woman..."  // ← Ancien résultat reste
  ✅ generated_image: "https://..."         // ← Nouveau résultat
```

**Problème** : Mélange de résultats anciens et nouveaux

---

### APRÈS la correction

**Exécution 1** :
```
Workflow A: describe_images + enhance_prompt
Résultats: {
  descriptions: ["A woman in dress..."],
  enhanced_prompt: "A crowned woman..."
}
```

**Exécution 2** (nouveau workflow) :
```
1. workflowStore.lastResult = null  // ✅ Effacement
2. Affichage: [Vide ou Loader]
3. Workflow B: generate_image
4. Affichage:
   ✅ generated_image: "https://..."  // ← Seulement le nouveau résultat
```

**Résultat** : Aucune confusion, résultats clairs

---

## Interface utilisateur

### Séquence visuelle

**1. Avant exécution**
```
┌────────────────────────────────────────┐
│ Builder - Workflow personnalisé        │
├────────────────────────────────────────┤
│ [Tâche 1: input_images]               │
│ [Tâche 2: describe_images]            │
│ [Tâche 3: generate_video_i2v]         │
├────────────────────────────────────────┤
│ [▶ Exécuter le workflow]              │
└────────────────────────────────────────┘

Résultats: (Anciens résultats visibles)
- Description: "A woman..."
- Vidéo: "https://old-video.mp4"
```

**2. Clic sur "Exécuter"**
```
↓ workflowStore.lastResult = null
```

**3. Pendant exécution**
```
┌────────────────────────────────────────┐
│ Builder - Workflow personnalisé        │
├────────────────────────────────────────┤
│ [Tâche 1: input_images]     ✅        │
│ [Tâche 2: describe_images]  ⏳        │
│ [Tâche 3: generate_video_i2v] ⏸️      │
├────────────────────────────────────────┤
│ [⏳ Exécution en cours...]            │
└────────────────────────────────────────┘

Résultats: [Vide - Effacés]  ✅
```

**4. Après exécution**
```
┌────────────────────────────────────────┐
│ Builder - Workflow personnalisé        │
├────────────────────────────────────────┤
│ [Tâche 1: input_images]     ✅        │
│ [Tâche 2: describe_images]  ✅        │
│ [Tâche 3: generate_video_i2v] ✅      │
├────────────────────────────────────────┤
│ [✅ Workflow exécuté avec succès]     │
└────────────────────────────────────────┘

Résultats: (Nouveaux résultats uniquement)
- Description: "A crowned woman..."  ✅
- Vidéo: "https://new-video.mp4"     ✅
```

---

## Gestion des états

### États possibles de `workflowStore.lastResult`

| État       | Valeur              | Affichage                    | Quand                           |
|------------|---------------------|------------------------------|---------------------------------|
| Vide       | `null`              | Aucun résultat               | Initial / Après réinitialisation |
| Chargement | `null`              | Loader                       | Pendant `executing = true`       |
| Succès     | `{ task_results }` | Résultats détaillés          | Après exécution réussie          |
| Erreur     | `null`              | Message d'erreur             | Après échec (via `error`)        |

### Transition d'états

```
[null] → (Clic Exécuter) → [null] → (executing=true) → [Chargement]
                                                           ↓
                                              (Réponse serveur)
                                                           ↓
                                      [Succès: {results}] ou [Erreur: null + error]
```

---

## Tests de validation

### Test 1 : Exécution successive de workflows différents

**Actions** :
1. Créer workflow A (2 tâches)
2. Exécuter → Vérifier résultats A
3. Créer workflow B (3 tâches différentes)
4. Exécuter → Vérifier résultats

**Résultat attendu** :
- ✅ Étape 2 : Résultats A affichés
- ✅ Étape 4 : Résultats A effacés, seulement résultats B affichés

---

### Test 2 : Modification et ré-exécution du même workflow

**Actions** :
1. Créer workflow avec describe_images
2. Exécuter → Résultat : "A woman..."
3. Modifier prompt d'entrée
4. Ré-exécuter

**Résultat attendu** :
- ✅ Étape 2 : Premier résultat "A woman..."
- ✅ Étape 4 : Ancien résultat effacé, nouveau résultat "A crowned woman..."

---

### Test 3 : Exécution échouée puis réussie

**Actions** :
1. Créer workflow avec erreur (ex: image manquante)
2. Exécuter → Erreur
3. Corriger l'erreur
4. Ré-exécuter

**Résultat attendu** :
- ✅ Étape 2 : Message d'erreur, pas de résultats
- ✅ Étape 4 : Message d'erreur effacé, nouveaux résultats affichés

---

## Cohérence avec le mode Template

### Mode Builder
```javascript
// WorkflowRunner.vue ligne 1137
async function executeBuilderWorkflow() {
  workflowStore.lastResult = null  // ✅ Ajouté
  workflowStore.executing = true
  workflowStore.error = null
  // ...
}
```

### Mode Template
```javascript
// useWorkflowStore.js ligne 369
async function executeCurrentWorkflow() {
  executing.value = true
  error.value = null
  lastResult.value = null  // ✅ Déjà présent
  // ...
}
```

**Résultat** : Comportement identique entre les deux modes ✅

---

## Impact utilisateur

### Amélioration de l'expérience

**Avant** :
- ❌ Confusion entre anciens et nouveaux résultats
- ❌ Nécessité de recharger la page pour effacer
- ❌ Doute sur la validité des résultats affichés

**Après** :
- ✅ Clarté totale : seuls les résultats actuels sont affichés
- ✅ Feedback visuel : loader pendant l'exécution
- ✅ Confiance : résultats toujours à jour

### Cas d'usage courants

**1. Itération rapide** :
```
Test 1 → Résultats → Modification → Test 2 → Nouveaux résultats ✅
```

**2. Comparaison de workflows** :
```
Workflow A → Résultats A → Copier
Workflow B → Résultats B (A effacés) ✅
→ L'utilisateur sait qu'il voit B
```

**3. Debugging** :
```
Workflow avec erreur → Message
Correction → Ré-exécution → Résultats propres ✅
```

---

## Notes techniques

### Pourquoi `null` et pas `{}` ?

```javascript
// ✅ Correct
workflowStore.lastResult = null

// ❌ Incorrect
workflowStore.lastResult = {}
```

**Raison** : `null` indique "pas de résultat", tandis que `{}` pourrait être interprété comme "résultat vide mais valide". Cela permet au template Vue de détecter facilement l'absence de résultats avec `v-if="workflowStore.lastResult"`.

### Ordre des réinitialisations

```javascript
// 1. Effacer les résultats
workflowStore.lastResult = null

// 2. Marquer comme en cours
workflowStore.executing = true

// 3. Effacer les erreurs
workflowStore.error = null
```

Cet ordre est important car :
1. Efface l'affichage des anciens résultats
2. Active le loader/spinner
3. Retire les messages d'erreur précédents

---

## Résumé

### Changement
**1 ligne ajoutée** dans `/frontend/src/components/WorkflowRunner.vue` :
```javascript
workflowStore.lastResult = null  // Ligne 1137
```

### Impact
- ✅ Mode Builder : Résultats effacés avant chaque exécution
- ✅ Mode Template : Déjà géré correctement (pas de changement)
- ✅ UX améliorée : Clarté totale pour l'utilisateur
- ✅ Pas de régression : Comportement cohérent

### Tests validés
- ✅ Exécution successive de workflows différents
- ✅ Modification et ré-exécution
- ✅ Exécution échouée puis réussie
- ✅ Cohérence Builder ↔ Template

---

## Auteur

Copilot AI Assistant

## Validation

✅ Correction appliquée et testée
✅ Cohérence avec mode Template
✅ Amélioration UX significative
