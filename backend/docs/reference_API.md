# Référence API - Endpoints Backend SLUFE IA

## Vue d'ensemble

Ce document référence tous les endpoints du backend et les modèles d'IA utilisés.

## Modèles d'IA utilisés

### Gemini 2.5 Flash (Google via Replicate)

**Modèle:** `google/gemini-2.5-flash`

**Utilisé pour:**
- Amélioration de prompts (prompt enhancement)
- Analyse de workflows
- Génération de workflows personnalisés

**Configuration:**
```javascript
{
  system_instruction: "You are an expert... [contexte selon targetType]",
  prompt: inputText,  // Prompt utilisateur directement, sans préfixe
  max_output_tokens: 512-1024,
  temperature: 0.3-0.7,
  top_p: 0.8-0.95,
  dynamic_thinking: false
}
```

**Format optimisé (nov 2025):**
- ✅ Le `system_instruction` contient la tâche et les guidelines
- ✅ Le `prompt` contient directement le texte utilisateur (sans "Original prompt:" ni "Enhanced prompt:")
- ✅ Le contexte (nombre d'images, type) est intégré dans `system_instruction`
- ✅ Gemini retourne uniquement le prompt amélioré

### Autres modèles
- **LLaVA-13B:** Analyse d'images (describe_images)
- **Qwen-Image:** Génération d'images
- **Qwen-Image-Edit-Plus:** Édition d'images
- **Wan-2:** Génération de vidéos

---

## 🎯 Endpoints utilisant Gemini 2.5 Flash

### 1. POST /api/prompt/enhance

**Description:** Améliore un prompt utilisateur avec l'IA Gemini 2.5 Flash

**Service:** `backend/services/promptEnhancer.js`

**Modèle:** ✅ `google/gemini-2.5-flash` (ligne 108)

**Corps de la requête:**
```json
{
  "prompt": "string (required)",
  "hasImages": "boolean (optional)",
  "imageCount": "number (optional)",
  "targetType": "string (optional: 'image' | 'edit' | 'video')"
}
```

**Réponse:**
```json
{
  "success": true,
  "enhanced": "string",
  "original": "string",
  "mock": false,
  "context": "generation|edition"
}
```

**Cas d'usage:**
- **targetType='image':** Prompts pour génération d'images (Qwen-Image)
- **targetType='edit':** Prompts pour édition d'images (Qwen-Image-Edit-Plus)
- **targetType='video':** Prompts pour génération de vidéos (Wan-2)

**Vérifications effectuées:**
- ✅ Appel direct dans `promptEnhancer.js` ligne 108: `replicate.run('google/gemini-2.5-flash', ...)`
- ✅ Adapte les instructions système selon le contexte (image/edit/video)
- ✅ Toujours en anglais pour compatibilité avec les modèles cibles
- ✅ Gère les erreurs avec fallback vers le prompt original

---

### 2. GET /api/prompt/status

**Description:** Vérifie le statut du service d'amélioration de prompt

**Modèle référencé:** ✅ `google/gemini-2.5-flash` (ligne 130)

**Réponse:**
```json
{
  "success": true,
  "service": "promptEnhancer",
  "configured": true,
  "model": "google/gemini-2.5-flash",
  "status": "ready",
  "message": "Service d'amélioration de prompt opérationnel"
}
```

**Correction effectuée:** ✅ Ligne 130 modifiée de `gemini-2.0-flash-exp` → `gemini-2.5-flash`

---

### 3. Task: enhance_prompt (Workflows)

**Description:** Tâche d'amélioration de prompt dans les workflows personnalisés

**Service:** `backend/services/tasks/EnhancePromptTask.js`

**Modèle:** ✅ `gemini-2.5-flash` (propriété modelName ligne 10)

**Appel indirect:** Utilise `promptEnhancer.js` qui appelle Gemini 2.5 Flash

**Inputs:**
```json
{
  "prompt": "string (required)",
  "style": "string (optional)",
  "language": "string (optional, default: 'fr')",
  "targetType": "string (optional: 'image'|'edit'|'video')",
  "imageDescription1": "string (optional)",
  "imageDescription2": "string (optional)",
  "imageCount": "number (optional)"
}
```

**Outputs:**
```json
{
  "enhanced_prompt": "string",
  "original_prompt": "string",
  "improvements": ["array of strings"],
  "confidence": "number",
  "style_applied": "string",
  "language": "string"
}
```

**Fonctionnalités:**
- ✅ Enrichissement du contexte avec descriptions d'images
- ✅ Adaptation selon targetType (image/edit/video)
- ✅ Fallback vers prompt original en cas d'erreur

---

### 4. POST /api/workflow/analyze

**Description:** Analyse un prompt utilisateur pour recommander des workflows

**Service:** `backend/services/workflowAnalyzer.js`

**Modèle:** ✅ `google/gemini-2.5-flash` (ligne 177)

**Corps de la requête:**
```json
{
  "prompt": "string (required)",
  "context": "object (optional)"
}
```

**Réponse:**
```json
{
  "success": true,
  "recommendations": [
    {
      "workflow_name": "string",
      "confidence": "number",
      "description": "string",
      "tasks_count": "number",
      "estimated_duration": "string",
      "difficulty": "string"
    }
  ]
}
```

**Vérifications:**
- ✅ Utilise Gemini 2.5 Flash pour l'analyse sémantique
- ✅ Température basse (0.3) pour réponses structurées
- ✅ Retourne JSON avec recommandations de workflows

---

### 5. Task: generate_workflow (Workflows)

**Description:** Génère un workflow personnalisé à partir d'un prompt

**Service:** `backend/services/tasks/GenerateWorkflowTask.js`

**Modèle:** ✅ `google/gemini-2.5-flash` (lignes 145 et 151)

**Inputs:**
```json
{
  "description": "string (required)",
  "style": "string (optional)",
  "complexity": "string (optional: 'simple'|'medium'|'advanced')"
}
```

**Outputs:**
```json
{
  "workflow": {
    "name": "string",
    "description": "string",
    "tasks": ["array of task objects"]
  },
  "metadata": {
    "model": "string",
    "confidence": "number"
  }
}
```

**Vérifications:**
- ✅ Ligne 145: Référence dans les logs `model: 'google/gemini-2.5-flash'`
- ✅ Ligne 151: Appel direct `replicate.run("google/gemini-2.5-flash", ...)`
- ✅ Génère des workflows au format JSON structuré

---

## 🔍 Vérifications de cohérence

### Tous les endpoints utilisent Gemini 2.5 Flash

| Service | Fichier | Ligne | Statut |
|---------|---------|-------|--------|
| promptEnhancer | `services/promptEnhancer.js` | 108 | ✅ `google/gemini-2.5-flash` |
| prompt status | `routes/prompt.js` | 130 | ✅ `google/gemini-2.5-flash` (corrigé) |
| EnhancePromptTask | `services/tasks/EnhancePromptTask.js` | 10 | ✅ `gemini-2.5-flash` |
| workflowAnalyzer | `services/workflowAnalyzer.js` | 177 | ✅ `google/gemini-2.5-flash` |
| GenerateWorkflowTask | `services/tasks/GenerateWorkflowTask.js` | 151 | ✅ `google/gemini-2.5-flash` |

### Aucune référence à d'anciens modèles

❌ Aucune référence à `gemini-2.0-flash-exp` trouvée (corrigée)
❌ Aucune référence à `gemini-2.0-flash` trouvée
✅ Toutes les références pointent vers `gemini-2.5-flash`

---

## 📋 Configuration requise

**Variable d'environnement:**
```bash
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Installation:**
```bash
npm install replicate
```

**Import dans le code:**
```javascript
import Replicate from 'replicate';
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
```

---

## 🧪 Tests de vérification

### Test 1: Status endpoint
```bash
curl http://localhost:3001/api/prompt/status
```

**Résultat attendu:**
```json
{
  "model": "google/gemini-2.5-flash"
}
```

### Test 2: Enhancement endpoint
```bash
curl -X POST http://localhost:3001/api/prompt/enhance \
  -H "Content-Type: application/json" \
  -d '{"prompt": "un chat mignon", "targetType": "image"}'
```

**Vérifie:** Logs backend montrent `google/gemini-2.5-flash`

### Test 3: Workflow task
```bash
# Créer un workflow avec task enhance_prompt
# Vérifier logs: "Amélioration du prompt avec Gemini 2.5 Flash"
```

---

## ✅ Conclusion

**Tous les endpoints utilisant l'amélioration de prompts utilisent exclusivement `google/gemini-2.5-flash`**

**Corrections effectuées:**
- ✅ `/api/prompt/status` : Référence corrigée de `gemini-2.0-flash-exp` → `gemini-2.5-flash`

**Aucune autre modification nécessaire** - tous les autres services utilisaient déjà le bon modèle.

---

*Document généré le 3 novembre 2025*
*Dernière vérification: 3 novembre 2025*
