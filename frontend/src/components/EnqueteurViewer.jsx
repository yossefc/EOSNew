// frontend/src/components/EnqueteurViewer.jsx
import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Download, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VPNTemplateManager from './VPNTemplateManager';

const API_URL = 'http://localhost:5000';

const EnqueteurViewer = () => {
    const [enqueteurs, setEnqueteurs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newEnqueteur, setNewEnqueteur] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: ''
    });

    const fetchEnqueteurs = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/enqueteurs`);
            const data = await response.json();
            if (data.success) {
                setEnqueteurs(data.data);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEnqueteur = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/enqueteurs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEnqueteur)
            });

            const data = await response.json();

            if (response.ok) {
                await fetchEnqueteurs();
                setShowAddDialog(false);
                setNewEnqueteur({ nom: '', prenom: '', email: '', telephone: '' });
                alert('Enquêteur ajouté avec succès');
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteEnqueteur = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enquêteur ?')) {
            try {
                const response = await fetch(`${API_URL}/api/enqueteurs/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    await fetchEnqueteurs();
                    alert('Enquêteur supprimé avec succès');
                } else {
                    const data = await response.json();
                    throw new Error(data.error);
                }
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const downloadVPNConfig = async (id, nom, prenom) => {
        try {
            const response = await fetch(`${API_URL}/api/enqueteurs/${id}/vpn-config`);
            const data = await response.json();
            
            if (data.success) {
                // Afficher un message de succès avec le chemin du fichier
                alert(`Configuration VPN générée avec succès !\n\nChemin du fichier : ${data.config_path}`);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setError(err.message);
            alert('Erreur lors de la génération de la configuration VPN');
        }
    };

    useEffect(() => {
        fetchEnqueteurs();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <VPNTemplateManager />
            
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users className="w-6 h-6" />
                        Gestion des enquêteurs
                    </h2>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowAddDialog(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter un enquêteur
                        </button>
                        <button
                            onClick={fetchEnqueteurs}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Actualiser
                        </button>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {enqueteurs.map((enqueteur) => (
                        <div key={enqueteur.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium">{enqueteur.nom} {enqueteur.prenom}</h3>
                                    <p className="text-sm text-gray-500">{enqueteur.email}</p>
                                    <p className="text-sm text-gray-500">{enqueteur.telephone}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => downloadVPNConfig(enqueteur.id, enqueteur.nom, enqueteur.prenom)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                        title="Télécharger la configuration VPN"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEnqueteur(enqueteur.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                        title="Supprimer l'enquêteur"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter un enquêteur</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddEnqueteur}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Nom
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newEnqueteur.nom}
                                    onChange={(e) => setNewEnqueteur({...newEnqueteur, nom: e.target.value})}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Prénom
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newEnqueteur.prenom}
                                    onChange={(e) => setNewEnqueteur({...newEnqueteur, prenom: e.target.value})}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={newEnqueteur.email}
                                    onChange={(e) => setNewEnqueteur({...newEnqueteur, email: e.target.value})}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Téléphone
                                </label>
                                <input
                                    type="tel"
                                    value={newEnqueteur.telephone}
                                    onChange={(e) => setNewEnqueteur({...newEnqueteur, telephone: e.target.value})}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                />
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <button
                                type="button"
                                onClick={() => setShowAddDialog(false)}
                                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Ajouter
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EnqueteurViewer;