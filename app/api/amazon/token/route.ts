import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/amazon-spapi-auth';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const tokenData = await exchangeCodeForTokens(code);

    if (tokenData.error) {
      return NextResponse.json(
        { error: tokenData.error_description || tokenData.error }, 
        { status: 400 }
      );
    }

    if (tokenData.refresh_token) {
      return NextResponse.json({ 
        success: true,
        refresh_token: tokenData.refresh_token 
      });
    } else {
      return NextResponse.json(
        { error: 'No refresh token received' }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { error: 'Failed to exchange code for tokens' }, 
      { status: 500 }
    );
  }
}
