#!/bin/bash

echo "🧪 Test du service imageAnalyzer (LLaVA-13B)"
echo "============================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL de base
BASE_URL="http://localhost:3000"

echo "1️⃣  Test du statut du service..."
echo ""

STATUS_RESPONSE=$(curl -s "$BASE_URL/api/images/status")
echo "$STATUS_RESPONSE" | jq '.'

if echo "$STATUS_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Service disponible${NC}"
else
    echo -e "${RED}❌ Service indisponible${NC}"
    exit 1
fi

echo ""
echo "2️⃣  Test d'analyse d'images via URLs..."
echo ""

# URLs d'images de test (images publiques)
TEST_IMAGES='[
  "https://picsum.photos/seed/test1/400/300",
  "https://picsum.photos/seed/test2/400/300"
]'

echo "Images à analyser:"
echo "$TEST_IMAGES" | jq '.'
echo ""

ANALYZE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/images/analyze" \
  -H "Content-Type: application/json" \
  -d "{\"images\": $TEST_IMAGES}")

echo "$ANALYZE_RESPONSE" | jq '.'

if echo "$ANALYZE_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Analyse réussie${NC}"
    
    IS_MOCK=$(echo "$ANALYZE_RESPONSE" | jq -r '.mock // false')
    if [ "$IS_MOCK" = "true" ]; then
        echo -e "${YELLOW}⚠️  Mode mock actif (configurez REPLICATE_API_TOKEN pour l'IA réelle)${NC}"
    else
        echo -e "${GREEN}✅ Utilisation de l'IA réelle (LLaVA-13B)${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}Descriptions:${NC}"
    echo "$ANALYZE_RESPONSE" | jq -r '.results[] | "- " + (.description[:100] + "...")'
    
    echo ""
    echo -e "${BLUE}Statistiques:${NC}"
    echo "$ANALYZE_RESPONSE" | jq '.stats'
else
    echo -e "${RED}❌ Erreur lors de l'analyse${NC}"
    exit 1
fi

echo ""
echo "3️⃣  Test avec tableau vide (doit échouer)..."
echo ""

ERROR_RESPONSE=$(curl -s -X POST "$BASE_URL/api/images/analyze" \
  -H "Content-Type: application/json" \
  -d '{"images": []}')

if echo "$ERROR_RESPONSE" | jq -e '.success == false' > /dev/null; then
    echo -e "${GREEN}✅ Validation correcte (erreur attendue)${NC}"
    echo "$ERROR_RESPONSE" | jq '.error'
else
    echo -e "${RED}❌ La validation a échoué${NC}"
fi

echo ""
echo "4️⃣  Test avec prompt personnalisé..."
echo ""

CUSTOM_PROMPT="Describe the colors and composition of this image."
CUSTOM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/images/analyze" \
  -H "Content-Type: application/json" \
  -d "{\"images\": [\"https://picsum.photos/seed/color/400/300\"], \"prompt\": \"$CUSTOM_PROMPT\"}")

if echo "$CUSTOM_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Analyse avec prompt personnalisé réussie${NC}"
    echo ""
    echo "Prompt utilisé: $CUSTOM_PROMPT"
    echo "Description:"
    echo "$CUSTOM_RESPONSE" | jq -r '.results[0].description' | head -c 200
    echo "..."
else
    echo -e "${RED}❌ Erreur lors de l'analyse avec prompt personnalisé${NC}"
fi

echo ""
echo "============================================"
echo -e "${GREEN}✅ Tests terminés${NC}"
