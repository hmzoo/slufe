# 🎬 Guide d'Utilisation - Capture Photo dans AppViewer

## 📱 Sur Mobile (Smartphone/Tablette)

### Étapes

1. **Ouvrir AppViewer**
   - Naviguer vers l'onglet "AppViewer"

2. **Sélectionner un Template**
   - Choisir un template qui utilise une image en entrée

3. **Cliquer sur "Prendre une photo"**
   - Bouton bleu avec icône caméra
   - OU "Caméra frontale" pour un selfie

4. **Autoriser l'accès à la caméra** (première utilisation)
   ```
   ┌────────────────────────────────┐
   │ Autoriser l'accès à la caméra? │
   │                                │
   │  [Bloquer]    [Autoriser]     │
   └────────────────────────────────┘
   ```
   → Cliquer **"Autoriser"**

5. **Prévisualiser**
   - Le dialogue s'ouvre
   - Vous voyez la **prévisualisation en direct** de la caméra
   - Positionner le smartphone/tablette

6. **Capturer**
   - Cliquer sur le bouton **"Capturer"** (bleu)
   - La photo est prise instantanément

7. **Vérifier**
   - La photo capturée s'affiche
   - Options disponibles :
     - **"Recommencer"** → Prendre une nouvelle photo
     - **"Utiliser cette photo"** → Valider et utiliser

8. **Valider**
   - Cliquer **"Utiliser cette photo"**
   - La photo est ajoutée au formulaire
   - Le dialogue se ferme
   - ✅ **Tous les autres champs du formulaire sont préservés !**

## 💻 Sur Desktop (PC/Mac avec Webcam)

### Étapes

1. **Ouvrir AppViewer** dans le navigateur

2. **Sélectionner un Template** avec input image

3. **Cliquer "Prendre une photo"**

4. **Autoriser l'accès à la webcam** (première utilisation)
   
   **Chrome/Edge :**
   ```
   ┌────────────────────────────────────┐
   │ example.com souhaite utiliser     │
   │ votre caméra                       │
   │                                    │
   │  [Bloquer]        [Autoriser]     │
   └────────────────────────────────────┘
   ```
   
   **Firefox :**
   ```
   ┌────────────────────────────────────┐
   │ Partager la caméra ?              │
   │                                    │
   │  [Ne pas autoriser]  [Autoriser]  │
   └────────────────────────────────────┘
   ```

5. **Prévisualiser**
   - Dialogue s'ouvre avec flux webcam en direct
   - Ajuster votre position devant la webcam

6. **Capturer et Valider**
   - Même processus que sur mobile

## ⚙️ Options Avancées

### Changer de Caméra (Mobile uniquement)

Si votre appareil a plusieurs caméras :

- **"Prendre une photo"** → Caméra arrière (principale)
- **"Caméra frontale"** → Caméra avant (selfie)

### Recommencer une Photo

Après avoir capturé :
1. Cliquer **"Recommencer"**
2. Le flux vidéo réapparaît
3. Prendre une nouvelle photo

### Annuler

À tout moment :
- Cliquer **"Annuler"**
- Le dialogue se ferme
- La caméra s'arrête automatiquement
- Aucune modification au formulaire

## 🔧 Résolution de Problèmes

### "Permission refusée"

**Sur Mobile :**
1. Aller dans **Réglages** du téléphone
2. Chercher **Safari** ou **Chrome**
3. Aller dans **Autorisations** → **Caméra**
4. Autoriser pour le site

**Sur Desktop Chrome :**
1. Cliquer sur le **cadenas 🔒** dans la barre d'adresse
2. **Permissions du site**
3. **Caméra** → Autoriser

**Sur Desktop Firefox :**
1. Cliquer sur l'**icône caméra** dans la barre d'adresse
2. Retirer le blocage
3. Actualiser la page

### "Aucune caméra détectée"

**Vérifier :**
- La webcam est bien **connectée** (sur PC)
- La webcam n'est pas **désactivée** dans les paramètres système
- Aucune autre application n'utilise la caméra

**Tester :**
- Ouvrir l'application Caméra native du système
- Si ça ne fonctionne pas → Problème matériel/pilote

### "La caméra est déjà utilisée"

**Cause :**
Une autre application utilise déjà la caméra

**Solution :**
1. Fermer **Zoom, Skype, Teams, Discord**, etc.
2. Fermer les **autres onglets** du navigateur
3. Réessayer

### Page noire dans le dialogue

**Cause :**
La caméra est en cours d'initialisation

**Solution :**
- Attendre **1-2 secondes**
- Si le problème persiste, fermer et rouvrir le dialogue

### Qualité d'image faible

**Desktop :**
- Vérifier que la webcam supporte HD (720p ou 1080p)
- Améliorer l'éclairage de la pièce

**Mobile :**
- Nettoyer l'objectif de la caméra
- Améliorer l'éclairage

## 💡 Astuces

### Pour une Meilleure Photo

1. **Éclairage** : Se positionner face à une source de lumière
2. **Stabilité** : Tenir fermement l'appareil
3. **Cadrage** : Centrer le sujet dans le cadre
4. **Recommencer** : N'hésitez pas à recommencer si la photo ne convient pas

### Sécurité et Confidentialité

- ✅ **La photo reste locale** - Pas d'envoi automatique
- ✅ **Caméra s'arrête** après fermeture du dialogue
- ✅ **Contrôle total** - Vous validez avant utilisation
- ✅ **Aucun enregistrement** - Seule la photo capturée est conservée

## 🎯 Cas d'Usage

### Exemple 1 : Upscaler d'Image
1. Cliquer "Prendre une photo"
2. Capturer une photo d'un document/objet
3. Utiliser la photo
4. Exécuter le template → Image en haute résolution

### Exemple 2 : Filtre Artistique
1. Cliquer "Caméra frontale"
2. Prendre un selfie
3. Utiliser
4. Appliquer un filtre artistique

### Exemple 3 : OCR/Extraction de Texte
1. Prendre en photo un document texte
2. Utiliser
3. Le template extrait le texte du document

## ❓ FAQ

**Q : Puis-je utiliser la caméra sans connexion internet ?**
R : Oui, la capture fonctionne hors ligne. Seule l'exécution du workflow (AI) nécessite internet.

**Q : La photo est-elle sauvegardée automatiquement ?**
R : Non, elle est uniquement utilisée pour ce workflow. Pas de sauvegarde automatique.

**Q : Puis-je prendre plusieurs photos ?**
R : Pour l'instant, un seul input image. Mais vous pouvez recommencer autant de fois que nécessaire.

**Q : La webcam reste-t-elle active après fermeture ?**
R : Non, la webcam s'arrête automatiquement quand vous fermez le dialogue ou annulez.

**Q : Sur quelle résolution la photo est-elle capturée ?**
R : Jusqu'à Full HD (1920x1080) selon votre caméra. Qualité JPEG à 95%.

**Q : Puis-je utiliser une caméra externe (USB) ?**
R : Oui ! Le navigateur détecte automatiquement toutes les caméras disponibles.

## 📞 Support

Si vous rencontrez un problème non listé ici :

1. Vérifier la console du navigateur (F12) pour les erreurs
2. Vérifier que vous êtes en **HTTPS** (ou localhost)
3. Tester avec un autre navigateur
4. Contacter le support technique

---

**Profitez de la capture photo simplifiée ! 📸**
