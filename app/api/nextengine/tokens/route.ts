import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCookies } from '../../../../lib/nextengine-api';

export async function GET() {
  try {
    const tokens = await getTokensFromCookies();
    
    return NextResponse.json({
      success: true,
      hasTokens: !!tokens.accessToken,
      userInfo: tokens.userInfo
    });
  } catch (error) {
    console.error('Error getting Next Engine tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get tokens' },
      { status: 500 }
    );
  }
}