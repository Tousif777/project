'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Loader2, Package, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

interface AmazonInventoryItem {
  sku: string;
  fnsku: string;
  asin: string;
  condition: string;
  totalQuantity: number;
  inboundWorkingQuantity: number;
  inboundShippedQuantity: number;
  inboundReceivingQuantity: number;
  reservedQuantity: number;
  researchingQuantity: number;
  unfulfillableQuantity: number;
}

export function AmazonInventoryDisplay() {
  const [inventory, setInventory] = useState<AmazonInventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/amazon/inventory');
      if (!response.ok) {
        throw new Error('Failed to load Amazon inventory');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setInventory(data.data);
      } else {
        throw new Error(data.error || 'No inventory data available');
      }
    } catch (err) {
      console.error('Amazon inventory error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>Amazon FBA Inventory</span>
        </CardTitle>
        <CardDescription>
          Current inventory levels at Amazon fulfillment centers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading Amazon inventory...</span>
          </div>
        )}

        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && inventory.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No inventory data loaded</p>
            <Button onClick={loadInventory} variant="outline">
              Load FBA Inventory
            </Button>
          </div>
        )}

        {inventory.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Total SKUs: {inventory.length}
              </div>
              <Button onClick={loadInventory} variant="outline" size="sm">
                Refresh
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>ASIN</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Inbound</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.slice(0, 10).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.sku}</TableCell>
                      <TableCell>
                        {item.asin && (
                          <a
                            href={`https://www.amazon.co.jp/dp/${item.asin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {item.asin}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.condition === 'NEW' ? 'default' : 'secondary'}>
                          {item.condition}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.totalQuantity - item.reservedQuantity - item.unfulfillableQuantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.inboundWorkingQuantity + item.inboundShippedQuantity + item.inboundReceivingQuantity}
                      </TableCell>
                      <TableCell className="text-right">{item.reservedQuantity}</TableCell>
                      <TableCell className="text-right font-medium">{item.totalQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {inventory.length > 10 && (
              <div className="text-center text-sm text-gray-600">
                Showing first 10 items of {inventory.length} total
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
