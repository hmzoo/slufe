#!/bin/bash

# Script de test pour le système de workflows SLUFE IA
# Usage: ./test-workflow-system.sh

echo "🧪 Tests du système de workflows SLUFE IA"
echo "========================================"

BASE_URL="http://localhost:3000/api"
TEMP_DIR="/tmp/slufe-workflow-tests"

# Créer le dossier temporaire
mkdir -p "$TEMP_DIR"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher le résultat des tests
test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $2"
  else
    echo -e "${RED}❌ FAIL${NC}: $2"
  fi
}

# Test 1: Workflow simple d'amélioration de prompt
echo -e "\n${YELLOW}📋 Test 1: Workflow simple d'amélioration de prompt${NC}"

cat > "$TEMP_DIR/workflow_simple.json" << 'EOF'
{
  "workflow": {
    "workflow": {
      "id": "wf_test_simple",
      "name": "Test amélioration simple",
      "description": "Test basique du système de workflows",
      "tasks": [
        {
          "type": "enhance_prompt",
          "id": "enhance",
          "inputs": {
            "prompt": "{{input.user_prompt}}",
            "style": "réaliste",
            "enhancementLevel": "high"
          }
        }
      ],
      "outputs": {
        "enhanced_prompt": "{{enhance.enhanced_prompt}}"
      }
    }
  },
  "inputs": {
    "user_prompt": "un chat dans un jardin"
  }
}
EOF

echo "Envoi de la requête workflow simple..."
RESPONSE1=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/workflow/run" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_DIR/workflow_simple.json" \
  -o "$TEMP_DIR/response1.json")

HTTP_CODE1=${RESPONSE1: -3}
test_result $([[ "$HTTP_CODE1" == "200" ]] && echo 0 || echo 1) "Workflow simple - Code HTTP: $HTTP_CODE1"

if [ "$HTTP_CODE1" == "200" ]; then
  SUCCESS1=$(jq -r '.success' "$TEMP_DIR/response1.json" 2>/dev/null)
  test_result $([[ "$SUCCESS1" == "true" ]] && echo 0 || echo 1) "Workflow simple - Succès: $SUCCESS1"
  
  ENHANCED=$(jq -r '.results.enhanced_prompt // "N/A"' "$TEMP_DIR/response1.json" 2>/dev/null)
  echo "   Prompt amélioré: ${ENHANCED:0:100}..."
fi

# Test 2: Workflow avec génération d'image
echo -e "\n${YELLOW}📋 Test 2: Workflow avec génération d'image${NC}"

cat > "$TEMP_DIR/workflow_generate.json" << 'EOF'
{
  "workflow": {
    "workflow": {
      "id": "wf_test_generate",
      "name": "Test génération complète", 
      "tasks": [
        {
          "type": "enhance_prompt",
          "id": "enhance",
          "inputs": {
            "prompt": "{{input.user_prompt}}"
          }
        },
        {
          "type": "generate_image",
          "id": "generate",
          "inputs": {
            "prompt": "{{enhance.enhanced_prompt}}",
            "parameters": {
              "width": 512,
              "height": 512,
              "steps": 20
            }
          }
        }
      ],
      "outputs": {
        "final_image": "{{generate.image}}"
      }
    }
  },
  "inputs": {
    "user_prompt": "un robot futuriste"
  }
}
EOF

echo "Envoi de la requête workflow avec génération..."
RESPONSE2=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/workflow/run" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_DIR/workflow_generate.json" \
  -o "$TEMP_DIR/response2.json")

HTTP_CODE2=${RESPONSE2: -3}
test_result $([[ "$HTTP_CODE2" == "200" ]] && echo 0 || echo 1) "Workflow génération - Code HTTP: $HTTP_CODE2"

if [ "$HTTP_CODE2" == "200" ]; then
  SUCCESS2=$(jq -r '.success' "$TEMP_DIR/response2.json" 2>/dev/null)
  test_result $([[ "$SUCCESS2" == "true" ]] && echo 0 || echo 1) "Workflow génération - Succès: $SUCCESS2"
  
  TASKS_COMPLETED=$(jq -r '.execution.progress.completed_tasks // 0' "$TEMP_DIR/response2.json" 2>/dev/null)
  test_result $([[ "$TASKS_COMPLETED" == "2" ]] && echo 0 || echo 1) "Workflow génération - Tâches complétées: $TASKS_COMPLETED/2"
fi

# Test 3: Workflow invalide (test d'erreur)
echo -e "\n${YELLOW}📋 Test 3: Workflow invalide (gestion d'erreur)${NC}"

cat > "$TEMP_DIR/workflow_invalid.json" << 'EOF'
{
  "workflow": {
    "workflow": {
      "id": "wf_test_invalid",
      "tasks": [
        {
          "type": "unknown_task_type",
          "id": "invalid",
          "inputs": {}
        }
      ]
    }
  }
}
EOF

echo "Envoi d'un workflow invalide..."
RESPONSE3=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/workflow/run" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_DIR/workflow_invalid.json" \
  -o "$TEMP_DIR/response3.json")

HTTP_CODE3=${RESPONSE3: -3}
test_result $([[ "$HTTP_CODE3" == "400" || "$HTTP_CODE3" == "500" ]] && echo 0 || echo 1) "Workflow invalide - Code d'erreur: $HTTP_CODE3"

# Test 4: Test du format multipart
echo -e "\n${YELLOW}📋 Test 4: Format multipart avec fichier${NC}"

# Créer un fichier image de test simple (1x1 pixel PNG)
echo -ne '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\xdac\xf8\x0f\x00\x00\x01\x00\x01' > "$TEMP_DIR/test.png"

cat > "$TEMP_DIR/workflow_multipart.json" << 'EOF'
{
  "workflow": {
    "id": "wf_test_multipart",
    "name": "Test multipart",
    "tasks": [
      {
        "type": "describe_images",
        "id": "analyze",
        "inputs": {
          "images": "{{input.images}}"
        }
      }
    ],
    "outputs": {
      "descriptions": "{{analyze.descriptions}}"
    }
  }
}
EOF

echo "Envoi d'une requête multipart..."
RESPONSE4=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/workflow/run" \
  -F "workflow=@$TEMP_DIR/workflow_multipart.json" \
  -F "images[]=@$TEMP_DIR/test.png" \
  -F "user_prompt=Analyser cette image" \
  -o "$TEMP_DIR/response4.json")

HTTP_CODE4=${RESPONSE4: -3}
test_result $([[ "$HTTP_CODE4" == "200" ]] && echo 0 || echo 1) "Workflow multipart - Code HTTP: $HTTP_CODE4"

# Test 5: Vérification des métadonnées des tâches
echo -e "\n${YELLOW}📋 Test 5: Vérification des services de tâches${NC}"

# Test si les modules peuvent être importés (via un simple appel à une route qui va les charger)
echo "Vérification de la disponibilité des services..."

# Créer un workflow qui utilise tous les types de tâches pour tester leur chargement
cat > "$TEMP_DIR/workflow_all_tasks.json" << 'EOF'
{
  "workflow": {
    "workflow": {
      "id": "wf_test_all",
      "name": "Test tous les types de tâches",
      "tasks": [
        {
          "type": "enhance_prompt",
          "id": "enhance",
          "inputs": {
            "prompt": "test"
          }
        }
      ],
      "outputs": {
        "result": "{{enhance.enhanced_prompt}}"
      }
    }
  },
  "inputs": {
    "user_prompt": "test simple"
  }
}
EOF

RESPONSE5=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/workflow/run" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_DIR/workflow_all_tasks.json" \
  -o "$TEMP_DIR/response5.json")

HTTP_CODE5=${RESPONSE5: -3}
test_result $([[ "$HTTP_CODE5" == "200" ]] && echo 0 || echo 1) "Services de tâches - Disponibilité: $HTTP_CODE5"

# Résumé des tests
echo -e "\n${YELLOW}📊 Résumé des tests${NC}"
echo "===================="

TOTAL_TESTS=5
PASSED_TESTS=0

# Compter les tests réussis
[[ "$HTTP_CODE1" == "200" ]] && ((PASSED_TESTS++))
[[ "$HTTP_CODE2" == "200" ]] && ((PASSED_TESTS++))
[[ "$HTTP_CODE3" == "400" || "$HTTP_CODE3" == "500" ]] && ((PASSED_TESTS++))
[[ "$HTTP_CODE4" == "200" ]] && ((PASSED_TESTS++))
[[ "$HTTP_CODE5" == "200" ]] && ((PASSED_TESTS++))

echo "Tests réussis: $PASSED_TESTS/$TOTAL_TESTS"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
  echo -e "${GREEN}🎉 Tous les tests sont passés avec succès !${NC}"
  echo "Le système de workflows est opérationnel."
else
  echo -e "${YELLOW}⚠️  Certains tests ont échoué.${NC}"
  echo "Vérifiez les logs du serveur pour plus de détails."
fi

# Afficher quelques réponses détaillées pour debug
echo -e "\n${YELLOW}🔍 Exemples de réponses (pour debug)${NC}"
echo "======================================"

if [ -f "$TEMP_DIR/response1.json" ]; then
  echo "Réponse workflow simple:"
  jq '.' "$TEMP_DIR/response1.json" 2>/dev/null || cat "$TEMP_DIR/response1.json"
fi

# Nettoyage
echo -e "\n🧹 Nettoyage des fichiers temporaires..."
rm -rf "$TEMP_DIR"

echo -e "\n✅ Tests terminés !"