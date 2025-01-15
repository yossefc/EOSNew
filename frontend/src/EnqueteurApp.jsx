import React from 'react';
import EnqueteurViewer from './components/EnqueteurViewer';

function EnqueteurApp() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              EOS System - Interface Enquêteur
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        <EnqueteurViewer />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="text-sm text-gray-500">
            {new Date().getFullYear()} EOS System
          </div>
        </div>
      </footer>
    </div>
  );
}

export default EnqueteurApp;