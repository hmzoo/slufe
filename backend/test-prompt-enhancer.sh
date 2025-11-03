#!/bin/bash

echo "🧪 Test du service promptEnhancer"
echo "=================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL de base
BASE_URL="http://localhost:3000"

echo "1️⃣  Test du statut du service..."
echo ""

STATUS_RESPONSE=$(curl -s "$BASE_URL/api/prompt/status")
echo "$STATUS_RESPONSE" | jq '.'

if echo "$STATUS_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Service disponible${NC}"
else
    echo -e "${RED}❌ Service indisponible${NC}"
    exit 1
fi

echo ""
echo "2️⃣  Test d'amélioration de prompt..."
echo ""

PROMPT="Un coucher de soleil sur un lac"
echo "Prompt original: $PROMPT"
echo ""

ENHANCE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/prompt/enhance" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"$PROMPT\"}")

echo "$ENHANCE_RESPONSE" | jq '.'

if echo "$ENHANCE_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Amélioration réussie${NC}"
    
    IS_MOCK=$(echo "$ENHANCE_RESPONSE" | jq -r '.mock // false')
    if [ "$IS_MOCK" = "true" ]; then
        echo -e "${YELLOW}⚠️  Mode mock actif (configurez REPLICATE_API_TOKEN pour l'IA réelle)${NC}"
    else
        echo -e "${GREEN}✅ Utilisation de l'IA réelle (Gemini 2.5 Flash)${NC}"
    fi
    
    echo ""
    echo "Prompt amélioré:"
    echo "$ENHANCE_RESPONSE" | jq -r '.enhanced'
else
    echo -e "${RED}❌ Erreur lors de l'amélioration${NC}"
    exit 1
fi

echo ""
echo "3️⃣  Test avec prompt vide (doit échouer)..."
echo ""

ERROR_RESPONSE=$(curl -s -X POST "$BASE_URL/api/prompt/enhance" \
  -H "Content-Type: application/json" \
  -d '{"prompt": ""}')

if echo "$ERROR_RESPONSE" | jq -e '.success == false' > /dev/null; then
    echo -e "${GREEN}✅ Validation correcte (erreur attendue)${NC}"
    echo "$ERROR_RESPONSE" | jq '.error'
else
    echo -e "${RED}❌ La validation a échoué${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ Tests terminés${NC}"
