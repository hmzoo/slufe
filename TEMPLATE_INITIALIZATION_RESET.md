# 🔄 Template - Réinitialisation des Champs Principaux

## 📋 Vue d'ensemble

Quand un template est généré depuis un workflow, tous les champs principaux de saisie de données doivent être réinitialisés à zéro (valeurs par défaut) pour garantir que l'utilisateur doit fournir de nouvelles données lors de l'utilisation du template.

## 🎯 Objectif

Assurer que les templates générés depuis des workflows sont **vierges de données utilisateur**, prêts à être réutilisés avec de nouveaux inputs.

## ✅ Champs Réinitialisés

### 1. **Tâches `input_text` - Saisie de Texte**
```javascript
// AVANT (workflow exécuté)
{
  type: 'input_text',
  input: {
    label: 'Entrez un prompt',
    placeholder: 'Ex: ...',
    userInput: 'mon texte saisi'  // ❌ DONNÉES UTILISATEUR
  }
}

// APRÈS (template généré)
{
  type: 'input_text',
  input: {
    label: 'Entrez un prompt',
    placeholder: 'Ex: ...',
    userInput: ''  // ✅ VIDÉ
  }
}
```

**Propriétés vidées:**
- `task.userInputValue` (supprimée)
- `task.input.userInput` → `''` (réinitialisée)

**Propriétés conservées:**
- `task.input.label` - Libellé du champ
- `task.input.placeholder` - Texte d'aide
- `task.input.defaultValue` - Valeur par défaut proposée
- `task.input.description` - Description du champ

---

### 2. **Tâches `input_images` - Upload d'Images**
```javascript
// AVANT (workflow exécuté)
{
  type: 'input_images',
  input: {
    label: 'Uploadez les images',
    multiple: true,
    uploadedImages: [  // ❌ DONNÉES UTILISATEUR
      { url: '/medias/img1.jpg', name: 'image1.jpg' },
      { url: '/medias/img2.jpg', name: 'image2.jpg' }
    ]
  }
}

// APRÈS (template généré)
{
  type: 'input_images',
  input: {
    label: 'Uploadez les images',
    multiple: true,
    uploadedImages: []  // ✅ VIDÉ
  }
}
```

**Propriétés vidées:**
- `task.uploadedImagePreviews` (supprimée)
- `task.selectedMediaIds` (supprimée)
- `task.input.uploadedImages` → `[]` (réinitialisée)

**Propriétés conservées:**
- `task.input.label` - Libellé du champ
- `task.input.multiple` - Accepter plusieurs images
- `task.input.required` - Champ obligatoire

---

### 3. **Tâches `image_input` - Entrée d'Image Simple**
```javascript
// AVANT (workflow exécuté)
{
  type: 'image_input',
  input: {
    selectedImage: '/medias/photo.jpg'  // ❌ DONNÉES UTILISATEUR
  }
}

// APRÈS (template généré)
{
  type: 'image_input',
  input: {
    selectedImage: undefined  // ✅ VIDÉ
  }
}
```

**Propriétés vidées:**
- `task.selectedImage` (supprimée)
- `task.selectedImageUrl` (supprimée)
- `task.input.selectedImage` → `undefined`
- `task.input.image` → `undefined`
- `task.input.defaultImage` → `undefined`

---

### 4. **Autres Champs de Saisie Utilisateur**

Pour tous les autres types de tâches, les champs suivants sont vidés s'ils contiennent des données utilisateur (sans variables `{{}}`):

- Champs contenant `prompt` (ex: `main_prompt`, `negative_prompt`)
- Champs contenant `text` (ex: `description_text`, `input_text`)
- Champs contenant `user` (ex: `user_input`, `userValue`)
- Champs contenant `input` (ex: `additional_input`)
- Champs contenant `value` (ex: `custom_value`)
- Champs contenant `content` (ex: `file_content`)

**Exemple:**
```javascript
{
  type: 'edit_image',
  input: {
    // VIDE - champ de données utilisateur
    prompt: '',
    
    // GARDE - propriété de configuration
    label: 'Décrivez l\'édition',
    
    // GARDE - référence variable
    image: '{{image_input.image}}'
  }
}
```

---

## 🔧 Implémentation Technique

### Fonction: `cleanWorkflowForTemplate()`
**Emplacement:** `backend/services/templateManager.js`

**Responsabilité:**
- Crée une copie profonde du workflow
- Réinitialise tous les champs de saisie utilisateur
- Conserve les configurations et les références variables
- Supprime les métadonnées d'instance (IDs, dates, historique)

**Appelée par:**
1. `saveTemplate()` - quand un template est créé depuis l'API
2. `updateTemplate()` - quand un template est mis à jour
3. Route POST `/api/templates` - création via API
4. Route POST `/api/templates/from-workflow` - création depuis workflow

### Processus de Création

```
Utilisateur clique "Sauvegarder comme template"
    ↓
WorkflowManager.saveAsTemplate() (frontend)
    ↓
POST /api/templates (avec le workflow complet)
    ↓
routes/templates.js::POST /
    ↓
saveTemplate(templateData)
    ↓
cleanWorkflowForTemplate(workflow)
    ↓ (réinitialise tous les champs)
    ↓
Template sauvegardé avec données vierges
```

---

## 🎯 Résultat Final

### Template Généré
```json
{
  "id": "template_xyz123",
  "name": "Mon Template",
  "description": "...",
  "category": "custom",
  "icon": "dashboard",
  "workflow": {
    "name": "Mon Template",
    "description": "...",
    "tasks": [
      {
        "id": "task_1",
        "type": "input_text",
        "input": {
          "label": "Entrez un prompt",
          "placeholder": "Ex: ...",
          "userInput": ""  // ✅ VIDE
        }
      },
      {
        "id": "task_2",
        "type": "input_images",
        "input": {
          "label": "Uploadez les images",
          "uploadedImages": []  // ✅ VIDE
        }
      }
    ]
    // ❌ id, createdAt, updatedAt SUPPRIMÉS
  },
  "createdAt": "2025-11-13T...",
  "tags": []
}
```

---

## 🧪 Vérification

Pour vérifier que la réinitialisation fonctionne:

1. **Créer un workflow avec données:**
   ```
   - Ajouter tâche input_text → saisir "Mon texte"
   - Ajouter tâche input_images → uploader des images
   ```

2. **Sauvegarder comme template:**
   - Clic droit sur le workflow
   - "Sauvegarder comme template"
   - Confirmer le nom

3. **Vérifier le template généré:**
   ```bash
   # Aller dans /backend/data/templates/
   cat template_xyz.json
   ```

4. **Vérifier que:**
   ```javascript
   // ✅ Champs de saisie vidés
   workflow.tasks[0].input.userInput === ''
   workflow.tasks[1].input.uploadedImages === []
   
   // ✅ Configuration conservée
   workflow.tasks[0].input.label === 'Entrez un prompt'
   workflow.tasks[1].input.label === 'Uploadez les images'
   
   // ✅ Métadonnées supprimées
   workflow.id === undefined
   workflow.createdAt === undefined
   ```

---

## 📊 Champs Conservés par Défaut

Ces champs sont **TOUJOURS** conservés (jamais vidés):

```javascript
const configFields = [
  'label',           // Libellé du champ
  'placeholder',     // Texte d'aide
  'defaultValue',    // Valeur par défaut
  'description',     // Description du champ
  'required',        // Obligatoire?
  'type',           // Type de champ
  'options',        // Liste d'options (select)
  'multiple',       // Accepter plusieurs?
  'min', 'max',     // Limites numériques
  'step',           // Pas d'incrémentation
  'pattern',        // Regex de validation
  'hint',           // Info-bulle
  'hidden',         // Masqué?
  'disabled'        // Désactivé?
]
```

Les **références variables** (`{{variable}}`) sont **TOUJOURS** conservées, quel que soit le champ.

---

## 🚀 Utilisation du Template

Quand l'utilisateur crée un workflow depuis le template:

```javascript
// Frontend: createWorkflowFromTemplate()
const newWorkflow = JSON.parse(JSON.stringify(template.workflow))
// → Template a les champs vides ✅

// Utilisateur peut maintenant:
// 1. Saisir du texte → input_text.userInput rempli
// 2. Uploader des images → input_images.uploadedImages rempli
// 3. Exécuter le workflow avec les nouvelles données
```

---

## ✅ Checklist Implémentation

- ✅ `cleanWorkflowForTemplate()` réinitialise `input_text.userInput` à `''`
- ✅ `cleanWorkflowForTemplate()` réinitialise `input_images.uploadedImages` à `[]`
- ✅ `cleanWorkflowForTemplate()` réinitialise `image_input` champs à `undefined`
- ✅ `cleanWorkflowForTemplate()` vide les champs de données utilisateur génériques
- ✅ `cleanWorkflowForTemplate()` conserve les propriétés de configuration
- ✅ `cleanWorkflowForTemplate()` conserve les références variables `{{}}`
- ✅ `cleanWorkflowForTemplate()` supprime les métadonnées d'instance
- ✅ `saveTemplate()` appelle `cleanWorkflowForTemplate()`
- ✅ `updateTemplate()` appelle `cleanWorkflowForTemplate()`
- ✅ Notification utilisateur informe de la réinitialisation
- ✅ Routes `/api/templates` appliquent le nettoyage

---

## 📝 Notes

- La **réinitialisation est automatique**, l'utilisateur n'a rien à faire
- Les **configurations** (labels, placeholders, etc.) sont **toujours préservées**
- Les **variables** (`{{...}}`) sont **toujours préservées**
- Les **templates sont immuables** - créer un workflow depuis un template ne modifie pas le template original
