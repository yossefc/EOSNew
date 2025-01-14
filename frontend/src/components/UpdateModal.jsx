import React, { useState, useEffect } from 'react';
import { 
    X, Search, AlertCircle, User, Phone, Building2, 
    Building, CreditCard, Calendar, Info, 
    MapPin, Mail, Briefcase, Landmark 
} from 'lucide-react';

// Constantes pour les types de recherche
const TYPE_RECHERCHE = {
    A: "Adresse",
    T: "Téléphone",
    D: "Décès",
    B: "Coordonnées bancaires",
    E: "Coordonnées employeur",
    R: "Revenus"
};

// Constantes pour les codes résultat
const CODES_RESULTAT = [
    { code: 'P', libelle: 'Positif' },
    { code: 'N', libelle: 'Négatif / NPA' },
    { code: 'H', libelle: 'Adresse/téléphone confirmés' },
    { code: 'Z', libelle: 'Annulation agence' },
    { code: 'I', libelle: 'Intraitable' },
    { code: 'Y', libelle: 'Annulation EOS' }
];

const UpdateModal = ({ isOpen, onClose, data }) => {
    const [enqueteurData, setEnqueteurData] = useState({
        // Résultat enquête
        code_resultat: '',
        elements_retrouves: '',
        flag_etat_civil_errone: '',
        date_retour: new Date().toISOString().split('T')[0],

        // Nouvelles coordonnées
        adresse1: '',
        adresse2: '',
        adresse3: '',
        adresse4: '',
        code_postal: '',
        ville: '',
        pays: 'FRANCE',
        telephone_personnel: '',
        telephone_employeur: '',
        
        // Informations bancaires
        banque_domiciliation: '',
        libelle_guichet: '',
        code_banque: '',
        code_guichet: '',
        
        // Informations sur les revenus
        commentaires_revenus: '',
        montant_salaire: '',
        periode_versement_salaire: '',
        frequence_versement_salaire: '',

        // Mémos
        memo1: '',
        memo2: '',
        memo3: '',
        memo4: '',
        memo5: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEnqueteurData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (!isOpen) return null;

    // Récupérer les éléments demandés et obligatoires
    const elementsDemandes = data?.elementDemandes?.split('') || [];
    const elementsObligatoires = data?.elementObligatoires?.split('') || [];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-[1000px] max-h-[90vh] overflow-y-auto">
                {/* En-tête */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-t-xl">
                    <div className="flex justify-between items-start">
                        <div className="text-white space-y-2">
                            <h2 className="text-2xl font-bold">Dossier n° {data?.numeroDossier}</h2>
                            <p>{data?.typeDemande === 'ENQ' ? 'Enquête' : 'Contestation'}</p>
                            
                            {/* Éléments demandés */}
                            <div className="space-y-1">
                                <p className="font-medium">Éléments demandés :</p>
                                <div className="flex flex-wrap gap-2">
                                    {elementsDemandes.map(code => (
                                        <span key={code} className="bg-blue-500/20 px-2 py-1 rounded text-sm">
                                            {TYPE_RECHERCHE[code]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Éléments obligatoires */}
                            <div className="space-y-1">
                                <p className="font-medium">Éléments obligatoires :</p>
                                <div className="flex flex-wrap gap-2">
                                    {elementsObligatoires.map(code => (
                                        <span key={code} className="bg-red-500/20 px-2 py-1 rounded text-sm flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {TYPE_RECHERCHE[code]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => onClose(false)} className="text-white/70 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Informations en lecture seule */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium mb-4">Informations du dossier</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Nom</p>
                                <p className="font-medium">{data?.nom}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Prénom</p>
                                <p className="font-medium">{data?.prenom}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Date de naissance</p>
                                <p className="font-medium">{data?.dateNaissance}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Lieu de naissance</p>
                                <p className="font-medium">{data?.lieuNaissance}</p>
                            </div>
                            {data?.adresse && (
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Adresse connue</p>
                                    <p className="font-medium">{data.adresse}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Formulaire de saisie enquêteur */}
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                        {/* Résultat de l'enquête */}
                        <div className="bg-white border rounded-lg p-4">
                            <h3 className="font-medium mb-4">Résultat de l'enquête</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Code résultat</label>
                                    <select
                                        name="code_resultat"
                                        value={enqueteurData.code_resultat}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="">Sélectionnez un résultat</option>
                                        {CODES_RESULTAT.map(({ code, libelle }) => (
                                            <option key={code} value={code}>{code} - {libelle}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        État civil erroné ?
                                    </label>
                                    <select
                                        name="flag_etat_civil_errone"
                                        value={enqueteurData.flag_etat_civil_errone}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="">Non</option>
                                        <option value="E">Oui</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Nouvelles coordonnées */}
                        <div className="bg-white border rounded-lg p-4">
                            <h3 className="font-medium mb-4">Nouvelles coordonnées</h3>
                            <div className="space-y-4">
                                {/* Adresse */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Ligne 1 (Étage, Appartement)
                                    </label>
                                    <input
                                        type="text"
                                        name="adresse1"
                                        value={enqueteurData.adresse1}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
                                        maxLength={32}
                                    />
                                </div>
                                {/* ... autres champs d'adresse ... */}
                            </div>
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => onClose(false)}
                                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;