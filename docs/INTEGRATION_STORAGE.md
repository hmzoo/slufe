# Guide d'intégration du système de stockage

## 🎯 Objectif

Intégrer `saveCompleteOperation()` dans toutes les routes de génération pour persister automatiquement les opérations.

## ✅ Statut d'intégration

### Routes complétées
- ✅ `/api/generate/text-to-image` - Text to Image

### Routes à faire
- ⏳ `/api/generate/img-to-img` - Image to Image transformation
- ⏳ `/api/edit/*` - Toutes les routes d'édition
- ⏳ `/api/video/*` - Toutes les routes vidéo
- ⏳ `/api/workflow/execute` - Exécution de workflow

## 📝 Modèle d'intégration

### 1. Import du service

```javascript
import { saveCompleteOperation } from '../services/dataStorage.js';
```

### 2. Pattern pour succès

```javascript
try {
  // ... génération de contenu ...
  const resultUrl = await generateSomething({...});
  
  // Sauvegarder l'opération
  try {
    const saveResult = await saveCompleteOperation({
      operationType: 'text_to_image', // ou 'text_to_video', 'image_edit', etc.
      prompt: prompt,
      parameters: {
        // Tous les paramètres utilisés
        aspectRatio,
        guidance,
        // ...
      },
      inputImages: [], // Array de buffers (vide pour text-to-X)
      resultUrl: resultUrl,
      workflowAnalysis: null, // ou les données d'analyse si disponibles
      error: null
    });
    console.log('✅ Opération sauvegardée:', saveResult.operationId);
  } catch (saveError) {
    console.error('⚠️ Erreur sauvegarde:', saveError.message);
    // Ne pas bloquer la réponse
  }
  
  res.json({ success: true, resultUrl, ... });
  
} catch (error) {
  // Pattern pour erreur (voir ci-dessous)
}
```

### 3. Pattern pour erreur

```javascript
catch (error) {
  console.error('Erreur:', error);
  
  // Sauvegarder l'échec
  try {
    await saveCompleteOperation({
      operationType: 'text_to_image',
      prompt: req.body.prompt,
      parameters: req.body,
      inputImages: [],
      resultUrl: null,
      workflowAnalysis: null,
      error: error.message
    });
  } catch (saveError) {
    console.error('⚠️ Erreur sauvegarde échec:', saveError.message);
  }
  
  res.status(500).json({ success: false, error: error.message });
}
```

### 4. Pattern avec images en entrée

Pour les routes qui reçoivent des images (edit, img-to-img, etc.) :

```javascript
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

router.post('/edit', upload.array('images', 5), async (req, res) => {
  try {
    // Récupérer les buffers des images
    const inputImages = req.files.map(file => file.buffer);
    
    // ... traitement ...
    const resultUrl = await editImages({...});
    
    // Sauvegarder avec les images en entrée
    await saveCompleteOperation({
      operationType: 'image_edit_multiple',
      prompt: req.body.prompt,
      parameters: req.body,
      inputImages: inputImages, // ⚠️ Important: passer les buffers
      resultUrl: resultUrl,
      workflowAnalysis: null,
      error: null
    });
    
    res.json({ success: true, resultUrl });
  } catch (error) {
    // Pattern erreur...
  }
});
```

## 🔧 Types d'opérations

Utilisez ces valeurs pour `operationType` :

### Images
- `text_to_image` - Génération d'image depuis texte
- `image_edit_single` - Édition d'une seule image
- `image_edit_multiple` - Édition avec plusieurs images
- `img_to_img` - Transformation image vers image

### Vidéos
- `text_to_video` - Génération vidéo depuis texte
- `image_to_video_single` - Animation d'une image
- `image_to_video_transition` - Transition entre images

### Workflows
- `edit_then_video` - Édition puis animation
- Le type exact du workflow détecté

## 📋 Checklist par route

### `/routes/generate.js`
- [x] POST /text-to-image
- [ ] POST /img-to-img

### `/routes/edit.js`
- [ ] POST /image (édition simple)
- [ ] POST /pose (transfer de pose)
- [ ] POST /style (transfer de style)

### `/routes/video.js`
- [ ] POST /text-to-video
- [ ] POST /img-to-video (single image)

### `/routes/videoImage.js`
- [ ] POST /animate-image
- [ ] POST /transition (2 images)

### `/routes/workflow.js`
- [ ] POST /execute

## 🧪 Tests

### Test manuel

1. **Démarrer le serveur**
   ```bash
   cd backend
   npm run dev
   ```

2. **Vérifier l'initialisation**
   ```
   ✅ Dossiers de stockage initialisés
   📁 data/operations/
   ```

3. **Faire une génération**
   ```bash
   curl -X POST http://localhost:3000/api/generate/text-to-image \
     -H "Content-Type: application/json" \
     -d '{"prompt": "un chat", "aspectRatio": "16:9"}'
   ```

4. **Vérifier les fichiers créés**
   ```bash
   ls -lh backend/data/operations/
   ```
   
   Devrait afficher :
   ```
   20251103_abc123_out.jpg
   20251103_abc123.json
   ```

5. **Consulter l'historique**
   ```bash
   curl http://localhost:3000/api/history
   ```

### Script de test automatique

Utilisez le script fourni :

```bash
cd backend
./test-storage.sh
```

Ce script :
- ✅ Vérifie que le serveur fonctionne
- ✅ Génère une image de test
- ✅ Vérifie les fichiers créés
- ✅ Affiche l'historique
- ✅ Affiche le dernier JSON sauvegardé

## 🐛 Débogage

### Les fichiers ne sont pas créés

1. **Vérifier les logs serveur**
   ```
   ✅ Opération sauvegardée: 20251103_abc123
   ```

2. **Vérifier les permissions**
   ```bash
   ls -ld backend/data/operations
   # Doit être writable
   ```

3. **Vérifier manuellement**
   ```bash
   cd backend
   node -e "import('./services/dataStorage.js').then(m => m.initializeStorage())"
   ```

### Erreur "Cannot find module"

Vérifier que l'import est bien en haut du fichier :
```javascript
import { saveCompleteOperation } from '../services/dataStorage.js';
```

### Opération sauvegardée mais sans image

Pour les routes avec images en entrée, vérifier :
1. `req.files` existe et contient les fichiers
2. Les buffers sont bien passés : `req.files.map(f => f.buffer)`
3. L'array n'est pas vide : `inputImages.length > 0`

## 📊 Ordre de priorité des routes

1. **Haute priorité** (routes les plus utilisées)
   - ✅ text-to-image
   - ⏳ text-to-video
   - ⏳ image-edit
   - ⏳ workflow/execute

2. **Moyenne priorité**
   - ⏳ img-to-img
   - ⏳ animate-image
   - ⏳ pose-transfer

3. **Basse priorité**
   - ⏳ style-transfer
   - ⏳ transition

## 🚀 Prochaines étapes

1. **Intégrer dans route video.js**
   ```bash
   # À faire
   ```

2. **Intégrer dans route edit.js**
   ```bash
   # À faire
   ```

3. **Intégrer dans route workflow.js**
   ```bash
   # À faire (le plus important)
   ```

4. **Tester chaque route**
   ```bash
   ./test-storage.sh
   ```

5. **Vérifier l'historique**
   ```bash
   curl http://localhost:3000/api/history
   ```

## 💡 Améliorations futures

- [ ] Ajouter un job de nettoyage automatique (supprimer les > 30 jours)
- [ ] Compresser les anciennes opérations
- [ ] Ajouter des statistiques d'utilisation
- [ ] Interface admin pour gérer les opérations
- [ ] Export CSV des opérations
- [ ] Sauvegarde automatique sur cloud

---

**Mis à jour** : 3 novembre 2025  
**Status** : 1/10 routes intégrées (10%)
