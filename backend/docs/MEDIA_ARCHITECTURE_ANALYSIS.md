# 📡 Exposition et Récupération des Médias dans SLUFE

## Vue d'ensemble

Le système de médias SLUFE utilise une **architecture hybride** combinant stockage physique et exposition HTTP statique pour optimiser performance et simplicité.

---

## 🏗️ **Architecture Backend - Exposition des Médias**

### **1. Stockage Physique**
```
📁 /backend/medias/
├── f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg
├── 550e8400-e29b-41d4-a716-446655440000.mp4
└── 6ba7b810-9dad-11d1-80b4-00c04fd430c8.webp
```

### **2. Exposition HTTP Statique** (server.js:75)
```javascript
// Servir les fichiers médias (images, vidéos)
const mediasPath = path.join(__dirname, 'medias');
app.use('/medias', express.static(mediasPath));
```

### **3. URLs d'Accès Générées**
```
📡 Exposition publique:
http://localhost:3000/medias/f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg
http://localhost:3000/medias/550e8400-e29b-41d4-a716-446655440000.mp4
```

---

## 🔧 **Génération et Sauvegarde Backend**

### **1. Génération de Noms Uniques** (fileUtils.js)
```javascript
import { v4 as uuidv4 } from 'uuid';

export function generateUniqueFileName(originalExtension) {
  const ext = originalExtension.startsWith('.') ? originalExtension : `.${originalExtension}`;
  return `${uuidv4()}${ext}`;
}
```

### **2. Sauvegarde Fichier** (fileUtils.js:87-107)
```javascript
export function saveMediaFile(filename, buffer) {
  const filePath = getMediaFilePath(filename);
  
  // Créer dossier si nécessaire
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }
  
  // Écrire le fichier physiquement
  fs.writeFileSync(filePath, buffer);
  
  // Retourner métadonnées + URL d'accès
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? `${protocol}://${host}` 
    : `${protocol}://${host}:${port}`;
    
  return {
    filename: filename,
    filePath: filePath,
    url: `${baseUrl}/medias/${filename}` // URL COMPLÈTE
  };
}
```

### **3. Usage dans les Services IA**

#### **Génération d'Images** (imageGenerator.js:128-138)
```javascript
const filename = generateUniqueFileName(extension);
const savedFile = saveMediaFile(filename, buffer);

return {
  success: true,
  url: `/medias/${filename}`, // URL RELATIVE
  filename: filename,
  fileSize: buffer.length
};
```

#### **Workflows Tasks** (EditImageTask.js:160-165)
```javascript
const uniqueFileName = generateUniqueFileName(extension);
const savedPath = saveMediaFile(uniqueFileName, buffer);

processedImages.push({
  url: `/medias/${uniqueFileName}`,
  filename: uniqueFileName,
  size: buffer.length
});
```

---

## 🌐 **Récupération Frontend**

### **1. Via Collections API**

#### **Récupération Galerie** (CollectionMediaSelector.vue:288)
```javascript
const response = await api.get('/api/collections/current/gallery')

// Réponse backend:
{
  "success": true,
  "images": [
    {
      "url": "/medias/f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg",
      "description": "Image générée",
      "addedAt": "2025-11-13T10:30:00.000Z"
    }
  ]
}
```

#### **Utilisation directe URLs**
```javascript
// Dans les templates Vue
<img :src="media.url" />  // src="/medias/abc123.jpg"

// Construction URL complète si nécessaire
let fullUrl = media.url
if (media.url.startsWith('/')) {
  fullUrl = window.location.origin + media.url
  // Résultat: "http://localhost:9000/medias/abc123.jpg"
}
```

### **2. Via Upload API**

#### **Récupération Métadonnées** (uploadMedia.js:93)
```javascript
const response = await api.get(`/upload/media/${id}`)

// Réponse backend:
{
  "success": true,
  "media": {
    "id": "media_123",
    "filename": "f47ac10b-58cc.jpg",
    "url": "/medias/f47ac10b-58cc.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000
  }
}
```

---

## 🔄 **Flux de Données Complet**

### **Scénario 1: Upload Utilisateur**
```
1. Frontend: Upload fichier → POST /api/upload/single
2. Backend: 
   - Génère nom unique: generateUniqueFileName('.jpg')
   - Sauve physiquement: saveMediaFile('uuid.jpg', buffer)  
   - Stocke dans /backend/medias/uuid.jpg
3. Backend Response: { url: "/medias/uuid.jpg" }
4. Frontend: Affiche via <img :src="/medias/uuid.jpg" />
5. Navigateur: Récupère http://localhost:3000/medias/uuid.jpg
```

### **Scénario 2: Génération IA**
```
1. Frontend: Exécute workflow → POST /api/workflow/run
2. Backend:
   - Task généré une image (buffer)
   - saveMediaFile() → /backend/medias/uuid.jpg
   - Retourne { url: "/medias/uuid.jpg" }
3. Frontend: Récupère résultat + affiche image générée
4. Navigateur: Charge directement depuis /medias/
```

### **Scénario 3: Navigation Collections**
```
1. Frontend: Charge galerie → GET /api/collections/current/gallery  
2. Backend: Retourne liste d'URLs { images: [{ url: "/medias/..." }] }
3. Frontend: Affiche grille d'images
4. Navigateur: Charge chaque image via express.static
```

---

## ⚡ **Optimisations Performance**

### **1. Express.static Middleware**
- **Cache HTTP natif** - Headers de cache automatiques
- **Compression automatique** - Gzip/Brotli si activé
- **Range requests** - Support du streaming vidéo
- **ETags** - Validation cache client

### **2. URLs Relatives**
- **Portabilité** - Fonctionne en dev (localhost:9000) et prod
- **Proxy transparent** - Quasar dev server redirige vers backend
- **Pas de CORS** - Même origine apparente

### **3. Stockage Direct**
- **Pas de base64** - Fichiers binaires optimaux
- **Pas de DB blob** - Accès fichier direct ultra-rapide
- **Backup simple** - Dossier /medias/ copiable

---

## 🔧 **Configuration Développement**

### **Frontend Dev Server** (Quasar)
```javascript
// quasar.config.js - Proxy automatique
devServer: {
  proxy: {
    '/api': 'http://localhost:3000',
    '/medias': 'http://localhost:3000',  // PROXY MÉDIAS
    '/workflows': 'http://localhost:3000'
  }
}
```

### **URLs Effectives en Dev**
```
Frontend: http://localhost:9000/medias/uuid.jpg
  ↓ (proxy)
Backend:  http://localhost:3000/medias/uuid.jpg
  ↓ (express.static)  
Fichier:  /backend/medias/uuid.jpg
```

---

## 📊 **Avantages Architecture Actuelle**

### **✅ Simplicité**
- **Configuration minimale** - 1 ligne express.static
- **Pas de middleware complexe** - Pas de auth/streaming custom
- **URLs prévisibles** - Pattern simple /medias/{filename}

### **✅ Performance** 
- **Accès direct fichier** - Pas de proxy applicatif
- **Cache navigateur** - Headers HTTP standards
- **Streaming natif** - Support vidéo intégré

### **✅ Portabilité**
- **URLs relatives** - Fonctionne partout
- **Fichiers séparés** - Backup/migration facile  
- **Pas de DB dépendance** - Stockage autonome

### **✅ Sécurité Base**
- **Noms uniques** - Pas de collision/guess
- **Extension validation** - Types MIME contrôlés
- **Pas d'exécution** - Seulement du statique

---

## ⚠️ **Limitations Actuelles**

### **🔐 Pas d'Authentification**
- **Accès public** - Tous les médias accessibles via URL
- **Pas de permissions** - Pas de contrôle utilisateur
- **URLs prévisibles** - UUID guess possible (très difficile)

### **📝 Pas de Métadonnées Avancées**  
- **Pas d'EXIF** - Pas d'info technique image
- **Pas de thumbnails** - Pas de miniatures auto
- **Pas de transformation** - Pas de resize à la volée

### **🗑️ Pas de Garbage Collection**
- **Fichiers orphelins** - Médias non référencés
- **Croissance continue** - Pas de nettoyage auto
- **Gestion manuelle** - Suppression collection ≠ fichiers

---

## 🚀 **Améliorations Possibles**

### **Court Terme**
1. **Middleware auth** sur /medias/ si nécessaire
2. **Cleanup task** pour fichiers orphelins  
3. **Validation MIME** plus stricte

### **Long Terme**  
1. **Service thumbnails** automatiques
2. **CDN integration** pour production
3. **Storage abstraction** (S3/local/etc)

---

## 📋 **Résumé Architecture**

| Composant | Rôle | Technologie |
|-----------|------|-------------|
| **Backend Storage** | Stockage physique | Filesystem (/medias/) |
| **Backend Exposition** | Serveur HTTP | Express.static |
| **Backend APIs** | Métadonnées/CRUD | REST endpoints |
| **Frontend Access** | Consommation | URLs relatives + proxy |
| **Génération** | Création médias | UUID + Buffer → Fichier |

**Architecture actuelle = Simple, Performante, Évolutive** ✅