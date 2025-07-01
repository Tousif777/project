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

    // Try a simpler redirect URI that might be pre-configured
    const redirectUri = 'http://localhost:3000/callback';
    
    // Use the correct Next Engine OAuth endpoint
    const oauthUrl = `https://base.next-engine.org/users/sign_in/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    console.log('Testing with simple redirect URI:', redirectUri);
    
    return NextResponse.json({ 
      oauthUrl,
      redirectUri,
      note: 'This uses a simpler redirect URI. If this works, update your Next Engine app settings accordingly.'
    });
    
  } catch (error) {
    console.error('OAuth initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize OAuth flow' }, 
      { status: 500 }
    );
  }
}
