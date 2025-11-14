#!/bin/bash

# Script d'arrêt du reverse proxy HTTPS

set -e

echo "🛑 Arrêt du Reverse Proxy HTTPS"
echo "==============================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier si le script est exécuté en root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Ce script doit être exécuté avec sudo${NC}"
  echo "Usage: sudo ./stop-https-proxy.sh"
  exit 1
fi

NGINX_CONFIG="/etc/nginx/sites-available/slufe-dev"
NGINX_ENABLED="/etc/nginx/sites-enabled/slufe-dev"

echo "Désactivation de la configuration Nginx..."

# Supprimer le lien symbolique
if [ -L "$NGINX_ENABLED" ]; then
    rm "$NGINX_ENABLED"
    echo -e "${GREEN}✅ Configuration désactivée${NC}"
else
    echo "⚠️  Configuration déjà désactivée"
fi

# Recharger Nginx
if command -v nginx &> /dev/null; then
    nginx -t && systemctl reload nginx
    echo -e "${GREEN}✅ Nginx rechargé${NC}"
fi

echo ""
echo -e "${GREEN}✅ Reverse proxy HTTPS arrêté${NC}"
echo ""
echo "Pour le réactiver :"
echo "  sudo ./setup-https-proxy.sh"
echo ""
