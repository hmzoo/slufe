# Configuration langue : Frontend vs Backend

## Date
3 novembre 2025

## Clarification du besoin

### Ce qui a été fait

1. **Backend** : Analyse IA en anglais par défaut (`'en'`)
2. **Frontend** : Interface en français + option "Anglais (recommandé pour vidéo)" par défaut

### Distinction importante

| Aspect                 | Langue | Fichier                      | Valeur |
|------------------------|--------|------------------------------|--------|
| **Interface utilisateur** | 🇫🇷 FR | `taskDefinitions.js`      | Labels FR |
| **Analyse IA (défaut)** | 🇬🇧 EN | `DescribeImagesTask.js`      | `default: 'en'` |
| **Option sélectionnée** | 🇬🇧 EN | `taskDefinitions.js`         | `default: 'en'` |

---

## Corrections appliquées

### 1. Backend - Analyse en anglais par défaut ✅

**Fichier** : `/backend/services/tasks/DescribeImagesTask.js`

**Ligne 223** :
```javascript
language: { 
  type: 'string', 
  required: false, 
  default: 'en', // ✅ Anglais pour meilleure qualité IA
  enum: ['fr', 'en', 'es', 'de', 'it'],
  description: 'Langue des descriptions' 
}
```

**Ligne 40** (code d'exécution) :
```javascript
const language = inputs.language || 'en'; // ✅ Anglais par défaut
```

---

### 2. Frontend - Option "Anglais (recommandé)" par défaut ✅

**Fichier** : `/frontend/src/config/taskDefinitions.js`

**AVANT (ligne 118-127)** :
```javascript
language: {
  type: 'select',
  label: 'Langue',
  required: false,
  options: [
    { label: 'Français', value: 'fr' },
    { label: 'Anglais', value: 'en' }
  ],
  default: 'fr',  // ❌ Français par défaut
  acceptsVariable: false
}
```

**APRÈS (ligne 118-127)** :
```javascript
language: {
  type: 'select',
  label: 'Langue des descriptions',
  required: false,
  options: [
    { label: 'Anglais (recommandé pour vidéo)', value: 'en' },  // ✅ Premier + recommandé
    { label: 'Français', value: 'fr' }
  ],
  default: 'en',  // ✅ Anglais par défaut
  acceptsVariable: false
}
```

**Changements** :
- ✅ `default: 'en'` (anglais par défaut)
- ✅ Ordre inversé : Anglais en premier
- ✅ Label explicatif : "Anglais (recommandé pour vidéo)"
- ✅ Label plus descriptif : "Langue des descriptions" au lieu de "Langue"

---

## Interface utilisateur

### Apparence dans le Builder

Avant :
```
┌─────────────────────────────────┐
│ Langue                          │
│ ┌─────────────────────────────┐ │
│ │ Français               ▼    │ │ ← Défaut
│ └─────────────────────────────┘ │
│   • Français                    │
│   • Anglais                     │
└─────────────────────────────────┘
```

Après :
```
┌────────────────────────────────────────────┐
│ Langue des descriptions                    │
│ ┌────────────────────────────────────────┐ │
│ │ Anglais (recommandé pour vidéo)    ▼  │ │ ← Défaut
│ └────────────────────────────────────────┘ │
│   • Anglais (recommandé pour vidéo)       │
│   • Français                               │
└────────────────────────────────────────────┘
```

### Autres textes de l'interface (restent en français)

Tous ces textes **restent en français** :
- ✅ "Analyser des images" (nom de la tâche)
- ✅ "Images à analyser" (label du champ)
- ✅ "Question (optionnel)" (label du champ)
- ✅ "Posez une question sur l'image..." (placeholder)
- ✅ Tous les messages d'erreur
- ✅ Tous les tooltips et hints

---

## Comportement complet

### Scénario 1 : Utilisateur ne change rien (recommandé) ✅

```json
{
  "type": "describe_images",
  "inputs": {
    "images": "{{input1.images}}"
    // Pas de "language" spécifié
  }
}
```

**Workflow** :
1. Frontend : Affiche "Anglais (recommandé pour vidéo)" sélectionné
2. Frontend → Backend : Envoie `language: 'en'` (valeur par défaut)
3. Backend : Reçoit `'en'`, analyse en anglais
4. Résultat : `"A woman in a dress, sitting in the water..."`

**Avantages** :
- ✅ Qualité optimale pour vidéo
- ✅ Compatibilité avec Gemini/Wan-2
- ✅ Pas de perte de qualité en traduction

---

### Scénario 2 : Utilisateur sélectionne "Français"

**Interface** :
```
┌────────────────────────────────────────────┐
│ Langue des descriptions                    │
│ ┌────────────────────────────────────────┐ │
│ │ Français                           ▼  │ │ ← Manuel
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

**Workflow** :
```json
{
  "type": "describe_images",
  "inputs": {
    "images": "{{input1.images}}",
    "language": "fr"  // ← Explicitement français
  }
}
```

**Résultat** :
```
Description: "Une femme en robe, assise dans l'eau..."
```

**Cas d'usage** :
- Documentation en français
- Rapport pour client francophone
- Analyse sans génération vidéo

---

## Workflow complet avec choix de langue

### Exemple A : Tout en anglais (optimal pour vidéo)

```json
{
  "tasks": [
    {
      "id": "input1",
      "type": "input_images",
      "label": "Upload image"
    },
    {
      "id": "describe1",
      "type": "describe_images",
      "inputs": {
        "images": "{{input1.images}}"
        // language: 'en' par défaut ✅
      }
    },
    {
      "id": "enhance1",
      "type": "enhance_prompt",
      "inputs": {
        "prompt": "She rises and steps out",
        "imageDescription1": "{{describe1.descriptions}}"
        // Reçoit description EN ✅
      }
    },
    {
      "id": "generate1",
      "type": "generate_video_i2v",
      "inputs": {
        "image": "{{input1.images}}",
        "prompt": "{{enhance1.enhanced_prompt}}"
        // Prompt EN optimal ✅
      }
    }
  ]
}
```

**Résultat** :
```
describe1: "A woman in dress, sitting in mystical water..."
enhance1: "A crowned woman, gracefully seated in mystical green water, slowly rises..."
generate1: [VIDEO] ← Prompt EN optimal
```

---

### Exemple B : Description française, puis traduction

```json
{
  "tasks": [
    {
      "id": "input1",
      "type": "input_images",
      "label": "Upload image"
    },
    {
      "id": "describe1",
      "type": "describe_images",
      "inputs": {
        "images": "{{input1.images}}",
        "language": "fr"  // ← Français explicite
      }
    },
    {
      "id": "enhance1",
      "type": "enhance_prompt",
      "inputs": {
        "prompt": "Elle se lève et sort de l'eau",
        "imageDescription1": "{{describe1.descriptions}}"
        // Reçoit description FR
        // Gemini traduira en EN automatiquement
      }
    },
    {
      "id": "generate1",
      "type": "generate_video_i2v",
      "inputs": {
        "image": "{{input1.images}}",
        "prompt": "{{enhance1.enhanced_prompt}}"
      }
    }
  ]
}
```

**Résultat** :
```
describe1: "Une femme en robe, assise dans l'eau mystique..."
enhance1: "A crowned woman, gracefully seated..." ← Gemini traduit
generate1: [VIDEO] ← Prompt EN correct mais légère perte qualité
```

---

## Recommandations utilisateur

### Interface du Builder - Message d'aide

Ajouter un tooltip sur le champ "Langue des descriptions" :

```
ℹ️ Anglais recommandé :
   • Meilleure qualité pour génération vidéo
   • Compatible avec tous les modèles IA
   • Pas de perte en traduction
   
   Choisir Français si :
   • Rapport/documentation en français
   • Pas de génération vidéo prévue
```

### Documentation utilisateur

**Quand utiliser l'anglais (défaut)** :
- ✅ Workflow avec génération vidéo
- ✅ Workflow avec édition d'image
- ✅ Amélioration de prompts complexes
- ✅ Pipeline multi-modèles

**Quand utiliser le français** :
- ✅ Rapport final en français
- ✅ Description pour client francophone
- ✅ Analyse simple sans génération
- ✅ Documentation interne

---

## Tests de validation

### Test 1 : Nouveau workflow (défaut anglais)

**Actions** :
1. Créer nouveau workflow Builder
2. Ajouter tâche "Analyser des images"
3. Ne pas modifier la langue
4. Exécuter

**Résultat attendu** :
- ✅ Frontend : "Anglais (recommandé)" sélectionné
- ✅ Backend : Analyse en anglais
- ✅ Output : `"A woman in a dress..."`

---

### Test 2 : Forcer français

**Actions** :
1. Créer workflow
2. Ajouter tâche "Analyser des images"
3. Changer langue → "Français"
4. Exécuter

**Résultat attendu** :
- ✅ Frontend : "Français" sélectionné
- ✅ Backend : Analyse en français
- ✅ Output : `"Une femme en robe..."`

---

### Test 3 : Workflow vidéo complet

**Actions** :
1. Upload image
2. Analyser (langue par défaut)
3. Améliorer prompt
4. Générer vidéo

**Résultat attendu** :
```
✅ Description EN : "A woman in dress..."
✅ Prompt amélioré EN : "A crowned woman, gracefully..."
✅ Vidéo générée : Qualité optimale
```

---

## Cohérence Frontend ↔ Backend

| Configuration         | Frontend         | Backend          | Status |
|-----------------------|------------------|------------------|--------|
| Langue par défaut     | `'en'`           | `'en'`           | ✅     |
| Options disponibles   | `['en', 'fr']`   | `['en', 'fr', ...]` | ✅  |
| Label recommandé      | "(recommandé)"   | N/A              | ✅     |
| Interface textes      | Français         | N/A              | ✅     |

**Résultat** : Cohérence parfaite ✅

---

## Résumé des fichiers modifiés

### Backend
**`/backend/services/tasks/DescribeImagesTask.js`**
- Ligne 40 : `language = 'en'` (code)
- Ligne 223 : `default: 'en'` (schéma)

### Frontend
**`/frontend/src/config/taskDefinitions.js`**
- Ligne 123 : `default: 'en'` (anglais par défaut)
- Ligne 120 : "Anglais (recommandé pour vidéo)" en premier
- Ligne 119 : Label "Langue des descriptions"

---

## Migration workflows existants

### Impact sur workflows existants

| Type de workflow                | Impact          | Action requise |
|---------------------------------|-----------------|----------------|
| Sans `language` spécifié        | ✅ EN au lieu FR | Aucune (amélioration) |
| Avec `language: 'fr'`           | ✅ Reste FR      | Aucune         |
| Avec `language: 'en'`           | ✅ Reste EN      | Aucune         |

**Conclusion** : Pas de breaking change, amélioration automatique

---

## Auteur

Copilot AI Assistant

## Validation

✅ Frontend en français (interface)
✅ Backend en anglais (IA, défaut)
✅ Option pour forcer français
✅ Label explicatif "(recommandé pour vidéo)"
✅ Cohérence totale
