'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Key, 
  Database, 
  Globe, 
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  TestTube,
  Shield
} from 'lucide-react';
import Header from '@/components/dashboard/Header';

export default function ApiSettingsContent() {
  const [showSecrets, setShowSecrets] = useState({
    nextEngine: false,
    amazon: false,
    google: false
  });

  const [credentials, setCredentials] = useState({
    nextEngine: {
      apiKey: '••••••••••••••••',
      apiSecret: '••••••••••••••••',
      endpoint: 'https://api.nextengine.com'
    },
    amazon: {
      clientId: '••••••••••••••••',
      clientSecret: '••••••••••••••••',
      refreshToken: '••••••••••••••••',
      region: 'us-east-1'
    },
    google: {
      serviceAccountKey: '••••••••••••••••',
      spreadsheetId: '••••••••••••••••'
    }
  });

  const [connectionStatus, setConnectionStatus] = useState({
    nextEngine: 'connected',
    amazon: 'connected',
    google: 'connected'
  });

  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState('');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async (service: string) => {
    setTesting(service);
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTesting('');
  };

  const toggleVisibility = (service: keyof typeof showSecrets) => {
    setShowSecrets(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertCircle className="w-3 h-3 mr-1" />Warning</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">API Settings</h1>
              <p className="text-slate-600">Manage your API credentials and connections</p>
            </div>
          </div>

          {saved && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                API settings saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Next Engine API */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Database className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>Next Engine API</CardTitle>
                    <CardDescription>Inventory management system integration</CardDescription>
                  </div>
                </div>
                {getStatusBadge(connectionStatus.nextEngine)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ne-api-key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="ne-api-key"
                      type={showSecrets.nextEngine ? "text" : "password"}
                      value={credentials.nextEngine.apiKey}
                      onChange={(e) => setCredentials(prev => ({
                        ...prev,
                        nextEngine: { ...prev.nextEngine, apiKey: e.target.value }
                      }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => toggleVisibility('nextEngine')}
                    >
                      {showSecrets.nextEngine ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ne-api-secret">API Secret</Label>
                  <div className="relative">
                    <Input
                      id="ne-api-secret"
                      type={showSecrets.nextEngine ? "text" : "password"}
                      value={credentials.nextEngine.apiSecret}
                      onChange={(e) => setCredentials(prev => ({
                        ...prev,
                        nextEngine: { ...prev.nextEngine, apiSecret: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ne-endpoint">API Endpoint</Label>
                  <Input
                    id="ne-endpoint"
                    value={credentials.nextEngine.endpoint}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      nextEngine: { ...prev.nextEngine, endpoint: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleTest('nextEngine')}
                  disabled={testing === 'nextEngine'}
                >
                  {testing === 'nextEngine' ? (
                    <>
                      <TestTube className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Amazon SP-API */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className="h-6 w-6 text-orange-600" />
                  <div>
                    <CardTitle>Amazon SP-API</CardTitle>
                    <CardDescription>Amazon Seller Partner API for sales data</CardDescription>
                  </div>
                </div>
                {getStatusBadge(connectionStatus.amazon)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amz-client-id">Client ID</Label>
                  <div className="relative">
                    <Input
                      id="amz-client-id"
                      type={showSecrets.amazon ? "text" : "password"}
                      value={credentials.amazon.clientId}
                      onChange={(e) => setCredentials(prev => ({
                        ...prev,
                        amazon: { ...prev.amazon, clientId: e.target.value }
                      }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => toggleVisibility('amazon')}
                    >
                      {showSecrets.amazon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amz-client-secret">Client Secret</Label>
                  <Input
                    id="amz-client-secret"
                    type={showSecrets.amazon ? "text" : "password"}
                    value={credentials.amazon.clientSecret}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      amazon: { ...prev.amazon, clientSecret: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amz-refresh-token">Refresh Token</Label>
                  <Input
                    id="amz-refresh-token"
                    type={showSecrets.amazon ? "text" : "password"}
                    value={credentials.amazon.refreshToken}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      amazon: { ...prev.amazon, refreshToken: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amz-region">Region</Label>
                  <Input
                    id="amz-region"
                    value={credentials.amazon.region}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      amazon: { ...prev.amazon, region: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleTest('amazon')}
                  disabled={testing === 'amazon'}
                >
                  {testing === 'amazon' ? (
                    <>
                      <TestTube className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Google Sheets API */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-green-600" />
                  <div>
                    <CardTitle>Google Sheets API</CardTitle>
                    <CardDescription>Google Sheets integration for shipment files</CardDescription>
                  </div>
                </div>
                {getStatusBadge(connectionStatus.google)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="google-service-key">Service Account Key (JSON)</Label>
                  <div className="relative">
                    <Input
                      id="google-service-key"
                      type={showSecrets.google ? "text" : "password"}
                      value={credentials.google.serviceAccountKey}
                      onChange={(e) => setCredentials(prev => ({
                        ...prev,
                        google: { ...prev.google, serviceAccountKey: e.target.value }
                      }))}
                      placeholder="Paste your service account JSON key here"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => toggleVisibility('google')}
                    >
                      {showSecrets.google ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google-spreadsheet-id">Template Spreadsheet ID</Label>
                  <Input
                    id="google-spreadsheet-id"
                    value={credentials.google.spreadsheetId}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      google: { ...prev.google, spreadsheetId: e.target.value }
                    }))}
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleTest('google')}
                  disabled={testing === 'google'}
                >
                  {testing === 'google' ? (
                    <>
                      <TestTube className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Security Notice:</strong> All API credentials are encrypted and stored securely. 
              Never share your credentials with unauthorized users.
            </AlertDescription>
          </Alert>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="mr-2 h-4 w-4" />
              Save API Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}