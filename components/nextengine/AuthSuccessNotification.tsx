'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AuthSuccessNotification() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const authStatus = searchParams.get('auth');
    const error = searchParams.get('error');
    
    if (authStatus === 'success' || error) {
      setShowNotification(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
        clearUrlParams();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const clearUrlParams = () => {
    // Remove the auth/error parameters from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    url.searchParams.delete('error');
    router.replace(url.pathname, { scroll: false });
  };

  const handleDismiss = () => {
    setShowNotification(false);
    clearUrlParams();
  };

  if (!showNotification) {
    return null;
  }

  const authStatus = searchParams.get('auth');
  const error = searchParams.get('error');

  if (authStatus === 'success') {
    return (
      <div className="fixed top-4 right-4 z-50 w-96">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <div className="flex items-start justify-between">
            <div>
              <AlertDescription className="text-green-800">
                <strong>Next Engine Connected Successfully!</strong>
                <br />
                You can now test API endpoints and access your Next Engine data.
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="ml-2 h-6 w-6 p-0 text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (error) {
    const errorMessages: Record<string, string> = {
      missing_params: 'Missing required parameters from Next Engine',
      config_error: 'Next Engine configuration error',
      token_exchange_failed: 'Failed to exchange authorization code for tokens',
      invalid_token_response: 'Invalid response from Next Engine',
      internal_error: 'Internal server error during authentication'
    };

    return (
      <div className="fixed top-4 right-4 z-50 w-96">
        <Alert className="border-red-200 bg-red-50">
          <X className="h-4 w-4 text-red-600" />
          <div className="flex items-start justify-between">
            <div>
              <AlertDescription className="text-red-800">
                <strong>Next Engine Authentication Failed</strong>
                <br />
                {errorMessages[error] || `Unknown error: ${error}`}
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="ml-2 h-6 w-6 p-0 text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return null;
}
