# 🛠️ Fix MediaSelector - Erreur de Type Props

## 🐛 Problème identifié
```
TypeError: props.accept.map is not a function
```

## 🔍 Cause racine
Le composant `MediaSelector` attend la prop `accept` comme **Array** mais on lui passait un **String**.

### ❌ Code incorrect
```vue
<MediaSelector
  accept="image/*"          <!-- String - ERREUR -->
  ...
/>
```

### ✅ Code corrigé  
```vue
<MediaSelector
  :accept="['image']"       <!-- Array - CORRECT -->
  ...
/>
```

## 📋 Définition des props dans MediaSelector.vue
```javascript
accept: {
  type: Array,              // 🎯 Attend un Array
  default: () => ['image', 'video']
}
```

## 🧪 Test de validation
1. ✅ Ajouter tâche "Upload d'images" 
2. ✅ Le MediaSelector s'affiche sans erreur
3. ✅ Cliquer sur l'icône galerie ouvre la sélection
4. ✅ Sélectionner des images fonctionne

## 🚀 Statut
**RÉSOLU** - Le composant fonctionne maintenant correctement avec `accept` en format Array.