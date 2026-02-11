// Utilitaires pour exporter des données dans différents formats

export type ExportFormat = 'excel' | 'csv' | 'json' | 'html';

/**
 * Convertit les données en CSV
 */
export function toCSV(data: any[], filename: string = 'export'): void {
  if (!data || data.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  // Récupérer les en-têtes
  const headers = Object.keys(data[0]);
  
  // Créer les lignes CSV
  const csvContent = [
    headers.join(','), // En-têtes
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Échapper les virgules et guillemets
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Convertit les données en JSON
 */
export function toJSON(data: any[], filename: string = 'export'): void {
  if (!data || data.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

/**
 * Convertit les données en HTML
 */
export function toHTML(data: any[], filename: string = 'export', title: string = 'Export'): void {
  if (!data || data.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  const headers = Object.keys(data[0]);
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background: #f5f5f5;
    }
    h1 {
      color: #333;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #4F46E5;
      color: white;
      font-weight: bold;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .footer {
      margin-top: 20px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
  <table>
    <thead>
      <tr>
        ${headers.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map(row => `
        <tr>
          ${headers.map(h => {
            const value = row[h];
            if (value === null || value === undefined) return '<td></td>';
            return `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="footer">
    <p>Total: ${data.length} enregistrement(s)</p>
  </div>
</body>
</html>
  `;

  downloadFile(htmlContent, `${filename}.html`, 'text/html');
}

/**
 * Convertit les données en Excel (format XML compatible Excel)
 */
export function toExcel(data: any[], filename: string = 'export', sheetName: string = 'Données'): void {
  if (!data || data.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  const headers = Object.keys(data[0]);
  
  // Créer un contenu CSV avec séparateur tabulation pour Excel
  const csvContent = [
    headers.join('\t'), // En-têtes séparés par des tabulations
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Échapper les tabulations et retours à la ligne
        return stringValue.replace(/\t/g, ' ').replace(/\n/g, ' ');
      }).join('\t')
    )
  ].join('\n');

  downloadFile(csvContent, `${filename}.xls`, 'application/vnd.ms-excel');
}

/**
 * Fonction utilitaire pour télécharger un fichier
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporte les données dans le format spécifié
 */
export function exportData(
  data: any[], 
  format: ExportFormat, 
  filename: string = 'export',
  options?: {
    title?: string;
    sheetName?: string;
  }
): void {
  switch (format) {
    case 'excel':
      toExcel(data, filename, options?.sheetName || 'Données');
      break;
    case 'csv':
      toCSV(data, filename);
      break;
    case 'json':
      toJSON(data, filename);
      break;
    case 'html':
      toHTML(data, filename, options?.title || 'Export');
      break;
    default:
      console.error('Format non supporté:', format);
  }
}

/**
 * Transforme les données pour l'export (nettoie et formate)
 */
export function prepareDataForExport(data: any[], excludeFields: string[] = []): any[] {
  if (!data || data.length === 0) return [];

  return data.map(item => {
    const cleaned: any = {};
    
    Object.keys(item).forEach(key => {
      // Exclure certains champs
      if (excludeFields.includes(key)) return;
      
      // Exclure les champs techniques
      if (key === 'password' || key === 'deletedAt' || key.endsWith('Id')) return;
      
      const value = item[key];
      
      // Formater les dates
      if (value instanceof Date) {
        cleaned[key] = value.toLocaleString('fr-FR');
      }
      // Formater les booléens
      else if (typeof value === 'boolean') {
        cleaned[key] = value ? 'Oui' : 'Non';
      }
      // Nettoyer null/undefined
      else if (value === null || value === undefined) {
        cleaned[key] = '';
      }
      // Parser les JSON strings
      else if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          cleaned[key] = JSON.parse(value);
        } catch {
          cleaned[key] = value;
        }
      }
      else {
        cleaned[key] = value;
      }
    });
    
    return cleaned;
  });
}
