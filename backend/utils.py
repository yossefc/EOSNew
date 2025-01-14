import logging
from datetime import datetime
from extensions import db
from models.models import Donnee, Fichier
from models.models_enqueteur import DonneeEnqueteur
import codecs

logger = logging.getLogger(__name__)

# Définition des positions des colonnes
COLUMN_SPECS =  [
                    ("numeroDossier", 0, 10), 
                    ("referenceDossier", 10, 25),
                    ("numeroInterlocuteur", 25, 37),     
                    ("guidInterlocuteur", 37, 73),     
                    ("typeDemande", 73, 76),     
                    ("numeroDemande", 76, 87),     
                    ("numeroDemandeContestee", 87, 98),     
                    ("numeroDemandeInitiale", 98, 109),     
                    ("forfaitDemande", 109, 125),     
                    ("dateRetourEspere", 125, 135),     
                    ("qualite", 135, 145),     
                    ("nom", 145, 175),     
                    ("prenom", 175, 195),     
                    ("dateNaissance", 195, 205),    
                    ("lieuNaissance", 205, 255),     
                    ("codePostalDeNaissance", 255, 265),     
                    ("paysNaissance", 265, 297),     
                    ("nomPatronymique", 297, 327), 
                    ("adresse1", 327, 359),     
                    ("adresse2", 359, 391),    
                    ("adresse3", 391, 423),     
                    ("adresse4", 423, 455),     
                    ("ville", 455, 487 ),    
                    ("codePostal", 487, 497),
                    ("paysResidence", 497, 529),
                    ("telephonePersonnel", 529, 544),
                    ("telephoneEmployeur", 544, 559),
                    ("telecopieEmployeur", 559, 574),
                    ("nomEmployeur", 574, 606),
                    ("banqueDomiciliation",606, 638),
                    ("libelleGuichet", 638, 668),
                    ("titulaireCompte", 668, 700),
                    ("codeBanque", 700, 705),
                    ("codeGuichet", 705, 710),
                    ("numeroCompte", 710, 721),
                    ("ribCompte", 721, 723),
                    ("datedenvoie", 723, 733),
                    ("elementDemandes", 733, 743),
                    ("elementObligatoires", 743, 753),
                    ("elementContestes", 753, 763),
                    ("codeMotif", 763, 779),
                    ("motifDeContestation", 779, 843),
                    ("CumulMontantsPrecedents", 843, 851),
                    ("codeSociete", 851, 853),
                    ("urgence", 853, 854),
                    ("commentaire", 854, 1854)]
  

def parse_line(line):
    """Parse une ligne selon les spécifications exactes"""
    try:
        if len(line.strip()) == 0:
            return None
            
        record = {}
        for name, start, end in COLUMN_SPECS:
            try:
                # S'assurer que la ligne est assez longue
                if len(line) >= end:
                    value = line[start:end].strip()
                else:
                    value = line[start:].strip() if len(line) > start else ""
                record[name] = value
            except Exception as e:
                logger.error(f"Erreur lors de l'extraction du champ {name}: {str(e)}")
                record[name] = ""

        # Vérifier si on a un numéro de dossier valide
        if not record.get("numeroDossier"):
            return None

        logger.debug(f"Ligne parsée avec succès: {record['numeroDossier']}")
        return record

    except Exception as e:
        logger.error(f"Erreur lors du parsing de la ligne: {str(e)}")
        return None

def process_file_content(content, fichier_id):
    """Traite le contenu du fichier et crée les enregistrements"""
    try:
        # Décodage du contenu en UTF-8
        if isinstance(content, bytes):
            content = content.decode('utf-8')
        
        # Séparation des lignes et suppression des lignes vides
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        
        logger.info(f"Traitement de {len(lines)} lignes pour le fichier {fichier_id}")
        processed_records = []
        errors = []

        for line_number, line in enumerate(lines, 1):
            try:
                record = parse_line(line)
                if record:
                    record = clean_and_validate_record(record)
                    if record:
                        record['fichier_id'] = fichier_id
                        nouvelle_donnee = Donnee(
                            fichier_id=fichier_id,
                            numeroDossier=record.get('numeroDossier'),
                            referenceDossier=record.get('referenceDossier'),
                            numeroInterlocuteur=record.get('numeroInterlocuteur'),
                            guidInterlocuteur=record.get('guidInterlocuteur'),
                            typeDemande=record.get('typeDemande'),
                            numeroDemande=record.get('numeroDemande'),
                            numeroDemandeContestee=record.get('numeroDemandeContestee'),
                            numeroDemandeInitiale=record.get('numeroDemandeInitiale'),
                            forfaitDemande=record.get('forfaitDemande'),
                            dateRetourEspere=convert_date(record.get('dateRetourEspere')),
                            qualite=record.get('qualite'),
                            nom=record.get('nom'),
                            prenom=record.get('prenom'),
                            dateNaissance=convert_date(record.get('dateNaissance')),
                            lieuNaissance=record.get('lieuNaissance'),
                            codePostalNaissance=record.get('codePostalDeNaissance'),
                            paysNaissance=record.get('paysNaissance'),
                            nomPatronymique=record.get('nomPatronymique'),
                            adresse1=record.get('adresse1'),
                            adresse2=record.get('adresse2'),
                            adresse3=record.get('adresse3'),
                            adresse4=record.get('adresse4'),
                            ville=record.get('ville'),
                            codePostal=record.get('codePostal'),
                            paysResidence=record.get('paysResidence'),
                            telephonePersonnel=record.get('telephonePersonnel'),
                            telephoneEmployeur=record.get('telephoneEmployeur'),
                            telecopieEmployeur=record.get('telecopieEmployeur'),
                            nomEmployeur=record.get('nomEmployeur'),
                            banqueDomiciliation=record.get('banqueDomiciliation'),
                            libelleGuichet=record.get('libelleGuichet'),
                            titulaireCompte=record.get('titulaireCompte'),
                            codeBanque=record.get('codeBanque'),
                            codeGuichet=record.get('codeGuichet'),
                            numeroCompte=record.get('numeroCompte'),
                            ribCompte=record.get('ribCompte'),
                            datedenvoie=convert_date(record.get('datedenvoie')),
                            elementDemandes=record.get('elementDemandes'),
                            elementObligatoires=record.get('elementObligatoires'),
                            elementContestes=record.get('elementContestes'),
                            codeMotif=record.get('codeMotif'),
                            motifDeContestation=record.get('motifDeContestation'),
                            cumulMontantsPrecedents=convert_float(record.get('CumulMontantsPrecedents')),
                            codesociete=record.get('codeSociete'),
                            urgence=record.get('urgence'),
                            commentaire=record.get('commentaire')
                        )
                        db.session.add(nouvelle_donnee)
                        db.session.flush()  # Pour obtenir l'id de la donnée
                        
                        # Créer automatiquement une entrée dans DonneeEnqueteur
                        new_donnee_enqueteur = DonneeEnqueteur(
                            donnee_id=nouvelle_donnee.id
                        )
                        db.session.add(new_donnee_enqueteur)
                        
                        processed_records.append(record)
                        
                        if len(processed_records) % 100 == 0:
                            db.session.commit()
                        
            except Exception as e:
                errors.append(f"Ligne {line_number}: {str(e)}")
                continue
        
        # Commit final
        db.session.commit()
        count = Donnee.query.filter_by(fichier_id=fichier_id).count()
        print(f"Import terminé. {count} enregistrements créés")
        
        if errors:
            print(f"Erreurs rencontrées : {len(errors)}")
            for error in errors:
                print(error)
        
        return processed_records
        
    except Exception as e:
        db.session.rollback()
        raise e

def clean_and_validate_record(record):
    """Nettoie et valide les données d'un enregistrement"""
    if not record:
        return None
    return record

def convert_date(date_str):
    """Convertit une chaîne de date au format DD/MM/YYYY en objet datetime"""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, '%d/%m/%Y')
    except ValueError:
        return None

def convert_float(float_str):
    """Convertit une chaîne en float"""
    if not float_str:
        return None
    try:
        return float(float_str.replace(',', '.'))
    except ValueError:
        return None