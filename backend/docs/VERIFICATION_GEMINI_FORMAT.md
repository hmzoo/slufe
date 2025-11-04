# ✅ Vérification du format d'input Gemini 2.5 Flash

**Date:** 3 novembre 2025  
**Modèle:** `google/gemini-2.5-flash`  
**Documentation source:** `backend/references_API/gemini-2.5-flash.json`

---

## 📋 Format officiel Replicate

Selon la documentation officielle du modèle sur Replicate :

### Input Schema (requis)
```json
{
  "prompt": "string (REQUIRED)",
  "system_instruction": "string (nullable, optional)",
  "max_output_tokens": "integer (1-65535, default: 65535)",
  "temperature": "number (0-2, default: 1)",
  "top_p": "number (0-1, default: 0.95)",
  "dynamic_thinking": "boolean (default: false)",
  "thinking_budget": "integer (0-24576, nullable, optional)"
}
```

### Exemple officiel
```javascript
const output = await replicate.run(
  'google/gemini-2.5-flash',
  {
    input: {
      prompt: 'A recipe for flan',
      max_output_tokens: 1024,
      temperature: 0.7,
      top_p: 0.95,
      dynamic_thinking: false
    }
  }
);
```

---

## 🔍 Notre implémentation actuelle

### Code dans `backend/services/promptEnhancer.js` (lignes 119-128)

```javascript
const output = await replicate.run(
  'google/gemini-2.5-flash',
  {
    input: {
      system_instruction: systemInstruction,  // ✅ Optionnel selon spec
      prompt: userPrompt,                      // ✅ REQUIRED
      max_output_tokens: 512,                  // ✅ Dans range 1-65535
      temperature: 0.7,                        // ✅ Dans range 0-2
      top_p: 0.95,                             // ✅ Dans range 0-1
      dynamic_thinking: false,                 // ✅ Valeur valide
    },
    ...DEFAULT_REPLICATE_OPTIONS
  }
);
```

---

## ✅ Validation point par point

| Paramètre | Notre valeur | Spec officielle | Status |
|-----------|--------------|-----------------|--------|
| `prompt` | `userPrompt` (string) | ✅ Required string | ✅ **CONFORME** |
| `system_instruction` | `systemInstruction` (string) | ✅ Nullable string | ✅ **CONFORME** |
| `max_output_tokens` | `512` | ✅ 1-65535 | ✅ **CONFORME** |
| `temperature` | `0.7` | ✅ 0-2 | ✅ **CONFORME** |
| `top_p` | `0.95` | ✅ 0-1 | ✅ **CONFORME** |
| `dynamic_thinking` | `false` | ✅ Boolean | ✅ **CONFORME** |

---

## 📊 Modifications effectuées (3 nov 2025)

### AVANT (format sous-optimal)
```javascript
// Ancien format avec préfixes instructionnels
userPrompt = `Original prompt: "${inputText}"\n\nEnhanced prompt:`;
```

**Problème:** Le prompt contenait des instructions de format au lieu du contenu pur.

### APRÈS (format optimisé)
```javascript
// Nouveau format : prompt utilisateur direct
userPrompt = inputText;

// Les instructions sont dans system_instruction
systemInstruction = `You are an expert...
Your task: Enhance the user's prompt...
Return ONLY the enhanced prompt in English, nothing else.`;
```

**Avantages:**
- ✅ Séparation claire : tâche dans `system_instruction`, contenu dans `prompt`
- ✅ Plus propre et plus efficace
- ✅ Conforme aux best practices Gemini
- ✅ Meilleure utilisation du contexte

---

## 🎯 Exemple concret

### Input envoyé à Replicate (APRÈS modification)
```json
{
  "system_instruction": "You are an expert in AI image generation prompts for the Qwen-Image model.\n\nYour task: Enhance the user's prompt to be precise, detailed, and optimized for high-quality results.\n\nKey guidelines:\n- Use clear, descriptive English\n- Include specific visual elements\n- Mention lighting (golden hour, studio lighting, natural light, etc.)\n- Specify composition (close-up, wide shot, aerial view, etc.)\n- Add style keywords (cinematic, photorealistic, artistic, etc.)\n- Include quality modifiers (highly detailed, professional, 4k, sharp focus)\n- Describe atmosphere and mood\n- Be concise but descriptive (aim for 15-30 words)\n\nReturn ONLY the enhanced prompt in English, nothing else.",
  "prompt": "une dame blanche se repose",
  "max_output_tokens": 512,
  "temperature": 0.7,
  "top_p": 0.95,
  "dynamic_thinking": false
}
```

### Output attendu
```
"A woman in a white dress resting peacefully, golden hour lighting, soft focus, serene atmosphere, natural composition, highly detailed, cinematic photography"
```

---

## 🔧 Contextes adaptés

Notre implémentation adapte `system_instruction` selon le contexte :

### 1. Génération d'images (`targetType='image'`)
```javascript
system_instruction: "You are an expert in AI image generation prompts for the Qwen-Image model..."
prompt: "une dame blanche se repose"
```

### 2. Édition d'images (`targetType='edit'`, `imageCount=1`)
```javascript
system_instruction: "You are an expert in AI image editing prompts for the Qwen-Image-Edit-Plus model...
Context: The user has uploaded 1 image and wants to edit it."
prompt: "add sunglasses"
```

### 3. Multi-images (`targetType='edit'`, `imageCount=2+`)
```javascript
system_instruction: "You are an expert in AI multi-image editing prompts...
Context: The user has uploaded 2 images."
prompt: "transfer the style from image 1 to image 2"
```

### 4. Génération de vidéos (`targetType='video'`)
```javascript
system_instruction: "You are an expert in AI video generation prompts for the Wan-2 video model..."
prompt: "a cat playing with yarn"
```

---

## ✅ Conclusion

### Format d'input : **100% CONFORME**

Notre implémentation respecte **exactement** le schéma officiel de Gemini 2.5 Flash sur Replicate :

1. ✅ Tous les paramètres sont dans les ranges valides
2. ✅ Le champ `prompt` est bien une string (required)
3. ✅ Le champ `system_instruction` est bien une string nullable (optional)
4. ✅ Les paramètres numériques respectent les min/max
5. ✅ Aucun paramètre invalide ou manquant
6. ✅ Format optimisé : tâche séparée du contenu

### Amélioration apportée

Le format a été optimisé le 3 novembre 2025 pour :
- Séparer clairement les instructions système du prompt utilisateur
- Utiliser `system_instruction` pour la tâche et les guidelines
- Passer le prompt utilisateur directement sans préfixe
- Contextualiser selon le type de génération (image/edit/video)

**Statut final:** 🟢 **VALIDÉ ET OPTIMISÉ**

---

*Document généré automatiquement le 3 novembre 2025*
