from flask import Flask, request, jsonify
from extensions import init_extensions, db
from routes.enqueteur import register_enqueteur_routes
from routes.vpn_template import register_vpn_template_routes
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
    init_extensions(app)
    register_enqueteur_routes(app)
    register_vpn_template_routes(app)

    with app.app_context():
        db.create_all()

    @app.route('/api/donnees', methods=['GET'])
    def get_donnees():
        """Route pour récupérer les données"""
        try:
            donnees = Donnee.query.all()
            return jsonify({
                "success": True,
                "data": [donnee.to_dict() for donnee in donnees]
            })
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des données: {str(e)}")
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500

    @app.route('/api/donnees/<int:id>', methods=['DELETE'])
    def delete_donnee(id):
        try:
            donnee = Donnee.query.get_or_404(id)
            db.session.delete(donnee)
            db.session.commit()
            return jsonify({'message': 'Enregistrement supprimé avec succès'}), 200
        except Exception as e:
            db.session.rollback()
            logger.error(f"Erreur lors de la suppression : {str(e)}")
            return jsonify({'error': 'Erreur lors de la suppression'}), 500

    @app.route('/api/donnees', methods=['POST'])
    def add_donnee():
        try:
            data = request.json
            nouvelle_donnee = Donnee(
                numeroDossier=data.get('numeroDossier'),
                referenceDossier=data.get('referenceDossier'),
                typeDemande=data.get('typeDemande'),
                nom=data.get('nom'),
                prenom=data.get('prenom'),
                dateNaissance=datetime.strptime(data.get('dateNaissance'), '%Y-%m-%d').date() if data.get('dateNaissance') else None,
                lieuNaissance=data.get('lieuNaissance'),
                codePostal=data.get('codePostal'),
                ville=data.get('ville'),
                adresse1=data.get('adresse1'),
                adresse2=data.get('adresse2'),
                adresse3=data.get('adresse3'),
                telephonePersonnel=data.get('telephonePersonnel')
            )
            db.session.add(nouvelle_donnee)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Données ajoutées avec succès',
                'data': nouvelle_donnee.to_dict()
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route('/api/donnees-enqueteur/<int:donnee_id>', methods=['POST'])
    def update_donnee_enqueteur(donnee_id):
        try:
            data = request.get_json()
            
            # Récupérer l'entrée existante ou en créer une nouvelle
            donnee_enqueteur = DonneeEnqueteur.query.filter_by(donnee_id=donnee_id).first()
            if not donnee_enqueteur:
                donnee_enqueteur = DonneeEnqueteur(donnee_id=donnee_id)
                db.session.add(donnee_enqueteur)
            
            # Mettre à jour les champs
            if 'dateVisite' in data:
                donnee_enqueteur.dateVisite = datetime.strptime(data['dateVisite'], '%Y-%m-%d').date()
            if 'resultat' in data:
                donnee_enqueteur.resultat = data['resultat']
            if 'commentaire' in data:
                donnee_enqueteur.commentaire = data['commentaire']
            
            db.session.commit()
            
            return jsonify({'success': True, 'message': 'Données mises à jour avec succès'})
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400

    @app.route('/parse', methods=['POST'])
    def parse_file():
        logger.info("Début du traitement de la requête d'import")
        try:
            if 'file' not in request.files:
                return jsonify({"error": "Aucun fichier fourni"}), 400
                
            file = request.files['file']
            if not file.filename:
                return jsonify({"error": "Nom de fichier invalide"}), 400

            # Vérifier si le fichier existe déjà
            existing_file = Fichier.query.filter_by(nom=file.filename).first()
            if existing_file:
                return jsonify({
                    "status": "file_exists",
                    "message": "Ce fichier existe déjà. Voulez-vous le remplacer ?",
                    "existing_file_info": {
                        "nom": existing_file.nom,
                        "date_upload": existing_file.date_upload.strftime('%Y-%m-%d %H:%M:%S'),
                        "nombre_donnees": Donnee.query.filter_by(fichier_id=existing_file.id).count()
                    }
                }), 409

            # 1. Lire le contenu du fichier
            content = file.read()
            if not content:
                return jsonify({"error": "Fichier vide"}), 400

            try:
                # 2. Créer d'abord l'entrée du fichier
                nouveau_fichier = Fichier(nom=file.filename)
                db.session.add(nouveau_fichier)
                db.session.commit()
                logger.info(f"Fichier créé avec ID: {nouveau_fichier.id}")

                # 3. Traiter le contenu avec l'ID du fichier
                from utils import process_file_content
                processed_records = process_file_content(content, nouveau_fichier.id)
                
                if processed_records:
                    return jsonify({
                        "message": "Fichier traité avec succès",
                        "file_id": nouveau_fichier.id,
                        "records_processed": len(processed_records)
                    })
                else:
                    # Si aucun enregistrement n'a été créé, on supprime le fichier
                    db.session.delete(nouveau_fichier)
                    db.session.commit()
                    return jsonify({"error": "Aucun enregistrement valide trouvé dans le fichier"}), 400

            except Exception as e:
                # En cas d'erreur, on s'assure de supprimer le fichier s'il a été créé
                if 'nouveau_fichier' in locals():
                    try:
                        db.session.delete(nouveau_fichier)
                        db.session.commit()
                    except:
                        db.session.rollback()
                
                logger.error(f"Erreur lors du traitement du contenu: {str(e)}")
                return jsonify({"error": str(e)}), 400

        except Exception as e:
            logger.error(f"Erreur lors du traitement: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @app.route('/replace-file', methods=['POST'])
    def replace_file():
        try:
            if 'file' not in request.files:
                return jsonify({"error": "Aucun fichier fourni"}), 400
                
            file = request.files['file']
            if not file.filename:
                return jsonify({"error": "Nom de fichier invalide"}), 400

            # Supprimer l'ancien fichier et ses données
            existing_file = Fichier.query.filter_by(nom=file.filename).first()
            if existing_file:
                Donnee.query.filter_by(fichier_id=existing_file.id).delete()
                db.session.delete(existing_file)
                db.session.commit()

            # Créer le nouveau fichier
            nouveau_fichier = Fichier(nom=file.filename)
            db.session.add(nouveau_fichier)
            db.session.commit()
            
            content = file.read()
            from utils import process_file_content
            processed_records = process_file_content(content, nouveau_fichier.id)

            return jsonify({
                "message": "Fichier remplacé avec succès",
                "file_id": nouveau_fichier.id,
                "records_processed": len(processed_records)
            })

        except Exception as e:
            logger.error(f"Erreur lors du remplacement: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @app.route('/api/stats', methods=['GET'])
    def get_stats():
        try:
            total_fichiers = Fichier.query.count()
            total_donnees = Donnee.query.count()
            
            derniers_fichiers = (Fichier.query
                            .order_by(Fichier.date_upload.desc())
                            .all())
            
            fichiers_info = [{
                "id": f.id,
                "nom": f.nom,
                "date_upload": f.date_upload.strftime('%Y-%m-%d %H:%M:%S'),
                "nombre_donnees": Donnee.query.filter_by(fichier_id=f.id).count()
            } for f in derniers_fichiers]
            
            logger.info(f"Stats - Fichiers: {total_fichiers}, Données: {total_donnees}")
            return jsonify({
                "total_fichiers": total_fichiers,
                "total_donnees": total_donnees,
                "derniers_fichiers": fichiers_info
            })
            
        except Exception as e:
            logger.error(f"Erreur dans get_stats: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @app.route('/api/files/<int:file_id>', methods=['DELETE'])
    def delete_file(file_id):
        try:
            logger.info(f"Tentative de suppression du fichier {file_id}")
            fichier = Fichier.query.get_or_404(file_id)
            
            # Supprimer d'abord toutes les données associées
            try:
                Donnee.query.filter_by(fichier_id=file_id).delete()
                logger.info(f"Données du fichier {file_id} supprimées")
            except Exception as e:
                logger.error(f"Erreur lors de la suppression des données: {e}")
                db.session.rollback()
                return jsonify({"error": "Erreur lors de la suppression des données"}), 500
            
            # Supprimer le fichier
            try:
                db.session.delete(fichier)
                db.session.commit()
                logger.info(f"Fichier {file_id} supprimé avec succès")
            except Exception as e:
                logger.error(f"Erreur lors de la suppression du fichier: {e}")
                db.session.rollback()
                return jsonify({"error": "Erreur lors de la suppression du fichier"}), 500
            
            return jsonify({"message": "Fichier supprimé avec succès"}), 200
            
        except Exception as e:
            logger.error(f"Erreur générale lors de la suppression: {e}")
            return jsonify({"error": str(e)}), 500

    return app

if __name__ == '__main__':
    app = init_app()
    app.run(debug=True)