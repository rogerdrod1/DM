import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X,
  Download
} from 'lucide-react';
import { CSVProcessor } from '../lib/CSVProcessor';

const CSVImport = ({ onDataImport, onClose }) => {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [processingStats, setProcessingStats] = useState(null);

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    return { headers, rows };
  };

  const handleFileUpload = useCallback((uploadedFile) => {
    if (!uploadedFile) return;
    
    if (!uploadedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(uploadedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const parsed = parseCSV(csvText);
        setCsvData(parsed);
        setPreview(parsed.rows.slice(0, 5)); // Show first 5 rows
        
        // Note: Column mapping is now handled automatically by CSVProcessor
      } catch (err) {
        setError('Error parsing CSV file: ' + err.message);
      }
    };
    reader.readAsText(uploadedFile);
  }, []);


  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFileUpload(droppedFile);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const processCSVWithNewProcessor = async () => {
    if (!file) return null;

    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const csvText = e.target.result;
          const processor = new CSVProcessor();
          const result = await processor.processCsv(csvText);
          
          if (result.success) {
            setProcessingStats(result.stats);
            resolve(result.data);
          } else {
            reject(new Error(result.error));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const processedData = await processCSVWithNewProcessor();
      if (processedData) {
        // CSV processed successfully
        
        await onDataImport(processedData);
        onClose();
      }
    } catch (err) {
      console.error('❌ CSV import failed:', err);
      setError('Error importing data: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Reporting starts', 'Reporting ends', 'Campaign name', 'Campaign Delivery', 'Attribution setting', 'Results', 'Result indicator', 'Reach', 'Impressions', 'Link clicks', 'Amount spent (USD)'],
      ['2025-06-20', '2025-06-20', 'DFY Content Image', 'active', '7-day click or 1-day view', '3', 'actions:onsite_conversion.messaging_conversation_started_7d', '2009', '2838', '8', '94.98'],
      ['2025-06-19', '2025-06-19', 'DFY Content Image', 'active', '7-day click or 1-day view', '3', 'actions:onsite_conversion.messaging_conversation_started_7d', '2135', '2989', '7', '90.36'],
      ['2025-06-18', '2025-06-18', 'DFY Content Image', 'active', '7-day click or 1-day view', '3', 'actions:onsite_conversion.messaging_conversation_started_7d', '1707', '2158', '5', '61.03']
    ];
    
    const csvContent = sampleData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'facebook-ads-sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Facebook Ads Data
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          {!file && (
            <div>
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Upload Facebook Ads CSV
                </h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <Button variant="outline">
                  Choose File
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                />
              </div>
              
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Need a sample CSV format?</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Download a sample CSV to see the expected format for Facebook Ads data.
                </p>
                <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                  <Download className="h-3 w-3 mr-1" />
                  Download Sample CSV
                </Button>
              </div>
            </div>
          )}

          {/* File Info */}
          {file && (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">{file.name}</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {(file.size / 1024).toFixed(1)} KB • {csvData?.rows?.length || 0} rows
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                setFile(null);
                setCsvData(null);
                setPreview(null);
                setError(null);
                setProcessingStats(null);
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-red-900 dark:text-red-100">{error}</p>
            </div>
          )}

          {/* Processing Statistics */}
          {csvData && processingStats && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Processing Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-blue-600 dark:text-blue-400">Total Rows</div>
                  <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">{processingStats.totalRows}</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-green-600 dark:text-green-400">Valid Rows</div>
                  <div className="text-lg font-semibold text-green-900 dark:text-green-100">{processingStats.validRows}</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm text-orange-600 dark:text-orange-400">Summary Rows Removed</div>
                  <div className="text-lg font-semibold text-orange-900 dark:text-orange-100">{processingStats.summaryRowsRemoved}</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm text-purple-600 dark:text-purple-400">Boosted Posts Removed</div>
                  <div className="text-lg font-semibold text-purple-900 dark:text-purple-100">{processingStats.boostedPostsRemoved}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                The CSV processor automatically detects and cleans your Facebook Ads data, removing summary rows and boosted posts to ensure accurate metrics.
              </div>
            </div>
          )}

          {/* Data Preview */}
          {preview && (
            <div>
              <h3 className="text-lg font-medium mb-4">Data Preview</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-border rounded-lg">
                  <thead className="bg-muted">
                    <tr>
                      {csvData.headers.slice(0, 6).map(header => (
                        <th key={header} className="p-2 text-left text-sm font-medium border-b border-border text-foreground">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className="border-b border-border">
                        {csvData.headers.slice(0, 6).map(header => (
                          <td key={header} className="p-2 text-sm text-foreground">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.rows.length > 5 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Showing 5 of {csvData.rows.length} rows
                </p>
              )}
            </div>
          )}

          {/* Import Button */}
          {csvData && (
            <div className="flex justify-between items-center pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground">
                  Ready to process and import {csvData.rows.length} rows of Facebook Ads data
                </p>
                <p className="text-xs text-muted-foreground">
                  Data will be automatically cleaned and processed. Manual entries will be preserved.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={importing}
                >
                  {importing ? 'Processing & Importing...' : 'Import Data'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVImport;