# Vérification de Conformité API

Date: 2025-11-02
Status: ✅ Vérifié et conforme

## 🎯 Gemini 2.5 Flash (`google/gemini-2.5-flash`)

### Implémentation actuelle dans `promptEnhancer.js`
```javascript
{
  prompt: "...",              // ✅ Requis - string
  max_output_tokens: 1024,    // ✅ Integer (1-65535), default: 65535
  temperature: 0.7,           // ✅ Number (0-2), default: 1
  top_p: 0.95,                // ✅ Number (0-1), default: 0.95
  dynamic_thinking: false,    // ✅ Boolean, default: false
}
```

### Paramètres optionnels non utilisés
- `system_instruction` (string, nullable) - Pourrait être ajouté pour guider le comportement
- `thinking_budget` (integer 0-24576, nullable) - Pour le raisonnement complexe

### Output
- **Type retourné**: `array` de strings
- **Traitement**: `output.join('')` ✅
- **Display**: concatenate (iterator)

### Statut: ✅ Conforme
Les paramètres essentiels sont utilisés correctement.

---

## 🖼️ LLaVA 13B (`yorickvp/llava-13b`)

### Implémentation actuelle dans `imageAnalyzer.js`
```javascript
{
  image: imageData,           // ✅ Requis - string (URI ou data:)
  prompt: "...",              // ✅ Requis - string
  top_p: 1,                   // ✅ Number (0-1), default: 1
  max_tokens: 1024,           // ✅ Integer (min: 0), default: 1024
  temperature: 0.2,           // ✅ Number (min: 0), default: 0.2
}
```

### Gestion des images
- ✅ Supporte URL directe (convertie en base64 par `urlToBase64()`)
- ✅ Supporte data URI base64
- ✅ Format: `data:image/jpeg;base64,...`

### Output
- **Type retourné**: `array` de strings
- **Traitement**: `output.join('')` ✅
- **Display**: concatenate (iterator)

### Statut: ✅ Conforme
Tous les paramètres requis sont présents et correctement typés.

---

## 📝 Recommandations

### Pour Gemini 2.5 Flash
1. **Optionnel**: Ajouter `system_instruction` pour un meilleur contrôle
   ```javascript
   system_instruction: "Tu es un expert en génération d'images par IA..."
   ```

2. **Optionnel**: Utiliser `thinking_budget` pour des tâches complexes
   ```javascript
   thinking_budget: 1000  // Pour raisonnement approfondi
   ```

### Pour LLaVA 13B
1. ✅ La gestion actuelle est optimale
2. ✅ Temperature 0.2 est idéale pour descriptions objectives
3. ✅ max_tokens 1024 est un bon équilibre

### Gestion des outputs
Les deux modèles retournent des **arrays** qu'on concatene avec `.join('')`:
```javascript
if (Array.isArray(output)) {
  result = output.join('');
}
```
✅ Cette approche est correcte pour les deux modèles.

---

## 🔧 Changements appliqués aujourd'hui

1. ✅ Corrigé le nom du modèle Gemini: `google/gemini-2.5-flash` (au lieu de 2.0)
2. ✅ Ajouté `dynamic_thinking: false` explicitement
3. ✅ Retiré le hash de version pour LLaVA: `yorickvp/llava-13b` (sans `:hash`)
4. ✅ Corrigé le champ `prompt` dans PromptInput.vue (était `text`)
5. ✅ Mis à jour les fichiers de référence API avec la doc officielle

---

## 🧪 Tests recommandés

### Test Gemini
```bash
curl -X POST http://localhost:3000/api/prompt/enhance \
  -H "Content-Type: application/json" \
  -d '{"prompt":"un chat mignon"}'
```

### Test LLaVA
```bash
curl -X POST http://localhost:3000/api/images/analyze \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/cat.jpg"}'
```

---

## 📚 Documentation de référence

- Gemini 2.5 Flash: `backend/references_API/gemini-2.5-flash.json`
- LLaVA 13B: `backend/references_API/llava-13b.json`
- Replicate Docs: https://replicate.com/docs

Ces fichiers contiennent la documentation officielle complète copiée depuis Replicate.
