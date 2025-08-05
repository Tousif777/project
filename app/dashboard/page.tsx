import Header from '@/components/dashboard/Header';
import { NextEngineAuth } from '@/components/nextengine/NextEngineAuth';
import { AuthSuccessNotification } from '@/components/nextengine/AuthSuccessNotification';
import { ShipmentPlanner } from '@/components/shipment/ShipmentPlanner';
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

function ShipmentPlannerSection() {
  return (
    <div className="space-y-6">
      <ShipmentPlanner />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Shipment Planner - Takes most space */}
          <div className="xl:col-span-3">
            <ShipmentPlannerSection />
          </div>
          
          {/* Next Engine Integration - Right sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Next Engine Integration</h2>
              <Suspense fallback={<div>Loading Next Engine status...</div>}>
                <NextEngineStatus />
              </Suspense>
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