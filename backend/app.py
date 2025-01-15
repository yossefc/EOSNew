from flask import Flask, request, jsonify
from flask_cors import CORS
from extensions import init_extensions, db
from routes.enqueteur import register_enqueteur_routes
from routes.vpn_template import register_vpn_template_routes
from routes.donnees import donnees_bp
from models.models import Donnee, Fichier
from models.models_enqueteur import DonneeEnqueteur
from datetime import datetime
import logging
import os
import sys
import codecs
from config import create_app

# Configuration de l'encodage par défaut
if sys.stdout.encoding != 'utf-8':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Configuration avancée du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def init_app():
    app = create_app()
    
    # Configuration CORS pour accepter les requêtes de n'importe quelle origine
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    init_extensions(app)
    register_enqueteur_routes(app)
    register_vpn_template_routes(app)
    app.register_blueprint(donnees_bp)

    with app.app_context():
        db.create_all()

    @app.route('/parse', methods=['POST'])
    def parse_file():
        """Route pour parser un fichier OST"""
        if 'file' not in request.files:
            return jsonify({'error': 'Aucun fichier envoyé'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Aucun fichier sélectionné'}), 400

        try:
            # Sauvegarder le fichier
            filename = file.filename
            filepath = os.path.join('uploads', filename)
            file.save(filepath)
            
            # Créer l'entrée dans la base de données
            new_file = Fichier(
                nom=filename,
                date_upload=datetime.now(),
                chemin=filepath
            )
            db.session.add(new_file)
            db.session.commit()

            # Lire et parser le fichier OST
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            # Parser chaque ligne
            for line in lines[1:]:  # Skip header
                data = line.strip().split(';')
                if len(data) >= 4:  # Vérifier qu'il y a assez de données
                    donnee = Donnee(
                        numeroDossier=data[0],
                        nom=data[1],
                        prenom=data[2],
                        typeDemande=data[3],
                        fichier_id=new_file.id
                    )
                    db.session.add(donnee)
            
            db.session.commit()
            
            return jsonify({
                'message': 'Fichier importé avec succès',
                'file_id': new_file.id
            }), 200

        except Exception as e:
            db.session.rollback()
            logger.error(f"Erreur lors du parsing : {str(e)}")
            return jsonify({'error': str(e)}), 400

    @app.route('/api/stats', methods=['GET'])
    def get_stats():
        try:
            # Récupérer les 10 derniers fichiers
            derniers_fichiers = Fichier.query.order_by(Fichier.date_upload.desc()).limit(10).all()
            
            stats = {
                'derniers_fichiers': [{
                    'id': f.id,
                    'nom': f.nom,
                    'date_upload': f.date_upload.strftime('%Y-%m-%d %H:%M:%S'),
                    'nombre_donnees': Donnee.query.filter_by(fichier_id=f.id).count()
                } for f in derniers_fichiers]
            }
            
            return jsonify(stats), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return app

if __name__ == '__main__':
    app = init_app()
    app.run(host='0.0.0.0', port=5000, debug=True)