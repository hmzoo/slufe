# ⚡ Fix Rapide : [object Object]

## Problème
```
[object Object]  ❌
```

## Cause
Backend renvoie un objet au lieu d'un array :
```javascript
results: {
  "0": { "0": "/medias/xxx.jpg" }  // Objet pseudo-array
}
```

## Solution
```javascript
// 1. Détecter objet pseudo-array
if (typeof value === 'object' && !Array.isArray(value)) {
  const values = Object.values(value)
  if (values.every(v => v.startsWith('/medias/'))) {
    type = 'image_output'  // ✅
  }
}

// 2. Convertir objet → array
let images = []
if (typeof output.result === 'object') {
  images = Object.values(output.result)  // ✅
}

// 3. Afficher
images.forEach(path => {
  // path est maintenant une string !
})
```

## Test
1. **Ctrl + F5**
2. Exécuter workflow
3. ✅ **Images affichées** au lieu de [object Object]

**C'est bon ! 🎉**
