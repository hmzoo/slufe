# 🔧 QUICKFIX : Remplacement d'images SmallApp

## ⚡ Problème
Impossible de supprimer et remplacer une image uploadée.

## 🐛 Cause
Conflit d'ID : `createImageInput()` crée un container avec l'ID `image-container-{id}`, et on essayait d'ajouter ce container dans lui-même !

## ✅ Solution finale (v2)

**Fichier :** `smallapps/app.js` (~ligne 370)

```javascript
window.removeImage = function(inputId) {
  console.log('🗑️ Suppression image:', inputId)
  
  delete state.formInputs[inputId]
  
  const config = state.template.workflow.inputs.find(i => i.id === inputId)
  if (!config) return
  
  const container = document.getElementById(`image-container-${inputId}`)
  if (!container) return
  
  container.innerHTML = ''
  
  const newInputElement = createImageInput(config)
  
  // ✨ ASTUCE : Copier les enfants, pas le container !
  while (newInputElement.firstChild) {
    container.appendChild(newInputElement.firstChild)
  }
  
  console.log('✅ Input recréé pour:', inputId)
  updateExecuteButtonState()
}
```

## 🎯 Ce qui a changé

### ❌ Avant (ne fonctionnait pas)
```javascript
const newInputElement = createImageInput(config)
container.appendChild(newInputElement)  // ❌ Conflit d'ID !
```

### ✅ Après (fonctionne !)
```javascript
const newInputElement = createImageInput(config)
// Copier les enfants un par un
while (newInputElement.firstChild) {
  container.appendChild(newInputElement.firstChild)
}
```

## 🧪 Test rapide

1. **Ctrl+F5** pour rafraîchir
2. Upload une image → Aperçu avec 🗑️
3. Clic sur 🗑️ → Zone upload réapparaît
4. Upload nouvelle image → Fonctionne !

## 📝 Logs console

```
🗑️ Suppression image: image1
✅ Input recréé pour: image1
```

---

**Résultat : Tu peux maintenant changer les images autant de fois que tu veux !** 🎉
