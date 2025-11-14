# 🔧 Fix Résultats Dupliqués

## ❌ Problème

Les résultats s'affichent plusieurs fois (images dupliquées).

---

## 🔍 Causes Possibles

### Cause 1 : Outputs Dupliqués

Le backend renvoie plusieurs fois le même output :

```javascript
results: {
  "0": { id: "image2", type: "image_output", result: {...} },
  "image2": { id: "image2", type: "image_output", result: {...} }
  // ↑ Même ID = doublon !
}
```

### Cause 2 : Plusieurs Images dans un Output

Un output contient plusieurs images (comportement normal) :

```javascript
output.result = {
  "0": "/medias/image1.jpg",
  "1": "/medias/image2.jpg",
  "2": "/medias/image3.jpg"
}
// 3 images affichées = normal !
```

---

## ✅ Solution

### Déduplication par ID

```javascript
const uniqueOutputs = []
const seenIds = new Set()

outputs.forEach(output => {
  if (!seenIds.has(output.id)) {
    uniqueOutputs.push(output)      // ✅ Premier avec cet ID
    seenIds.add(output.id)
  } else {
    console.log('⚠️ Output dupliqué ignoré:', output.id)  // ❌ Déjà vu
  }
})

// Utiliser uniqueOutputs au lieu de outputs
uniqueOutputs.forEach(output => {
  // Afficher...
})
```

---

## 🧪 Logs de Debug

### Avant Déduplication

```javascript
📊 Nombre d'outputs à afficher: 3
  outputs finaux: [
    { id: "0", type: "image_output", result: {...} },
    { id: "image2", type: "image_output", result: {...} },
    { id: "image2", type: "image_output", result: {...} }  // ← Doublon !
  ]
```

### Après Déduplication

```javascript
⚠️ Output dupliqué ignoré: image2
📊 Nombre d'outputs uniques: 2
  📌 Affichage output #1/2: { id: "0", ... }
  📌 Affichage output #2/2: { id: "image2", ... }
```

### Images Multiples (Normal)

```javascript
📌 Affichage output #1/1: { id: "image2", type: "image_output", ... }
  Images à afficher: ["/medias/a.jpg", "/medias/b.jpg", "/medias/c.jpg"]
  📷 Nombre d'images dans ce output: 3
    → Image 1/3: /medias/a.jpg
    → Image 2/3: /medias/b.jpg
    → Image 3/3: /medias/c.jpg
```

**C'est normal si le workflow produit plusieurs images !**

---

## 📊 Différence : Doublons vs Multiple Images

### Doublons (Bug) ❌

```
[Image A]  ← Output 1
[Image A]  ← Output 2 (même ID)
[Image A]  ← Output 3 (même ID)
```

**Solution :** Déduplication par ID

### Images Multiples (Normal) ✅

```
[Image A]  ← Image 1 dans Output 1
[Image B]  ← Image 2 dans Output 1
[Image C]  ← Image 3 dans Output 1
```

**Aucune action nécessaire**

---

## 🎯 Quand Utiliser la Déduplication

### ✅ Utiliser si :
- Les mêmes images apparaissent plusieurs fois
- Les logs montrent `⚠️ Output dupliqué ignoré`
- Le backend renvoie des IDs en double

### ❌ Ne PAS utiliser si :
- Le workflow produit naturellement plusieurs images
- Chaque image est différente
- Les IDs sont tous uniques

---

## 🔧 Désactiver la Déduplication

Si tu veux afficher **tous** les outputs même avec IDs dupliqués :

```javascript
// Commenter la déduplication
// const uniqueOutputs = ...
// Utiliser directement outputs
outputs.forEach(output => {
  // Afficher...
})
```

---

## 📝 Fichier Modifié

- **`smallapps/app.js`** lignes 790-805
  - Ajout déduplication par ID
  - Logs compteurs
  - Détection doublons

---

**Date :** 14 novembre 2025  
**Status :** ✅ Corrigé  
**Type :** Bug affichage - outputs dupliqués
