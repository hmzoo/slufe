# 🔧 Fix - Galerie Vidéo Vide - Type Forcé en 'image'

## 📅 Date
5 novembre 2025

## 🐛 Problème

Lorsqu'on sélectionne le mode "Galerie" pour une vidéo dans la tâche "Extraire une frame", **la galerie est vide** alors qu'il y a des vidéos dans la collection.

## 🔍 Cause Racine

Dans `SimpleMediaGallery.vue`, lors du chargement des médias depuis la collection, **tous les médias étaient forcés au type `'image'`** en dur (ligne 475) :

```javascript
return {
  id: imageId,
  url: img.url,
  type: 'image',  // ← Forcé en dur !
  originalName: img.description || `Image ${index + 1}`,
  // ...
}
```

Ensuite, le filtre appliquait :

```javascript
const displayedMedias = computed(() => {
  const allMedias = collectionImages.value
  // Filtrer par types acceptés
  return allMedias.filter(media => props.accept.includes(media.type))
})
```

Avec `props.accept = ['video']`, le filtre cherchait des médias avec `type: 'video'` mais trouvait uniquement `type: 'image'` → **galerie vide** !

## ✅ Solution Implémentée

### Utiliser le Vrai Type

**Fichier** : `/frontend/src/components/SimpleMediaGallery.vue`

**AVANT** :
```javascript
return {
  id: imageId,
  url: img.url,
  type: 'image',  // ← Forcé !
  originalName: img.description || `Image ${index + 1}`,
  filename: imageId.includes('.') ? imageId : `${imageId}.jpg`,
  size: 0,
  createdAt: img.addedAt,
  fromCollection: true
}
```

**APRÈS** :
```javascript
return {
  id: imageId,
  url: img.url,
  type: img.type || 'image',  // ← Utilise le vrai type
  originalName: img.description || `${img.type === 'video' ? 'Vidéo' : 'Image'} ${index + 1}`,
  filename: imageId.includes('.') ? imageId : `${imageId}.${img.type === 'video' ? 'mp4' : 'jpg'}`,
  size: 0,
  createdAt: img.addedAt,
  fromCollection: true
}
```

**Améliorations** :
- ✅ Utilise `img.type` depuis la collection (image/video)
- ✅ Fallback sur `'image'` si type non défini
- ✅ Adapte `originalName` selon le type
- ✅ Adapte `filename` avec bonne extension

## 🔄 Flux Corrigé

### AVANT (Cassé)

```
Collection JSON:
  {
    images: [
      { url: '/medias/uuid.mp4', type: 'video', ... }
    ]
  }
    ↓
SimpleMediaGallery.loadCollectionImages():
  img.type = 'video' ← Depuis JSON
    ↓
Mapping:
  type: 'image'  ← Forcé en dur ❌
    ↓
collectionImages.value = [
  { id: '...', type: 'image', ... }
]
    ↓
Filtre avec accept=['video']:
  .filter(media => ['video'].includes(media.type))
  → .filter(media => ['video'].includes('image'))
  → false ❌
    ↓
displayedMedias = [] ← Galerie vide
```

### APRÈS (Fonctionnel)

```
Collection JSON:
  {
    images: [
      { url: '/medias/uuid.mp4', type: 'video', ... }
    ]
  }
    ↓
SimpleMediaGallery.loadCollectionImages():
  img.type = 'video' ← Depuis JSON
    ↓
Mapping:
  type: img.type || 'image'  ← Utilise le vrai type ✅
    ↓
collectionImages.value = [
  { id: '...', type: 'video', ... }
]
    ↓
Filtre avec accept=['video']:
  .filter(media => ['video'].includes(media.type))
  → .filter(media => ['video'].includes('video'))
  → true ✅
    ↓
displayedMedias = [{ video }] ← Vidéos affichées !
```

## 📊 Impact sur Différents Filtres

| Filtre `accept` | Avant (type forcé 'image') | Après (type réel) |
|-----------------|---------------------------|-------------------|
| `['image']` | ✅ Affiche tout | ✅ Affiche images uniquement |
| `['video']` | ❌ Galerie vide | ✅ Affiche vidéos uniquement |
| `['image', 'video']` | ✅ Affiche tout (comme 'image') | ✅ Affiche images ET vidéos |

## 🧪 Test

### Test 1 : Filtre Vidéo

```bash
1. Créer workflow "Extraire une frame"
2. Mode "Galerie" pour la vidéo
3. Ouvrir sélecteur

✅ Résultat attendu:
- Galerie affiche les vidéos ✅
- Pas d'images affichées ✅
- Peut sélectionner une vidéo ✅
```

### Test 2 : Filtre Image

```bash
1. Créer workflow "Edit Image"
2. Mode "Galerie" pour l'image
3. Ouvrir sélecteur

✅ Résultat attendu:
- Galerie affiche les images ✅
- Pas de vidéos affichées ✅
- Peut sélectionner une image ✅
```

### Test 3 : Filtre Mixte

```bash
1. Créer workflow avec MediaSelector
2. Prop: accept=['image', 'video']
3. Ouvrir sélecteur

✅ Résultat attendu:
- Galerie affiche images ET vidéos ✅
- Tous les médias visibles ✅
```

## 🎯 Impact

### Avant
- ❌ Galerie vide avec filtre `['video']`
- ❌ Impossible de sélectionner vidéo
- ❌ Type forcé ne respecte pas les données
- ❌ Tous les médias traités comme images

### Après
- ✅ Galerie affiche vidéos avec filtre `['video']`
- ✅ Sélection vidéo fonctionnelle
- ✅ Type respecte les données de collection
- ✅ Filtrage précis par type

## 🔗 Backend - Format Collection

Le backend (`collectionManager.js`) enregistre déjà le bon type :

```javascript
{
  images: [
    {
      url: '/medias/uuid.jpg',
      type: 'image',  // ← Type correct
      description: '...',
      addedAt: '...'
    },
    {
      url: '/medias/uuid.mp4',
      type: 'video',  // ← Type correct
      description: '...',
      addedAt: '...'
    }
  ]
}
```

Le problème était uniquement dans le **mapping frontend** qui ignorait ce type.

## 📝 Améliorations Bonus

### 1. Nom par Défaut Adapté

**AVANT** :
```javascript
originalName: img.description || `Image ${index + 1}`
```

**APRÈS** :
```javascript
originalName: img.description || `${img.type === 'video' ? 'Vidéo' : 'Image'} ${index + 1}`
```

→ "Vidéo 1" au lieu de "Image 1" pour les vidéos

### 2. Extension Adaptée

**AVANT** :
```javascript
filename: imageId.includes('.') ? imageId : `${imageId}.jpg`
```

**APRÈS** :
```javascript
filename: imageId.includes('.') ? imageId : `${imageId}.${img.type === 'video' ? 'mp4' : 'jpg'}`
```

→ `.mp4` pour les vidéos, `.jpg` pour les images

## 🎉 Résultat

La galerie fonctionne maintenant **correctement pour tous les types de médias** :

✅ **Images** : Filtrées et affichées avec `accept=['image']`  
✅ **Vidéos** : Filtrées et affichées avec `accept=['video']`  
✅ **Mixte** : Affichées avec `accept=['image', 'video']`  
✅ **Type** : Respecte les données de collection  
✅ **Noms** : Adaptés selon le type (Image/Vidéo)  
✅ **Extensions** : Correctes (.jpg/.mp4)  

**Le workflow "Extraire une frame" peut maintenant sélectionner des vidéos !** 🚀

---

**Date** : 5 novembre 2025  
**Fichier modifié** : `/frontend/src/components/SimpleMediaGallery.vue`  
**Ligne** : 475  
**Status** : ✅ Fix implémenté  
**Impact** : Galerie vidéo maintenant fonctionnelle
