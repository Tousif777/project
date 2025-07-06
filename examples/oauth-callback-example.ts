// Example OAuth callback handler for Next Engine integration
// This should be implemented in your Next.js app at /app/api/auth/nextengine/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const state = searchParams.get('state');
    
    if (!uid || !state) {
      return NextResponse.json(
        { error: 'Missing uid or state parameter' }, 
        { status: 400 }
      );
    }

    const clientId = process.env.NEXT_ENGINE_CLIENT_ID;
    const clientSecret = process.env.NEXT_ENGINE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Next Engine credentials not configured' }, 
        { status: 500 }
      );
    }

    // Exchange uid and state for access_token
    const response = await fetch('https://api.next-engine.org/api_neauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        uid,
        state,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        { error: `Failed to get access token: ${response.status} ${errorBody}` }, 
        { status: 500 }
      );
    }

    const tokenData = await response.json();
    
    if (tokenData.result !== 'success' || !tokenData.access_token) {
      return NextResponse.json(
        { error: 'Failed to get access token', details: tokenData }, 
        { status: 500 }
      );
    }

    // TODO: Store tokens securely (database, encrypted session, etc.)
    // For production, implement proper token storage
    console.log('Successfully obtained Next Engine tokens');
    console.log('Access Token:', tokenData.access_token.substring(0, 10) + '...');
    console.log('Company:', tokenData.company_name);
    console.log('User:', tokenData.pic_name);

    // Redirect to a success page or dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error during OAuth callback' }, 
      { status: 500 }
    );
  }
}

// Example: How to initiate OAuth flow from your frontend
export async function POST(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_ENGINE_CLIENT_ID;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Next Engine client ID not configured' }, 
        { status: 500 }
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/nextengine/callback`;
    
    const oauthUrl = `https://base.next-engine.org/users/sign_in?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    return NextResponse.json({ oauthUrl });
    
  } catch (error) {
    console.error('OAuth initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize OAuth flow' }, 
      { status: 500 }
    );
  }
}
