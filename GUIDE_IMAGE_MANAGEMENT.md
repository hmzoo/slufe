# Guide de Gestion des Images - Architecture SLUFE

## 📋 Table des Matières

1. [Principes Fondamentaux](#principes-fondamentaux)
2. [Architecture du Système](#architecture-du-système)
3. [Flux de Données](#flux-de-données)
4. [Formats et Chemins](#formats-et-chemins)
5. [Implémentation pour les Services](#implémentation-pour-les-services)
6. [Exemples Pratiques](#exemples-pratiques)
7. [Bonnes Pratiques](#bonnes-pratiques)

---

## Principes Fondamentaux

### Concept Principal: Chemins Locaux Entre Services

**Règle d'Or:** Entre les services (dans la chaîne de workflow), on utilise **toujours des chemins locaux** (`/medias/xxx.jpg`), jamais des URLs complètes.

```
Frontend → Backend (upload) → Service 1 → Service 2 → Service 3 → Frontend (affichage)
                              /medias/     /medias/     /medias/
```

### Pourquoi Cette Approche?

- **Performance**: Les chemins sont légers et rapides à passer entre services
- **Flexibilité**: Fonctionne en local (développement) et en production
- **Chaînage**: Permet l'enchaînement automatique des services
- **Stockage**: Images restent locales, accessibles via API `/medias/` endpoint

---

## Architecture du Système

### Structure de Fichiers

```
/home/hmj/slufe/
├── backend/
│   ├── data/
│   │   ├── medias/              ← Toutes les images stockées ici
│   │   │   ├── uuid1.png
│   │   │   ├── uuid2.jpg
│   │   │   └── uuid3.webp
│   │   ├── collections/
│   │   ├── workflows/
│   │   └── templates/
│   ├── services/
│   │   └── tasks/
│   │       ├── GenerateImageTask.js
│   │       ├── ImageEnhanceTask.js
│   │       ├── ImageResizeCropTask.js
│   │       ├── EditImageTask.js
│   │       ├── DescribeImagesTask.js
│   │       └── ImageOutputTask.js
│   ├── utils/
│   │   └── fileUtils.js         ← Gestion des fichiers
│   └── server.js
└── frontend/
    └── src/
        └── components/
            └── AppViewer.vue    ← Upload des images
```

### Utilitaires Clés (`backend/utils/fileUtils.js`)

```javascript
// Retourne le chemin relatif du fichier média
getMediaFileUrl(filename) → '/medias/uuid.png'

// Sauvegarde un buffer et retourne les infos
saveMediaFile(filename, buffer) → {
  filename: 'uuid.png',
  filePath: '/full/path/to/uuid.png',
  url: '/medias/uuid.png'          ← C'est ce qu'on utilise!
}

// Génère un nom unique
generateUniqueFileName('.png') → 'a1b2c3d4-e5f6-7890-1234-567890abcdef.png'
```

---

## Flux de Données

### 1. Upload Initial (Frontend → Backend)

```
User uploads image.jpg
        ↓
AppViewer.vue: POST /api/media/upload
        ↓
Backend saves: data/medias/uuid1.jpg
        ↓
Response: { url: '/medias/uuid1.jpg' }
        ↓
Frontend injects into workflow.inputs.image = '/medias/uuid1.jpg'
```

### 2. Exécution Workflow (Service à Service)

```
WorkflowRunner executes tasks in sequence

Task 1: GenerateImageTask
  Input:  { prompt: '...' }
  Output: { image: '/medias/uuid2.png' }
           ↓ (passed to next task)

Task 2: ImageEnhanceTask
  Input:  { image: '/medias/uuid2.png' }
         Convert to URL: 'http://localhost:3000/medias/uuid2.png'
         Call Replicate API
         Download result
         Save locally
  Output: { image: '/medias/uuid3.png' }
           ↓ (passed to next task)

Task 3: ImageOutputTask
  Input:  { image: '/medias/uuid3.png' }
  Output: { image_url: '/medias/uuid3.png' }
           ↓ (displayed in frontend)

Frontend receives: { image_url: '/medias/uuid3.png' }
Display: <img :src="`${API_BASE_URL}${image_url}`" />
         → Shows http://localhost:3000/medias/uuid3.png
```

### 3. Affichage Final (Backend → Frontend)

```
Frontend receives: { image: '/medias/uuid.png' }
                   or
                   { image_url: '/medias/uuid.png' }

Frontend constructs: ${API_BASE_URL}/medias/uuid.png
                   = http://localhost:3000/medias/uuid.png
                   (ou https://example.com/medias/uuid.png en prod)

Server serves: GET /medias/uuid.png → Express static middleware
Result: Image affichée dans le navigateur
```

---

## Formats et Chemins

### Format Standard des Chemins

| Context | Format | Exemple |
|---------|--------|---------|
| Entre services | Chemin relatif | `/medias/a1b2c3d4.png` |
| Frontale reçoit | Chemin relatif | `/medias/a1b2c3d4.png` |
| Frontend affiche | URL complète | `http://localhost:3000/medias/a1b2c3d4.png` |
| Replicate API | URL complète | `http://localhost:3000/medias/a1b2c3d4.png` |

### Conversion Automatique

```javascript
// À L'ENTRÉE du service (si reçoit chemin local)
if (imageUrl.startsWith('/medias/')) {
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  imageUrl = `${apiBaseUrl}${imageUrl}`;
  // Résultat: 'http://localhost:3000/medias/uuid.png'
}

// À LA SORTIE du service (toujours chemin local)
return {
  image: '/medias/uuid.png',      // ✅ Correct
  image_url: '/medias/uuid.png'   // ✅ Aussi correct
}
```

---

## Implémentation pour les Services

### Template Minimal d'un Service Image

```javascript
import { saveMediaFile, generateUniqueFileName } from '../../utils/fileUtils.js';

export class MonImageTask {
  constructor() {
    this.taskType = 'mon_image_task';
  }

  async execute(inputs) {
    try {
      // 1. ENTRÉE: Recevoir chemin local
      let imageInput = inputs.image; // '/medias/uuid.png'
      
      // 2. CONVERSION: Transformer en URL si nécessaire
      if (imageInput.startsWith('/medias/')) {
        const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        imageInput = `${apiBaseUrl}${imageInput}`;
        // Maintenant: 'http://localhost:3000/medias/uuid.png'
      }

      // 3. TRAITEMENT: Votre logique métier
      // Appel API, transformation d'image, etc.
      const result = await apiCall(imageInput);
      
      // 4. SI GÉNÉRATION: Télécharger et sauvegarder
      if (result.isExternalUrl) {
        const imageResponse = await fetch(result.url);
        const buffer = await imageResponse.arrayBuffer();
        const filename = generateUniqueFileName('.png');
        const savedFile = saveMediaFile(filename, Buffer.from(buffer));
        
        // 5. SORTIE: Retourner chemin local
        return {
          image: savedFile.url,           // '/medias/uuid.png'
          image_filename: savedFile.filename,
          external_url: result.url,       // Garder URL source si utile
          status: 'success'
        };
      } else {
        // Image déjà locale, la passer en tant que
        return {
          image: imageInput,
          status: 'success'
        };
      }

    } catch (error) {
      global.logWorkflow(`❌ Erreur`, { error: error.message });
      throw error;
    }
  }

  validateInputs(inputs) {
    return {
      isValid: inputs && inputs.image,
      errors: !inputs.image ? ['Image requise'] : []
    };
  }

  getSchema() {
    return {
      inputs: {
        image: {
          type: 'image',
          required: true,
          description: 'Image à traiter (chemin /medias/...)'
        }
      },
      outputs: {
        image: {
          type: 'image',
          description: 'Image traitée (chemin /medias/...)'
        }
      }
    };
  }
}

export default MonImageTask;
```

### Schéma d'Inputs/Outputs Complet

```javascript
getSchema() {
  return {
    inputs: {
      // Format accepté: chemin local '/medias/...' OU URL complète
      image: {
        type: 'image',
        required: true,
        description: 'Image source (chemin ou URL)'
      },
      // Paramètres optionnels selon le service
      scale: {
        type: 'number',
        required: false,
        min: 1,
        max: 10,
        default: 4,
        description: 'Facteur d\'upscaling'
      }
    },
    outputs: {
      // Format retourné: TOUJOURS chemin local '/medias/...'
      image: {
        type: 'image',
        description: 'Image traitée (chemin /medias/...)'
      },
      // Métadonnées utiles
      image_filename: {
        type: 'string',
        description: 'Nom du fichier sauvegardé'
      },
      // URL externe si créée via API
      external_url: {
        type: 'string',
        description: 'URL externe de référence (si applicable)'
      }
    }
  };
}
```

---

## Exemples Pratiques

### Exemple 1: Service qui Reçoit et Passe

**ImageResizeCropTask** - Reçoit une image, la redimensionne, retourne le chemin local

```javascript
async execute(inputs) {
  let processedImage = inputs.image; // '/medias/original.jpg'
  
  // Si chemin local, convertir en URL pour traitement
  if (typeof processedImage === 'string' && !processedImage.startsWith('http')) {
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    processedImage = `${apiBaseUrl}${processedImage}`;
    // 'http://localhost:3000/medias/original.jpg'
  }
  
  // Appeler service de redimensionnement
  const result = await resizeCropImage(processedImage);
  
  // Sauvegarder localement
  const savedFile = saveMediaFile(
    generateUniqueFileName('.jpg'),
    result.buffer
  );
  
  // Retourner chemin local TOUJOURS
  return {
    image: savedFile.url,           // '/medias/resized.jpg'
    edited_image: savedFile.url,
    image_path: savedFile.filePath
  };
}
```

### Exemple 2: Service qui Génère (API Externe)

**ImageEnhanceTask** - Appelle Replicate, télécharge, sauvegarde

```javascript
async execute(inputs) {
  let imageUrl = inputs.image; // '/medias/original.png'
  
  // Convertir chemin en URL pour Replicate
  if (imageUrl.startsWith('/medias/')) {
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    imageUrl = `${apiBaseUrl}${imageUrl}`;
  }
  
  // Appeler API (Replicate, CloudinaryAPI, etc.)
  const output = await this.replicate.run('nightmareai/real-esrgan', {
    input: { image: imageUrl, scale: inputs.scale }
  });
  
  // Télécharger résultat
  const response = await fetch(output); // URL de Replicate
  const buffer = await response.arrayBuffer();
  
  // Sauvegarder localement
  const filename = generateUniqueFileName('.png');
  const savedFile = saveMediaFile(filename, Buffer.from(buffer));
  
  // Retourner CHEMIN LOCAL pour chaînage
  return {
    image: savedFile.url,        // '/medias/enhanced.png'
    image_filename: savedFile.filename,
    external_url: output,        // Garder URL Replicate pour ref
    status: 'success'
  };
}
```

### Exemple 3: Service Chaîné

**Workflow:** Upload → GenerateImage → ImageEnhance → ImageOutput → Display

```
1. Upload: image.jpg
   Output: { image: '/medias/uuid1.jpg' }

2. GenerateImage (reçoit: '/medias/uuid1.jpg' comme référence)
   Output: { image: '/medias/uuid2.png' }  ← image générée

3. ImageEnhance (reçoit: '/medias/uuid2.png')
   Converts to: 'http://localhost:3000/medias/uuid2.png'
   Calls Replicate
   Downloads result
   Saves: '/medias/uuid3.png'
   Output: { image: '/medias/uuid3.png' }

4. ImageOutput (reçoit: '/medias/uuid3.png')
   Output: { image_url: '/medias/uuid3.png' }

5. Frontend reçoit: '/medias/uuid3.png'
   Displays: <img :src="`http://localhost:3000/medias/uuid3.png`" />
```

---

## Bonnes Pratiques

### ✅ À FAIRE

1. **Toujours retourner chemins locaux** entre services
   ```javascript
   return { image: '/medias/uuid.png' }  // ✅ Correct
   ```

2. **Convertir en URLs pour les APIs externes**
   ```javascript
   if (imageUrl.startsWith('/medias/')) {
     imageUrl = `${process.env.API_BASE_URL}${imageUrl}`;
   }
   ```

3. **Télécharger et sauvegarder les résultats externes**
   ```javascript
   const response = await fetch(externalUrl);
   const buffer = await response.arrayBuffer();
   const savedFile = saveMediaFile(generateUniqueFileName('.png'), Buffer.from(buffer));
   return { image: savedFile.url };
   ```

4. **Garder URL externe en référence**
   ```javascript
   return {
     image: '/medias/local.png',      // Pour chaînage
     external_url: 'https://api.../result.png'  // Pour ref
   };
   ```

5. **Valider les inputs**
   ```javascript
   if (!inputs.image) {
     throw new Error('Image requise');
   }
   ```

6. **Supporter formats multiples d'entrée**
   ```javascript
   // Accepter chemin local ET URL
   if (typeof imageInput === 'string' && !imageInput.startsWith('http')) {
     // C'est un chemin local, convertir
   }
   ```

7. **Générer noms uniques**
   ```javascript
   const filename = generateUniqueFileName('.png');  // UUID auto
   const savedFile = saveMediaFile(filename, buffer);
   ```

### ❌ À ÉVITER

1. **Retourner URLs Replicate/CloudinaryAPI**
   ```javascript
   return { image: 'https://api.replicate.com/...png' }  // ❌ Mauvais!
   ```

2. **Passer URLs complètes entre services**
   ```javascript
   taskResult.image = 'http://localhost:3000/medias/uuid.png'  // ❌ Mauvais!
   ```

3. **Oublier de sauvegarder les résultats externes**
   ```javascript
   return { image: externalApiUrl }  // ❌ Manque saveMediaFile!
   ```

4. **Utiliser noms de fichiers fixes**
   ```javascript
   saveMediaFile('result.png', buffer)  // ❌ Risque collision!
   ```

5. **Ne pas convertir chemins en URLs pour APIs**
   ```javascript
   await apiCall('/medias/image.png')  // ❌ API ne comprend pas!
   ```

6. **Ignorer les variables d'environnement**
   ```javascript
   const url = `http://localhost:3000/medias/uuid.png`  // ❌ Hard-coded!
   const url = `${process.env.API_BASE_URL}/medias/uuid.png`  // ✅ Correct
   ```

---

## Configuration et Déploiement

### Variables d'Environnement

```bash
# .env (Backend)

# Base URL pour construction des URLs complètes
API_BASE_URL=http://localhost:3000      # Dev
API_BASE_URL=https://api.example.com    # Prod

# API tokens si nécessaire
REPLICATE_API_TOKEN=...
CLOUDINARY_API_KEY=...
```

### Express Static Middleware

```javascript
// backend/server.js

// Servir les fichiers médias statiques
app.use('/medias', express.static(path.join(process.cwd(), 'data/medias')));
```

### Dossier Medias Créé Automatiquement

```javascript
// utils/fileUtils.js crée automatiquement le dossier s'il n'existe pas
export function saveMediaFile(filename, buffer) {
  const filePath = getMediaFilePath(filename);
  const mediaDir = path.dirname(filePath);
  
  // Crée le dossier s'il n'existe pas
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, buffer);
  return {
    filename: filename,
    filePath: filePath,
    url: `/medias/${filename}`
  };
}
```

---

## Cas d'Usage Courants

### 1. Service qui Lit et Modifie

```
Input: { image: '/medias/source.jpg' }
  ↓
Convert to URL: 'http://localhost:3000/medias/source.jpg'
  ↓
Fetch + Traitement local
  ↓
Save result: saveMediaFile(newFilename, resultBuffer)
  ↓
Output: { image: '/medias/modified.jpg' }
```

**Services:** ImageResizeCropTask, EditImageTask

### 2. Service qui Génère de Zéro

```
Input: { prompt: 'A cat' }
  ↓
Call API: await apiCall(params)
  ↓
Get external URL: 'https://api.../generated.jpg'
  ↓
Download + Save: saveMediaFile(newFilename, buffer)
  ↓
Output: { image: '/medias/generated.jpg' }
```

**Services:** GenerateImageTask, GenerateVideoT2VTask

### 3. Service qui Analyse et Retourne Métadonnées

```
Input: { image: '/medias/source.jpg' }
  ↓
Convert to URL: 'http://localhost:3000/medias/source.jpg'
  ↓
Call Analysis API
  ↓
Output: { description: '...', image: '/medias/source.jpg' }
```

**Services:** DescribeImagesTask, AnalyzeImageTask

### 4. Service Purement d'Affichage

```
Input: { image: '/medias/source.jpg' }
  ↓
No modification, just format
  ↓
Output: { image_url: '/medias/source.jpg', ... metadata ... }
```

**Services:** ImageOutputTask, VideoOutputTask

---

## Troubleshooting

### Erreur: "Image not found"

**Cause:** Chemin incorrect ou fichier non sauvegardé
```javascript
// Vérifier que saveMediaFile est appelé
const savedFile = saveMediaFile(filename, buffer);
console.log('Saved at:', savedFile.url); // '/medias/uuid.png'
```

### Erreur: "Cannot read property 'url'"

**Cause:** Output Replicate mal formé
```javascript
// Convertir si nécessaire
let outputUrl = output;
if (typeof output === 'object' && output.url) {
  outputUrl = output.url();  // FileURL object
}
// Maintenant c'est une string URL
```

### Image non accessible dans Frontend

**Cause:** URL mal formée
```javascript
// ❌ Mauvais
<img :src="image" /> <!-- /medias/uuid.png → 404 -->

// ✅ Correct
<img :src="`${API_BASE_URL}${image}`" /> <!-- http://localhost:3000/medias/uuid.png →  200 -->
```

### Énorme consommation de disque

**Cause:** Fichiers temporaires non nettoyés
```javascript
// Implémenter un cleanup régulier
// Supprimer fichiers > X jours old
// Ou implémenter une limite de stockage
```

---

## Résumé Rapide

| Étape | Format | Exemple |
|-------|--------|---------|
| Frontend Upload | Chemin local | `/medias/uuid1.jpg` |
| Entre services | Chemin local | `/medias/uuid2.png` |
| Appel API | URL complète | `http://localhost:3000/medias/uuid2.png` |
| Sauvegarde résultat API | Buffer + chemin local | `/medias/uuid3.png` |
| Retour service | Chemin local | `/medias/uuid3.png` |
| Frontend affichage | URL complète | `http://localhost:3000/medias/uuid3.png` |

**Le mantra:** Entre les services = chemins, pour les APIs = URLs, toujours sauvegarder localement
