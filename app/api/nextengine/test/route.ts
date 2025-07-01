import { NextRequest, NextResponse } from 'next/server';
import { getNextEngineData } from '../../../../lib/integrations/nextEngine';
import { isNextEngineAuthenticated } from '../../../../lib/nextengine-api';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const isAuthenticated = await isNextEngineAuthenticated();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Next Engine authentication required' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'sales' | 'inventory' || 'sales';

    console.log(`Fetching Next Engine ${type} data...`);
    
    // Fetch data from Next Engine
    const data = await getNextEngineData(type);
    
    return NextResponse.json({
      success: true,
      type,
      count: Array.isArray(data) ? data.length : 0,
      data: Array.isArray(data) ? data.slice(0, 5) : data, // Return first 5 items for demo
      message: `Successfully fetched ${type} data from Next Engine`
    });
    
  } catch (error) {
    console.error('Next Engine API test error:', error);
    
    if (error instanceof Error && error.message.includes('authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required', needsAuth: true }, 
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
