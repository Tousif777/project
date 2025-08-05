'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, Upload, Download, CheckCircle2 } from 'lucide-react';

export default function MainContent() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            <span>Amazon FBA Shipment Planner</span>
          </CardTitle>
          <CardDescription>
            Process Excel files to generate Amazon FBA shipment plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <Upload className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">1. Upload Excel</h3>
                <p className="text-sm text-blue-700">Upload your product spreadsheet</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium text-green-900">2. Review Data</h3>
                <p className="text-sm text-green-700">Validate processed information</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
              <Download className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-medium text-purple-900">3. Download CSV</h3>
                <p className="text-sm text-purple-700">Get Amazon-ready file</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Excel Format */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Required Excel Format</CardTitle>
          <CardDescription>
            Your Excel file must contain these columns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Product Information</h4>
              <ul className="space-y-1 text-slate-600">
                <li>• Merchant SKU</li>
                <li>• Prep owner</li>
                <li>• Labeling owner</li>
                <li>• Expiration date (MM/DD/YYYY)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Packaging Details</h4>
              <ul className="space-y-1 text-slate-600">
                <li>• Units per box</li>
                <li>• Number of boxes</li>
                <li>• Box length (cm)</li>
                <li>• Box width (cm)</li>
                <li>• Box height (cm)</li>
                <li>• Box weight (kg)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}