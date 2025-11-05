# ✅ Fix Rapide - Sélection Images Vidéo I2V

## Problème
❌ La sélection d'images ne fonctionnait pas dans "Générer Vidéo (Image)"

## Solution
✅ Ajout de `normalizeImageInput()` (copié depuis EditImageTask.js)

## Changements

### GenerateVideoI2VTask.js

**Ajouté** :
- Fonction `normalizeImageInput()` - ligne ~360
- Logique de normalisation `image1/2/3` dans `execute()` - lignes ~20-55

**Gère maintenant** :
- ✅ IDs de média avec points : `"abc123."` → `"http://localhost:9000/medias/abc123..jpg"`
- ✅ URLs complètes : `"http://..."`
- ✅ Objets avec url/buffer : `{ url: "/medias/..." }`
- ✅ Arrays : `["url1", "url2"]`
- ✅ Objets avec clés numériques : `{ "0": "url1", "1": "url2" }`

## Test

```bash
# 1. Démarrer serveurs
npm run dev

# 2. Créer workflow "Générer Vidéo I2V"
# 3. Ajouter sélection d'image (image1)
# 4. Sélectionner image depuis galerie
# 5. Générer vidéo

# ✅ Devrait fonctionner maintenant !
```

## Logs Attendus

```
🔍 Normalisation input image I2V: { type: 'string', value: 'abc123.' }
🔄 ID média converti: abc123. -> http://localhost:9000/medias/abc123..jpg
🎞️ Génération vidéo I2V { hasSourceImage: true, sourceImageType: 'string' }
✅ Vidéo I2V générée avec succès
```

---

**Date** : 5 novembre 2025  
**Fichier** : `/backend/services/tasks/GenerateVideoI2VTask.js`  
**Status** : ✅ Corrigé
