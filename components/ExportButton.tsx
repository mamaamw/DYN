'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileJson, FileCode, ChevronDown } from 'lucide-react';
import { exportData, prepareDataForExport, ExportFormat } from '@/lib/exportUtils';

interface ExportButtonProps {
  data: any[];
  filename?: string;
  title?: string;
  excludeFields?: string[];
  className?: string;
}

export default function ExportButton({ 
  data, 
  filename = 'export',
  title = 'Export',
  excludeFields = [],
  className = ''
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: ExportFormat) => {
    const cleanedData = prepareDataForExport(data, excludeFields);
    exportData(cleanedData, format, filename, { title });
    setIsOpen(false);
  };

  const formats = [
    { 
      id: 'excel' as ExportFormat, 
      label: 'Excel', 
      icon: FileSpreadsheet, 
      color: 'text-green-600',
      description: 'Format Excel (.xls)'
    },
    { 
      id: 'csv' as ExportFormat, 
      label: 'CSV', 
      icon: FileText, 
      color: 'text-blue-600',
      description: 'Valeurs séparées par virgules'
    },
    { 
      id: 'json' as ExportFormat, 
      label: 'JSON', 
      icon: FileJson, 
      color: 'text-yellow-600',
      description: 'Format JSON'
    },
    { 
      id: 'html' as ExportFormat, 
      label: 'HTML', 
      icon: FileCode, 
      color: 'text-purple-600',
      description: 'Page HTML'
    }
  ];

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={!data || data.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        Exporter
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay pour fermer le menu */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu déroulant */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-700">Choisir le format</p>
              <p className="text-xs text-gray-500 mt-1">
                {data?.length || 0} enregistrement(s)
              </p>
            </div>
            
            <div className="py-2">
              {formats.map(format => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.id}
                    onClick={() => handleExport(format.id)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <Icon className={`w-5 h-5 ${format.color} flex-shrink-0 mt-0.5`} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{format.label}</p>
                      <p className="text-xs text-gray-500">{format.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
