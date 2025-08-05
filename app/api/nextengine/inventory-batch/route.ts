import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { skus } = await request.json();

    if (!skus || !Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json(
        { error: 'SKUs array is required' },
        { status: 400 }
      );
    }

    // Import the Next Engine API helper
    const { fetchNextEngineData, getTokensFromCookies } = await import('../../../../lib/nextengine-api');
    
    // Get tokens from cookies
    const { accessToken, refreshToken } = await getTokensFromCookies();
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Next Engine authentication required' },
        { status: 401 }
      );
    }

    const inventory = [];
    
    // Fetch inventory data from Next Engine API using the proper helper
    for (const sku of skus) {
      try {
        const data = await fetchNextEngineData(
          process.env.NEXT_ENGINE_CLIENT_ID!,
          process.env.NEXT_ENGINE_CLIENT_SECRET!,
          'api_v1_master_stock/search',
          {
            'stock_goods_id-eq': sku,
            fields: 'stock_goods_id,stock_quantity' // Removed invalid 'stock_reserved_quantity' field
          },
          undefined, // uid
          undefined, // state
          { accessToken, refreshToken }
        );

        if (data && data.data && data.data.length > 0) {
          const item = data.data[0];
          const warehouseStock = parseInt(item.stock_quantity) || 0;
          inventory.push({
            sku,
            warehouseStock,
            reservedStock: 0, // Reserved quantity not available in Next Engine API
            availableStock: warehouseStock // Since reserved quantity is unknown, available = warehouse stock
          });
        } else {
          // SKU not found, add with zero stock
          inventory.push({
            sku,
            warehouseStock: 0,
            reservedStock: 0,
            availableStock: 0
          });
        }
      } catch (error) {
        console.error(`Error fetching inventory for SKU ${sku}:`, error);
        // Add with zero stock on error
        inventory.push({
          sku,
          warehouseStock: 0,
          reservedStock: 0,
          availableStock: 0
        });
      }
    }

    return NextResponse.json({ inventory });
  } catch (error) {
    console.error('Error fetching inventory batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    );
  }
}