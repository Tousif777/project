import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_ENGINE_CLIENT_ID;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Next Engine client ID not configured' }, 
        { status: 500 }
      );
    }

    // Get the base URL from the request
    const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const redirectUri = `${baseUrl}/api/auth/nextengine/callback`;
    
    // Use the correct Next Engine OAuth endpoint according to documentation
    const oauthUrl = `https://base.next-engine.org/users/sign_in/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    console.log('Generated OAuth URL:', oauthUrl);
    console.log('Redirect URI:', redirectUri);
    console.log('Client ID:', clientId);
    
    return NextResponse.json({ 
      oauthUrl,
      redirectUri,
      clientId: clientId.substring(0, 5) + '...',
      message: 'Redirect user to oauthUrl to begin authorization',
      instructions: [
        'Make sure the redirect_uri matches exactly in your Next Engine app settings',
        'Verify your app is published/approved in Next Engine',
        'Check that client_id is correct'
      ]
    });
    
  } catch (error) {
    console.error('OAuth initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize OAuth flow' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Same logic for GET requests
  return POST(request);
}
