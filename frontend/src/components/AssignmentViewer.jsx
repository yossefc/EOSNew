import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;

const AssignmentViewer = () => {
    const [enquetes, setEnquetes] = useState([]);
    const [enqueteurs, setEnqueteurs] = useState([]);
    const [selectedEnqueteur, setSelectedEnqueteur] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        // Charger les enquêtes
        axios.get(`${API_URL}/api/donnees`)
            .then(response => {
                if (Array.isArray(response.data)) {
                    setEnquetes(response.data);
                } else {
                    console.error('Les données reçues ne sont pas un tableau:', response.data);
                    setEnquetes([]);
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des enquêtes:', error);
                setError('Erreur lors du chargement des enquêtes');
            });

        // Charger les enquêteurs
        axios.get(`${API_URL}/api/enqueteurs`)
            .then(response => {
                if (Array.isArray(response.data)) {
                    setEnqueteurs(response.data);
                } else {
                    console.error('Les données reçues ne sont pas un tableau:', response.data);
                    setEnqueteurs([]);
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des enquêteurs:', error);
                setError('Erreur lors du chargement des enquêteurs');
            });
    }, []);

    const handleAssignment = async (enqueteId, enqueteurId) => {
        try {
            await axios.post(`${API_URL}/api/assign-enquete`, {
                enqueteId: enqueteId,
                enqueteurId: enqueteurId
            });
            // Rafraîchir les données après l'assignation
            const response = await axios.get(`${API_URL}/api/donnees`);
            if (Array.isArray(response.data)) {
                setEnquetes(response.data);
            }
        } catch (error) {
            console.error('Erreur lors de l\'assignation:', error);
            setError('Erreur lors de l\'assignation de l\'enquête');
        }
    };

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Assignation des Enquêtes</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 border">Numéro Dossier</th>
                            <th className="px-4 py-2 border">Nom</th>
                            <th className="px-4 py-2 border">Prénom</th>
                            <th className="px-4 py-2 border">Type Demande</th>
                            <th className="px-4 py-2 border">Enquêteur Assigné</th>
                            <th className="px-4 py-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(enquetes) && enquetes.map((enquete) => (
                            <tr key={enquete.numeroDossier}>
                                <td className="px-4 py-2 border">{enquete.numeroDossier}</td>
                                <td className="px-4 py-2 border">{enquete.nom}</td>
                                <td className="px-4 py-2 border">{enquete.prenom}</td>
                                <td className="px-4 py-2 border">{enquete.typeDemande}</td>
                                <td className="px-4 py-2 border">
                                    {enquete.enqueteurId ? 
                                        enqueteurs.find(e => e.id === enquete.enqueteurId)?.nom 
                                        : 'Non assigné'}
                                </td>
                                <td className="px-4 py-2 border">
                                    <select
                                        className="border rounded px-2 py-1"
                                        value={enquete.enqueteurId || ''}
                                        onChange={(e) => handleAssignment(enquete.numeroDossier, e.target.value)}
                                    >
                                        <option value="">Sélectionner un enquêteur</option>
                                        {enqueteurs.map((enqueteur) => (
                                            <option key={enqueteur.id} value={enqueteur.id}>
                                                {enqueteur.nom} {enqueteur.prenom}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!Array.isArray(enquetes) || enquetes.length === 0) && (
                    <div className="text-center py-4 text-gray-500">
                        Aucune enquête disponible
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentViewer;
