'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, ExternalLink } from 'lucide-react';

interface NextEngineAuthProps {
  isAuthenticated?: boolean;
  userInfo?: {
    company_name: string;
    pic_name: string;
  } | null;
  onAuthSuccess?: () => void;
}

export function NextEngineAuth({ isAuthenticated, userInfo, onAuthSuccess }: NextEngineAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get OAuth URL from our API
      const response = await fetch('/api/auth/nextengine/oauth', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to get OAuth URL');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Next Engine OAuth
      window.location.href = data.oauthUrl;
      
    } catch (error) {
      console.error('OAuth error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start authorization');
      setIsLoading(false);
    }
  };

  if (isAuthenticated && userInfo) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-green-600">✅ Next Engine Connected</CardTitle>
          <CardDescription>
            Successfully connected to Next Engine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <strong>Company:</strong> {userInfo.company_name}
          </div>
          <div className="text-sm">
            <strong>User:</strong> {userInfo.pic_name}
          </div>
          <div className="pt-2">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
            >
              Refresh Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connect to Next Engine</CardTitle>
        <CardDescription>
          Authorize this application to access your Next Engine data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2 text-sm text-gray-600">
          <p>This will redirect you to Next Engine to:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Login to your Next Engine account</li>
            <li>Grant permission to access your data</li>
            <li>Return to this application</li>
          </ul>
        </div>

        <Button 
          onClick={handleAuthorize} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecting...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Authorize Next Engine Access
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
