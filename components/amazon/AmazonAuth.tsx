'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';

interface AmazonAuthProps {
  isAuthenticated?: boolean;
  onAuthSuccess?: () => void;
}

export function AmazonAuth({ isAuthenticated, onAuthSuccess }: AmazonAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get OAuth URL from our API
      const response = await fetch('/api/amazon/auth-url');

      if (!response.ok) {
        throw new Error('Failed to get OAuth URL');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Open Amazon OAuth in new window
      window.open(data.url, '_blank');
      
    } catch (error) {
      console.error('OAuth error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start authorization');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/amazon/test');
      const data = await response.json();

      if (data.success) {
        onAuthSuccess?.();
      } else {
        setError(data.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to test connection');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-600 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Amazon SP-API Connected
          </CardTitle>
          <CardDescription>
            Successfully connected to Amazon Seller Central
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <span className="text-sm font-medium">Status: Connected</span>
              <span className="text-sm text-gray-600">
                Ready to fetch FBA inventory data
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={testConnection}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              
              <Button
                onClick={handleAuthorize}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Refresh Connection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect to Amazon SP-API</CardTitle>
        <CardDescription>
          Authorize this application to access your Amazon Seller Central data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-sm text-gray-600">
            <p>This will redirect you to Amazon Seller Central to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Login to your Amazon Seller Central account</li>
              <li>Authorize access to your FBA inventory data</li>
              <li>Enable automated shipment calculations</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAuthorize}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Authorize Amazon Access
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
