# API Real-ESRGAN (nightmareai/real-esrgan) - Référence

## Vue d'ensemble
Real-ESRGAN est un modèle d'amélioration d'image utilisant la super-résolution guidée par réseau génératif. Il permet d'upscaler et d'améliorer la qualité des images.

**Fournisseur:** Replicate  
**Modèle:** `nightmareai/real-esrgan`  
**Documentation:** https://replicate.com/nightmareai/real-esrgan

---

## Entrées (Input)

### `image` (requis)
- **Type:** `string (URI)`
- **Description:** URL de l'image à améliorer
- **Exemple:** `https://example.com/image.jpg`

### `scale` (optionnel)
- **Type:** `number`
- **Default:** `4`
- **Min:** `0`
- **Max:** `10`
- **Description:** Facteur d'upscaling (multiplicateur de résolution)
- **Valeurs recommandées:**
  - `2` : Upscale 2x (recommandé pour petites images)
  - `4` : Upscale 4x (par défaut, bon équilibre)
  - `8` : Upscale 8x (pour très petites images)

### `face_enhance` (optionnel)
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Active l'amélioration des visages (GFPGAN) en parallèle de l'upscaling
- **Utilité:** Améliore la qualité des visages détectés dans l'image

---

## Sorties (Output)

### Résultat
- **Type:** `string (URI)`
- **Description:** URL de l'image améliorée
- **Format:** Image PNG ou JPEG (selon format d'entrée)
- **Exemple:** `https://replicate.delivery/pbxt/xxxxx/output.png`

---

## Flux d'exécution

```
1. User input: Image + Scale + Face Enhance
         ↓
2. Frontend → POST /api/workflows/execute
         ↓
3. Backend: Download image → Replicate API
         ↓
4. Replicate: Real-ESRGAN processing
         ↓
5. Replicate: Return improved image URL
         ↓
6. Backend: Return result to frontend
         ↓
7. Frontend: Display improved image
```

---

## Exemple de requête Node.js

```javascript
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const input = {
  image: "https://replicate.delivery/pbxt/Ing7Fa4YMk6YtcoG1YZnaK3UwbgDB5guRc5M2dEjV6ODNLMl/cat.jpg",
  scale: 4,
  face_enhance: false
};

const output = await replicate.run("nightmareai/real-esrgan", { input });
console.log(output); // URL of improved image
```

---

## Implémentation SLUFE

### Tâche Frontend
```json
{
  "id": "image_enhance",
  "type": "image_enhance",
  "name": "Amélioration d'image",
  "category": "image-processing",
  "config": {
    "scale": 4,
    "face_enhance": false
  }
}
```

### Service Backend
**Fichier:** `backend/services/tasks/ImageEnhanceTask.js`

```javascript
import Replicate from "replicate";

export class ImageEnhanceTask {
  constructor() {
    this.taskType = 'image_enhance';
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }

  async execute(inputs) {
    // Implementation détaillée ci-dessous
  }
}
```

### Paramètres d'exécution
- `image`: URL ou chemin local de l'image à améliorer
- `scale`: Facteur d'upscaling (2-10)
- `face_enhance`: Activation de l'amélioration des visages

### Résultat
```json
{
  "image_url": "https://replicate.delivery/pbxt/.../output.png",
  "original_url": "https://example.com/image.jpg",
  "scale": 4,
  "face_enhance": false,
  "status": "success"
}
```

---

## Considérations

### Avantages
- ✅ Excellente qualité d'upscaling
- ✅ Amélioration des visages disponible
- ✅ Rapide et fiable
- ✅ API gratuite avec limite généreuse
- ✅ Gère plusieurs formats (PNG, JPEG, WebP)

### Limitations
- ⚠️ Coûte des crédits Replicate
- ⚠️ Temps de traitement: 5-30 secondes
- ⚠️ Limite de taille d'entrée
- ⚠️ Nécessite clé API Replicate

### Coûts estimés
- Real-ESRGAN: ~0.001 crédit par image
- GFPGAN (face_enhance): +0.0005 crédit par image

---

## Variables d'environnement requises

```env
REPLICATE_API_TOKEN=your_token_here
```

---

## Gestion des erreurs

```javascript
// Erreurs possibles:
- "Image URL invalid" → Vérifier URL ou télécharger image
- "Invalid scale value" → Scale doit être entre 0 et 10
- "API rate limit" → Attendre avant nouvelle tentative
- "Task timeout" → Image trop grande ou API surchargée
```

---

## Intégration Workflow

### Exemple de workflow complet
```json
{
  "name": "Amélioration et Upscaling d'images",
  "inputs": [
    {
      "id": "selected_image",
      "type": "image",
      "label": "Image à améliorer",
      "required": true
    }
  ],
  "tasks": [
    {
      "id": "enhance",
      "type": "image_enhance",
      "inputs": {
        "image": "{{selected_image}}",
        "scale": 4,
        "face_enhance": true
      }
    }
  ],
  "outputs": [
    {
      "id": "result",
      "type": "image_output",
      "source": "{{enhance.image_url}}"
    }
  ]
}
```
