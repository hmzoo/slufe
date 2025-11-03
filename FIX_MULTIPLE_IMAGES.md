# 🔧 Fix - Envoi de plusieurs images au service d'édition

## 📋 Problème rencontré

### Symptôme
Même quand l'utilisateur uploade plusieurs images, le backend ne reçoit qu'une seule image.

```bash
# Logs backend
📝 Prompt reçu: view from below
🖼️  Nombre d'images: 1  # ❌ Devrait être 2+ si plusieurs uploadées
```

### Cause
Le mode d'édition était fixé à `'single'` par défaut :

```javascript
// ❌ PROBLÈME : Mode toujours 'single'
const editMode = ref('single');

// Résultat : Même avec plusieurs images, n'envoie que la première
if (editMode.value === 'single') {
  formData.append('image', store.images[0].file);  // ❌ Une seule image
}
```

## ✅ Solution appliquée

### 1. Détection automatique du mode

Le mode d'édition est maintenant **auto-détecté** selon le nombre d'images :

```javascript
// Mode d'édition auto-détecté selon le nombre d'images
const editMode = computed(() => {
  if (imageCount.value === 1) return 'single';
  return 'multiple'; // 2+ images = édition multiple
});
```

### 2. Envoi de toutes les images en mode multiple

```javascript
// Ajouter les images depuis le store
if (store.images && store.images.length > 0) {
  const fieldName = editMode.value === 'single' ? 'image' : 'images';
  
  if (editMode.value === 'single') {
    // 1 image : envoyer celle-ci
    formData.append(fieldName, store.images[0].file);
  } else {
    // 2+ images : envoyer TOUTES les images
    store.images.forEach((image) => {
      formData.append(fieldName, image.file);
    });
  }
  
  console.log(`📤 Mode: ${editMode.value}, Images envoyées: ${store.images.length}`);
}
```

### 3. Sélection automatique de l'endpoint

```javascript
// Choisir l'endpoint selon le mode auto-détecté
const endpoint = editMode.value === 'single' 
  ? '/edit/single-image'   // 1 image
  : '/edit/image';          // 2+ images

console.log(`🎯 Endpoint: ${endpoint}`);
```

## 🎯 Logique du système

### Tableau de comportement

| Images uploadées | Mode détecté | Endpoint | Champ | Images envoyées |
|------------------|--------------|----------|-------|-----------------|
| 1 | `'single'` | `/edit/single-image` | `'image'` | 1 |
| 2 | `'multiple'` | `/edit/image` | `'images'` | 2 |
| 3 | `'multiple'` | `/edit/image` | `'images'` | 3 |
| 4 | `'multiple'` | `/edit/image` | `'images'` | 4 |
| 5 | `'multiple'` | `/edit/image` | `'images'` | 5 |

### Code de détection

```javascript
// AVANT : Mode fixe
const editMode = ref('single');  // ❌ Toujours single

// APRÈS : Mode dynamique
const editMode = computed(() => {
  if (imageCount.value === 1) return 'single';
  return 'multiple';
});  // ✅ S'adapte automatiquement
```

## 📊 Exemple de flux

### Cas 1 : Une seule image
```javascript
// User uploade 1 image
store.imageCount = 1

// Détection automatique
editMode = 'single'

// Envoi
POST /edit/single-image
FormData: { 
  image: File,           // 1 seule image
  prompt: "...",
  aspectRatio: "1:1",
  ...
}

// Backend reçoit
🖼️  Nombre d'images: 1  ✅
```

### Cas 2 : Plusieurs images
```javascript
// User uploade 3 images
store.imageCount = 3

// Détection automatique
editMode = 'multiple'

// Envoi
POST /edit/image
FormData: { 
  images: [File, File, File],  // 3 images
  prompt: "...",
  aspectRatio: "1:1",
  ...
}

// Backend reçoit
🖼️  Nombre d'images: 3  ✅
```

## ✅ Simplifications apportées

### 1. **Suppression des modes manuels**
- ❌ Supprimé : Modes `'transfer-pose'` et `'transfer-style'`
- ❌ Supprimé : Logique complexe de validation selon le mode
- ✅ Ajouté : Détection automatique simple (1 vs 2+)

### 2. **Prompt toujours requis**
```javascript
// AVANT : Logique complexe
if (editMode.value === 'transfer-pose' || editMode.value === 'transfer-style') {
  // Pas de prompt
} else {
  // Prompt requis
}

// APRÈS : Logique simple
// Prompt toujours requis
const canEdit = computed(() => {
  return hasImages.value && localPrompt.value.trim().length > 0;
});
```

### 3. **Validation simplifiée**
```javascript
// AVANT : Validation complexe selon mode
const canEdit = computed(() => {
  if (editMode.value === 'transfer-pose' || editMode.value === 'transfer-style') {
    return hasImages.value && imageCount.value >= 2;
  }
  return hasImages.value && localPrompt.value.trim().length > 0;
});

// APRÈS : Validation simple
const canEdit = computed(() => {
  // Besoin d'au moins 1 image + prompt
  return hasImages.value && localPrompt.value.trim().length > 0;
});
```

## 🎉 Résultat

### Comportement obtenu
```
✅ 1 image uploadée → Mode 'single' → Envoie 1 image à /edit/single-image
✅ 2+ images uploadées → Mode 'multiple' → Envoie TOUTES à /edit/image
✅ Logs clairs : "Mode: multiple, Images envoyées: 3"
✅ Backend reçoit toutes les images
```

### Messages de log
```javascript
console.log(`📤 Mode: ${editMode.value}, Images envoyées: ${store.images.length}`);
console.log(`🎯 Endpoint: ${endpoint}`);
```

Ces logs permettent de vérifier que :
- Le bon mode est détecté
- Toutes les images sont envoyées
- Le bon endpoint est appelé

## 🧪 Test

### Test 1 : Une image
```
1. Upload 1 image
2. Entre prompt : "Améliorer la lumière"
3. Clique "Éditer l'image"

Console frontend:
📤 Mode: single, Images envoyées: 1
🎯 Endpoint: /edit/single-image

Console backend:
📝 Prompt reçu: Améliorer la lumière
🖼️  Nombre d'images: 1  ✅
```

### Test 2 : Trois images
```
1. Upload 3 images
2. Entre prompt : "Harmoniser les couleurs"
3. Clique "Éditer l'image"

Console frontend:
📤 Mode: multiple, Images envoyées: 3
🎯 Endpoint: /edit/image

Console backend:
📝 Prompt reçu: Harmoniser les couleurs
🖼️  Nombre d'images: 3  ✅
```

## 📝 Code final

### État d'édition
```javascript
const editing = ref(false);  // État de chargement

// Options d'édition (paramètres par défaut)
const aspectRatio = ref('1:1');
const outputFormat = ref('webp');
const outputQuality = ref(95);
const goFast = ref(false);
```

### Détection automatique
```javascript
// Mode auto-détecté selon nombre d'images
const editMode = computed(() => {
  if (imageCount.value === 1) return 'single';
  return 'multiple';
});
```

### Validation
```javascript
// Validation simple : images + prompt requis
const canEdit = computed(() => {
  return hasImages.value && localPrompt.value.trim().length > 0;
});
```

### Envoi
```javascript
// Adaptation du nom de champ et du nombre d'images
const fieldName = editMode.value === 'single' ? 'image' : 'images';

if (editMode.value === 'single') {
  formData.append(fieldName, store.images[0].file);
} else {
  store.images.forEach((image) => {
    formData.append(fieldName, image.file);
  });
}
```

## 🚀 Avantages

### 1. **Automatique**
- ✅ Plus besoin de choisir le mode manuellement
- ✅ Détection intelligente selon contexte
- ✅ UX simplifiée

### 2. **Toutes les images envoyées**
- ✅ 2+ images → envoie toutes les images
- ✅ Backend reçoit tout ce qu'il faut
- ✅ Édition multiple fonctionnelle

### 3. **Logs de debug**
- ✅ Affiche le mode détecté
- ✅ Affiche le nombre d'images envoyées
- ✅ Affiche l'endpoint appelé
- ✅ Facilite le débogage

### 4. **Code plus simple**
- ✅ Moins de conditions
- ✅ Logique linéaire
- ✅ Facile à maintenir

---

**Statut** : ✅ Fix appliqué  
**Impact** : Toutes les images sont maintenant envoyées au service d'édition  
**Détection** : Automatique selon nombre d'images (1 vs 2+)  
**Backend** : Reçoit toutes les images uploadées
