#!/bin/bash

echo "🚀 SLUFE IA - Installation et démarrage"
echo "======================================"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null
then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js >= 16"
    exit 1
fi

echo "✅ Node.js $(node --version) détecté"
echo ""

# Installation des dépendances
echo "📦 Installation des dépendances..."
echo ""

echo "Installing root dependencies..."
npm install

echo ""
echo "Installing backend dependencies..."
cd backend
npm install

echo ""
echo "Installing frontend dependencies..."
cd ../frontend
npm install

cd ..

# Créer le fichier .env
if [ ! -f backend/.env ]; then
    echo ""
    echo "⚙️  Création du fichier .env..."
    cp backend/.env.example backend/.env
    echo "✅ Fichier .env créé dans backend/"
fi

echo ""
echo "✅ Installation terminée !"
echo ""
echo "Pour démarrer l'application en mode développement :"
echo "  npm run dev"
echo ""
echo "Le backend sera sur http://localhost:3000"
echo "Le frontend sera sur http://localhost:9000"
echo ""
