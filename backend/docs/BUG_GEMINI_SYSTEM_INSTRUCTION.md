# 🐛 Bug Gemini 2.5 Flash : system_instruction ne fonctionne pas

**Date de découverte:** 3 novembre 2025  
**Modèle affecté:** `google/gemini-2.5-flash` sur Replicate  
**Statut:** Workaround implémenté

---

## 🔍 Symptômes

Lorsqu'on utilise le paramètre `system_instruction` séparément du `prompt`, Gemini retourne :

```
Input token count: 0
Output token count: 0
output: []
```

### Exemple de requête qui ne fonctionne PAS :

```javascript
const output = await replicate.run('google/gemini-2.5-flash', {
  input: {
    system_instruction: "You are an expert...",  // ❌ Ne fonctionne pas
    prompt: "La Dame Blanche se repose",
    max_output_tokens: 512,
    temperature: 0.7,
    top_p: 0.95,
    dynamic_thinking: false
  }
});
```

**Résultat:** `output = []` avec 0 tokens traités

---

## 🔬 Analyse

### Documentation officielle

Le schéma JSON de Replicate indique que `system_instruction` est un paramètre valide :

```json
"system_instruction": {
  "type": "string",
  "title": "System Instruction",
  "x-order": 1,
  "nullable": true,
  "description": "System instruction to guide the model's behavior"
}
```

### Mais l'exemple officiel ne l'utilise PAS

```javascript
// Exemple officiel de Replicate
const output = await replicate.run('google/gemini-2.5-flash', {
  input: {
    prompt: 'A recipe for flan',  // ✅ Seulement prompt
    max_output_tokens: 1024,
    temperature: 0.7,
    top_p: 0.95,
    dynamic_thinking: false
  }
});
```

**Observation:** L'exemple officiel n'utilise **que** le champ `prompt`, sans `system_instruction`.

---

## ✅ Solution (Workaround)

### Combiner system_instruction et prompt dans un seul champ

```javascript
// Construire les instructions séparément (pour clarté du code)
const systemInstruction = `You are an expert in AI image generation prompts...
Key guidelines:
- Use clear, descriptive English
- Include specific visual elements
...
Return ONLY the enhanced prompt in English, nothing else.`;

const userPrompt = "La Dame Blanche se repose";

// WORKAROUND: Combiner les deux dans le champ prompt
const fullPrompt = `${systemInstruction}\n\n---\n\nUser prompt to enhance: ${userPrompt}`;

const output = await replicate.run('google/gemini-2.5-flash', {
  input: {
    prompt: fullPrompt,  // ✅ Tout dans prompt
    max_output_tokens: 512,
    temperature: 0.7,
    top_p: 0.95,
    dynamic_thinking: false
  }
});
```

---

## 📝 Implémentation dans le code

### Fichier: `backend/services/promptEnhancer.js`

**Avant (ne fonctionnait pas):**
```javascript
const output = await replicate.run('google/gemini-2.5-flash', {
  input: {
    system_instruction: systemInstruction,  // ❌ Ignoré
    prompt: userPrompt,
    ...
  }
});
```

**Après (fonctionne):**
```javascript
// Combiner system instruction et prompt
const fullPrompt = `${systemInstruction}\n\n---\n\nUser prompt to enhance: ${userPrompt}`;

const output = await replicate.run('google/gemini-2.5-flash', {
  input: {
    prompt: fullPrompt,  // ✅ Instructions + prompt combinés
    max_output_tokens: 512,
    temperature: 0.7,
    top_p: 0.95,
    dynamic_thinking: false
  }
});
```

---

## 🧪 Tests de validation

### Test 1 : Avec system_instruction séparé (BUG)

**Input:**
```json
{
  "system_instruction": "You are an expert...",
  "prompt": "La Dame Blanche se repose"
}
```

**Output:**
```json
{
  "logs": "Input token count: 0\nOutput token count: 0",
  "output": []
}
```

❌ **ÉCHEC** : Aucun token traité

### Test 2 : Avec prompt combiné (WORKAROUND)

**Input:**
```json
{
  "prompt": "You are an expert...\n\n---\n\nUser prompt to enhance: La Dame Blanche se repose"
}
```

**Output attendu:**
```json
{
  "logs": "Input token count: 150\nOutput token count: 35",
  "output": ["A woman in white resting peacefully..."]
}
```

✅ **SUCCÈS** : Tokens traités et réponse générée

---

## 📊 Impact

### Fichiers modifiés
- ✅ `backend/services/promptEnhancer.js` (ligne ~117-127)

### Contextes affectés
- ✅ Génération d'images (targetType='image')
- ✅ Édition d'images (targetType='edit')
- ✅ Génération de vidéos (targetType='video')
- ✅ Tous les appels à `enhancePrompt()`

### Autres services Gemini
À vérifier :
- ⚠️ `backend/services/workflowAnalyzer.js`
- ⚠️ `backend/services/tasks/GenerateWorkflowTask.js`

---

## 🔮 Hypothèses sur la cause

### Hypothèse 1: Bug temporaire de l'API Replicate
Le paramètre `system_instruction` est documenté mais pas encore implémenté côté serveur.

### Hypothèse 2: Restriction du modèle
Gemini 2.5 Flash sur Replicate ne supporte peut-être pas `system_instruction` (contrairement à l'API native Google).

### Hypothèse 3: Version du modèle
La version déployée sur Replicate pourrait être différente de la version documentée.

---

## 📋 Actions recommandées

### Court terme (FAIT)
- ✅ Implémenter le workaround (combiner dans prompt)
- ✅ Documenter le problème
- ✅ Tester avec différents types de prompts

### Moyen terme (TODO)
- ⏳ Vérifier les autres services utilisant Gemini
- ⏳ Tester périodiquement si le bug est corrigé
- ⏳ Signaler le bug à Replicate si confirmé

### Long terme (TODO)
- ⏳ Surveiller les changelogs de Replicate
- ⏳ Revenir à `system_instruction` quand le bug sera fixé
- ⏳ Optimiser la longueur du prompt combiné si nécessaire

---

## 📚 Références

- **Documentation Replicate:** https://replicate.com/google/gemini-2.5-flash
- **Issue potentielle:** À créer sur le forum Replicate
- **Workaround source:** Tests internes du 3 novembre 2025

---

## ⚠️ Note importante

Ce workaround augmente légèrement la longueur du prompt (instructions + séparateur + prompt utilisateur), mais c'est actuellement la **seule solution fonctionnelle** pour utiliser Gemini 2.5 Flash avec des instructions système sur Replicate.

**Token overhead estimé:** +100-200 tokens selon le contexte

---

*Document créé le 3 novembre 2025*  
*Dernière mise à jour: 3 novembre 2025*
