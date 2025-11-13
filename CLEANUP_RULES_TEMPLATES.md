# 📋 Règles de Nettoyage des Templates

## 🎯 Principe Fondamental

Quand un template est généré depuis un workflow, il doit:
- **✅ CONSERVER** tous les paramètres de CONFIGURATION
- **❌ NETTOYER** toutes les DONNÉES UTILISATEUR

---

## 📊 Tableau Récapitulatif

### Inputs du Workflow

| Champ | Type | Status | Raison |
|-------|------|--------|--------|
| `id` | Config | ✅ CONSERVER | Identifie l'input |
| `type` | Config | ✅ CONSERVER | Type d'input (image_input, text_input, etc.) |
| `label` | Config | ✅ CONSERVER | Libellé affiché à l'utilisateur |
| `placeholder` | Config | ✅ CONSERVER | Texte d'aide |
| `description` | Config | ✅ CONSERVER | Description détaillée |
| `required` | Config | ✅ CONSERVER | Si champ obligatoire |
| `multiple` | Config | ✅ CONSERVER | Si multi-sélection |
| `maxFiles` | Config | ✅ CONSERVER | Nombre max de fichiers |
| `min`, `max` | Config | ✅ CONSERVER | Limites numériques |
| `defaultValue` | Config | ✅ CONSERVER | ⭐ Valeur par défaut du texte |
| `defaultImage` | Config | ✅ CONSERVER | ⭐ Image par défaut |
| `multiline` | Config | ✅ CONSERVER | Si textarea |
| `rows` | Config | ✅ CONSERVER | Hauteur textarea |
| `aspectRatio` | Config | ✅ CONSERVER | Ratio d'aspect image |
| `userInput` | Données | ❌ NETTOYER | Texte saisi par utilisateur → `''` |
| `selectedImage` | Données | ❌ NETTOYER | Image sélectionnée → `''` |
| `image` | Données | ❌ NETTOYER | Chemin image uploadée → `''` |
| `uploadedImages` | Données | ❌ NETTOYER | List d'images → `[]` |

### Tasks du Workflow

| Champ | Type | Status | Raison |
|-------|------|--------|--------|
| `id` | Config | ✅ CONSERVER | Identifie la tâche |
| `type` | Config | ✅ CONSERVER | Type de tâche |
| `inputs.*` (avec `{{}}`) | Config | ✅ CONSERVER | Références de variables |
| `inputs.*` (sans `{{}}`) | Données | ❌ NETTOYER | Valeurs littérales → `''` ou `[]` |
| `userInputValue` | Données | ❌ NETTOYER | Supprimer |
| `executionTime` | Données | ❌ NETTOYER | Supprimer |
| `executionResult` | Données | ❌ NETTOYER | Supprimer |
| `executionError` | Données | ❌ NETTOYER | Supprimer |

### Outputs du Workflow

| Champ | Type | Status | Raison |
|-------|------|--------|--------|
| `id` | Config | ✅ CONSERVER | Identifie l'output |
| `type` | Config | ✅ CONSERVER | Type d'output |
| `label` | Config | ✅ CONSERVER | Libellé |
| `sourceTaskId` | Config | ✅ CONSERVER | Tâche source |
| `inputs.*` (avec `{{}}`) | Config | ✅ CONSERVER | Références de variables |
| `inputs.*` (sans `{{}}`) | Données | ❌ NETTOYER | Valeurs littérales → `''` |

---

## 🔍 Exemples Concrets

### Exemple 1: Input Image

#### ❌ AVANT (Données Sales)
```javascript
{
  id: "image1",
  type: "image_input",
  label: "Image à éditer",
  defaultImage: "",           // ✅ CONFIGURATION
  selectedImage: "/medias/7dab6612-201a-437c-a8ec-962e160858a7.jpg",  // ❌ DONNÉES
  image: "/medias/2b34a259-cd06-4224-beb2-e299db73e6c2.png",          // ❌ DONNÉES
  maxFiles: 5,                // ✅ CONFIGURATION
  required: true              // ✅ CONFIGURATION
}
```

#### ✅ APRÈS (Nettoyé)
```javascript
{
  id: "image1",
  type: "image_input",
  label: "Image à éditer",
  defaultImage: "",           // ✅ CONSERVÉ
  selectedImage: "",          // ❌ VIDÉ (était données)
  image: "",                  // ❌ VIDÉ (était données)
  maxFiles: 5,                // ✅ CONSERVÉ
  required: true              // ✅ CONSERVÉ
}
```

### Exemple 2: Input Texte

#### ❌ AVANT (Données Sales)
```javascript
{
  id: "text1",
  type: "text_input",
  label: "edition",
  placeholder: "",            // ✅ CONFIGURATION
  defaultValue: "",           // ✅ CONFIGURATION
  multiline: false,           // ✅ CONFIGURATION
  required: true,             // ✅ CONFIGURATION
  userInput: "turn 90 degres right"  // ❌ DONNÉES
}
```

#### ✅ APRÈS (Nettoyé)
```javascript
{
  id: "text1",
  type: "text_input",
  label: "edition",
  placeholder: "",            // ✅ CONSERVÉ
  defaultValue: "",           // ✅ CONSERVÉ
  multiline: false,           // ✅ CONSERVÉ
  required: true,             // ✅ CONSERVÉ
  userInput: ""               // ❌ VIDÉ (était données)
}
```

### Exemple 3: Task avec Références

#### ❌ AVANT
```javascript
{
  id: "edit1",
  type: "edit_image",
  inputs: {
    image1: "{{image1.image}}",     // ✅ Référence → CONSERVER
    editPrompt: "{{text1.text}}",   // ✅ Référence → CONSERVER
    aspectRatio: "original"          // ❌ Valeur littérale → VIDER
  }
}
```

#### ✅ APRÈS
```javascript
{
  id: "edit1",
  type: "edit_image",
  inputs: {
    image1: "{{image1.image}}",     // ✅ CONSERVÉ
    editPrompt: "{{text1.text}}",   // ✅ CONSERVÉ
    aspectRatio: ""                  // ❌ VIDÉ
  }
}
```

---

## 🎯 Cas Spéciaux

### Variables {{ }} - Toujours Conserver!
```javascript
editPrompt: "{{text1.text}}"      // ✅ CONSERVER ABSOLUMENT
image: "{{edit1.edited_images}}"  // ✅ CONSERVER ABSOLUMENT
```

### defaultValue - Configuration Importante!
```javascript
defaultValue: "Mon texte par défaut"  // ✅ CONSERVER
// Permet au template de proposer une valeur par défaut à l'utilisateur
```

### defaultImage - Configuration Importante!
```javascript
defaultImage: "/images/placeholder.jpg"  // ✅ CONSERVER
// Permet au template de proposer une image par défaut
```

---

## 🧹 Algorithme de Nettoyage

```
POUR CHAQUE input dans workflow.inputs:
  POUR CHAQUE propriété de input:
    SI propriété IN configFields:
      CONSERVER
    SINON SI propriété == 'userInput':
      VIDER (transformer en '')
    SINON SI propriété == 'selectedImage' OR 'image':
      VIDER (transformer en '')
    SINON SI propriété == 'uploadedImages':
      VIDER (transformer en [])
    SINON SI type = string:
      VIDER (transformer en '')
    SINON SI type = array:
      VIDER (transformer en [])
    SINON:
      SUPPRIMER

POUR CHAQUE task dans workflow.tasks:
  POUR CHAQUE input de task.inputs:
    SI value CONTIENT '{{':
      CONSERVER
    SINON SI type = string:
      VIDER (transformer en '')
```

---

## ✅ Résumé des Conservations Obligatoires

Toujours conserver:
- ✅ `defaultValue` - Valeur par défaut du texte
- ✅ `defaultImage` - Image par défaut
- ✅ `placeholder` - Texte d'aide
- ✅ `label` - Libellé affiché
- ✅ Tous les `{{}}` - Références de variables
- ✅ `type` - Type de champ/tâche
- ✅ `required`, `multiple`, etc. - Configuration booléenne

À toujours nettoyer:
- ❌ `userInput` - Texte saisi
- ❌ `selectedImage` - Chemin uploadé
- ❌ `image` - Chemin de fichier
- ❌ `uploadedImages` - Liste de fichiers
- ❌ `executionTime`, `executionResult` - Métadonnées d'exécution

---

**Version**: 2.0  
**Date**: 2025-11-13  
**Status**: ✅ Mis à jour

