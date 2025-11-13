#!/bin/bash

# Script pour supprimer les fichiers médias du suivi Git
# Sans les supprimer du disque

echo "🧹 Nettoyage des fichiers médias du suivi Git..."
echo ""

# Supprimer les fichiers médias du suivi Git
echo "📸 Suppression des images..."
git rm --cached backend/medias/*.jpg 2>/dev/null
git rm --cached backend/medias/*.jpeg 2>/dev/null
git rm --cached backend/medias/*.png 2>/dev/null
git rm --cached backend/medias/*.gif 2>/dev/null
git rm --cached backend/medias/*.webp 2>/dev/null
git rm --cached backend/medias/*.bmp 2>/dev/null
git rm --cached backend/medias/*.svg 2>/dev/null

echo "🎬 Suppression des vidéos..."
git rm --cached backend/medias/*.mp4 2>/dev/null
git rm --cached backend/medias/*.webm 2>/dev/null
git rm --cached backend/medias/*.ogg 2>/dev/null
git rm --cached backend/medias/*.avi 2>/dev/null
git rm --cached backend/medias/*.mov 2>/dev/null
git rm --cached backend/medias/*.mkv 2>/dev/null
git rm --cached backend/medias/*.flv 2>/dev/null
git rm --cached backend/medias/*.wmv 2>/dev/null

echo ""
echo "✅ Fichiers médias supprimés du suivi Git (conservés sur disque)"
echo ""
echo "📝 Prochaines étapes :"
echo "1. Vérifier les changements : git status"
echo "2. Commiter : git commit -m 'Remove media files from Git tracking'"
echo "3. Les nouveaux médias ne seront plus trackés grâce au .gitignore"
