#!/bin/bash

# Script de nettoyage complet du reverse proxy HTTPS

set -e

echo "🧹 Nettoyage du Reverse Proxy HTTPS"
echo "===================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier si le script est exécuté en root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Ce script doit être exécuté avec sudo${NC}"
  echo "Usage: sudo ./cleanup-https-proxy.sh"
  exit 1
fi

NGINX_CONFIG="/etc/nginx/sites-available/slufe-dev"
NGINX_ENABLED="/etc/nginx/sites-enabled/slufe-dev"
CERT_DIR="./certs"

echo "🗑️  Suppression de la configuration Nginx..."
# Supprimer le lien symbolique
if [ -L "$NGINX_ENABLED" ]; then
    rm "$NGINX_ENABLED"
    echo -e "${GREEN}✅ Lien symbolique supprimé${NC}"
fi

# Supprimer le fichier de configuration
if [ -f "$NGINX_CONFIG" ]; then
    rm "$NGINX_CONFIG"
    echo -e "${GREEN}✅ Fichier de configuration supprimé${NC}"
fi

echo ""
echo "🔑 Suppression des certificats..."
read -p "Voulez-vous supprimer les certificats SSL ? (o/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[OoYy]$ ]]; then
    if [ -d "$CERT_DIR" ]; then
        rm -rf "$CERT_DIR"
        echo -e "${GREEN}✅ Certificats supprimés${NC}"
    else
        echo "⚠️  Dossier certificats déjà absent"
    fi
else
    echo -e "${YELLOW}⏭️  Certificats conservés${NC}"
fi

echo ""
echo "🔄 Rechargement de Nginx..."
if command -v nginx &> /dev/null; then
    nginx -t && systemctl reload nginx
    echo -e "${GREEN}✅ Nginx rechargé${NC}"
fi

echo ""
echo "🔥 Règles pare-feu (optionnel)..."
if command -v ufw &> /dev/null; then
    read -p "Voulez-vous supprimer les règles pare-feu ? (o/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[OoYy]$ ]]; then
        ufw delete allow 80/tcp 2>/dev/null || echo "Règle HTTP déjà absente"
        ufw delete allow 443/tcp 2>/dev/null || echo "Règle HTTPS déjà absente"
        echo -e "${GREEN}✅ Règles pare-feu supprimées${NC}"
    else
        echo -e "${YELLOW}⏭️  Règles pare-feu conservées${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Nettoyage terminé${NC}"
echo ""
