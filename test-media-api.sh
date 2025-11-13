#!/bin/bash

# 🧪 Script de Test - API Media Unifiée
# Test complet de tous les endpoints /api/media

set -e  # Arrêt en cas d'erreur

# Configuration
API_BASE="http://localhost:3000"
API_ENDPOINT="$API_BASE/api/media"
TEST_DIR="/tmp/slufe_media_test"
LOG_FILE="$TEST_DIR/test_results.log"

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
    if [ -f "$LOG_FILE" ]; then
        echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" >> "$LOG_FILE"
    fi
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Préparation environnement test
setup_test_env() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} 🚀 Initialisation environnement de test..."
    
    # Créer répertoire de test
    rm -rf "$TEST_DIR"
    mkdir -p "$TEST_DIR"
    
    # Créer le fichier de log
    touch "$LOG_FILE"
    
    log "🚀 Initialisation environnement de test..."
    
    # Créer fichiers test simples mais valides
    # Créer une vraie image JPG minimale
    echo -e '\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xFF\xD9' > "$TEST_DIR/test_image.jpg"
    
    # Fichiers texte avec extensions correctes (acceptés par l'API)
    echo "Test video content - MP4 file" > "$TEST_DIR/test_video.mp4"
    echo "Test audio content - MP3 file" > "$TEST_DIR/test_audio.mp3"
    echo "Test document content - PDF file" > "$TEST_DIR/test_doc.pdf"
    
    success "Environnement de test prêt"
}

# Vérification serveur
check_server() {
    log "🔍 Vérification serveur..."
    
    if ! curl -s "$API_BASE/health" > /dev/null 2>&1; then
        error "Serveur non accessible sur $API_BASE"
        echo "💡 Démarrer le serveur avec : cd backend && npm start"
        exit 1
    fi
    
    success "Serveur accessible"
}

# Test 1: Upload Single
test_upload_single() {
    log "📤 Test Upload Single..."
    
    local response=$(curl -s -X POST \
        -F "file=@$TEST_DIR/test_image.jpg" \
        "$API_ENDPOINT/upload")
    
    if echo "$response" | grep -q '"success":true'; then
        success "Upload single: OK"
        # Extraire l'URL pour tests suivants (prendre seulement le path relatif)
        UPLOADED_URL=$(echo "$response" | grep -o '"url":"[^"]*"' | cut -d'"' -f4 | sed 's|http://[^/]*/||')
        UPLOADED_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo "  📄 URL: $UPLOADED_URL" | tee -a "$LOG_FILE"
        echo "  🆔 ID: $UPLOADED_ID" | tee -a "$LOG_FILE"
    else
        error "Upload single: ÉCHEC"
        echo "  Response: $response" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Test 2: Upload Multiple
test_upload_multiple() {
    log "📤 Test Upload Multiple..."
    
    local response=$(curl -s -X POST \
        -F "files=@$TEST_DIR/test_video.mp4" \
        -F "files=@$TEST_DIR/test_audio.mp3" \
        "$API_ENDPOINT/upload")
    
    if echo "$response" | grep -q '"success":true'; then
        success "Upload multiple: OK"
        local count=$(echo "$response" | grep -o '"uploaded":\[[^]]*\]' | grep -o ',' | wc -l)
        echo "  📊 Fichiers uploadés: $((count + 1))" | tee -a "$LOG_FILE"
    else
        error "Upload multiple: ÉCHEC"
        echo "  Response: $response" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Test 3: Upload Fields
test_upload_fields() {
    log "📤 Test Upload Fields..."
    
    local response=$(curl -s -X POST \
        -F "image=@$TEST_DIR/test_image.jpg" \
        -F "document=@$TEST_DIR/test_doc.pdf" \
        "$API_ENDPOINT/upload")
    
    if echo "$response" | grep -q '"success":true'; then
        success "Upload fields: OK"
        echo "$response" | grep -o '"[a-z]*":{[^}]*}' | while read field; do
            echo "  📁 $field" | tee -a "$LOG_FILE"
        done
    else
        error "Upload fields: ÉCHEC"
        echo "  Response: $response" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Test 4: List Media
test_list_media() {
    log "📋 Test List Media..."
    
    # Test basique
    local response=$(curl -s "$API_ENDPOINT")
    
    if echo "$response" | grep -q '"success":true'; then
        success "List media: OK"
        local total=$(echo "$response" | grep -o '"total":[0-9]*' | cut -d':' -f2)
        echo "  📊 Total médias: $total" | tee -a "$LOG_FILE"
    else
        error "List media: ÉCHEC"
        return 1
    fi
    
    # Test avec filtres
    log "🔍 Test filtres..."
    
    local filtered_response=$(curl -s "$API_ENDPOINT?type=image&limit=5")
    if echo "$filtered_response" | grep -q '"success":true'; then
        success "List avec filtres: OK"
    else
        warning "List avec filtres: Problème"
    fi
}

# Test 5: Get Media Info
test_get_media_info() {
    log "🔍 Test Get Media Info..."
    
    if [ -z "$UPLOADED_ID" ]; then
        warning "Pas d'ID de test disponible"
        return 0
    fi
    
    local response=$(curl -s "$API_ENDPOINT/$UPLOADED_ID")
    
    if echo "$response" | grep -q '"success":true'; then
        success "Get media info: OK"
        echo "  📄 $(echo "$response" | grep -o '"filename":"[^"]*"' | cut -d'"' -f4)" | tee -a "$LOG_FILE"
    else
        error "Get media info: ÉCHEC"
        return 1
    fi
}

# Test 6: Copy Media
test_copy_media() {
    log "📋 Test Copy Media..."
    
    if [ -z "$UPLOADED_URL" ]; then
        warning "Pas d'URL de test disponible"
        return 0
    fi
    
    local json_data=$(printf '{"sourceUrl":"%s","targetCollectionId":"test-collection"}' "$UPLOADED_URL")
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$json_data" \
        "$API_ENDPOINT/copy")
    
    if echo "$response" | grep -q '"success":true'; then
        success "Copy media: OK"
        local new_url=$(echo "$response" | grep -o '"newUrl":"[^"]*"' | cut -d'"' -f4)
        echo "  📄 Nouvelle URL: $new_url" | tee -a "$LOG_FILE"
    else
        error "Copy media: ÉCHEC"
        echo "  Response: $response" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Test 7: Copy Batch
test_copy_batch() {
    log "📋 Test Copy Batch..."
    
    if [ -z "$UPLOADED_URL" ]; then
        warning "Pas d'URL de test disponible"
        return 0
    fi
    
    local json_data=$(printf '{"operations":[{"sourceUrl":"%s","targetCollectionId":"batch-test-1"},{"sourceUrl":"%s","targetCollectionId":"batch-test-2"}]}' "$UPLOADED_URL" "$UPLOADED_URL")
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$json_data" \
        "$API_ENDPOINT/copy-batch")
    
    if echo "$response" | grep -q '"success":true'; then
        success "Copy batch: OK"
        local successful=$(echo "$response" | grep -o '"successful_copies":[0-9]*' | cut -d':' -f2)
        echo "  ✅ Copies réussies: $successful" | tee -a "$LOG_FILE"
    else
        error "Copy batch: ÉCHEC"
        echo "  Response: $response" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Test 8: Delete Media
test_delete_media() {
    log "🗑️  Test Delete Media..."
    
    if [ -z "$UPLOADED_ID" ]; then
        warning "Pas d'ID de test disponible"
        return 0
    fi
    
    local response=$(curl -s -X DELETE "$API_ENDPOINT/$UPLOADED_ID")
    
    if echo "$response" | grep -q '"success":true'; then
        success "Delete media: OK"
    else
        error "Delete media: ÉCHEC"
        echo "  Response: $response" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Test 9: Gestion d'erreurs
test_error_handling() {
    log "🚨 Test Gestion d'Erreurs..."
    
    # Test 404
    local response_404=$(curl -s "$API_ENDPOINT/nonexistent-id")
    if echo "$response_404" | grep -q '"error"'; then
        success "Erreur 404: OK"
    else
        warning "Gestion erreur 404: À améliorer"
    fi
    
    # Test upload fichier invalide
    echo "invalid content" > "$TEST_DIR/invalid_file.xxx"
    local response_invalid=$(curl -s -X POST \
        -F "file=@$TEST_DIR/invalid_file.xxx" \
        "$API_ENDPOINT/upload")
    
    if echo "$response_invalid" | grep -q '"error"\|"success":false'; then
        success "Validation fichier: OK"
    else
        warning "Validation fichier: À vérifier"
    fi
}

# Test 10: Performance basique
test_performance() {
    log "⚡ Test Performance Basique..."
    
    local start_time=$(date +%s%N)
    curl -s "$API_ENDPOINT" > /dev/null
    local end_time=$(date +%s%N)
    
    local duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ $duration -lt 1000 ]; then
        success "Performance: OK ($duration ms)"
    elif [ $duration -lt 3000 ]; then
        warning "Performance: Acceptable ($duration ms)"
    else
        error "Performance: Lente ($duration ms)"
    fi
}

# Rapport final
generate_report() {
    log "📊 Génération du rapport final..."
    
    echo ""
    echo "===========================================" | tee -a "$LOG_FILE"
    echo "🧪 RAPPORT DE TEST - API MEDIA UNIFIÉE" | tee -a "$LOG_FILE"
    echo "===========================================" | tee -a "$LOG_FILE"
    echo ""
    
    # Compter succès/échecs
    local total_tests=10
    local passed=$(grep -c "✅" "$LOG_FILE" || echo 0)
    local warnings=$(grep -c "⚠️" "$LOG_FILE" || echo 0)
    local errors=$(grep -c "❌" "$LOG_FILE" || echo 0)
    
    echo "📈 STATISTIQUES:" | tee -a "$LOG_FILE"
    echo "  ✅ Tests réussis: $passed/$total_tests" | tee -a "$LOG_FILE"
    echo "  ⚠️  Avertissements: $warnings" | tee -a "$LOG_FILE" 
    echo "  ❌ Erreurs: $errors" | tee -a "$LOG_FILE"
    echo ""
    
    # Status global
    if [ $errors -eq 0 ] && [ $passed -ge 8 ]; then
        success "🎉 API MEDIA UNIFIÉE: PRÊTE POUR PRODUCTION"
    elif [ $errors -le 2 ]; then
        warning "🔧 API MEDIA UNIFIÉE: QUELQUES AJUSTEMENTS NÉCESSAIRES"
    else
        error "🚨 API MEDIA UNIFIÉE: CORRECTIONS REQUISES"
    fi
    
    echo ""
    echo "📁 Rapport détaillé: $LOG_FILE"
    echo "==========================================="
}

# Nettoyage
cleanup() {
    log "🧹 Nettoyage..."
    rm -rf "$TEST_DIR"
    success "Nettoyage terminé"
}

# Exécution principale
main() {
    echo "🧪 TESTS API MEDIA UNIFIÉE - SLUFE"
    echo "===================================="
    echo ""
    
    setup_test_env
    check_server
    
    echo ""
    log "🏁 Démarrage des tests..."
    echo ""
    
    # Exécuter tous les tests
    test_upload_single || true
    test_upload_multiple || true
    test_upload_fields || true
    test_list_media || true
    test_get_media_info || true
    test_copy_media || true
    test_copy_batch || true
    test_delete_media || true
    test_error_handling || true
    test_performance || true
    
    echo ""
    generate_report
    cleanup
}

# Gestion des signaux
trap cleanup EXIT

# Lancer les tests
main "$@"