import React, { useState, useEffect } from 'react';
import { Shield, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_URL = 'http://localhost:5000';

const VPNTemplateManager = () => {
    const [hasTemplate, setHasTemplate] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkTemplate = async () => {
        try {
            const response = await fetch(`${API_URL}/api/vpn-template`);
            const data = await response.json();
            setHasTemplate(data.exists);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/api/vpn-template`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de l\'upload du template');
            }

            await checkTemplate();
            alert('Template VPN uploadé avec succès');
        } catch (err) {
            setError(err.message);
        } finally {
            e.target.value = ''; // Reset input file
        }
    };

    useEffect(() => {
        checkTemplate();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-500" />
                <h3 className="font-medium">Configuration VPN</h3>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${hasTemplate ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>
                        {hasTemplate ? 'Template VPN configuré' : 'Template VPN non configuré'}
                    </span>
                </div>

                <div>
                    <label className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Upload className="w-4 h-4" />
                            {hasTemplate ? 'Modifier le template' : 'Uploader le template VPN'}
                        </div>
                        <input
                            type="file"
                            accept=".ovpn"
                            onChange={handleTemplateUpload}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                        />
                    </label>
                </div>

                {hasTemplate && (
                    <div className="text-sm text-gray-500">
                        Le template sera utilisé pour générer les configurations VPN des enquêteurs.
                    </div>
                )}
            </div>
        </div>
    );
};

export default VPNTemplateManager;