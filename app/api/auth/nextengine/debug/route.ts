import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_ENGINE_CLIENT_ID;
  const clientSecret = process.env.NEXT_ENGINE_CLIENT_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  
  return NextResponse.json({
    clientId: clientId ? `${clientId.substring(0, 5)}...` : 'NOT_SET',
    clientSecret: clientSecret ? `${clientSecret.substring(0, 5)}...` : 'NOT_SET',
    baseUrl,
    redirectUri: `${baseUrl}/api/auth/nextengine/callback`,
    expectedNextEngineUrl: `https://base.next-engine.org/users/sign_in?client_id=${clientId}&redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/nextengine/callback`)}`,
    troubleshooting: {
      step1: 'Check if redirect_uri in Next Engine app settings matches the redirectUri above',
      step2: 'Verify client_id is correct',
      step3: 'Make sure app is approved/published in Next Engine'
    }
  });
}
