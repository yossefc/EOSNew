import React, { useState } from 'react';
import { BarChart2, FileText, Database, Users } from 'lucide-react';
import StatsViewer from './StatsViewer';
import FileViewer from './FileViewer';
import DataViewer from './DataViewer';
import EnqueteurViewer from './EnqueteurViewer';

const Tabs = () => {
    const [activeTab, setActiveTab] = useState('stats');

    const tabs = [
        {
            id: 'stats',
            label: 'Statistiques',
            icon: <BarChart2 className="w-4 h-4" />,
            component: <StatsViewer />
        },
        {
            id: 'files',
            label: 'Fichiers',
            icon: <FileText className="w-4 h-4" />,
            component: <FileViewer />
        },
        {
            id: 'data',
            label: 'Données',
            icon: <Database className="w-4 h-4" />,
            component: <DataViewer />
        },
        {
            id: 'enqueteurs',
            label: 'Enquêteurs',
            icon: <Users className="w-4 h-4" />,
            component: <EnqueteurViewer />
        }
    ];

    return (
        <div className="w-full">
            <div className="border-b border-gray-200">
                <nav className="flex gap-4" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2 text-sm font-medium
                                border-b-2 transition-colors duration-200
                                ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-4">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={`${activeTab === tab.id ? 'block' : 'hidden'}`}
                        role="tabpanel"
                    >
                        {tab.component}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Tabs;