import { NextRequest, NextResponse } from 'next/server';
import { fetchNextEngineData, getTokensFromCookies } from '../../../../lib/nextengine-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'sales' | 'inventory' || 'sales';

    console.log(`Fetching Next Engine ${type} data...`);
    
    // Get tokens from cookies
    const { accessToken, refreshToken } = await getTokensFromCookies();
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Next Engine authentication required' }, 
        { status: 401 }
      );
    }

    // Simple test endpoints with correct Next Engine v1 API paths
    const endpoint = type === 'inventory' ? 'api_v1_master_stock/search' : 'api_v1_receiveorder_base/search';
    
    // Add required fields parameter based on endpoint type
    let params: Record<string, any> = { limit: 5 };
    if (type === 'inventory') {
      params.fields = 'stock_goods_id,stock_quantity';
    } else {
      // For orders (receiveorder_base) - using minimal valid fields
      params.fields = 'receive_order_id,receive_order_date,receive_order_total_amount';
    }
    
    const data = await fetchNextEngineData(
      process.env.NEXT_ENGINE_CLIENT_ID!,
      process.env.NEXT_ENGINE_CLIENT_SECRET!,
      endpoint,
      params
    );
    
    return NextResponse.json({
      success: true,
      type,
      count: Array.isArray(data) ? data.length : 0,
      data: Array.isArray(data) ? data.slice(0, 3) : data,
      message: `Successfully fetched ${type} data from Next Engine`
    });
    
  } catch (error) {
    console.error('Next Engine API test error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, params = {} } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter is required' }, 
        { status: 400 }
      );
    }

    console.log(`Testing Next Engine endpoint: ${endpoint}`);

    // Get tokens from cookies
    const { accessToken, refreshToken } = await getTokensFromCookies();
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Next Engine authentication required. Please authenticate first.' }, 
        { status: 401 }
      );
    }

    // Special handling for info endpoints (like login_company/info)
    const isInfoEndpoint = endpoint.includes('login_company/info');
    
    // Test the specific endpoint parameters
    const testParams: Record<string, any> = { 
      ...params
    };

    // Add limit only for search endpoints, not info endpoints
    if (!isInfoEndpoint) {
      testParams.limit = 3; // Small limit for testing
    }

    // Add required fields parameter if not provided and endpoint requires it
    if (!testParams.fields && !isInfoEndpoint) {
      if (endpoint.includes('receiveorder_base')) {
        testParams.fields = 'receive_order_id,receive_order_date,receive_order_total_amount';
      } else if (endpoint.includes('master_stock')) {
        testParams.fields = 'stock_goods_id,stock_quantity';
      } else if (endpoint.includes('master_goods')) {
        testParams.fields = 'goods_id,goods_name';
      }
    }

    const data = await fetchNextEngineData(
      process.env.NEXT_ENGINE_CLIENT_ID!,
      process.env.NEXT_ENGINE_CLIENT_SECRET!,
      endpoint,
      testParams,
      undefined, // uid
      undefined, // state
      { accessToken, refreshToken } // pass tokens from cookies
    );
    
    return NextResponse.json({
      success: true,
      endpoint,
      params: testParams,
      count: Array.isArray(data?.data) ? data.data.length : 0,
      data: data,
      message: `Successfully tested endpoint: ${endpoint}`
    });
    
  } catch (error) {
    console.error('Next Engine API POST test error:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('authentication') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Authentication failed. Please re-authenticate with Next Engine.' }, 
          { status: 401 }
        );
      }
      
      if (error.message.includes('400')) {
        return NextResponse.json(
          { error: 'Bad request. The endpoint or parameters may be invalid.' }, 
          { status: 400 }
        );
      }
      
      if (error.message.includes('403')) {
        return NextResponse.json(
          { error: 'Access forbidden. Check your API permissions.' }, 
          { status: 403 }
        );
      }
      
      if (error.message.includes('500')) {
        return NextResponse.json(
          { error: 'Next Engine server error. Please try again later.' }, 
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred during API test' }, 
      { status: 500 }
    );
  }
}
