#!/bin/bash

# Script de test pour le service d'édition d'images
# Usage: ./test_image_editor.sh

echo "🧪 Tests du Service d'Édition d'Images"
echo "======================================"
echo ""

BASE_URL="http://localhost:3000/api/edit"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Status
echo "📊 Test 1: Vérification du statut"
response=$(curl -s "${BASE_URL}/status")
if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Service opérationnel${NC}"
    echo "$response" | head -3
else
    echo -e "${RED}❌ Service non disponible${NC}"
    exit 1
fi
echo ""

# Test 2: Examples
echo "📚 Test 2: Récupération des exemples"
response=$(curl -s "${BASE_URL}/examples")
if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Exemples disponibles${NC}"
    echo "$response" | grep -o '"description":"[^"]*"' | head -5
else
    echo -e "${RED}❌ Échec de récupération des exemples${NC}"
fi
echo ""

# Test 3: Édition avec URL (mock mode si pas de token)
echo "🎨 Test 3: Édition d'image avec URL"
response=$(curl -s -X POST "${BASE_URL}/single-image" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Transform into a watercolor painting",
    "imageUrl": "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400"
  }')

if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Édition réussie${NC}"
    echo "$response" | grep -o '"mock":[^,]*'
    echo "$response" | grep -o '"imageUrls":\[[^]]*\]' | head -c 100
else
    echo -e "${RED}❌ Échec de l'édition${NC}"
    echo "$response"
fi
echo ""

# Test 4: Validation des paramètres (doit échouer)
echo "⚠️  Test 4: Validation des paramètres (doit échouer)"
response=$(curl -s -X POST "${BASE_URL}/single-image" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/photo.jpg"}')

if echo "$response" | grep -q '"success":false'; then
    echo -e "${GREEN}✅ Validation fonctionne (prompt manquant détecté)${NC}"
    echo "$response" | grep -o '"error":"[^"]*"'
else
    echo -e "${YELLOW}⚠️  Validation ne fonctionne pas comme prévu${NC}"
fi
echo ""

# Test 5: Transfert de pose (mock)
echo "🤸 Test 5: Transfert de pose"
response=$(curl -s -X POST "${BASE_URL}/transfer-pose" \
  -H "Content-Type: application/json" \
  -d '{
    "poseSourceUrl": "https://example.com/pose.jpg",
    "targetPersonUrl": "https://example.com/person.jpg"
  }')

if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Transfert de pose configuré${NC}"
    echo "$response" | grep -o '"imageUrls":\[[^]]*\]' | head -c 100
else
    echo -e "${RED}❌ Échec du transfert de pose${NC}"
fi
echo ""

# Test 6: Transfert de style (mock)
echo "🎨 Test 6: Transfert de style"
response=$(curl -s -X POST "${BASE_URL}/transfer-style" \
  -H "Content-Type: application/json" \
  -d '{
    "styleSourceUrl": "https://example.com/style.jpg",
    "targetImageUrl": "https://example.com/photo.jpg"
  }')

if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Transfert de style configuré${NC}"
    echo "$response" | grep -o '"imageUrls":\[[^]]*\]' | head -c 100
else
    echo -e "${RED}❌ Échec du transfert de style${NC}"
fi
echo ""

# Résumé
echo "======================================"
echo "✨ Tests terminés"
echo ""
echo "💡 Conseils:"
echo "  - Si 'mock':true, configurez REPLICATE_API_TOKEN pour utiliser l'API réelle"
echo "  - Pour tester avec de vrais fichiers, utilisez -F au lieu de -d"
echo "  - Consultez IMAGE_EDITOR_README.md pour plus d'exemples"
echo ""
