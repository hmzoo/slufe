#!/bin/bash

# Script de création d'un reverse proxy HTTPS pour tests mobile
# Redirige HTTPS (port 443) vers le frontend (port 9000)

set -e

echo "🔐 Configuration du Reverse Proxy HTTPS pour tests mobile"
echo "=========================================================="
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si le script est exécuté en root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Ce script doit être exécuté avec sudo${NC}"
  echo "Usage: sudo ./setup-https-proxy.sh"
  exit 1
fi

# Détection de l'IP locale
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}📡 Adresse IP locale détectée: ${LOCAL_IP}${NC}"
echo ""

# Dossier pour les certificats
CERT_DIR="./certs"
NGINX_CONFIG="/etc/nginx/sites-available/slufe-dev"
NGINX_ENABLED="/etc/nginx/sites-enabled/slufe-dev"

# Créer le dossier pour les certificats
mkdir -p "$CERT_DIR"

echo "📋 Étape 1: Installation de Nginx (si nécessaire)"
echo "------------------------------------------------"
if ! command -v nginx &> /dev/null; then
    echo "Installation de Nginx..."
    apt-get update
    apt-get install -y nginx
    echo -e "${GREEN}✅ Nginx installé${NC}"
else
    echo -e "${GREEN}✅ Nginx déjà installé${NC}"
fi
echo ""

echo "🔑 Étape 2: Génération du certificat SSL auto-signé"
echo "---------------------------------------------------"
if [ ! -f "$CERT_DIR/server.crt" ] || [ ! -f "$CERT_DIR/server.key" ]; then
    echo "Génération du certificat pour ${LOCAL_IP}..."
    
    # Créer un fichier de configuration OpenSSL
    cat > "$CERT_DIR/openssl.cnf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext
x509_extensions = v3_ca

[dn]
C=FR
ST=France
L=Paris
O=Development
OU=Dev Team
CN=${LOCAL_IP}

[req_ext]
subjectAltName = @alt_names

[v3_ca]
subjectAltName = @alt_names
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
IP.1 = ${LOCAL_IP}
IP.2 = 127.0.0.1
DNS.1 = localhost
EOF

    # Générer la clé privée et le certificat
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CERT_DIR/server.key" \
        -out "$CERT_DIR/server.crt" \
        -config "$CERT_DIR/openssl.cnf"
    
    chmod 600 "$CERT_DIR/server.key"
    chmod 644 "$CERT_DIR/server.crt"
    
    echo -e "${GREEN}✅ Certificat SSL généré${NC}"
    echo "   Clé: $CERT_DIR/server.key"
    echo "   Certificat: $CERT_DIR/server.crt"
else
    echo -e "${GREEN}✅ Certificat SSL déjà existant${NC}"
fi
echo ""

echo "⚙️  Étape 3: Configuration de Nginx"
echo "-----------------------------------"

# Obtenir le chemin absolu du dossier certs
CERT_DIR_ABS=$(realpath "$CERT_DIR")

# Créer la configuration Nginx
cat > "$NGINX_CONFIG" <<EOF
# Configuration HTTPS Reverse Proxy pour Slufe Dev
# Redirige HTTPS (443) vers Frontend (9000) et Backend (3000)

# Redirection HTTP vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${LOCAL_IP} localhost;
    
    return 301 https://\$server_name\$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${LOCAL_IP} localhost;

    # Certificats SSL auto-signés
    ssl_certificate ${CERT_DIR_ABS}/server.crt;
    ssl_certificate_key ${CERT_DIR_ABS}/server.key;

    # Configuration SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Taille maximale des uploads (pour les images)
    client_max_body_size 50M;

    # Logs
    access_log /var/log/nginx/slufe-dev-access.log;
    error_log /var/log/nginx/slufe-dev-error.log;

    # Backend (qui sert le frontend build + API sur port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Headers pour proxy
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts longs pour les requêtes AI
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}
EOF

echo -e "${GREEN}✅ Configuration Nginx créée${NC}"
echo ""

echo "🔗 Étape 4: Activation de la configuration"
echo "------------------------------------------"
# Créer le lien symbolique
ln -sf "$NGINX_CONFIG" "$NGINX_ENABLED"
echo -e "${GREEN}✅ Configuration activée${NC}"
echo ""

echo "🔄 Étape 5: Test et rechargement de Nginx"
echo "-----------------------------------------"
# Tester la configuration
if nginx -t; then
    echo -e "${GREEN}✅ Configuration Nginx valide${NC}"
    
    # Recharger Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    echo -e "${GREEN}✅ Nginx redémarré${NC}"
else
    echo -e "${RED}❌ Erreur dans la configuration Nginx${NC}"
    exit 1
fi
echo ""

echo "🔥 Étape 6: Configuration du pare-feu (optionnel)"
echo "------------------------------------------------"
if command -v ufw &> /dev/null; then
    echo "Configuration UFW..."
    ufw allow 80/tcp comment "HTTP pour Slufe Dev"
    ufw allow 443/tcp comment "HTTPS pour Slufe Dev"
    echo -e "${GREEN}✅ Règles pare-feu ajoutées${NC}"
else
    echo -e "${YELLOW}⚠️  UFW non installé, règles pare-feu non configurées${NC}"
fi
echo ""

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Configuration terminée avec succès !${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📱 Accès depuis mobile :"
echo "   https://${LOCAL_IP}"
echo ""
echo "💻 Accès depuis localhost :"
echo "   https://localhost"
echo "   ou"
echo "   https://127.0.0.1"
echo ""
echo "⚠️  IMPORTANT - Configuration mobile :"
echo "   1. Sur votre mobile, ouvrir le navigateur"
echo "   2. Aller sur: https://${LOCAL_IP}"
echo "   3. Accepter le certificat auto-signé :"
echo "      - Chrome/Edge : Cliquer 'Avancé' puis 'Continuer'"
echo "      - Safari : Cliquer 'Afficher les détails' puis 'Accéder'"
echo "      - Firefox : Cliquer 'Avancé' puis 'Accepter le risque'"
echo ""
echo "🔧 Commandes utiles :"
echo "   sudo systemctl status nginx   # Vérifier le statut"
echo "   sudo systemctl restart nginx  # Redémarrer"
echo "   sudo nginx -t                 # Tester la config"
echo "   sudo tail -f /var/log/nginx/slufe-dev-error.log  # Logs"
echo ""
echo "🛑 Pour arrêter le reverse proxy :"
echo "   sudo ./stop-https-proxy.sh"
echo ""
echo "📋 Certificat :"
echo "   Emplacement: ${CERT_DIR_ABS}/server.crt"
echo "   Validité: 365 jours"
echo "   Pour: ${LOCAL_IP}, localhost, 127.0.0.1"
echo ""
echo "═══════════════════════════════════════════════════════════"
