#!/bin/bash

# Script de test du système de stockage des données

echo "🧪 Test du système de stockage"
echo "================================"
echo ""

# Vérifier si le serveur est démarré
echo "1️⃣  Vérification du serveur..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Serveur actif"
else
    echo "❌ Serveur non actif - Démarrez le serveur avec 'npm run dev'"
    exit 1
fi

echo ""
echo "2️⃣  Test génération d'image..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/generate/text-to-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "un magnifique paysage de montagne au coucher du soleil",
    "aspectRatio": "16:9",
    "guidance": 3
  }')

echo "$RESPONSE" | jq '.'

# Extraire l'URL de l'image si succès
IMAGE_URL=$(echo "$RESPONSE" | jq -r '.imageUrl // empty')

if [ -n "$IMAGE_URL" ]; then
    echo "✅ Image générée: $IMAGE_URL"
else
    echo "❌ Erreur de génération"
fi

echo ""
echo "3️⃣  Vérification du dossier data..."
if [ -d "data/operations" ]; then
    echo "✅ Dossier data/operations existe"
    FILE_COUNT=$(ls -1 data/operations | wc -l)
    echo "📁 Nombre de fichiers: $FILE_COUNT"
    
    if [ $FILE_COUNT -gt 0 ]; then
        echo ""
        echo "📄 Derniers fichiers créés:"
        ls -lht data/operations | head -5
        
        echo ""
        echo "🔍 Contenu du dernier JSON:"
        LAST_JSON=$(ls -t data/operations/*.json 2>/dev/null | head -1)
        if [ -n "$LAST_JSON" ]; then
            cat "$LAST_JSON" | jq '.'
        fi
    fi
else
    echo "❌ Dossier data/operations n'existe pas"
fi

echo ""
echo "4️⃣  Test de l'API history..."
HISTORY=$(curl -s http://localhost:3000/api/history?limit=3)
echo "$HISTORY" | jq '.'

COUNT=$(echo "$HISTORY" | jq -r '.count // 0')
echo ""
echo "📊 Nombre d'opérations dans l'historique: $COUNT"

echo ""
echo "================================"
echo "✅ Tests terminés"
