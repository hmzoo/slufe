# Service d'amélioration de prompts avec Replicate

## Description
Ce service utilise le modèle **Gemini 2.5 Flash** de Google via l'API Replicate pour améliorer automatiquement les prompts utilisateurs destinés à la génération d'images par IA.

## Configuration

### 1. Obtenir une clé API Replicate

1. Créez un compte sur [Replicate](https://replicate.com)
2. Accédez à votre profil > API tokens
3. Créez un nouveau token
4. Copiez le token (format: `r8_...`)

### 2. Configurer la variable d'environnement

Éditez le fichier `backend/.env` :

```env
REPLICATE_API_TOKEN=r8_votre_token_ici
```

## Utilisation

### Endpoint: POST /api/prompt/enhance

Améliore un prompt utilisateur en le rendant plus détaillé et précis.

**Requête:**
```bash
curl -X POST http://localhost:3000/api/prompt/enhance \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Un coucher de soleil sur un lac"
  }'
```

**Réponse (succès):**
```json
{
  "success": true,
  "enhanced": "Créez une image détaillée d'un magnifique coucher de soleil sur un lac tranquille. Le ciel devrait afficher des teintes vibrantes d'orange, de rose et de violet se reflétant sur la surface calme de l'eau. Style photographique professionnel avec une composition équilibrée, éclairage naturel doux, profondeur de champ cinématographique. Ambiance paisible et sereine, qualité 8K, rendu photoréaliste.",
  "original": "Un coucher de soleil sur un lac",
  "mock": false
}
```

**Réponse (mode mock si token non configuré):**
```json
{
  "success": true,
  "enhanced": "Créez une image détaillée et de haute qualité représentant Un coucher de soleil sur un lac. Style photographique professionnel, éclairage naturel et doux, composition harmonieuse et équilibrée...",
  "original": "Un coucher de soleil sur un lac",
  "mock": true,
  "message": "Réponse mock - Configurez REPLICATE_API_TOKEN pour utiliser l'IA réelle"
}
```

### Endpoint: GET /api/prompt/status

Vérifie si le service est configuré et opérationnel.

**Requête:**
```bash
curl http://localhost:3000/api/prompt/status
```

**Réponse:**
```json
{
  "success": true,
  "service": "promptEnhancer",
  "configured": true,
  "model": "google/gemini-2.0-flash-exp",
  "status": "ready",
  "message": "Service d'amélioration de prompt opérationnel"
}
```

## Structure du code

### services/promptEnhancer.js
Contient la logique d'appel au modèle Replicate:
- `enhancePrompt(inputText)` - Fonction principale d'amélioration
- `isReplicateConfigured()` - Vérifie si le token est configuré

### routes/prompt.js
Définit les endpoints Express:
- `POST /api/prompt/enhance` - Route d'amélioration
- `GET /api/prompt/status` - Route de statut

## Paramètres du modèle

Le service utilise les paramètres suivants pour Gemini 2.5 Flash:

```javascript
{
  prompt: "Instruction système + prompt utilisateur",
  max_output_tokens: 512,      // Longueur maximale de la réponse
  temperature: 0.7,             // Créativité (0-1)
  top_p: 0.95                   // Diversité des tokens
}
```

## Gestion des erreurs

Le service gère automatiquement:
- ✅ Token API manquant → Mode mock activé
- ✅ Prompt vide → Erreur 400
- ✅ Prompt trop long (>2000 caractères) → Erreur 400
- ✅ Rate limiting → Erreur 429
- ✅ Erreurs Replicate → Erreur 500

## Mode développement

Si `REPLICATE_API_TOKEN` n'est pas configuré, le service fonctionne en **mode mock** et retourne des prompts améliorés génériques. Cela permet de développer et tester sans API key.

## Exemple d'intégration frontend

```javascript
// Dans le store Pinia ou un composant Vue
async function improvePrompt(originalPrompt) {
  try {
    const response = await fetch('http://localhost:3000/api/prompt/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: originalPrompt }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.enhanced;
    } else {
      console.error('Erreur:', data.error);
      return originalPrompt;
    }
  } catch (error) {
    console.error('Erreur réseau:', error);
    return originalPrompt;
  }
}
```

## Coûts

Le modèle Gemini 2.5 Flash sur Replicate facture à l'utilisation:
- Vérifiez les tarifs actuels sur [replicate.com/pricing](https://replicate.com/pricing)
- Utilisez le mode mock pour le développement
- Implémentez un système de cache pour réduire les coûts

## Limites

- Maximum 2000 caractères par prompt
- Rate limiting selon votre plan Replicate
- Timeout de requête: 30 secondes par défaut

## Dépannage

### "REPLICATE_API_TOKEN non configuré"
→ Ajoutez votre token dans `backend/.env`

### "rate limit exceeded"
→ Attendez quelques minutes ou augmentez votre quota Replicate

### Le prompt amélioré est identique à l'original
→ Vérifiez que vous utilisez bien le modèle réel (mock: false)

## Tests

Pour tester le service:

```bash
# Vérifier le statut
curl http://localhost:3000/api/prompt/status

# Tester l'amélioration
curl -X POST http://localhost:3000/api/prompt/enhance \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Une maison"}'
```
