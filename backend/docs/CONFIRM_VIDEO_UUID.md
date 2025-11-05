# ✅ Confirmation - UUID Uniques pour Vidéos

## 📅 Date
5 novembre 2025

## ✅ Statut

Les vidéos sont **déjà téléchargées avec des UUID uniques**, exactement comme les images.

## 🔍 Vérification

### 1. Fonction de Génération UUID

**Fichier** : `/backend/utils/fileUtils.js`

```javascript
import { v4 as uuidv4 } from 'uuid';

/**
 * Génère un nom de fichier unique basé sur UUID v4
 * @param {string} originalExtension - Extension du fichier
 * @returns {string} Nom de fichier unique (ex: "a1b2c3d4-e5f6-7890-abcd-ef1234567890.mp4")
 */
export function generateUniqueFileName(originalExtension) {
  const ext = originalExtension.startsWith('.') ? originalExtension : `.${originalExtension}`;
  return `${uuidv4()}${ext}`;
}
```

### 2. Utilisation dans videoGenerator.js (T2V)

**Fichier** : `/backend/services/videoGenerator.js`

```javascript
// Téléchargement de la vidéo depuis Replicate
const response = await fetch(videoUrl);
const arrayBuffer = await response.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

// Extraction extension depuis Content-Type
const extension = getFileExtension(response.headers.get('content-type') || 'video/mp4');

// ✅ Génération nom de fichier avec UUID unique
const filename = generateUniqueFileName(extension);
// Résultat: "a1b2c3d4-e5f6-7890-abcd-ef1234567890.mp4"

// Sauvegarde locale
const savedFile = saveMediaFile(filename, buffer);

// Extraction UUID pour mediaId
const mediaId = filename.replace(/\.[^.]+$/, '');
// Résultat: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

// Ajout à la collection avec UUID
await addImageToCurrentCollection({
  url: `/medias/${filename}`,
  mediaId: mediaId, // UUID unique
  type: 'video',
  description: `Vidéo T2V générée : "${prompt}"`,
  metadata: { ... }
});
```

### 3. Utilisation dans videoImageGenerator.js (I2V)

**Fichier** : `/backend/services/videoImageGenerator.js`

```javascript
// Même logique exacte
const extension = getFileExtension(response.headers.get('content-type') || 'video/mp4');
const filename = generateUniqueFileName(extension); // ✅ UUID unique
const savedFile = saveMediaFile(filename, buffer);
const mediaId = filename.replace(/\.[^.]+$/, '');

await addImageToCurrentCollection({
  url: `/medias/${filename}`,
  mediaId: mediaId, // ✅ UUID unique
  type: 'video',
  description: `Vidéo I2V générée : "${prompt}"`,
  metadata: { ... }
});
```

## 📊 Exemples de Noms Générés

### Images (Déjà en place)
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
b2c3d4e5-f6a7-8901-bcde-f12345678901.png
c3d4e5f6-a7b8-9012-cdef-123456789012.webp
```

### Vidéos (Maintenant également)
```
d4e5f6a7-b8c9-0123-def1-234567890123.mp4
e5f6a7b8-c9d0-1234-ef12-345678901234.webm
f6a7b8c9-d0e1-2345-f123-456789012345.mp4
```

## ✅ Avantages UUID v4

### 1. **Unicité Garantie**
- Probabilité de collision : ~1 sur 10^36
- Pas de risque de conflit de noms
- Sûr pour génération distribuée

### 2. **Traçabilité**
- `mediaId` = UUID du fichier
- Référence unique dans collections
- Facile à retrouver dans `/medias/`

### 3. **Sécurité**
- Noms imprévisibles
- Pas de séquence devineble
- Protection contre énumération

### 4. **Cohérence**
- Même système pour images ET vidéos
- Format standardisé partout
- Facile à maintenir

## 🔄 Workflow Complet

```
1. Replicate génère vidéo
   ↓
2. Backend télécharge depuis URL Replicate
   https://replicate.delivery/xxx/output.mp4
   ↓
3. Extraction extension: .mp4
   ↓
4. Génération UUID: d4e5f6a7-b8c9-0123-def1-234567890123
   ↓
5. Création nom fichier: d4e5f6a7-b8c9-0123-def1-234567890123.mp4
   ↓
6. Sauvegarde dans: /backend/medias/d4e5f6a7-b8c9-0123-def1-234567890123.mp4
   ↓
7. Extraction mediaId: d4e5f6a7-b8c9-0123-def1-234567890123
   ↓
8. Ajout collection avec:
   - url: /medias/d4e5f6a7-b8c9-0123-def1-234567890123.mp4
   - mediaId: d4e5f6a7-b8c9-0123-def1-234567890123
   - type: video
   ↓
9. Frontend affiche depuis URL locale
```

## 📝 Structure Collection

```json
{
  "id": "collection_123",
  "name": "Ma Collection",
  "images": [
    {
      "url": "/medias/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
      "mediaId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "type": "image",
      "description": "Image générée",
      "addedAt": "2025-11-05T10:00:00Z"
    },
    {
      "url": "/medias/d4e5f6a7-b8c9-0123-def1-234567890123.mp4",
      "mediaId": "d4e5f6a7-b8c9-0123-def1-234567890123",
      "type": "video",
      "description": "Vidéo T2V générée",
      "metadata": {
        "duration": "5.1s",
        "fps": 24,
        "resolution": "720p"
      },
      "addedAt": "2025-11-05T10:05:00Z"
    }
  ]
}
```

## 🧪 Test de Vérification

### Vérifier UUID dans les Fichiers

```bash
# Lister les médias
ls -la /backend/medias/

# Résultat attendu :
# -rw-r--r-- 1 user user 5242880 Nov  5 10:00 a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
# -rw-r--r-- 1 user user 8388608 Nov  5 10:05 d4e5f6a7-b8c9-0123-def1-234567890123.mp4
#                                         ↑ UUID v4 (36 caractères)
```

### Vérifier mediaId dans Collection

```bash
# Lire collection
cat /backend/collections/collection_xxx.json | jq '.images[].mediaId'

# Résultat attendu :
# "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  (image)
# "d4e5f6a7-b8c9-0123-def1-234567890123"  (vidéo)
```

## ✅ Conclusion

**Les vidéos utilisent déjà des UUID uniques** ! Aucune modification nécessaire.

Le système est **100% cohérent** :
- ✅ Images : UUID v4
- ✅ Vidéos T2V : UUID v4
- ✅ Vidéos I2V : UUID v4
- ✅ Extraction mediaId : UUID sans extension
- ✅ Collections : Référence par UUID

---

**Vérifié le** : 5 novembre 2025  
**Status** : ✅ Déjà conforme aux bonnes pratiques  
**Action** : Aucune modification nécessaire
