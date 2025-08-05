'use client';

import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { ExcelFBAInventoryItem } from '../../lib/services/excel-processing';

interface ExcelUploaderProps {
  onDataProcessed?: (data: ExcelFBAInventoryItem[]) => void;
}

export function ExcelUploader({ onDataProcessed }: ExcelUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ExcelFBAInventoryItem[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/excel/process', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setProcessedData(result.data);
        setSuccess(result.message);
        onDataProcessed?.(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to process Excel file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (processedData.length === 0) return;

    try {
      const response = await fetch('/api/excel/export-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: processedData }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amazon-fba-shipment-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate CSV file');
      }
    } catch (err) {
      setError('Failed to download CSV file. Please try again.');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/excel/template');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fba-inventory-template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download template');
      }
    } catch (err) {
      setError('Failed to download template. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel File Upload
          </CardTitle>
          <CardDescription>
            Upload your Excel file with FBA shipment data. At minimum, you need a SKU column. Other fields will use default values if not provided.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Click to upload or drag and drop your Excel file
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={triggerFileInput} 
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Choose Excel File'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadTemplate}
                  className="ml-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Supports .xlsx and .xls files. Download template for correct format.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {processedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Data</CardTitle>
            <CardDescription>
              {processedData.length} items processed successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Quantity</th>
                      <th className="text-left p-2">Prep Owner</th>
                      <th className="text-left p-2">Labeling Owner</th>
                      <th className="text-left p-2">Boxes</th>
                      <th className="text-left p-2">Expiration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.sku}</td>
                        <td className="p-2">{item.totalQuantity}</td>
                        <td className="p-2">{item.prepOwner}</td>
                        <td className="p-2">{item.labelingOwner}</td>
                        <td className="p-2">{item.numberOfBoxes}</td>
                        <td className="p-2">{item.expirationDate || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <Button 
                onClick={handleDownloadCSV}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Amazon FBA CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}