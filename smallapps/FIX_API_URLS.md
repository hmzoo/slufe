# 🔧 Fix URLs API - SmallApp

## ✅ Correction Appliquée

### Problème
Les URLs de l'API étaient incorrectes :
- ❌ `/medias/upload` (404 Not Found)
- ❌ `/workflows/run` (404 Not Found)

### Solution
URLs corrigées vers les endpoints du backend :
- ✅ `/api/media/upload`
- ✅ `/api/workflow/run`

---

## 📋 Endpoints Backend Slufe

### Upload d'Images
```
POST /api/media/upload
Content-Type: multipart/form-data

Body:
- image: File
```

**Réponse :**
```json
{
  "filename": "/medias/xxx.jpg",
  "path": "absolute/path/to/file"
}
```

---

### Exécution Workflow
```
POST /api/workflow/run
Content-Type: multipart/form-data

Body:
- workflow: JSON string
- input1: value1
- input2: value2
- ...
```

**Réponse :**
```json
{
  "outputs": [
    {
      "id": "output1",
      "type": "image_output",
      "result": "/medias/result.jpg"
    }
  ],
  "executionTime": 1234
}
```

---

## 🔍 Routes Disponibles

### Media
- `POST /api/media/upload` - Upload image
- `GET /medias/:filename` - Récupérer image

### Workflow
- `POST /api/workflow/run` - Exécuter workflow
- `GET /api/workflow/list` - Liste workflows

### Templates
- `GET /api/templates` - Liste templates
- `GET /api/templates/:id` - Template par ID
- `POST /api/templates` - Créer template

---

## 🧪 Test avec curl

### Upload Image
```bash
curl -X POST https://192.168.24.210/api/media/upload \
  -F "image=@photo.jpg"
```

### Execute Workflow
```bash
curl -X POST https://192.168.24.210/api/workflow/run \
  -F "workflow={\"inputs\":[]}" \
  -F "text1=Hello"
```

---

## 📝 Changements dans app.js

### Ligne 614 - Upload
```javascript
// Avant
const uploadResponse = await axios.post(`${CONFIG.apiBaseUrl}/medias/upload`, imageFormData)

// Après
const uploadResponse = await axios.post(`${CONFIG.apiBaseUrl}/api/media/upload`, imageFormData)
```

### Ligne 625 - Workflow
```javascript
// Avant
const response = await axios.post(`${CONFIG.apiBaseUrl}/workflows/run`, formData, {...})

// Après
const response = await axios.post(`${CONFIG.apiBaseUrl}/api/workflow/run`, formData, {...})
```

---

## ✅ Vérification

Pour tester que ça fonctionne :

1. **Ouvrir SmallApp :**
   ```
   https://192.168.24.210/smallapps/
   ```

2. **Remplir le formulaire :**
   - Ajouter une image
   - Remplir le texte

3. **Cliquer "Exécuter"**

4. **Vérifier dans la console :**
   ```javascript
   ✅ Image uploadée: /medias/xxx.jpg
   ✅ Workflow exécuté
   ✅ Résultat: {...}
   ```

---

## 🐛 Debug

Si erreur 404 persiste :

```javascript
// Dans la console navigateur
console.log('API Base URL:', CONFIG.apiBaseUrl)
// Doit afficher : https://192.168.24.210

console.log('Upload URL:', `${CONFIG.apiBaseUrl}/api/media/upload`)
// Doit afficher : https://192.168.24.210/api/media/upload
```

---

**Date :** 14 novembre 2025  
**Status :** ✅ Corrigé
