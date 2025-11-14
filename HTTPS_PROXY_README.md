# 🔐 Configuration HTTPS pour Tests Mobile

Ce guide explique comment configurer un reverse proxy HTTPS avec certificat auto-signé pour tester l'application Slufe depuis un mobile sur le réseau local.

## 📋 Prérequis

- **Linux** (Ubuntu/Debian recommandé)
- **Nginx** (sera installé automatiquement si absent)
- **OpenSSL** (généralement préinstallé)
- **Sudo/Root access**
- **Même réseau local** pour le PC et le mobile

## 🚀 Installation Rapide

### 1. Rendre les scripts exécutables

```bash
chmod +x setup-https-proxy.sh
chmod +x stop-https-proxy.sh
chmod +x cleanup-https-proxy.sh
```

### 2. Démarrer les serveurs (dans des terminaux séparés)

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
# Doit tourner sur http://localhost:3000
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm run dev
# Doit tourner sur http://localhost:9000
```

### 3. Configurer le reverse proxy HTTPS

**Terminal 3 :**
```bash
sudo ./setup-https-proxy.sh
```

Le script va :
- ✅ Détecter votre IP locale (ex: 192.168.1.100)
- ✅ Installer Nginx si nécessaire
- ✅ Générer un certificat SSL auto-signé
- ✅ Configurer Nginx comme reverse proxy
- ✅ Rediriger HTTP (80) vers HTTPS (443)
- ✅ Proxy HTTPS (443) vers Frontend (9000)

### 4. Afficher votre configuration

À la fin du script, vous verrez :

```
═══════════════════════════════════════════════════════════
✅ Configuration terminée avec succès !
═══════════════════════════════════════════════════════════

📱 Accès depuis mobile :
   https://192.168.1.100

💻 Accès depuis localhost :
   https://localhost
```

## 📱 Utilisation depuis Mobile

### Étape 1 : Connecter le mobile au même WiFi

Assurez-vous que votre mobile est sur le **même réseau WiFi** que votre PC.

### Étape 2 : Ouvrir le navigateur mobile

Sur votre smartphone, ouvrir :
- Chrome
- Safari
- Firefox

### Étape 3 : Accéder à l'URL HTTPS

Taper dans la barre d'adresse :
```
https://192.168.1.100
```
(Remplacer par votre IP affichée par le script)

### Étape 4 : Accepter le certificat auto-signé

**Sur Chrome/Edge (Android) :**
1. Vous verrez "Votre connexion n'est pas privée"
2. Cliquer sur **"Avancé"**
3. Cliquer sur **"Continuer vers 192.168.1.100 (dangereux)"**

**Sur Safari (iOS) :**
1. Vous verrez "Ce site web n'est peut-être pas sécurisé"
2. Cliquer sur **"Afficher les détails"**
3. Cliquer sur **"Accéder à ce site web"**
4. Confirmer

**Sur Firefox (Android) :**
1. Vous verrez "Avertissement : risque probable de sécurité"
2. Cliquer sur **"Avancé"**
3. Cliquer sur **"Accepter le risque et continuer"**

### Étape 5 : Tester la caméra

1. Aller dans **AppViewer**
2. Sélectionner un template avec input image
3. Cliquer **"Prendre une photo"**
4. ✅ La caméra s'ouvre **dans l'application**
5. ✅ Capturer une photo
6. ✅ Utiliser la photo

## 🎯 Que Teste le Reverse Proxy ?

### Fonctionnalités Testables

✅ **getUserMedia API** - Accès caméra (nécessite HTTPS)
✅ **Géolocalisation** - Si utilisée (nécessite HTTPS)
✅ **Service Workers** - PWA (nécessite HTTPS)
✅ **Notifications Push** - Si implémentées (nécessite HTTPS)
✅ **Clipboard API** - Copier/coller (nécessite HTTPS)
✅ **Test conditions réelles** - Réseau WiFi mobile

### Architecture

```
Mobile (https://192.168.1.100:443)
        ↓
    Nginx (Reverse Proxy)
        ↓
Frontend (http://localhost:9000)
    Backend (http://localhost:3000)
```

## 🔧 Commandes Utiles

### Vérifier le statut de Nginx

```bash
sudo systemctl status nginx
```

### Redémarrer Nginx

```bash
sudo systemctl restart nginx
```

### Voir les logs en temps réel

**Logs d'erreur :**
```bash
sudo tail -f /var/log/nginx/slufe-dev-error.log
```

**Logs d'accès :**
```bash
sudo tail -f /var/log/nginx/slufe-dev-access.log
```

### Tester la configuration Nginx

```bash
sudo nginx -t
```

### Arrêter le reverse proxy

```bash
sudo ./stop-https-proxy.sh
```

### Nettoyer complètement

```bash
sudo ./cleanup-https-proxy.sh
```

## 🐛 Résolution de Problèmes

### Problème : "Connection refused" sur mobile

**Causes possibles :**
1. ❌ Backend ou Frontend non démarré
2. ❌ Nginx non démarré
3. ❌ Pare-feu bloque les ports

**Solutions :**
```bash
# Vérifier que les serveurs tournent
ps aux | grep node
ps aux | grep nginx

# Vérifier les ports
sudo netstat -tlnp | grep -E '(3000|9000|80|443)'

# Vérifier le pare-feu
sudo ufw status

# Redémarrer Nginx
sudo systemctl restart nginx
```

### Problème : "ERR_CERT_AUTHORITY_INVALID" persistant

**Cause :** Le certificat auto-signé n'est pas accepté

**Solution :**
- Sur mobile, vous DEVEZ cliquer "Continuer" ou "Accepter le risque"
- C'est normal pour un certificat auto-signé
- En production, utilisez Let's Encrypt pour un vrai certificat

### Problème : Changement d'IP locale

**Cause :** Votre routeur a changé votre IP (DHCP)

**Solution :**
```bash
# Vérifier votre nouvelle IP
hostname -I

# Reconfigurer avec la nouvelle IP
sudo ./cleanup-https-proxy.sh
sudo ./setup-https-proxy.sh
```

### Problème : Caméra ne fonctionne toujours pas

**Vérifications :**
1. ✅ Vous êtes bien en HTTPS (cadenas dans la barre d'adresse)
2. ✅ Vous avez autorisé l'accès à la caméra
3. ✅ Aucune autre app n'utilise la caméra
4. ✅ Le navigateur supporte getUserMedia

**Test :**
```javascript
// Dans la console du navigateur mobile (DevTools distant)
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => console.log('✅ Caméra OK', stream))
  .catch(err => console.error('❌ Erreur:', err))
```

### Problème : "Address already in use" (port 443)

**Cause :** Un autre service utilise le port 443

**Solution :**
```bash
# Voir ce qui utilise le port 443
sudo lsof -i :443

# Si c'est Apache
sudo systemctl stop apache2

# Redémarrer Nginx
sudo systemctl restart nginx
```

## 🔐 Sécurité

### Certificat Auto-Signé

⚠️ **IMPORTANT :**
- Le certificat est **auto-signé** (non vérifié par une autorité)
- Valable **365 jours**
- Pour **développement uniquement**
- Ne **JAMAIS** utiliser en production

### Pour la Production

Utiliser **Let's Encrypt** pour un certificat gratuit et vérifié :

```bash
# Installation Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat (nécessite un nom de domaine)
sudo certbot --nginx -d votre-domaine.com
```

## 📊 Fichiers Créés

```
slufe/
├── setup-https-proxy.sh      # Script de configuration
├── stop-https-proxy.sh        # Script d'arrêt
├── cleanup-https-proxy.sh     # Script de nettoyage
├── HTTPS_PROXY_README.md      # Ce fichier
└── certs/                     # Dossier créé
    ├── server.crt            # Certificat SSL
    ├── server.key            # Clé privée
    └── openssl.cnf           # Config OpenSSL
```

### Configuration Nginx

```
/etc/nginx/sites-available/slufe-dev    # Fichier de config
/etc/nginx/sites-enabled/slufe-dev      # Lien symbolique
```

## 🧹 Nettoyage

### Arrêt Temporaire

Pour arrêter temporairement (garde la config) :

```bash
sudo ./stop-https-proxy.sh
```

### Nettoyage Complet

Pour tout supprimer (config + certificats) :

```bash
sudo ./cleanup-https-proxy.sh
```

Vous serez invité à confirmer :
- Suppression des certificats
- Suppression des règles pare-feu

## 💡 Conseils

### Pour un Test Optimal

1. **WiFi stable** - Connecter PC et mobile au même réseau
2. **IP fixe** - Configurer une IP statique dans le routeur pour le PC
3. **Désactiver VPN** - Sur mobile et PC pendant les tests
4. **Vider le cache** - Sur mobile après changements

### Debug à Distance

Pour débugger sur mobile, utiliser :

**Chrome DevTools (Android) :**
1. Connecter le mobile en USB
2. Activer le "Débogage USB" sur Android
3. Ouvrir `chrome://inspect` sur PC
4. Inspecter la page mobile

**Safari DevTools (iOS) :**
1. Activer "Inspecteur web" dans Réglages Safari iOS
2. Connecter iPhone en USB
3. Ouvrir Safari > Développement > [iPhone] sur Mac

## 📞 Support

En cas de problème :

1. Vérifier les logs Nginx
2. Vérifier que les serveurs sont démarrés
3. Vérifier l'IP locale
4. Vérifier le certificat SSL
5. Tester depuis localhost d'abord

## ✅ Checklist de Test

Avant de tester sur mobile :

- [ ] Backend démarré (port 3000)
- [ ] Frontend démarré (port 9000)
- [ ] Script `setup-https-proxy.sh` exécuté
- [ ] Nginx actif (`sudo systemctl status nginx`)
- [ ] IP locale notée
- [ ] Mobile sur le même WiFi
- [ ] Certificat accepté sur mobile
- [ ] Page charge en HTTPS
- [ ] Caméra autorisée

---

**Bonne chance pour vos tests mobile ! 📱🚀**
