'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { 
  Package, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Download,
  Eye
} from 'lucide-react';
import { ShipmentPlan, CalculationResult, ShipmentCalculatorService } from '../../lib/services/shipment-calculator';
import { BusinessRules } from '../../lib/services/business-rules';

interface ShipmentReviewProps {
  plan: ShipmentPlan;
  onPlanUpdate: (updatedPlan: ShipmentPlan) => void;
  onGenerateCSV: () => void;
  isGeneratingCSV?: boolean;
}

export function ShipmentReview({ plan, onPlanUpdate, onGenerateCSV, isGeneratingCSV }: ShipmentReviewProps) {
  const [editingItem, setEditingItem] = useState<CalculationResult | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [adjustmentError, setAdjustmentError] = useState<string>('');
  const [isGeneratingTOOU, setIsGeneratingTOOU] = useState(false);
  const [isGeneratingLOGI, setIsGeneratingLOGI] = useState(false);

  const handleDownloadTOOU = async () => {
    setIsGeneratingTOOU(true);
    try {
      const response = await fetch('/api/excel/export-toou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: plan.items }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TOOU-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        console.error('Failed to generate TOOU CSV:', errorData.error);
      }
    } catch (error) {
      console.error('Error downloading TOOU CSV:', error);
    } finally {
      setIsGeneratingTOOU(false);
    }
  };

  const handleDownloadLOGI = async () => {
    setIsGeneratingLOGI(true);
    try {
      const response = await fetch('/api/excel/export-logi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: plan.items }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LOGI-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        console.error('Failed to generate LOGI CSV:', errorData.error);
      }
    } catch (error) {
      console.error('Error downloading LOGI CSV:', error);
    } finally {
      setIsGeneratingLOGI(false);
    }
  };

  const handleEditClick = (item: CalculationResult) => {
    setEditingItem(item);
    setEditQuantity(item.finalQuantity.toString());
    setAdjustmentError('');
  };

  const handleSaveAdjustment = () => {
    if (!editingItem) return;

    const newQuantity = parseInt(editQuantity) || 0;
    const result = ShipmentCalculatorService.adjustQuantity(
      plan,
      editingItem.sku,
      newQuantity,
      plan.businessRules
    );

    if (result.success && result.updatedPlan) {
      onPlanUpdate(result.updatedPlan);
      setEditingItem(null);
      setAdjustmentError('');
    } else {
      setAdjustmentError(result.error || 'Failed to update quantity');
    }
  };

  const getStatusBadge = (item: CalculationResult) => {
    if (!item.canShip) {
      return <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Cannot Ship</Badge>;
    }
    if (item.warnings.length > 0) {
      return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
    }
    return <Badge variant="default" className="text-xs bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Ready</Badge>;
  };

  const shippableItems = plan.items.filter(item => item.canShip && item.finalQuantity > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total Items</p>
                <p className="text-2xl font-bold text-slate-900">{plan.summary.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total Quantity</p>
                <p className="text-2xl font-bold text-slate-900">{plan.summary.totalQuantity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">TOOU Total</p>
                <p className="text-2xl font-bold text-blue-900">{plan.items.reduce((sum, item) => sum + item.toouQty, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">LOGI Total</p>
                <p className="text-2xl font-bold text-green-900">{plan.items.reduce((sum, item) => sum + item.logiQty, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Shippable SKUs</p>
                <p className="text-2xl font-bold text-slate-900">{shippableItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Warnings</p>
                <p className="text-2xl font-bold text-slate-900">{plan.summary.warnings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {plan.summary.warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-1">
              {plan.summary.warnings.map((warning, index) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Shipment Plan Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Shipment Plan Review</CardTitle>
              <CardDescription>
                Review and adjust quantities before generating TOOU.csv and LOGI.csv files
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleDownloadTOOU}
                disabled={plan.items.filter(item => item.toouQty > 0).length === 0 || isGeneratingTOOU}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingTOOU ? 'Generating...' : 'Download TOOU.csv'}
              </Button>
              <Button 
                onClick={handleDownloadLOGI}
                disabled={plan.items.filter(item => item.logiQty > 0).length === 0 || isGeneratingLOGI}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingLOGI ? 'Generating...' : 'Download LOGI.csv'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Avg Daily Sales</TableHead>
                  <TableHead>Target Qty</TableHead>
                  <TableHead>Final Qty</TableHead>
                  <TableHead>TOOU Qty</TableHead>
                  <TableHead>LOGI Qty</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.items.map((item) => (
                  <TableRow 
                    key={item.sku}
                    className={item.manuallyAdjusted ? 'bg-blue-50' : ''}
                  >
                    <TableCell className="font-medium">
                      {item.sku}
                      {item.manuallyAdjusted && (
                        <Badge variant="outline" className="ml-2 text-xs">Modified</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(item)}</TableCell>
                    <TableCell>{item.currentStock}</TableCell>
                    <TableCell>{item.averageDailySales.toFixed(2)}</TableCell>
                    <TableCell>{item.targetQuantity}</TableCell>
                    <TableCell className="font-medium">{item.finalQuantity}</TableCell>
                    <TableCell className="font-medium text-blue-600">{item.toouQty}</TableCell>
                    <TableCell className="font-medium text-green-600">{item.logiQty}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(item)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Calculation Details: {item.sku}</DialogTitle>
                              <DialogDescription>
                                Detailed reasoning for the calculated quantity
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Calculation Steps:</h4>
                                <ul className="space-y-1 text-sm text-slate-600">
                                  {item.reasoning.map((reason, index) => (
                                    <li key={index}>• {reason}</li>
                                  ))}
                                </ul>
                              </div>
                              {item.warnings.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2 text-yellow-700">Warnings:</h4>
                                  <ul className="space-y-1 text-sm text-yellow-600">
                                    {item.warnings.map((warning, index) => (
                                      <li key={index}>• {warning}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Quantity Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Quantity: {editingItem.sku}</DialogTitle>
              <DialogDescription>
                Current stock: {editingItem.currentStock} | 
                Max allowed: {Math.floor(editingItem.currentStock * (1 - plan.businessRules.safety_stock_percent / 100))}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">New Quantity</label>
                <Input
                  type="number"
                  min="0"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              {adjustmentError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{adjustmentError}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAdjustment}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}