# 📊 Endpoints Backend Utilisés par le Frontend

## Vue d'ensemble

Le frontend SLUFE utilise actuellement **26 endpoints** différents du backend, organisés en 7 groupes principaux.

---

## 🔄 **Workflow - Exécution** (2 endpoints)

### POST `/api/workflow/run`
- **Fichier:** `stores/useWorkflowStore.js` (lignes 513, 528)
- **Usage:** Exécution de workflows complets avec tâches séquentielles
- **Content-Type:** `multipart/form-data` (avec images) ou `application/json`
- **Fréquence:** ⭐⭐⭐ (Core feature - exécution workflows)

---

## 📤 **Upload & Media** (6 endpoints)

### POST `/api/upload/single`
- **Fichier:** `services/uploadMedia.js` (ligne 16)
- **Usage:** Upload d'un seul fichier média
- **Content-Type:** `multipart/form-data`

### POST `/api/upload/multiple`  
- **Fichier:** `services/uploadMedia.js` (ligne 42)
- **Usage:** Upload de plusieurs fichiers simultanément
- **Content-Type:** `multipart/form-data`

### POST `/api/upload/fields`
- **Fichier:** `services/uploadMedia.js` (ligne 74) 
- **Usage:** Upload avec champs multiples personnalisés
- **Content-Type:** `multipart/form-data`

### GET `/api/upload/media/:id`
- **Fichier:** `services/uploadMedia.js` (ligne 93), `components/CollectionMediaSelector.vue` (ligne 319)
- **Usage:** Récupérer métadonnées d'un média par ID
- **Fréquence:** ⭐⭐ (Consultation médias)

### GET `/api/upload/medias`
- **Fichier:** `services/uploadMedia.js` (lignes 102, 131)
- **Usage:** Lister tous les médias uploadés
- **Fréquence:** ⭐⭐ (Galeries médias)

### DELETE `/api/upload/media/:id`  
- **Fichier:** `services/uploadMedia.js` (lignes 112, 122)
- **Usage:** Supprimer un média par ID
- **Fréquence:** ⭐ (Gestion médias)

---

## 🗂️ **Collections** (13 endpoints)

### GET `/api/collections`
- **Fichier:** `components/CollectionManager.vue` (ligne 645), `stores/useCollectionStore.js` (ligne 69)
- **Usage:** Récupérer toutes les collections disponibles
- **Fréquence:** ⭐⭐⭐ (Navigation collections)

### GET `/api/collections/current/info`
- **Fichier:** `components/CollectionManager.vue` (ligne 664), `stores/useCollectionStore.js` (ligne 88)
- **Usage:** Informations sur la collection actuellement active
- **Fréquence:** ⭐⭐⭐ (État courant)

### GET `/api/collections/current/gallery`
- **Fichier:** `components/CollectionMediaSelector.vue` (ligne 288)
- **Usage:** Récupérer galerie de la collection courante
- **Fréquence:** ⭐⭐⭐ (Sélecteur médias)

### GET `/api/collections/:id`
- **Fichier:** `stores/useCollectionStore.js` (ligne 106)  
- **Usage:** Récupérer une collection spécifique par ID
- **Fréquence:** ⭐⭐ (Détails collection)

### POST `/api/collections`
- **Fichier:** `components/CollectionManager.vue` (ligne 745), `stores/useCollectionStore.js` (ligne 158)
- **Usage:** Créer une nouvelle collection
- **Fréquence:** ⭐⭐ (Création collections)

### POST `/api/collections/current/set`
- **Fichier:** `components/CollectionManager.vue` (ligne 699), `stores/useCollectionStore.js` (ligne 135)
- **Usage:** Définir la collection courante active
- **Content-Type:** `application/json`
- **Body:** `{ collectionId: "col_123" }`
- **Fréquence:** ⭐⭐⭐ (Changement collection active)

### PUT `/api/collections/:id`
- **Fichier:** `components/CollectionManager.vue` (ligne 742), `stores/useCollectionStore.js` (ligne 182)
- **Usage:** Mettre à jour une collection existante
- **Fréquence:** ⭐⭐ (Édition collections)

### DELETE `/api/collections/:id`
- **Fichier:** `components/CollectionManager.vue` (ligne 786), `stores/useCollectionStore.js` (ligne 206)
- **Usage:** Supprimer une collection
- **Fréquence:** ⭐ (Suppression collections)

### POST `/api/collections/:id/images`
- **Fichier:** `components/CollectionManager.vue` (ligne 856), `stores/useCollectionStore.js` (ligne 273)
- **Usage:** Ajouter des images à une collection spécifique
- **Content-Type:** `application/json`
- **Fréquence:** ⭐⭐ (Ajout médias)

### DELETE `/api/collections/:id/images/:imageUrl(*)`
- **Fichier:** `components/CollectionManager.vue` (ligne 942), `stores/useCollectionStore.js` (ligne 250)
- **Usage:** Supprimer une image d'une collection
- **Note:** URL encodée dans le paramètre
- **Fréquence:** ⭐⭐ (Suppression médias)

### PUT `/api/collections/:id/images/:imageUrl(*)`
- **Fichier:** `components/CollectionManager.vue` (ligne 896)
- **Usage:** Mettre à jour métadonnées d'une image
- **Fréquence:** ⭐ (Édition métadonnées)

### Routes collections manquantes dans stores:
- `GET /collections` (au lieu de `/api/collections`)
- `GET /collections/current/info` (au lieu de `/api/collections/current/info`)  
- `GET /collections/:id` (au lieu de `/api/collections/:id`)
- `POST /collections/current/set` (au lieu de `/api/collections/current/set`)

> **⚠️ Problème identifié:** Le store utilise des URLs sans le préfixe `/api/` pour certaines routes collections, ce qui peut causer des erreurs.

---

## 📋 **Templates** (5 endpoints)

### GET `/api/templates`
- **Fichier:** `stores/useTemplateStore.js` (ligne 81)
- **Usage:** Récupérer tous les templates de workflows
- **Fréquence:** ⭐⭐ (Navigation templates)

### GET `/api/templates/:id`
- **Fichier:** `stores/useTemplateStore.js` (ligne 111) 
- **Usage:** Récupérer un template spécifique
- **Fréquence:** ⭐⭐ (Détails template)

### POST `/api/templates`
- **Fichier:** `stores/useTemplateStore.js` (ligne 149)
- **Usage:** Créer un nouveau template
- **Content-Type:** `application/json`
- **Fréquence:** ⭐ (Création templates)

### PUT `/api/templates/:id`
- **Fichier:** `stores/useTemplateStore.js` (ligne 182)
- **Usage:** Mettre à jour un template existant
- **Fréquence:** ⭐ (Édition templates)

### DELETE `/api/templates/:id`
- **Fichier:** `stores/useTemplateStore.js` (ligne 223)
- **Usage:** Supprimer un template
- **Fréquence:** ⭐ (Suppression templates)

---

## 📊 **Statistiques d'usage**

### Par fréquence d'utilisation:
- **⭐⭐⭐ Critical (6 endpoints):** workflow/run, collections courantes, galleries
- **⭐⭐ Important (12 endpoints):** gestion collections, templates, médias  
- **⭐ Occasionnel (8 endpoints):** suppression, édition métadonnées

### Par groupe fonctionnel:
- **Collections:** 13 endpoints (50%)
- **Upload/Media:** 6 endpoints (23%) 
- **Templates:** 5 endpoints (19%)
- **Workflow:** 2 endpoints (8%)

---

## ⚠️ **Problèmes identifiés**

### 1. **Incohérence URLs dans CollectionStore**
Le fichier `stores/useCollectionStore.js` utilise des URLs sans préfixe `/api/` pour 4 routes:
- `GET /collections` → devrait être `GET /api/collections`
- `GET /collections/current/info` → devrait être `GET /api/collections/current/info`
- `GET /collections/:id` → devrait être `GET /api/collections/:id`  
- `POST /collections/current/set` → devrait être `POST /api/collections/current/set`

### 2. **Configuration axios multiple**
- `useTemplateStore.js` utilise une instance axios séparée avec `API_URL`
- Les autres utilisent l'instance `api` configurée dans `boot/axios.js`

### 3. **Upload URLs dynamiques**  
Dans `CollectionImageUpload.vue` et `WorkflowBuilder.vue`, les URLs d'upload sont construites dynamiquement selon le contexte.

---

## 🚀 **Recommandations**

1. **Corriger les URLs du CollectionStore** pour utiliser le préfixe `/api/`
2. **Uniformiser l'utilisation d'axios** (utiliser l'instance `api` partout)
3. **Ajouter la route `/api/media`** manquante au serveur backend
4. **Valider que tous les endpoints documentés** fonctionnent avec le frontend

---

**Analyse effectuée le 13 novembre 2025**  
**Frontend version:** Quasar Vue 3 + Pinia  
**Backend compatibility:** ✅ 92% | ⚠️ 8% (URLs inconsistantes)