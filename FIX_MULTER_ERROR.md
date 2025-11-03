# 🐛 Fix - MulterError: Unexpected field

## 📋 Problème rencontré

### Erreur
```
MulterError: Unexpected field
    at wrappedFileFilter (/node_modules/multer/index.js:40:19)
```

### Cause
Incompatibilité entre le nom du champ utilisé par le frontend et celui attendu par Multer dans le backend.

## 🔍 Analyse

### Backend - Configuration Multer

Le backend utilise **deux configurations différentes** selon la route :

#### Route `/edit/image` (édition multiple)
```javascript
router.post('/image', upload.array('images', 5), async (req, res) => {
  // Attend le champ 'images' (pluriel) pour plusieurs fichiers
});
```

#### Route `/edit/single-image` (édition simple)
```javascript
router.post('/single-image', upload.single('image'), async (req, res) => {
  // Attend le champ 'image' (singulier) pour un seul fichier
});
```

### Frontend - Avant le fix

Le frontend envoyait **toujours** avec le nom `'images'` :

```javascript
// ❌ PROBLÈME : Toujours 'images' même pour single mode
store.images.forEach((image) => {
  formData.append('images', image.file);
});
```

### Résultat
- ✅ Route `/edit/image` : Fonctionne (attend `'images'`)
- ❌ Route `/edit/single-image` : **MulterError** (attend `'image'` mais reçoit `'images'`)

## ✅ Solution appliquée

### Adaptation dynamique du nom du champ

```javascript
// Ajouter les images depuis le store
if (store.images && store.images.length > 0) {
  // Pour single-image, utiliser 'image' (singulier), sinon 'images' (pluriel)
  const fieldName = editMode.value === 'single' ? 'image' : 'images';
  
  if (editMode.value === 'single') {
    // Pour single mode, n'envoyer que la première image
    formData.append(fieldName, store.images[0].file);
  } else {
    // Pour les autres modes, envoyer toutes les images
    store.images.forEach((image) => {
      formData.append(fieldName, image.file);
    });
  }
}
```

## 🎯 Logique du fix

### Tableau de correspondance

| Mode d'édition | Endpoint | Nom du champ | Nombre de fichiers |
|----------------|----------|--------------|-------------------|
| `single` | `/edit/single-image` | `'image'` (singulier) | 1 seul fichier |
| `multiple` | `/edit/image` | `'images'` (pluriel) | Plusieurs fichiers |
| `transfer-pose` | `/edit/transfer-pose` | `'images'` (pluriel) | Plusieurs fichiers |
| `transfer-style` | `/edit/transfer-style` | `'images'` (pluriel) | Plusieurs fichiers |

### Code explicatif

```javascript
// Détermination du nom du champ
const fieldName = editMode.value === 'single' ? 'image' : 'images';

// Mode single : 1 seule image
if (editMode.value === 'single') {
  formData.append('image', store.images[0].file);
}

// Autres modes : toutes les images
else {
  store.images.forEach((image) => {
    formData.append('images', image.file);
  });
}
```

## ✅ Bénéfices

### 1. **Compatibilité totale**
- ✅ Mode `single` : Envoie `'image'` (singulier)
- ✅ Autres modes : Envoie `'images'` (pluriel)
- ✅ Aucune erreur Multer

### 2. **Optimisation**
- ✅ Mode `single` : N'envoie que la première image (pas toutes)
- ✅ Économie de bande passante
- ✅ Traitement plus rapide

### 3. **Clarté du code**
- ✅ Logique explicite et commentée
- ✅ Facile à maintenir
- ✅ Cohérent avec le backend

## 🧪 Test

### Avant le fix
```bash
# Mode single
POST /api/edit/single-image
FormData: { images: [File] }  # ❌ Multer attend 'image'
→ MulterError: Unexpected field
```

### Après le fix
```bash
# Mode single
POST /api/edit/single-image
FormData: { image: File }  # ✅ Correspond à upload.single('image')
→ Succès !

# Mode multiple
POST /api/edit/image
FormData: { images: [File, File, ...] }  # ✅ Correspond à upload.array('images')
→ Succès !
```

## 📝 Cas d'usage validés

### Cas 1 : Édition simple (1 image)
```
1. User uploade 1 image
2. Entre prompt : "Ajouter un ciel étoilé"
3. editMode = 'single'
4. → Envoie { image: File } avec nom 'image'
5. Backend reçoit correctement
6. ✅ Édition réussie
```

### Cas 2 : Édition multiple (plusieurs images)
```
1. User uploade 3 images
2. Entre prompt : "Harmoniser les couleurs"
3. editMode = 'multiple'
4. → Envoie { images: [File, File, File] } avec nom 'images'
5. Backend reçoit correctement
6. ✅ Édition réussie
```

### Cas 3 : Transfert de pose (2+ images)
```
1. User uploade 2 images
2. editMode = 'transfer-pose'
3. → Envoie { images: [File, File] } avec nom 'images'
4. Backend reçoit correctement
5. ✅ Transfert réussi
```

## 🔍 Vérification backend

### Route `/edit/single-image`
```javascript
router.post('/single-image', upload.single('image'), async (req, res) => {
  // ✅ Attend 'image' (singulier)
  // ✅ Frontend envoie maintenant 'image' pour mode 'single'
  const file = req.file; // Récupère le fichier unique
});
```

### Route `/edit/image`
```javascript
router.post('/image', upload.array('images', 5), async (req, res) => {
  // ✅ Attend 'images' (pluriel)
  // ✅ Frontend envoie 'images' pour modes autres que 'single'
  const files = req.files; // Récupère tous les fichiers
});
```

## 🎉 Résultat

### Erreurs corrigées
- ❌ Supprimé : `MulterError: Unexpected field`
- ✅ Ajouté : Logique dynamique de nom de champ
- ✅ Ajouté : Optimisation (1 seule image pour single mode)

### Compatibilité
```
Mode single      → 'image'  (singulier) → upload.single()   ✅
Mode multiple    → 'images' (pluriel)   → upload.array()    ✅
Mode transfer-*  → 'images' (pluriel)   → upload.array()    ✅
```

### Performance
- Mode single : Envoie 1 fichier au lieu de tous → **Plus rapide** ⚡
- Autres modes : Envoie tous les fichiers nécessaires → **Fonctionnel** ✅

---

**Statut** : ✅ Bug corrigé  
**Impact** : Édition d'images fonctionne maintenant pour tous les modes  
**Code modifié** : `PromptInput.vue` - fonction `editImages()`  
**Compatibilité** : 100% avec le backend Multer
