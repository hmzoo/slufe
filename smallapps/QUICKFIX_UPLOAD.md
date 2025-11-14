# ⚡ Quick Fix : Upload Response

## Problème
```
✅ Image uploadée: image1 → undefined  ❌
```

## Cause
```javascript
// AVANT - NE FONCTIONNE PAS
imageUrls[key] = uploadResponse.data.filename  // filename n'existe pas !
```

## Solution
```javascript
// APRÈS - EXTRACTION CORRECTE
let imageUrl = null
if (uploadResponse.data.success) {
  // Type 'single'
  if (uploadResponse.data.type === 'single') {
    imageUrl = uploadResponse.data.media.url
  }
  // Type 'fields' (notre cas avec champ 'image')
  else if (uploadResponse.data.type === 'fields') {
    imageUrl = uploadResponse.data.results.image.uploaded[0].url
  }
}
imageUrls[key] = imageUrl
```

## Structure API Response
```json
{
  "success": true,
  "type": "fields",
  "results": {
    "image": {
      "uploaded": [
        { "url": "/medias/xxx.jpg" }  ← ICI !
      ]
    }
  }
}
```

## Test
1. Rafraîchir : **Ctrl + F5**
2. Upload image + texte
3. Exécuter
4. Vérifier logs :
```
✅ Image uploadée: image1 → /medias/xxx.jpg  ✅
```

**Prêt ! 🚀**
