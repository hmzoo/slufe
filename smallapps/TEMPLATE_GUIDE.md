# 🎨 Guide de Création de Templates pour SmallApp

Ce guide vous explique comment créer vos propres templates pour générer des applications personnalisées.

---

## 📋 Structure de Base

Chaque template est un fichier JSON avec cette structure :

```json
{
  "id": "unique_id",
  "name": "Nom de l'Application",
  "description": "Description courte",
  "category": "custom",
  "icon": "play_circle",
  "workflow": {
    "name": "Nom du workflow",
    "description": "Description du workflow",
    "inputs": [...],
    "tasks": [...],
    "outputs": [...]
  }
}
```

> **⚠️ IMPORTANT :** Le champ `id` au niveau racine est **OBLIGATOIRE**. Il est automatiquement ajouté au workflow lors de l'exécution pour identifier l'instance du workflow.

---

## 🔧 Section : inputs

Les `inputs` définissent les champs du formulaire que l'utilisateur va remplir.

### Types d'Inputs Disponibles

#### 1. text_input - Champ Texte

**Simple ligne :**
```json
{
  "id": "mon_texte",
  "type": "text_input",
  "label": "Titre",
  "placeholder": "Entrez un titre...",
  "defaultValue": "",
  "required": true,
  "multiline": false
}
```

**Multi-lignes (textarea) :**
```json
{
  "id": "description",
  "type": "text_input",
  "label": "Description",
  "placeholder": "Entrez une description...",
  "multiline": true,
  "required": false
}
```

---

#### 2. image_input - Upload d'Image

```json
{
  "id": "photo",
  "type": "image_input",
  "label": "Photo",
  "required": true,
  "multiple": false,
  "maxFiles": 1
}
```

**Fonctionnalités automatiques :**
- Upload par clic
- Drag & Drop
- Caméra arrière
- Caméra frontale (mobile)

---

#### 3. number_input - Nombre

```json
{
  "id": "quantite",
  "type": "number_input",
  "label": "Quantité",
  "min": 1,
  "max": 100,
  "step": 1,
  "defaultValue": 10,
  "required": true
}
```

---

#### 4. select_input - Menu Déroulant

```json
{
  "id": "style",
  "type": "select_input",
  "label": "Style",
  "options": [
    { "value": "modern", "label": "Moderne" },
    { "value": "classic", "label": "Classique" },
    { "value": "retro", "label": "Rétro" }
  ],
  "defaultValue": "modern",
  "required": true
}
```

---

## ⚙️ Section : tasks

Les `tasks` définissent les actions à exécuter avec les données du formulaire.

### Utilisation des Variables

Pour référencer un input dans une task :

```
{{input_id.propriété}}
```

**Exemples :**
- `{{mon_texte.text}}` - Contenu d'un text_input
- `{{photo.image}}` - Chemin de l'image uploadée
- `{{quantite.value}}` - Valeur d'un number_input
- `{{style.value}}` - Valeur sélectionnée d'un select_input

### Types de Tasks Courants

#### generate_image - Génération d'Image

```json
{
  "id": "generate",
  "type": "generate_image",
  "inputs": {
    "prompt": "{{description.text}}",
    "size": "1024x1024",
    "quality": "standard"
  }
}
```

---

#### edit_image - Édition d'Image

```json
{
  "id": "edit",
  "type": "edit_image",
  "inputs": {
    "image1": "{{photo.image}}",
    "editPrompt": "{{instructions.text}}",
    "aspectRatio": "original"
  }
}
```

---

#### generate_text - Génération de Texte

```json
{
  "id": "describe",
  "type": "generate_text",
  "inputs": {
    "prompt": "Décris cette image : {{photo.image}}",
    "maxTokens": 500
  }
}
```

---

## 📤 Section : outputs

Les `outputs` définissent ce qui sera affiché comme résultat.

### Types d'Outputs

#### image_output - Afficher une Image

```json
{
  "id": "resultat_image",
  "type": "image_output",
  "inputs": {
    "image": "{{generate.images}}"
  }
}
```

**Note :** Peut référencer plusieurs images avec un array

---

#### text_output - Afficher du Texte

```json
{
  "id": "resultat_texte",
  "type": "text_output",
  "inputs": {
    "text": "{{describe.text}}"
  }
}
```

---

## 🎯 Exemples Complets

### Exemple 1 : Générateur d'Images Simple

```json
{
  "name": "Créateur d'Images",
  "description": "Générez des images à partir de descriptions",
  "workflow": {
    "inputs": [
      {
        "id": "prompt",
        "type": "text_input",
        "label": "Décrivez votre image",
        "placeholder": "Un coucher de soleil sur la mer...",
        "multiline": true,
        "required": true
      }
    ],
    "tasks": [
      {
        "id": "gen",
        "type": "generate_image",
        "inputs": {
          "prompt": "{{prompt.text}}",
          "size": "1024x1024"
        }
      }
    ],
    "outputs": [
      {
        "id": "result",
        "type": "image_output",
        "inputs": {
          "image": "{{gen.images}}"
        }
      }
    ]
  }
}
```

**Interface générée :**
- Textarea pour la description
- Bouton "Exécuter"
- Affichage de l'image générée

---

### Exemple 2 : Éditeur d'Images avec Options

```json
{
  "name": "Éditeur d'Images Pro",
  "description": "Modifiez vos photos avec précision",
  "workflow": {
    "inputs": [
      {
        "id": "photo",
        "type": "image_input",
        "label": "Photo à modifier",
        "required": true
      },
      {
        "id": "instructions",
        "type": "text_input",
        "label": "Instructions",
        "placeholder": "Ajouter un filtre sépia...",
        "multiline": true,
        "required": true
      },
      {
        "id": "format",
        "type": "select_input",
        "label": "Format de sortie",
        "options": [
          { "value": "original", "label": "Format original" },
          { "value": "1:1", "label": "Carré (1:1)" },
          { "value": "16:9", "label": "Paysage (16:9)" },
          { "value": "9:16", "label": "Portrait (9:16)" }
        ],
        "defaultValue": "original",
        "required": true
      }
    ],
    "tasks": [
      {
        "id": "edit",
        "type": "edit_image",
        "inputs": {
          "image1": "{{photo.image}}",
          "editPrompt": "{{instructions.text}}",
          "aspectRatio": "{{format.value}}"
        }
      }
    ],
    "outputs": [
      {
        "id": "edited",
        "type": "image_output",
        "inputs": {
          "image": "{{edit.edited_images}}"
        }
      }
    ]
  }
}
```

**Interface générée :**
- Zone d'upload avec caméra
- Textarea pour instructions
- Menu déroulant pour le format
- Bouton "Exécuter"
- Affichage de l'image modifiée

---

### Exemple 3 : Analyseur d'Image

```json
{
  "name": "Analyse d'Image AI",
  "description": "Obtenez une description détaillée de vos photos",
  "workflow": {
    "inputs": [
      {
        "id": "image",
        "type": "image_input",
        "label": "Photo à analyser",
        "required": true
      },
      {
        "id": "detail_level",
        "type": "select_input",
        "label": "Niveau de détail",
        "options": [
          { "value": "brief", "label": "Bref" },
          { "value": "detailed", "label": "Détaillé" },
          { "value": "comprehensive", "label": "Complet" }
        ],
        "defaultValue": "detailed",
        "required": true
      }
    ],
    "tasks": [
      {
        "id": "analyze",
        "type": "generate_text",
        "inputs": {
          "image": "{{image.image}}",
          "prompt": "Analyze this image in {{detail_level.value}} mode",
          "maxTokens": 1000
        }
      }
    ],
    "outputs": [
      {
        "id": "analysis",
        "type": "text_output",
        "inputs": {
          "text": "{{analyze.text}}"
        }
      }
    ]
  }
}
```

---

### Exemple 4 : Batch Processing (Plusieurs Sorties)

```json
{
  "name": "Variantes d'Images",
  "description": "Générez plusieurs variantes d'une même image",
  "workflow": {
    "inputs": [
      {
        "id": "source",
        "type": "image_input",
        "label": "Image source",
        "required": true
      },
      {
        "id": "variations",
        "type": "number_input",
        "label": "Nombre de variantes",
        "min": 1,
        "max": 4,
        "defaultValue": 2,
        "required": true
      }
    ],
    "tasks": [
      {
        "id": "vary",
        "type": "create_variations",
        "inputs": {
          "image": "{{source.image}}",
          "count": "{{variations.value}}"
        }
      }
    ],
    "outputs": [
      {
        "id": "results",
        "type": "image_output",
        "inputs": {
          "image": "{{vary.variation_images}}"
        }
      }
    ]
  }
}
```

---

## 🔗 Chaînage de Tasks

Vous pouvez chaîner plusieurs tasks en utilisant les résultats des tasks précédentes :

```json
{
  "tasks": [
    {
      "id": "generate",
      "type": "generate_image",
      "inputs": {
        "prompt": "{{description.text}}"
      }
    },
    {
      "id": "enhance",
      "type": "edit_image",
      "inputs": {
        "image1": "{{generate.images}}",
        "editPrompt": "Enhance quality and add professional lighting"
      }
    }
  ],
  "outputs": [
    {
      "id": "final",
      "type": "image_output",
      "inputs": {
        "image": "{{enhance.edited_images}}"
      }
    }
  ]
}
```

---

## ✅ Validation du Template

### Outils en Ligne

Validez votre JSON avant de l'utiliser :
- [JSONLint](https://jsonlint.com)
- [JSON Formatter](https://jsonformatter.curiousconcept.com)

### Checklist

- [ ] JSON valide (pas d'erreur de syntaxe)
- [ ] Tous les `id` sont uniques
- [ ] Tous les inputs requis ont `"required": true`
- [ ] Les références `{{input_id.propriété}}` sont correctes
- [ ] Les types de tasks sont supportés par le backend
- [ ] Les outputs référencent des tasks existantes

---

## 🎨 Bonnes Pratiques

### 1. Nommage

**IDs clairs et explicites :**
```json
// ✅ Bon
"id": "user_description"
"id": "output_image"

// ❌ Éviter
"id": "input1"
"id": "x"
```

### 2. Labels Utilisateurs

**Texte clair et instructif :**
```json
// ✅ Bon
"label": "Décrivez l'image que vous voulez créer"
"placeholder": "Ex: Un chat dans l'espace avec des étoiles"

// ❌ Éviter
"label": "Prompt"
"placeholder": "Texte"
```

### 3. Valeurs par Défaut

**Toujours fournir des valeurs par défaut sensées :**
```json
{
  "id": "quality",
  "type": "select_input",
  "defaultValue": "standard"  // ✅ Bon
}
```

### 4. Required vs Optional

**Marquer explicitement les champs requis :**
```json
{
  "id": "essential_input",
  "required": true  // ✅ Obligatoire
}
{
  "id": "optional_input",
  "required": false  // ✅ Facultatif
}
```

---

## 🧪 Test de votre Template

### 1. Valider le JSON

```bash
# Avec Python
python3 -m json.tool template.json

# Avec Node.js
node -e "console.log(JSON.stringify(require('./template.json'), null, 2))"
```

### 2. Remplacer le Template

```bash
# Sauvegarder l'ancien
cp template.json template.json.backup

# Copier le nouveau
cp mon-nouveau-template.json template.json
```

### 3. Tester dans SmallApp

```bash
# Ouvrir SmallApp
http://localhost:3000/smallapps/

# Ou recharger la page (F5)
```

### 4. Vérifier la Console

Ouvrir les DevTools (F12) et vérifier les logs :
```javascript
✅ Application initialisée {...}
```

---

## 📚 Référence Rapide

### Propriétés des Inputs

| Propriété | Type | Description | Requis |
|-----------|------|-------------|--------|
| `id` | string | Identifiant unique | ✅ |
| `type` | string | Type d'input | ✅ |
| `label` | string | Texte affiché | ✅ |
| `placeholder` | string | Texte d'aide | ❌ |
| `defaultValue` | any | Valeur par défaut | ❌ |
| `required` | boolean | Champ obligatoire | ❌ |
| `multiline` | boolean | Textarea (text_input) | ❌ |
| `min` / `max` | number | Limites (number_input) | ❌ |
| `step` | number | Incrément (number_input) | ❌ |
| `options` | array | Choix (select_input) | ✅* |

*Requis pour `select_input`

---

### Références de Variables

| Input Type | Propriété à Référencer |
|------------|------------------------|
| `text_input` | `{{id.text}}` |
| `image_input` | `{{id.image}}` |
| `number_input` | `{{id.value}}` |
| `select_input` | `{{id.value}}` |

### Outputs de Tasks

| Task Type | Output Disponible |
|-----------|-------------------|
| `generate_image` | `{{id.images}}` |
| `edit_image` | `{{id.edited_images}}` |
| `generate_text` | `{{id.text}}` |

---

## 💡 Astuces Avancées

### Multi-Outputs

Afficher plusieurs résultats :

```json
{
  "outputs": [
    {
      "id": "original",
      "type": "image_output",
      "inputs": { "image": "{{input.image}}" }
    },
    {
      "id": "modified",
      "type": "image_output",
      "inputs": { "image": "{{edit.edited_images}}" }
    }
  ]
}
```

### Paramètres Conditionnels

Bien que non supporté nativement, vous pouvez utiliser des valeurs par défaut :

```json
{
  "id": "mode",
  "type": "select_input",
  "options": [
    { "value": "fast", "label": "Rapide (qualité standard)" },
    { "value": "quality", "label": "Qualité (plus lent)" }
  ],
  "defaultValue": "fast"
}
```

---

## 🔍 Debugging Template

### Erreur : "Impossible de charger le template"

```bash
# Vérifier que le fichier existe
ls -la template.json

# Vérifier les permissions
chmod 644 template.json

# Valider le JSON
python3 -m json.tool template.json
```

### Erreur : "Input undefined"

Vérifier que l'`id` de l'input existe :

```json
// Dans tasks
"inputs": {
  "prompt": "{{mon_input.text}}"  // ✅ mon_input existe dans inputs
}
```

### Erreur : "Cannot execute workflow"

Vérifier que :
- Le backend est démarré
- Les types de tasks sont supportés
- Les images sont bien uploadées

---

## 📦 Templates Prêts à l'Emploi

Consultez le dossier `templates/` pour des exemples :

- `image-generator.json` - Générateur d'images
- `image-editor.json` - Éditeur d'images
- `image-analyzer.json` - Analyseur d'images
- `text-to-image.json` - Texte vers image
- `batch-processor.json` - Traitement par lot

---

**Bon développement de templates ! 🎨**
