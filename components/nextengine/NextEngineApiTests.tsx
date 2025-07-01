'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Database, 
  Package, 
  ShoppingCart,
  AlertTriangle,
  Activity,
  Eye
} from 'lucide-react';

interface ApiTestResult {
  endpoint: string;
  status: 'success' | 'error' | 'loading';
  data?: any;
  error?: string;
  responseTime?: number;
  debug?: {
    requestBody?: any;
    responseStatus?: number;
    responseText?: string;
  };
}

interface NextEngineApiTestsProps {
  isAuthenticated: boolean;
  userInfo?: any;
}

export function NextEngineApiTests({ isAuthenticated, userInfo }: NextEngineApiTestsProps) {
  const [testResults, setTestResults] = useState<Record<string, ApiTestResult>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  const apiEndpoints = [
    { key: 'receiveorder_base', name: '受注情報 (Orders)', endpoint: 'api_v1_receiveorder_base/search', description: 'Get sales data for FBA allocation calculations' },
    { key: 'stock_base', name: '在庫情報 (Inventory)', endpoint: 'api_v1_master_stock/search', description: 'Get inventory from Main/RSL/LOGI warehouses' },
    { key: 'goods_base', name: '商品情報 (Products)', endpoint: 'api_v1_master_goods/search', description: 'Get product info for shipment filtering' }
  ];

  const runSingleTest = async (endpoint: { key: string; endpoint: string; name: string }) => {
    setTestResults(prev => ({
      ...prev,
      [endpoint.key]: { endpoint: endpoint.endpoint, status: 'loading' }
    }));

    const startTime = Date.now();
    const requestBody = { 
      endpoint: endpoint.endpoint,
      params: { limit: 3 }
    };

    try {
      console.log(`Testing endpoint: ${endpoint.name}`, requestBody);
      
      const response = await fetch('/api/nextengine/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const responseTime = Date.now() - startTime;
      
      // Get response text first
      const responseText = await response.text();
      console.log(`Response for ${endpoint.name}:`, {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 500)
      });
      
      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : { error: 'Empty response' };
      } catch (parseError) {
        data = { 
          error: `JSON Parse Error: ${parseError instanceof Error ? parseError.message : 'Unknown'}`,
          responsePreview: responseText.substring(0, 200)
        };
      }

      if (response.ok && data.success) {
        setTestResults(prev => ({
          ...prev,
          [endpoint.key]: {
            endpoint: endpoint.endpoint,
            status: 'success',
            data: data,
            responseTime,
            debug: {
              requestBody,
              responseStatus: response.status,
              responseText: responseText.substring(0, 200)
            }
          }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [endpoint.key]: {
            endpoint: endpoint.endpoint,
            status: 'error',
            error: data.error || `HTTP ${response.status}: ${response.statusText}`,
            responseTime,
            debug: {
              requestBody,
              responseStatus: response.status,
              responseText: responseText.substring(0, 200)
            }
          }
        }));
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [endpoint.key]: {
          endpoint: endpoint.endpoint,
          status: 'error',
          error: error.message,
          responseTime
        }
      }));
    }
  };

  const runAllTests = async () => {
    if (!isAuthenticated) {
      alert('Please authenticate with Next Engine first');
      return;
    }

    setIsRunningTests(true);
    setTestResults({});

    // Run tests sequentially to avoid rate limiting
    for (const endpoint of apiEndpoints) {
      await runSingleTest(endpoint);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunningTests(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getEndpointIcon = (key: string) => {
    switch (key) {
      case 'receiveorder_base':
        return <ShoppingCart className="w-4 h-4" />;
      case 'goods_base':
        return <Package className="w-4 h-4" />;
      case 'stock_base':
        return <Database className="w-4 h-4" />;
      case 'warehouse_base':
        return <Database className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <AlertTriangle className="w-5 h-5" />
            <span>FBA Automation - API Status</span>
          </CardTitle>
          <CardDescription className="text-orange-700">
            Please authenticate with Next Engine to test essential APIs for FBA automation
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>FBA Automation - API Status</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={runAllTests} 
              disabled={isRunningTests}
              size="sm"
            >
              {isRunningTests ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Test Essential APIs
                </>
              )}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Test essential Next Engine APIs required for FBA shipment automation
          {userInfo && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Connected as:</span> {userInfo.pic_name} ({userInfo.company_name})
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="endpoints" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="endpoints" className="space-y-4">
            <div className="grid gap-3">
              {apiEndpoints.map((endpoint) => {
                const result = testResults[endpoint.key];
                return (
                  <div 
                    key={endpoint.key}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex items-center space-x-3">
                      {getEndpointIcon(endpoint.key)}
                      <div>
                        <p className="font-medium text-sm">{endpoint.name}</p>
                        <p className="text-xs text-slate-500">{endpoint.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {result?.responseTime && (
                        <span className="text-xs text-slate-500">
                          {result.responseTime}ms
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runSingleTest(endpoint)}
                        disabled={result?.status === 'loading'}
                      >
                        {result?.status === 'loading' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Test'
                        )}
                      </Button>
                      {getStatusIcon(result?.status || '')}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="space-y-4">
            {Object.keys(testResults).length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No test results yet. Click "Test All APIs" to start testing.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(testResults).map(([key, result]) => {
                  const endpoint = apiEndpoints.find(e => e.key === key);
                  return (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{endpoint?.name}</span>
                          {result.responseTime && (
                            <Badge variant="outline" className="text-xs">
                              {result.responseTime}ms
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {result.status === 'success' && result.data && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <p className="text-sm text-green-800 mb-2">✓ Success Response:</p>
                          <pre className="text-xs text-green-700 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(result.data, null, 2).substring(0, 500)}
                            {JSON.stringify(result.data, null, 2).length > 500 && '...'}
                          </pre>
                        </div>
                      )}
                      
                      {result.status === 'error' && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-sm text-red-800">✗ Error:</p>
                          <p className="text-sm text-red-700 mb-2">{result.error}</p>
                          {result.debug && (
                            <details className="text-xs text-red-600">
                              <summary className="cursor-pointer mb-1">Debug Info</summary>
                              <pre className="bg-red-100 p-2 rounded mt-1 overflow-x-auto">
                                Status: {result.debug.responseStatus}
                                Request: {JSON.stringify(result.debug.requestBody, null, 2)}
                                Response: {result.debug.responseText}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
