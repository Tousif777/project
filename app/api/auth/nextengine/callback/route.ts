import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const state = searchParams.get('state');
    
    console.log('Next Engine OAuth callback received:', { uid: uid?.substring(0, 10) + '...', state: state?.substring(0, 10) + '...' });
    
    if (!uid || !state) {
      console.error('Missing uid or state parameter');
      return NextResponse.redirect(new URL('/dashboard?error=missing_params', request.url));
    }

    const clientId = process.env.NEXT_ENGINE_CLIENT_ID;
    const clientSecret = process.env.NEXT_ENGINE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Next Engine credentials not configured');
      return NextResponse.redirect(new URL('/dashboard?error=config_error', request.url));
    }

    // Exchange uid and state for access_token
    console.log('Exchanging uid/state for access token...');
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
      console.error('Failed to get access token:', response.status, errorBody);
      return NextResponse.redirect(new URL('/dashboard?error=token_exchange_failed', request.url));
    }

    const tokenData = await response.json();
    
    if (tokenData.result !== 'success' || !tokenData.access_token) {
      console.error('Invalid token response:', tokenData);
      return NextResponse.redirect(new URL('/dashboard?error=invalid_token_response', request.url));
    }

    console.log('✅ Successfully obtained Next Engine tokens');
    console.log('Company:', tokenData.company_name);
    console.log('User:', tokenData.pic_name);

    // Get base URL from environment variable
    const baseUrl = process.env.NEXTAUTH_URL || '';
    if (!baseUrl) {
      console.error('NEXTAUTH_URL environment variable is not set');
      return NextResponse.redirect(new URL('/dashboard?error=config_error', request.url));
    }
    
    // Create redirect URL using the base URL from environment variables
    const redirectUrl = new URL('/dashboard', baseUrl).toString();
    console.log('Redirecting to:', redirectUrl);
    
    // Store tokens in cookies (for demo - use database for production)
    const response_redirect = NextResponse.redirect(redirectUrl);
    
    // Set secure cookies with tokens (expires in 1 day for access token)
    response_redirect.cookies.set('ne_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60, // 1 day
      sameSite: 'lax'
    });
    
    response_redirect.cookies.set('ne_refresh_token', tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3 * 24 * 60 * 60, // 3 days
      sameSite: 'lax'
    });

    // Store user info
    response_redirect.cookies.set('ne_user_info', JSON.stringify({
      company_name: tokenData.company_name,
      pic_name: tokenData.pic_name,
      uid: tokenData.uid
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60,
      sameSite: 'lax'
    });

    return response_redirect;

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=internal_error', request.url));
  }
}
