import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { skus, startDate, endDate } = await request.json();

    if (!skus || !Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json(
        { error: 'SKUs array is required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

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

    const sales = [];
    
    // Fetch sales data from Next Engine API using the proper helper
    for (const sku of skus) {
      try {
        // First, get the goods information to find the goods_id
        const goodsData = await fetchNextEngineData(
          process.env.NEXT_ENGINE_CLIENT_ID!,
          process.env.NEXT_ENGINE_CLIENT_SECRET!,
          'api_v1_master_goods/search',
          {
            'goods_id-eq': sku, // Use correct Next Engine API parameter format for goods code search
            fields: 'goods_id,goods_name' // Removed invalid 'goods_code' field
          },
          undefined, // uid
          undefined, // state
          { accessToken, refreshToken }
        );

        let goodsId = null;
        if (goodsData && goodsData.data && goodsData.data.length > 0) {
          goodsId = goodsData.data[0].goods_id;
        }

        if (!goodsId) {
          // If goods not found, add with zero sales
          sales.push({
            sku,
            totalSales: 0,
            averageDailySales: 0,
            salesHistory: []
          });
          continue;
        }

        // Now search for order rows using goods_id
        const data = await fetchNextEngineData(
          process.env.NEXT_ENGINE_CLIENT_ID!,
          process.env.NEXT_ENGINE_CLIENT_SECRET!,
          'api_v1_receiveorder_row/search',
          {
            'receive_order_row_goods_id-eq': goodsId, // Updated to use correct parameter format
            receive_order_date_from: startDate,
            receive_order_date_to: endDate,
            fields: 'receive_order_row_goods_id,receive_order_row_quantity,receive_order_date' // Updated to use correct field names
          },
          undefined, // uid
          undefined, // state
          { accessToken, refreshToken }
        );

        let totalSales = 0;
        const salesHistory = [];
        
        if (data && data.data && data.data.length > 0) {
          // Group sales by date
          const salesByDate: Record<string, number> = {};
          
          for (const orderRow of data.data) {
            const date = (orderRow as any).receive_order_date?.split(' ')[0] || ''; // Get date part only
            const quantity = parseInt((orderRow as any).receive_order_row_quantity) || 0;
            
            if (!salesByDate[date]) {
              salesByDate[date] = 0;
            }
            salesByDate[date] += quantity;
            totalSales += quantity;
          }
          
          // Create sales history array
          for (const [date, quantity] of Object.entries(salesByDate)) {
            salesHistory.push({
              date,
              quantity: quantity as number
            });
          }
        }
        
        const averageDailySales = daysDiff > 0 ? totalSales / daysDiff : 0;
        
        sales.push({
          sku,
          totalSales,
          averageDailySales,
          salesHistory
        });
        
      } catch (error) {
        console.error(`Error fetching sales for SKU ${sku}:`, error);
        // Add with zero sales on error
        sales.push({
          sku,
          totalSales: 0,
          averageDailySales: 0,
          salesHistory: []
        });
      }
    }

    return NextResponse.json({ sales });
  } catch (error) {
    console.error('Error fetching sales batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    );
  }
}