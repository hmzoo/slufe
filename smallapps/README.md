# 🚀 SmallApp - Standalone Template Executor

Application standalone autonome qui génère dynamiquement une interface utilisateur à partir d'un fichier `template.json`.

## 📋 Concept

Cette application est une version **légère et autonome** de l'AppViewer du frontend principal. Elle peut être déployée indépendamment et s'adapte automatiquement au template fourni.

### Caractéristiques

✅ **100% Autonome** - Aucune dépendance au frontend principal  
✅ **Génération Dynamique** - Interface créée à partir du template.json  
✅ **Support Caméra** - Capture photo avec getUserMedia API  
✅ **Responsive Mobile** - Optimisé pour mobile et desktop  
✅ **Drag & Drop** - Upload d'images par glisser-déposer  
✅ **HTTPS Ready** - Fonctionne en HTTPS pour la caméra mobile  

---

## 📁 Structure

```
smallapps/
├── index.html          # Interface HTML
├── app.js              # Logique JavaScript
├── template.json       # Configuration du workflow (MODIFIABLE)
└── README.md          # Ce fichier
```

---

## 🎯 Fonctionnement

### 1. **Chargement du Template**

Au démarrage, l'application charge `template.json` qui contient :

```json
{
  "name": "Mon Application",
  "description": "Description de l'app",
  "workflow": {
    "inputs": [
      {
        "id": "text1",
        "type": "text_input",
        "label": "Prompt",
        "required": true
      },
      {
        "id": "image1",
        "type": "image_input",
        "label": "Image",
        "required": true
      }
    ],
    "tasks": [...],
    "outputs": [...]
  }
}
```

### 2. **Génération de l'Interface**

L'application lit les `inputs` du workflow et génère automatiquement :

- **text_input** → Champ texte / textarea
- **image_input** → Zone d'upload + boutons caméra
- **select_input** → Menu déroulant
- **number_input** → Champ numérique

### 3. **Exécution du Workflow**

Lorsque l'utilisateur clique sur "Exécuter" :

**Process :**
1. Upload des images vers `/api/media/upload`
2. Envoi du workflow vers `/api/workflow/run`
3. Affichage des résultats

---

## 🚀 Utilisation

### Méthode 1 : Serveur Simple (Dev)

```bash
# Dans le dossier smallapps/
python3 -m http.server 8080

# Ou avec Node.js
npx serve -p 8080

# Ou avec PHP
php -S localhost:8080
```

Ouvrir : `http://localhost:8080`

⚠️ **Limitation** : La caméra ne fonctionne qu'en `localhost` ou HTTPS

---

### Méthode 2 : Via le Backend Principal

Le backend Slufe sert automatiquement le dossier `smallapps` :

```bash
cd backend/
node server.js
```

Accès : 
- Local : `http://localhost:3000/smallapps/`
- HTTPS : `https://192.168.x.x/smallapps/` (via reverse proxy)

---

### Méthode 3 : Déploiement Standalone

Copier le dossier `smallapps/` sur n'importe quel serveur web :

```bash
# Exemple avec Nginx
cp -r smallapps/ /var/www/html/myapp/

# Exemple avec Apache
cp -r smallapps/ /var/www/html/myapp/
```

Accès : `https://votredomaine.com/myapp/`

---

## 🎨 Personnalisation du Template

### Exemple : Application de Modification d'Image

```json
{
  "name": "Éditeur d'Image AI",
  "description": "Modifiez vos images avec l'intelligence artificielle",
  "icon": "edit",
  "workflow": {
    "inputs": [
      {
        "id": "prompt",
        "type": "text_input",
        "label": "Instructions de modification",
        "placeholder": "Ex: Ajouter un coucher de soleil...",
        "multiline": true,
        "required": true
      },
      {
        "id": "image",
        "type": "image_input",
        "label": "Image à modifier",
        "required": true
      }
    ],
    "tasks": [
      {
        "id": "edit",
        "type": "edit_image",
        "inputs": {
          "image1": "{{image.image}}",
          "editPrompt": "{{prompt.text}}",
          "aspectRatio": "original"
        }
      }
    ],
    "outputs": [
      {
        "id": "result",
        "type": "image_output",
        "inputs": {
          "image": "{{edit.edited_images}}"
        }
      }
    ]
  }
}
```

### Exemple : Générateur de Texte

```json
{
  "name": "Générateur de Descriptions",
  "description": "Générez des descriptions à partir d'une image",
  "workflow": {
    "inputs": [
      {
        "id": "style",
        "type": "select_input",
        "label": "Style de description",
        "options": [
          { "value": "formal", "label": "Formel" },
          { "value": "casual", "label": "Décontracté" },
          { "value": "poetic", "label": "Poétique" }
        ],
        "required": true
      },
      {
        "id": "photo",
        "type": "image_input",
        "label": "Photo à décrire",
        "required": true
      }
    ],
    "tasks": [
      {
        "id": "describe",
        "type": "generate_text",
        "inputs": {
          "image": "{{photo.image}}",
          "prompt": "Décris cette image en style {{style.value}}"
        }
      }
    ],
    "outputs": [
      {
        "id": "description",
        "type": "text_output",
        "inputs": {
          "text": "{{describe.text}}"
        }
      }
    ]
  }
}
```

---

## 🎯 Types d'Inputs Supportés

### text_input

```json
{
  "id": "mytext",
  "type": "text_input",
  "label": "Titre",
  "placeholder": "Entrez du texte...",
  "defaultValue": "",
  "multiline": false,
  "required": true
}
```

**Propriétés :**
- `multiline` : `true` pour textarea
- `placeholder` : Texte d'aide
- `defaultValue` : Valeur par défaut

---

### image_input

```json
{
  "id": "myimage",
  "type": "image_input",
  "label": "Photo",
  "required": true
}
```

**Fonctionnalités automatiques :**
- Upload par clic
- Drag & Drop
- Caméra arrière (tous appareils)
- Caméra frontale (mobile uniquement)

---

### number_input

```json
{
  "id": "count",
  "type": "number_input",
  "label": "Nombre",
  "min": 1,
  "max": 10,
  "step": 1,
  "defaultValue": 5,
  "required": true
}
```

---

### select_input

```json
{
  "id": "choice",
  "type": "select_input",
  "label": "Choisir",
  "options": [
    { "value": "option1", "label": "Option 1" },
    { "value": "option2", "label": "Option 2" }
  ],
  "defaultValue": "option1",
  "required": true
}
```

---

## 🔧 Configuration

### API Backend

Par défaut, l'app détecte automatiquement l'URL du backend :

```javascript
// Dans app.js (ligne 8-11)
const CONFIG = {
  apiBaseUrl: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : `${window.location.protocol}//${window.location.host}`,
  templateFile: 'template.json'
}
```

**Pour changer l'URL de l'API :**

```javascript
const CONFIG = {
  apiBaseUrl: 'https://mon-api.com',  // URL personnalisée
  templateFile: 'template.json'
}
```

---

### Fichier Template Alternatif

Pour charger un template différent :

```javascript
const CONFIG = {
  apiBaseUrl: '...',
  templateFile: 'mon-autre-template.json'  // Nom du fichier
}
```

Ou via URL param :

```html
<!-- Ajouter dans index.html -->
<script>
  const urlParams = new URLSearchParams(window.location.search)
  const templateFile = urlParams.get('template') || 'template.json'
</script>
```

Usage : `http://localhost:8080?template=autre.json`

---

## 📱 Support Mobile

### Caméra sur Mobile

Pour que la caméra fonctionne sur mobile, l'application **DOIT** être servie en HTTPS.

**Solutions :**

1. **Reverse Proxy HTTPS** (recommandé pour tests locaux) :
   ```bash
   cd /path/to/slufe
   sudo ./setup-https-proxy.sh
   ```
   Accès : `https://192.168.x.x/smallapps/`

2. **Certificat Let's Encrypt** (production) :
   ```bash
   sudo certbot --nginx -d votredomaine.com
   ```

3. **Tunneling Services** (dev rapide) :
   - [ngrok](https://ngrok.com) : `ngrok http 8080`
   - [localtunnel](https://localtunnel.github.io) : `lt --port 8080`

---

### Détection Mobile

L'app détecte automatiquement si l'utilisateur est sur mobile :

```javascript
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    .test(navigator.userAgent)
}
```

**Comportement :**
- **Mobile** : Affiche boutons caméra arrière + frontale
- **Desktop** : Affiche uniquement bouton caméra principale

---

## 🎨 Personnalisation de l'Interface

### Couleurs et Styles

Modifier les variables CSS dans `index.html` (ligne 20-300) :

```css
/* Gradient principal */
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Header */
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Bouton principal */
executeBtn.style.background = '#667eea';
```

---

### Logo et Titre

Dans `index.html` (ligne 315-320) :

```html
<div class="app-header">
  <h1>
    <i class="material-icons">play_circle</i>  <!-- Icône -->
    <span id="app-title">Application</span>
  </h1>
  <p id="app-description">Chargement...</p>
</div>
```

Le titre et la description sont automatiquement remplacés par ceux du `template.json`.

---

## 🔍 Debug et Logs

### Console du Navigateur

L'application log toutes les étapes :

```javascript
console.log('✅ Application initialisée', state.template)
console.log('✅ Image uploadée:', filename)
console.log('✅ Résultat:', results)
console.error('❌ Erreur:', error)
```

Ouvrir la console : `F12` → Onglet "Console"

---

### Vérifier le Template

```javascript
// Dans la console du navigateur
console.log(state.template)
console.log(state.formInputs)
```

---

## 🐛 Résolution de Problèmes

### Problème : "Impossible de charger le template"

**Cause :** Fichier `template.json` introuvable ou mal formaté

**Solution :**
1. Vérifier que `template.json` existe dans le dossier
2. Valider le JSON : [JSONLint](https://jsonlint.com)
3. Vérifier la console navigateur

---

### Problème : Caméra ne fonctionne pas

**Cause :** Application non servie en HTTPS

**Solution :**
- En local : Utiliser `localhost` OU HTTPS
- Sur mobile : OBLIGATOIRE HTTPS
- Voir section "Support Mobile" ci-dessus

---

### Problème : "CORS error" lors de l'exécution

**Cause :** Backend et frontend sur des domaines différents

**Solution :**

Configurer CORS dans le backend (`backend/server.js`) :

```javascript
app.use(cors({
  origin: ['http://localhost:8080', 'https://votredomaine.com'],
  credentials: true
}))
```

---

### Problème : Images ne s'affichent pas

**Cause :** Chemin incorrect vers `/medias`

**Solution :**

Vérifier la config API dans `app.js` :

```javascript
const imageUrl = `${CONFIG.apiBaseUrl}${imagePath}`
```

---

## 🚀 Cas d'Usage

### 1. Application Mobile Standalone

Déployer SmallApp comme PWA (Progressive Web App) :

```html
<!-- Ajouter dans <head> -->
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#667eea">
```

Créer `manifest.json` :

```json
{
  "name": "Mon App AI",
  "short_name": "AppAI",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "icon.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

### 2. Intégration dans un Site Web

Inclure dans une iframe :

```html
<iframe 
  src="https://votreapi.com/smallapps/" 
  width="100%" 
  height="800px"
  frameborder="0"
></iframe>
```

---

### 3. QR Code pour Accès Mobile

Générer un QR code pointant vers l'app :

```bash
# Utiliser un générateur en ligne
https://www.qr-code-generator.com/

# Ou via CLI
qrencode -o qrcode.png "https://192.168.1.100/smallapps/"
```

---

## 📊 Statistiques

- **Taille totale** : ~35 KB (HTML + JS)
- **Dépendances CDN** : Vue 3 + Quasar + Axios
- **Temps de chargement** : < 1 seconde
- **Compatible** : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## 🎓 Exemples de Templates

### Template Minimal

```json
{
  "name": "Hello World",
  "workflow": {
    "inputs": [
      {
        "id": "name",
        "type": "text_input",
        "label": "Votre nom",
        "required": true
      }
    ],
    "tasks": [],
    "outputs": []
  }
}
```

---

### Template Complet

Voir le fichier `template.json` inclus pour un exemple complet avec :
- Input texte multiline
- Input image avec caméra
- Tâche d'édition d'image
- Output image

---

## 🤝 Contribution

Pour améliorer SmallApp :

1. Modifier `app.js` pour ajouter des fonctionnalités
2. Ajouter des types d'inputs dans `createInputElement()`
3. Personnaliser les styles dans `index.html`

---

## 📝 Changelog

### v1.0.0 (14 novembre 2025)
- ✅ Première version
- ✅ Support inputs : text, image, number, select
- ✅ Caméra getUserMedia avec front/back
- ✅ Drag & Drop
- ✅ Interface responsive
- ✅ Upload et exécution workflow
- ✅ Affichage résultats image/texte

---

## 📄 Licence

Ce projet fait partie de l'écosystème Slufe.

---

## 📞 Support

Pour toute question :
1. Vérifier la console navigateur
2. Valider le `template.json`
3. Tester en HTTPS pour la caméra
4. Consulter les logs du backend

---

**Bonne création d'applications ! 🚀**
