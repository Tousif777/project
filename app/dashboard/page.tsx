import Header from '@/components/dashboard/Header';
import MainContent from '@/components/dashboard/MainContent';
import { NextEngineAuth } from '@/components/nextengine/NextEngineAuth';
import { NextEngineApiTests } from '@/components/nextengine/NextEngineApiTests';
import { AuthSuccessNotification } from '@/components/nextengine/AuthSuccessNotification';
import { AmazonAuth } from '@/components/amazon/AmazonAuth';
import { AmazonInventoryDisplay } from '@/components/amazon/AmazonInventoryDisplay';
import { getTokensFromCookies, isNextEngineAuthenticated } from '@/lib/nextengine-api';
import { Suspense } from 'react';

// Mark this page as dynamic since it uses cookies
export const dynamic = 'force-dynamic';

async function NextEngineStatus() {
  const isAuthenticated = await isNextEngineAuthenticated();
  const { userInfo } = await getTokensFromCookies();
  
  return (
    <div className="space-y-6">
      <NextEngineAuth 
        isAuthenticated={isAuthenticated} 
        userInfo={userInfo}
      />
      {/* <NextEngineApiTests 
        isAuthenticated={isAuthenticated} 
        userInfo={userInfo}
      /> */}
    </div>
  );
}

function AmazonStatus() {
  // Check if Amazon refresh token exists
  const isAmazonAuthenticated = !!process.env.AMAZON_REFRESH_TOKEN;
  
  return (
    <div className="space-y-6">
      <AmazonAuth 
        isAuthenticated={isAmazonAuthenticated}
      />
      {isAmazonAuthenticated && (
        <AmazonInventoryDisplay />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="xl:col-span-2">
            <MainContent />
          </div>
          
          {/* Integrations Section - Right Side */}
          <div className="xl:col-span-1 space-y-6">
            {/* Next Engine Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Next Engine Integration</h2>
              <Suspense fallback={<div>Loading Next Engine status...</div>}>
                <NextEngineStatus />
              </Suspense>
            </div>
            
            {/* Amazon Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Amazon SP-API Integration</h2>
              <AmazonStatus />
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Success/Error Notification */}
      <Suspense fallback={null}>
        <AuthSuccessNotification />
      </Suspense>
    </div>
  );
}