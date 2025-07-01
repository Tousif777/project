import Header from '@/components/dashboard/Header';
import MainContent from '@/components/dashboard/MainContent';
import { NextEngineAuth } from '@/components/nextengine/NextEngineAuth';
import { getTokensFromCookies, isNextEngineAuthenticated } from '@/lib/nextengine-api';
import { Suspense } from 'react';

// Mark this page as dynamic since it uses cookies
export const dynamic = 'force-dynamic';

async function NextEngineStatus() {
  const isAuthenticated = await isNextEngineAuthenticated();
  const { userInfo } = await getTokensFromCookies();
  
  return (
    <div className="mb-6">
      <NextEngineAuth 
        isAuthenticated={isAuthenticated} 
        userInfo={userInfo}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <Suspense fallback={<div>Loading Next Engine status...</div>}>
          <NextEngineStatus />
        </Suspense>
        <MainContent />
      </div>
    </div>
  );
}