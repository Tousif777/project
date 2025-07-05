import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/amazon-spapi-auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('spapi_oauth_code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code received from Amazon' }, 
      { status: 400 }
    );
  }

  try {
    const tokenData = await exchangeCodeForTokens(code);

    if (tokenData.error) {
      return NextResponse.json(
        { error: tokenData.error_description || tokenData.error }, 
        { status: 400 }
      );
    }

    if (tokenData.refresh_token) {
      // Return the refresh token - you should store this securely
      return NextResponse.json({ 
        success: true,
        refresh_token: tokenData.refresh_token,
        message: 'Authorization successful! Please save the refresh_token to your .env.local file.'
      });
    } else {
      return NextResponse.json(
        { error: 'No refresh token received' }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Failed to exchange authorization code for tokens' }, 
      { status: 500 }
    );
  }
}
