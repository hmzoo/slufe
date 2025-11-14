# ✅ Fix : aspect_ratio non transmis pour edit_image

## 📅 Date: 14 novembre 2025

## 🎯 Problème
Le paramètre `aspectRatio` sélectionné dans le frontend (WorkflowBuilder) n'était pas transmis au modèle lors de l'édition d'images. Le modèle utilisait toujours la valeur par défaut.

## 🐛 Cause

### Frontend (config correcte)
`frontend/src/config/taskDefinitions.js` - ligne 84-98 :
```javascript
aspectRatio: {
  type: 'select',
  label: 'Format',
  required: false,
  options: [
    { label: 'Conserver original', value: 'original' },
    { label: 'Carré (1:1)', value: '1:1' },
    { label: 'Portrait (9:16)', value: '9:16' },
    { label: 'Paysage (16:9)', value: '16:9' }
  ],
  default: 'original',
  acceptsVariable: false
}
```
✅ Frontend envoie bien `inputs.aspectRatio`

### Backend (bug)
`backend/services/tasks/EditImageTask.js` - ligne 123 (AVANT) :
```javascript
const editImageParams = {
  prompt: inputs.prompt,
  image1: processedImages[0],
  image2: processedImages[1],
  image3: processedImages[2],
  aspectRatio: this.getAspectRatioFromStrength(editParams.strength), // ❌ ERREUR !
  outputFormat: 'jpg'
};
```

**Problème :** Le code ignorait `inputs.aspectRatio` et utilisait une méthode obsolète qui retournait toujours `'match_input_image'`.

## ✅ Solution

### Code corrigé
`backend/services/tasks/EditImageTask.js` - ligne 123 (APRÈS) :
```javascript
const editImageParams = {
  prompt: inputs.prompt,
  image1: processedImages[0],
  image2: processedImages[1],
  image3: processedImages[2],
  aspectRatio: inputs.aspectRatio || 'original', // ✅ Utilise l'input du frontend !
  outputFormat: 'jpg'
};
```

**Changement :**
- ❌ `this.getAspectRatioFromStrength(editParams.strength)`
- ✅ `inputs.aspectRatio || 'original'`

## 🔄 Flux de données

### Avant (bug)
```
Frontend → inputs.aspectRatio = "16:9"
   ↓
Backend EditImageTask → IGNORE inputs.aspectRatio ❌
   ↓
Backend imageEditor.js → Reçoit 'match_input_image'
   ↓
Replicate API → aspect_ratio = 'match_input_image'
```

### Après (corrigé)
```
Frontend → inputs.aspectRatio = "16:9"
   ↓
Backend EditImageTask → aspectRatio: inputs.aspectRatio ✅
   ↓
Backend imageEditor.js → Reçoit "16:9"
   ↓
Replicate API → aspect_ratio = "16:9"
```

## 📋 Valeurs supportées

Le paramètre `aspectRatio` supporte les valeurs suivantes :

| Label Frontend | Valeur envoyée | Résultat API |
|----------------|----------------|--------------|
| Conserver original | `original` | Image conserve ses proportions |
| Carré (1:1) | `1:1` | Image carrée |
| Portrait (9:16) | `9:16` | Format vertical smartphone |
| Paysage (16:9) | `16:9` | Format horizontal écran |

## 🧪 Test du fix

### 1. **Redémarrer le backend**
```bash
cd backend
node server.js
```

### 2. **Test dans WorkflowBuilder**
1. Créer une tâche `edit_image`
2. Uploader une image
3. **Sélectionner un format** (ex: "Paysage 16:9")
4. Ajouter un prompt d'édition
5. Exécuter le workflow

### 3. **Vérifier les logs backend**
```
🎨 Édition d'images avec Qwen Image Edit Plus...
📝 Prompt: ...
🖼️  Images: 1
⚙️  Paramètres: aspectRatio=16:9, goFast=true, format=jpg
```
✅ `aspectRatio` doit afficher la valeur sélectionnée, pas `match_input_image`

### 4. **Vérifier le résultat**
L'image générée doit respecter le format sélectionné (16:9, 9:16, 1:1, etc.)

## 📊 Impact

### Services affectés
- ✅ `EditImageTask.js` - Correction appliquée
- ✅ `imageEditor.js` - Déjà correct (utilise le param)
- ✅ WorkflowBuilder - Déjà correct (envoie le param)

### Pas d'impact sur
- ✅ `generate_image` - Utilise son propre flux
- ✅ Autres tâches d'édition

## ✅ Résultat

Le format d'image sélectionné dans le frontend est maintenant correctement transmis au modèle Qwen Image Edit Plus via l'API Replicate ! 🎉

---

**Fichier modifié :** `backend/services/tasks/EditImageTask.js` (ligne 123)
