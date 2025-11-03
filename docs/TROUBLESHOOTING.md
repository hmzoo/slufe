# Guide de dépannage

## 🔧 Problèmes courants

### 1. Gemini retourne une réponse vide

**Symptôme** :
```
📄 Replicate Gemini response: 
❌ Erreur parsing JSON: Error: No JSON found in response
⚠️  FALLBACK: Utilisation de l'analyse basique
```

**Causes possibles** :

1. **Token Replicate invalide ou expiré**
   - Vérifier que `REPLICATE_API_TOKEN` est défini dans `.env`
   - Tester avec : `echo $REPLICATE_API_TOKEN`
   - Obtenir un nouveau token sur https://replicate.com/account/api-tokens

2. **Modèle Gemini pas encore disponible**
   - Le modèle `google/gemini-2.5-flash` peut ne pas être disponible
   - Essayer avec `google/gemini-2.0-flash-exp:latest`
   - Vérifier la disponibilité sur https://replicate.com/google

3. **Quota Replicate dépassé**
   - Vérifier le compte Replicate : https://replicate.com/account/billing
   - Ajouter des crédits si nécessaire

4. **Timeout de requête**
   - Le timeout est configuré à 10 minutes dans `replicate.js`
   - Gemini peut prendre du temps à répondre

**Solutions** :

#### Solution 1 : Vérifier la configuration
```bash
cd backend
cat .env | grep REPLICATE_API_TOKEN
```

#### Solution 2 : Tester le token directement
```bash
curl -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "google/gemini-2.5-flash",
    "input": {"prompt": "test"}
  }'
```

#### Solution 3 : Changer de modèle
Dans `workflowAnalyzer.js`, remplacer :
```javascript
const output = await replicate.run(
  'google/gemini-2.5-flash',  // ← Changer ici
  { /* ... */ }
);
```

Par :
```javascript
const output = await replicate.run(
  'google/gemini-2.0-flash-exp:latest',  // ← Version alternative
  { /* ... */ }
);
```

#### Solution 4 : Utiliser Gemini API directement
Si Replicate ne fonctionne pas, utiliser l'API Gemini directement :

1. Obtenir une clé API : https://aistudio.google.com/apikey
2. Ajouter dans `.env` :
   ```
   GEMINI_API_KEY=your_key_here
   ```
3. Le code tombera automatiquement sur `performGeminiAnalysis()` si disponible

### 2. Mode fallback activé constamment

**Symptôme** :
```
⚠️  FALLBACK: Utilisation de l'analyse basique (règles heuristiques)
```

**Causes** :
- Gemini ne retourne pas de JSON valide
- Les deux méthodes (Replicate + API directe) échouent

**Impact** :
- L'analyse fonctionne toujours grâce au mode heuristic
- Confiance réduite à ~70%
- Prompts optimisés moins précis

**Solutions** :
1. Vérifier les logs détaillés avec les nouveaux messages de debug
2. Résoudre le problème Gemini (voir section 1)
3. Le mode fallback est fiable pour une utilisation basique

### 3. Images non analysées

**Symptôme** :
```
⚠️  Erreur analyse image: ...
```

**Causes** :
- Token Replicate invalide
- Modèle LLaVA pas disponible
- Image trop grande (>10MB)

**Solutions** :
1. Vérifier `REPLICATE_API_TOKEN`
2. Réduire la taille des images avant upload
3. Les descriptions en cache sont réutilisées pendant 1h

### 4. Paramètres par défaut non appliqués

**Symptôme** :
- Les images/vidéos ne correspondent pas au format attendu
- Aspect ratio incorrect

**Cause** :
- Désynchronisation entre frontend et backend

**Solution** :
1. Vérifier que les fichiers de config sont identiques :
   - `/backend/config/defaults.js`
   - `/frontend/src/config/defaults.js`
2. Relancer le serveur après modification
3. Voir `/docs/DEFAULTS_SYNC.md` pour plus de détails

### 5. Erreur "Failed to resolve import"

**Symptôme** :
```
Failed to resolve import "../services/api" from "src/components/PromptInput.vue"
```

**Cause** :
- Import incorrect dans un composant Vue

**Solution** :
```javascript
// ❌ Incorrect
import api from '../services/api';

// ✅ Correct
import { api } from 'src/boot/axios';
```

## 🐛 Mode debug

### Activer les logs détaillés

Les logs détaillés sont maintenant activés par défaut pour le workflow analyzer. Chercher dans la console :

```
🔍 Type de output: ...
🔍 Output brut: ...
📋 Output est un array/string/objet: ...
```

### Tester un workflow manuellement

```bash
curl -X POST http://localhost:3000/api/workflow/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "créer une image de chat",
    "imageCount": 0
  }'
```

### Tester la génération directe

```bash
# Image
curl -X POST http://localhost:3000/api/generate/text-to-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "un chat mignon"}'

# Vidéo
curl -X POST http://localhost:3000/api/video/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "un chat qui joue"}'
```

## 📊 Vérifier l'état du système

### Backend
```bash
curl http://localhost:3000/api/generate/status
curl http://localhost:3000/api/video/status
```

### Variables d'environnement
```bash
cd backend
cat .env | grep -E "REPLICATE_API_TOKEN|GEMINI_API_KEY"
```

## 🆘 Support

Si le problème persiste :

1. **Vérifier les logs complets** dans la console backend
2. **Copier les logs** pertinents (avec les nouveaux emojis 🔍📋📄)
3. **Vérifier la documentation** :
   - `/docs/DEFAULTS_SYNC.md` - Paramètres par défaut
   - `/docs/ARCHITECTURE.md` - Architecture générale
4. **Issues GitHub** : Créer une issue avec les logs

## 🎯 Checklist de diagnostic

- [ ] `REPLICATE_API_TOKEN` est défini et valide
- [ ] Le backend démarre sans erreur
- [ ] Le frontend compile sans erreur
- [ ] Les deux serveurs tournent (backend:3000, frontend:9000)
- [ ] Aucune erreur CORS dans la console navigateur
- [ ] Les images s'uploadent correctement
- [ ] Le mode fallback fonctionne même si Gemini échoue
