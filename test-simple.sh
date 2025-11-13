#!/bin/bash

# Test simple et rapide de l'API media unifiée

API_BASE="http://localhost:3000/api/media"

echo "🧪 Test rapide API Media Unifiée"
echo "================================="

# 1. Test List
echo "📋 Test List..."
curl -s "$API_BASE" | jq '.success, .total'

# 2. Test Get par ID  
echo "🔍 Test Get Info..."
curl -s "$API_BASE/97e89596-4dda-4b70-a020-cbf927a9de19" | jq '.success'

# 3. Test Copy simple
echo "📋 Test Copy..."
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"sourceUrl":"medias/97e89596-4dda-4b70-a020-cbf927a9de19.jpg","targetCollectionId":"collection_1763025815798_ob4rvjz0q"}' \
  "$API_BASE/copy" | jq '.success'

# 4. Test Delete
echo "🗑️ Test Delete..."
curl -s -X DELETE "$API_BASE/97e89596-4dda-4b70-a020-cbf927a9de19" | jq '.success'

echo "✅ Tests terminés"