# Fonctionnalité de Copie de Médias entre Collections

## 📋 Vue d'ensemble

Cette fonctionnalité permet de copier des médias (images et vidéos) d'une collection vers une ou plusieurs autres collections. Contrairement au déplacement qui supprime le média de la collection source, la copie crée une **duplication physique complète** du fichier.

## ✨ Caractéristiques

### Copie Physique Complète
- Chaque copie crée un **nouveau fichier** sur le serveur avec un nom unique (UUID)
- Les fichiers originaux et copiés sont **totalement indépendants**
- Permet d'avoir le même média dans plusieurs collections sans conflit

### Interface Utilisateur
- Bouton **"Copier"** dans la barre d'actions (à côté de "Déplacer" et "Supprimer")
- Sélection multiple de médias supportée
- Dialog de confirmation avec choix de la collection de destination
- Notification de progression pendant la copie

## 🎯 Cas d'usage

1. **Organisation Multiple**
   - Avoir une image dans "Portraits" ET "Favoris"
   - Classer une vidéo dans "Projets 2025" ET "Archives"

2. **Backup/Sauvegarde**
   - Copier des médias importants dans une collection "Backup"
   - Dupliquer des ressources critiques

3. **Variations**
   - Copier un média avant de l'éditer
   - Garder l'original dans une collection, copie modifiée dans une autre

## 🔧 Utilisation

### Frontend (CollectionView.vue)

#### 1. Sélection et Copie

```vue
<!-- Bouton de copie (visible quand des médias sont sélectionnés) -->
<q-btn
  v-if="selectedMedias.length > 0"
  color="primary"
  icon="content_copy"
  label="Copier"
  @click="copySelectedMedias"
  size="sm"
/>
```

#### 2. Fonction de Copie

```javascript
const copySelectedMedias = () => {
  targetCollectionForCopy.value = null
  showCopyDialog.value = true
}

const confirmCopyMedias = async () => {
  // Pour chaque média sélectionné
  for (const media of selectedMedias.value) {
    // Appel API pour copier
    const response = await fetch('http://localhost:3000/api/media/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceUrl: media.url,
        targetCollectionId: targetCollectionForCopy.value,
        description: media.description || ''
      })
    })
    
    const result = await response.json()
    // Gestion du résultat...
  }
}
```

### Backend (routes/media.js)

#### Endpoint de Copie Simple

```javascript
POST /api/media/copy

// Body
{
  "sourceUrl": "/medias/123-456-789.jpg",
  "targetCollectionId": "collection_abc",
  "description": "Mon image copiée"
}

// Response (succès)
{
  "success": true,
  "message": "Média copié avec succès",
  "media": {
    "url": "/medias/new-uuid-123.jpg",
    "fileName": "new-uuid-123.jpg",
    "type": "image",
    "description": "Mon image copiée",
    "originalUrl": "/medias/123-456-789.jpg"
  }
}
```

#### Endpoint de Copie Batch (future amélioration)

```javascript
POST /api/media/copy-batch

// Body
{
  "medias": [
    { "sourceUrl": "/medias/img1.jpg", "description": "Image 1" },
    { "sourceUrl": "/medias/img2.jpg", "description": "Image 2" }
  ],
  "targetCollectionId": "collection_xyz"
}

// Response
{
  "success": true,
  "message": "2/2 médias copiés",
  "results": [ /* ... */ ],
  "errors": [],
  "successCount": 2,
  "errorCount": 0
}
```

## 🏗️ Architecture

### Flux de Données

```
User Interface (CollectionView.vue)
    ↓
    [Sélection de médias + Click "Copier"]
    ↓
Dialog de Confirmation
    ↓
    [Choix collection destination]
    ↓
API Call: POST /api/media/copy
    ↓
Backend (routes/media.js)
    ↓
    1. Validation des paramètres
    2. Vérification collection destination existe
    3. Lecture fichier source (fs.readFile)
    4. Génération nouveau nom UUID (generateUniqueFileName)
    5. Écriture nouveau fichier (fs.writeFile)
    6. Ajout référence à la collection (addImageToCollection)
    ↓
Response: Nouveau média créé
    ↓
Frontend: Refresh collection + Notification
```

### Structure des Fichiers

#### Frontend
```
frontend/src/components/
  └── CollectionView.vue
      ├── Template:
      │   ├── Bouton "Copier"
      │   └── Dialog de copie
      └── Script:
          ├── showCopyDialog (ref)
          ├── targetCollectionForCopy (ref)
          ├── copySelectedMedias() (function)
          └── confirmCopyMedias() (async function)
```

#### Backend
```
backend/
  ├── routes/
  │   └── media.js (NOUVEAU)
  │       ├── POST /copy
  │       └── POST /copy-batch
  ├── utils/
  │   └── fileUtils.js
  │       ├── generateUniqueFileName()
  │       ├── getFileExtension()
  │       └── getMediasDir() (NOUVEAU)
  ├── services/
  │   └── collectionManager.js
  │       └── addImageToCollection()
  └── server.js
      └── app.use('/api/media', mediaRoutes)
```

## 📊 Gestion des Erreurs

### Erreurs Possibles

1. **Fichier source introuvable** (404)
   ```json
   {
     "success": false,
     "message": "Fichier source introuvable",
     "sourceFile": "missing-file.jpg"
   }
   ```

2. **Collection destination inexistante** (404)
   ```json
   {
     "success": false,
     "message": "Collection de destination non trouvée"
   }
   ```

3. **Erreur d'écriture fichier** (500)
   ```json
   {
     "success": false,
     "message": "Erreur lors de la copie du média",
     "error": "EACCES: permission denied"
   }
   ```

### Gestion Frontend

```javascript
if (successCount === selectedMedias.value.length) {
  // Tous copiés ✅
  $q.notify({
    type: 'positive',
    message: `${successCount} média(s) copié(s) avec succès`
  })
} else if (successCount > 0) {
  // Certains copiés ⚠️
  $q.notify({
    type: 'warning',
    message: `${successCount}/${selectedMedias.value.length} média(s) copié(s)`
  })
} else {
  // Aucun copié ❌
  $q.notify({
    type: 'negative',
    message: 'Aucun média n\'a pu être copié'
  })
}
```

## 🔄 Différences avec le Déplacement

| Aspect | Déplacement | Copie |
|--------|-------------|-------|
| **Fichier physique** | Pas de duplication | **Nouveau fichier créé** |
| **Nom de fichier** | Conservé | **Nouveau UUID** |
| **Collection source** | Média supprimé | **Média conservé** |
| **Indépendance** | N/A | Fichiers totalement indépendants |
| **Espace disque** | Aucun impact | **Augmente** (fichier dupliqué) |

## 🚀 Améliorations Futures

### 1. Copie Batch Optimisée
Au lieu d'appeler `/copy` pour chaque média, utiliser `/copy-batch` :
```javascript
const response = await fetch('/api/media/copy-batch', {
  method: 'POST',
  body: JSON.stringify({
    medias: selectedMedias.value.map(m => ({
      sourceUrl: m.url,
      description: m.description
    })),
    targetCollectionId: targetCollectionForCopy.value
  })
})
```

### 2. Barre de Progression
```vue
<q-linear-progress 
  :value="progress" 
  color="primary"
  :buffer="1"
  class="q-mt-sm"
/>
<div class="text-caption text-center">
  {{ copiedCount }} / {{ totalCount }} médias copiés
</div>
```

### 3. Gestion des Doublons
Détection si un fichier identique existe déjà :
```javascript
// Calculer hash MD5 du fichier source
const sourceHash = crypto.createHash('md5')
  .update(fileBuffer)
  .digest('hex');

// Vérifier si un fichier avec le même hash existe
const existingFile = await findFileByHash(sourceHash);
if (existingFile) {
  // Option: réutiliser le fichier existant ou créer quand même
}
```

### 4. Copie avec Transformation
Copier ET appliquer une transformation :
```javascript
POST /api/media/copy-transform
{
  "sourceUrl": "/medias/img.jpg",
  "targetCollectionId": "col_123",
  "transform": {
    "resize": { "width": 800, "height": 600 },
    "format": "webp",
    "quality": 85
  }
}
```

## 📝 Logs et Debugging

### Logs Backend

```javascript
console.log('📋 Copie de média:', {
  sourceUrl,
  targetCollectionId,
  description
});

console.log('📁 Chemin source:', sourceFilePath);
console.log('📝 Nouveau fichier:', newFileName);
console.log('✅ Fichier copié:', newFilePath);
console.log('✅ Média ajouté à la collection:', targetCollectionId);
```

### Logs Frontend

```javascript
console.log('📋 Copie de', selectedMedias.value.length, 'médias vers collection', targetCollectionForCopy.value)
console.log('Copie média:', media.mediaId, 'URL:', media.url)
console.log('✅ Média copié:', result)
```

## ✅ Checklist d'Implémentation

- [x] Créer route backend `/api/media/copy`
- [x] Ajouter fonction `getMediasDir()` dans `fileUtils.js`
- [x] Enregistrer route dans `server.js`
- [x] Ajouter bouton "Copier" dans `CollectionView.vue`
- [x] Créer dialog de copie
- [x] Implémenter fonction `copySelectedMedias()`
- [x] Implémenter fonction `confirmCopyMedias()`
- [x] Ajouter variables `showCopyDialog` et `targetCollectionForCopy`
- [x] Tester copie simple
- [ ] Tester copie multiple
- [ ] Tester gestion d'erreurs
- [ ] Ajouter tests unitaires
- [ ] Optimiser avec endpoint batch

## 🎓 Notes de Développement

### Pourquoi Créer de Nouveaux Fichiers ?

1. **Indépendance**: Modifications dans une collection n'affectent pas les autres
2. **Sécurité**: Suppression d'une collection ne supprime pas les médias d'autres collections
3. **Traçabilité**: Chaque fichier a son propre UUID unique

### Considérations Espace Disque

- Chaque copie = fichier complet dupliqué
- Image moyenne: 2-5 MB
- 100 copies d'une image de 3 MB = 300 MB
- Prévoir système de nettoyage des fichiers orphelins

### Alternative: Liens Symboliques ?

**Pourquoi PAS de liens symboliques:**
- Complexité de gestion cross-platform (Windows vs Linux)
- Risques de corruption si fichier source supprimé
- Difficulté de maintenance
- Pas de transformation indépendante possible

**Avantage copie physique:**
- Simplicité
- Robustesse
- Indépendance totale
- Compatibilité universelle

---

**Date de création**: 2025-01-05  
**Version**: 1.0  
**Auteur**: Session de développement
