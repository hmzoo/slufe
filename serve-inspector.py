#!/usr/bin/env python3
"""
Serveur HTTP simple pour servir l'inspecteur localStorage
Usage: python3 serve-inspector.py
Puis ouvrir: http://localhost:8000/localStorage-inspector.html
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8000
DIRECTORY = Path(__file__).parent

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Ajouter les headers CORS pour éviter les problèmes
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == "__main__":
    print(f"🚀 Démarrage du serveur HTTP sur le port {PORT}")
    print(f"📁 Répertoire servi: {DIRECTORY}")
    print(f"🔗 Ouvrir dans le navigateur: http://localhost:{PORT}/localStorage-inspector.html")
    print(f"📜 Script console disponible: http://localhost:{PORT}/localStorage-console-inspector.js")
    print("💡 Pour arrêter le serveur: Ctrl+C")
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Serveur arrêté")