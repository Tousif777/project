import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCookies, isNextEngineAuthenticated } from '../../../../../lib/nextengine-api';

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await isNextEngineAuthenticated();
    const { userInfo } = await getTokensFromCookies();
    
    return NextResponse.json({
      isAuthenticated,
      userInfo
    });
    
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check authentication status' }, 
      { status: 500 }
    );
  }
}
