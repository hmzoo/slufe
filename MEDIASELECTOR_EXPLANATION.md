# 📘 Explication : MediaSelector vs CollectionMediaSelector

**Date**: 6 novembre 2025

---

## ❓ La Question

**"Je comprends pas ce composant MediaSelector, il appartient au module collections ?"**

---

## ✅ Réponse Courte

**OUI et NON** ! Il existe **2 composants similaires** mais avec des différences importantes :

1. **`MediaSelector.vue`** - ⚠️ **VERSION ANCIENNE/OBSOLÈTE**
2. **`CollectionMediaSelector.vue`** - ✅ **VERSION ACTUELLE** (module collections)

---

## 🔍 Analyse Détaillée

### 📊 Comparaison des 2 Composants

| Aspect | MediaSelector.vue | CollectionMediaSelector.vue |
|--------|-------------------|----------------------------|
| **Status** | ⚠️ Ancien/obsolète | ✅ Actuel (collections) |
| **Utilisé par** | TestUpload.vue (tests) | WorkflowBuilder.vue (prod) |
| **Dialog Upload** | `MediaUploadDialog` | `CollectionMediaUploadDialog` |
| **Dialog Preview** | `MediaPreviewDialog` | `CollectionMediaPreviewDialog` |
| **Store variable** | `collectionStore` | `mediaStore` (alias) |
| **API endpoint** | `/collections/current/gallery` | `/api/collections/current/gallery` |
| **Session storage** | `sessionMedias` | `medias` |

### 🔧 Différences Techniques

#### 1. **Imports de composants**

**MediaSelector.vue** (ancien) :
```javascript
import MediaUploadDialog from './MediaUploadDialog.vue'
import MediaPreviewDialog from './MediaPreviewDialog.vue'
```

**CollectionMediaSelector.vue** (actuel) :
```javascript
import CollectionMediaUploadDialog from './CollectionMediaUploadDialog.vue'
import CollectionMediaPreviewDialog from './CollectionMediaPreviewDialog.vue'
```

#### 2. **API Endpoint**

**MediaSelector.vue** :
```javascript
const response = await api.get('/collections/current/gallery')
```

**CollectionMediaSelector.vue** :
```javascript
const response = await api.get('/api/collections/current/gallery')
```
☝️ Préfixe `/api/` ajouté (meilleure pratique)

#### 3. **Storage Session**

**MediaSelector.vue** :
```javascript
collectionStore.sessionMedias.set(mediaId, { ... })
```

**CollectionMediaSelector.vue** :
```javascript
collectionStore.medias.set(mediaId, { ... })
```
☝️ `medias` au lieu de `sessionMedias` (structure store mise à jour)

---

## 📂 Structure Actuelle

```
frontend/src/components/
├── MediaSelector.vue                    ⚠️ ANCIEN (à supprimer?)
├── CollectionMediaSelector.vue          ✅ ACTUEL
├── CollectionMediaGallery.vue           ✅ Utilisé par les 2
├── MediaUploadDialog.vue                ⚠️ Ancien
├── CollectionMediaUploadDialog.vue      ✅ Actuel
├── MediaPreviewDialog.vue               ⚠️ Ancien
└── CollectionMediaPreviewDialog.vue     ✅ Actuel
```

---

## 🎯 Rôle du Composant

### CollectionMediaSelector (version actuelle)

**Fonction** : Sélecteur de médias (images/vidéos) avec intégration au système de **collections**

**Caractéristiques** :
- ✅ Input readonly avec preview compact
- ✅ Bouton "Galerie" → Ouvre `CollectionMediaGallery`
- ✅ Support mode **simple** (1 média) ou **multiple** (plusieurs)
- ✅ Preview avec thumbnail + infos (type, taille, usage)
- ✅ Upload vers collections
- ✅ Gestion IDs collection (`collection_123`)
- ✅ Résolution automatique médias depuis API

**Props principales** :
```javascript
{
  modelValue: String | Array,     // ID(s) média sélectionné
  multiple: Boolean,              // Sélection multiple
  accept: Array,                  // Types acceptés ['image', 'video', 'audio']
  label: String,                  // Label input
  required: Boolean,              // Validation requis
  hidePreview: Boolean            // Masquer preview compact
}
```

**Événements émis** :
```javascript
emit('update:modelValue', mediaId)  // Sélection changée
emit('selected', media)             // Média sélectionné depuis galerie
emit('uploaded', medias)            // Médias uploadés
emit('cleared')                     // Sélection effacée
```

---

## 📍 Où est-il Utilisé ?

### CollectionMediaSelector (actuel)

**WorkflowBuilder.vue** (ligne 1086) :
```javascript
// Utilisé pour les inputs de type 'image' et 'images' dans les tâches workflow
{
  component: defineAsyncComponent(() => import('./CollectionMediaSelector.vue')),
  props: {
    label: inputDef.label,
    accept: ['image'],
    multiple: inputDef.multiple,
    required: inputDef.required
  }
}
```

**Contexte** : Sélection d'images pour les tâches du WorkflowBuilder
- Tâche `edit_image` → Sélectionner 1-3 images
- Tâche `generate_video_i2v` → Sélectionner image de départ + image de fin
- Tâche `describe_images` → Sélectionner multiple images
- etc.

### MediaSelector (ancien)

**TestUpload.vue** (page de test) :
```vue
<MediaSelector
  v-model="selectedMediaSimple"
  label="Sélectionner un média"
  :accept="['image', 'video']"
/>
```

**Contexte** : Tests unitaires seulement, **pas utilisé en production**

---

## ✅ Appartenance au Module Collections

**Réponse définitive** : **OUI**, `CollectionMediaSelector` fait partie du **module Collections**

**Preuves** :
1. ✅ Utilise `CollectionMediaGallery` (composant collections)
2. ✅ Utilise `CollectionMediaUploadDialog` (upload vers collections)
3. ✅ Utilise `useCollectionStore` (store collections)
4. ✅ API endpoints collections (`/api/collections/...`)
5. ✅ Gère IDs collection (`collection_123`)
6. ✅ Affiche métadonnées collections (usageCount)

---

## 🧹 Recommandations Nettoyage

### Fichiers à Supprimer (Obsolètes)

1. ❌ `MediaSelector.vue` (remplacé par `CollectionMediaSelector.vue`)
2. ❌ `MediaUploadDialog.vue` (remplacé par `CollectionMediaUploadDialog.vue`)
3. ❌ `MediaPreviewDialog.vue` (remplacé par `CollectionMediaPreviewDialog.vue`)

**Raison** : Utilisés uniquement dans `TestUpload.vue` (page de test), pas en production

### Actions Proposées

```bash
# Option 1 : Supprimer les anciens fichiers
rm frontend/src/components/MediaSelector.vue
rm frontend/src/components/MediaUploadDialog.vue
rm frontend/src/components/MediaPreviewDialog.vue

# Option 2 : Les déplacer dans un dossier "deprecated"
mkdir frontend/src/components/deprecated
mv frontend/src/components/MediaSelector.vue frontend/src/components/deprecated/
mv frontend/src/components/MediaUploadDialog.vue frontend/src/components/deprecated/
mv frontend/src/components/MediaPreviewDialog.vue frontend/src/components/deprecated/

# Mettre à jour TestUpload.vue pour utiliser les nouveaux composants
# Ou supprimer TestUpload.vue si plus utilisé
```

---

## 📚 Documentation Composants Collections

### Composants Principaux

1. **CollectionMediaSelector** - Sélecteur avec input + galerie
2. **CollectionMediaGallery** - Galerie complète avec grille + upload
3. **CollectionMediaUploadDialog** - Dialog upload vers collections
4. **CollectionMediaPreviewDialog** - Preview médias plein écran
5. **CollectionView** - Vue complète gestion collections
6. **CollectionManager** - Gestionnaire collections (CRUD)

### Store Collections

**Fichier** : `src/stores/useCollectionStore.js`

**Principales méthodes** :
- `fetchCollections()` - Charger toutes les collections
- `viewCollection(id)` - Voir une collection
- `addMediaToCollection(id, media)` - Ajouter média
- `removeMediaFromCollection(id, mediaId)` - Retirer média
- `getMedia(id)` - Récupérer média par ID
- `formatFileSize(bytes)` - Formater taille fichier

---

## 🎯 Résumé

**Question** : *"MediaSelector appartient au module collections ?"*

**Réponse** :
- `MediaSelector.vue` → ⚠️ **Ancien composant** (non-collections, à supprimer)
- `CollectionMediaSelector.vue` → ✅ **OUI, fait partie du module Collections**

**Utilisation actuelle** :
- Production : `CollectionMediaSelector` dans `WorkflowBuilder`
- Tests : `MediaSelector` dans `TestUpload` (obsolète)

**Recommandation** :
- ✅ Utiliser `CollectionMediaSelector` pour tous les nouveaux développements
- 🧹 Supprimer `MediaSelector` + composants associés (deprecated)
- 📝 Mettre à jour `TestUpload.vue` ou le supprimer

---

**C'est un composant clé du module Collections pour la sélection de médias dans les workflows !** 📸🎬✨
