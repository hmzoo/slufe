# Système de stockage des données

## 📁 Structure des dossiers

```
backend/
  data/
    operations/
      20251103143022_abc123_in_1.jpg      # Image d'entrée 1
      20251103143022_abc123_in_2.jpg      # Image d'entrée 2 (optionnel)
      20251103143022_abc123_out.jpg       # Résultat image
      20251103143022_abc123_out.mp4       # Résultat vidéo
      20251103143022_abc123.json          # Métadonnées
```

## 🔑 Format de l'ID d'opération

Format: `{timestamp}_{random}`
- `timestamp`: Date/heure au format `YYYYMMDDHHmmss`
- `random`: 8 caractères hexadécimaux aléatoires

Exemple: `20251103143022_abc123de`

## 📋 Structure du fichier JSON de métadonnées

```json
{
  "operationId": "20251103143022_abc123",
  "timestamp": "2025-11-03T14:30:22.123Z",
  "operationType": "image_edit_multiple",
  "prompt": "remplace le personnage de l image 2 par celui de l image 1",
  "parameters": {
    "aspectRatio": "16:9",
    "outputFormat": "webp",
    "outputQuality": 95,
    "disableSafetyChecker": true,
    "goFast": true
  },
  "inputCount": 2,
  "inputFiles": [
    "20251103143022_abc123_in_1.jpg",
    "20251103143022_abc123_in_2.jpg"
  ],
  "outputFile": "20251103143022_abc123_out.jpg",
  "resultUrl": "https://replicate.delivery/...",
  "workflowAnalysis": {
    "workflow": {
      "id": "image_edit_multiple",
      "name": "Édition d'images multiples"
    },
    "confidence": 0.95,
    "reasoning": "L'utilisateur demande de remplacer un personnage..."
  },
  "error": null,
  "success": true,
  "duration": null
}
```

## 🔧 API du service de stockage

### Fonctions principales

#### `generateOperationId()`
Génère un ID unique pour une opération.

```javascript
const operationId = generateOperationId();
// Retourne: "20251103143022_abc123de"
```

#### `initializeStorage()`
Initialise les dossiers de stockage au démarrage.

```javascript
await initializeStorage();
// Crée: backend/data/operations/
```

#### `saveInputImage(operationId, imageBuffer, index)`
Sauvegarde une image d'entrée.

```javascript
const filepath = await saveInputImage(
  '20251103143022_abc123',
  imageBuffer,
  1 // Index (1 pour première image)
);
// Crée: 20251103143022_abc123_in_1.jpg
```

#### `saveOutputFile(operationId, resultBuffer, operationType)`
Sauvegarde le résultat (image ou vidéo).

```javascript
const filepath = await saveOutputFile(
  '20251103143022_abc123',
  resultBuffer,
  'text_to_video' // Détermine l'extension (.mp4)
);
// Crée: 20251103143022_abc123_out.mp4
```

#### `saveOperationMetadata(operationId, metadata)`
Sauvegarde les métadonnées de l'opération.

```javascript
const filepath = await saveOperationMetadata(
  '20251103143022_abc123',
  {
    operationType: 'image_edit_multiple',
    prompt: 'remplace le personnage...',
    parameters: { aspectRatio: '16:9', ... }
  }
);
// Crée: 20251103143022_abc123.json
```

#### `saveCompleteOperation(operation)`
Sauvegarde une opération complète (images + résultat + métadonnées).

```javascript
const result = await saveCompleteOperation({
  operationType: 'image_edit_multiple',
  prompt: 'remplace le personnage...',
  parameters: {
    aspectRatio: '16:9',
    outputFormat: 'webp',
    outputQuality: 95
  },
  inputImages: [imageBuffer1, imageBuffer2],
  resultUrl: 'https://replicate.delivery/...',
  workflowAnalysis: analysisData
});

// Retourne:
{
  operationId: '20251103143022_abc123',
  success: true,
  inputFiles: ['20251103143022_abc123_in_1.jpg', '20251103143022_abc123_in_2.jpg'],
  outputFile: '20251103143022_abc123_out.jpg',
  metadataFile: '20251103143022_abc123.json'
}
```

#### `listOperations(limit)`
Liste les opérations récentes.

```javascript
const operations = await listOperations(50);
// Retourne un tableau des 50 opérations les plus récentes
```

#### `getOperationMetadata(operationId)`
Récupère les métadonnées d'une opération.

```javascript
const metadata = await getOperationMetadata('20251103143022_abc123');
```

## 🚀 Utilisation dans les routes

### Exemple : Édition d'image avec sauvegarde

```javascript
import { saveCompleteOperation } from '../services/dataStorage.js';

router.post('/image', upload.array('images', 5), async (req, res) => {
  try {
    const { prompt, aspectRatio, outputFormat, outputQuality } = req.body;
    
    // 1. Convertir les fichiers en buffers
    const inputImages = req.files.map(file => file.buffer);
    
    // 2. Appeler le service d'édition
    const result = await editImage({
      prompt,
      images: inputImages.map(buffer => {
        const base64 = buffer.toString('base64');
        return `data:image/jpeg;base64,${base64}`;
      }),
      aspectRatio,
      outputFormat,
      outputQuality
    });
    
    // 3. Sauvegarder l'opération complète
    const saveResult = await saveCompleteOperation({
      operationType: 'image_edit_multiple',
      prompt,
      parameters: {
        aspectRatio,
        outputFormat,
        outputQuality,
        imageCount: inputImages.length
      },
      inputImages,
      resultUrl: result.imageUrls[0],
      workflowAnalysis: null
    });
    
    // 4. Retourner le résultat avec l'ID d'opération
    res.json({
      ...result,
      operationId: saveResult.operationId
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Exemple : Smart Generate avec sauvegarde

```javascript
router.post('/execute', upload.array('images', 10), async (req, res) => {
  try {
    // ... analyse du workflow ...
    
    // Exécuter le workflow
    let result;
    const inputImages = images.map(img => img.buffer);
    
    switch (workflowId) {
      case 'text_to_image':
        const imageUrl = await generateImage({ prompt: finalPrompt });
        result = { type: 'image', imageUrl };
        break;
      // ... autres cas ...
    }
    
    // Sauvegarder l'opération
    const saveResult = await saveCompleteOperation({
      operationType: workflowId,
      prompt: finalPrompt,
      parameters: {
        originalPrompt: prompt,
        optimized: useOptimizedPrompt === 'true',
        confidence: analysis.analysis.confidence
      },
      inputImages,
      resultUrl: result.imageUrl || result.videoUrl,
      workflowAnalysis: analysis
    });
    
    res.json({
      ...result,
      operationId: saveResult.operationId,
      workflow: analysis.workflow
    });
    
  } catch (error) {
    // Sauvegarder aussi les erreurs
    await saveCompleteOperation({
      operationType: 'unknown',
      prompt: req.body.prompt,
      parameters: {},
      inputImages: [],
      error: error.message
    });
    
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## 📊 Routes API d'historique

### GET /api/history
Liste les opérations récentes.

**Query Parameters:**
- `limit` (optionnel, défaut: 50) - Nombre d'opérations à retourner

**Exemple:**
```bash
curl http://localhost:3000/api/history?limit=10
```

**Réponse:**
```json
{
  "success": true,
  "count": 10,
  "operations": [
    {
      "operationId": "20251103143022_abc123",
      "timestamp": "2025-11-03T14:30:22.123Z",
      "operationType": "image_edit_multiple",
      "prompt": "remplace le personnage...",
      "success": true,
      ...
    }
  ]
}
```

### GET /api/history/:operationId
Récupère les détails d'une opération.

**Exemple:**
```bash
curl http://localhost:3000/api/history/20251103143022_abc123
```

**Réponse:**
```json
{
  "success": true,
  "operation": {
    "operationId": "20251103143022_abc123",
    "timestamp": "2025-11-03T14:30:22.123Z",
    "operationType": "image_edit_multiple",
    "prompt": "remplace le personnage...",
    "parameters": { ... },
    "inputFiles": ["..._in_1.jpg", "..._in_2.jpg"],
    "outputFile": "..._out.jpg",
    "success": true
  }
}
```

## 🎯 Types d'opérations

Types reconnus pour déterminer l'extension du fichier de sortie :

### Opérations vidéo (sortie `.mp4`)
- `text_to_video`
- `image_to_video_single`
- `image_to_video_transition`

### Opérations image (sortie `.jpg`)
- `text_to_image`
- `image_edit_single`
- `image_edit_multiple`
- `edit_then_video` (sortie intermédiaire)

## 🔒 Sécurité et bonnes pratiques

1. **Exclusion Git**: Le dossier `backend/data/` est dans `.gitignore`
2. **Taille des fichiers**: Les uploads sont limités à 10MB par fichier
3. **Nettoyage**: Créer un script de nettoyage pour supprimer les anciennes opérations
4. **Backup**: Sauvegarder régulièrement le dossier `data/`

## 📈 Statistiques possibles

Avec ce système, vous pouvez facilement :
- Compter le nombre d'opérations par type
- Calculer le temps moyen par opération
- Identifier les prompts les plus utilisés
- Analyser les taux de succès/échec
- Générer des rapports d'utilisation

## 🔄 Exemple de script de nettoyage

```javascript
// scripts/cleanup-old-operations.js
import { listOperations } from '../services/dataStorage.js';
import fs from 'fs/promises';

async function cleanupOldOperations(daysToKeep = 30) {
  const operations = await listOperations(9999);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  for (const op of operations) {
    const opDate = new Date(op.timestamp);
    if (opDate < cutoffDate) {
      // Supprimer les fichiers de cette opération
      console.log(`🗑️  Suppression: ${op.operationId}`);
      // ... code de suppression ...
    }
  }
}
```

## 📝 TODO futures améliorations

- [ ] Compression des anciennes opérations
- [ ] Export au format CSV/Excel
- [ ] Interface web pour parcourir l'historique
- [ ] Statistiques et graphiques d'utilisation
- [ ] Système de tags/catégories
- [ ] Recherche full-text dans les prompts
- [ ] Comparaison avant/après
- [ ] Partage d'opérations

---

**Date de création**: 3 novembre 2025  
**Version**: 1.0  
**Status**: ✅ Opérationnel
