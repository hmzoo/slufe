# 🔧 Fix : Bouton supprimer (🗑️) invisible

## 📅 Date: 14 novembre 2025

## 🎯 Problème
Le bouton de suppression (icône poubelle 🗑️) est invisible après avoir uploadé une image. Il est caché/coupé par l'image elle-même.

## 🐛 Cause

### Structure HTML
```html
<div class="image-preview">  <!-- Container -->
  <img src="...">            <!-- Image -->
  <div class="image-actions"><!-- Actions avec bouton 🗑️ -->
    <span class="filename">...</span>
    <button onclick="removeImage()">
      <i class="material-icons">delete</i>
    </button>
  </div>
</div>
```

### CSS problématique (avant)
```css
.image-preview {
  max-height: 720px;   /* ❌ Limite la hauteur totale */
  overflow: hidden;    /* ❌ Cache ce qui dépasse */
}

.image-preview img {
  max-height: 720px;   /* Image peut faire 720px */
}
```

**Résultat :** Si l'image fait 720px de haut, le `.image-actions` (en dessous) dépasse et est caché par `overflow: hidden` !

## ✅ Solution

Retirer `max-height` et `overflow: hidden` du container, les appliquer seulement à l'image :

```css
.image-preview {
  position: relative;
  border-radius: 8px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  max-width: 720px;           /* ✅ Seulement max-width */
  margin: 0 auto;
  display: flex;              /* ✨ NOUVEAU - Flex layout */
  flex-direction: column;     /* ✨ NOUVEAU - Colonne verticale */
}

.image-preview img {
  width: 100%;
  max-width: 720px;
  max-height: 720px;          /* ✅ Limite seulement l'image */
  object-fit: contain;
  display: block;
  border-radius: 8px 8px 0 0; /* ✨ NOUVEAU - Coins arrondis haut */
}
```

## 🎨 Améliorations

### 1. **Flexbox layout**
```css
display: flex;
flex-direction: column;
```
- ✅ Image et actions empilées verticalement
- ✅ Hauteur automatique (pas de limitation)
- ✅ Actions toujours visibles en dessous

### 2. **Border-radius intelligent**
```css
border-radius: 8px 8px 0 0;  /* Coins arrondis seulement en haut */
```
- ✅ Image arrondie en haut
- ✅ Actions carrées en bas (continuité visuelle)

### 3. **Pas d'overflow: hidden**
- ✅ Les actions ne sont jamais coupées
- ✅ Tout le contenu visible

## 📊 Comportement

| Hauteur image | Avant | Après |
|---------------|-------|-------|
| 400px | ✅ Visible | ✅ Visible |
| 720px | ❌ Caché | ✅ Visible |
| Portrait | ❌ Caché | ✅ Visible |

## 🧪 Test

1. **Rafraîchir** avec Ctrl+F5
2. **Upload une image portrait** (ex: 9:16, 1080×1920)
3. **Vérifier** que l'image fait ~720px de haut
4. **Vérifier** que le bouton 🗑️ est visible en dessous
5. **Cliquer** sur 🗑️ → doit fonctionner !

## 📸 Structure visuelle finale

```
┌─────────────────────────┐
│  .image-preview         │
│  ┌───────────────────┐  │
│  │                   │  │
│  │   Image (720px)   │  │ ← Border-radius haut
│  │                   │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ filename      🗑️  │  │ ← .image-actions TOUJOURS visible
│  └───────────────────┘  │
└─────────────────────────┘
```

## ✅ Résultat

Le bouton de suppression 🗑️ est maintenant **toujours visible**, quelle que soit la taille de l'image !

---

**Fichier modifié :** `smallapps/index.html` (lignes ~117-135)
