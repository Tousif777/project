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
        const data = await fetchNextEngineData(
          process.env.NEXT_ENGINE_CLIENT_ID!,
          process.env.NEXT_ENGINE_CLIENT_SECRET!,
          'api_v1_receiveorder_row/search',
          {
            goods_id: sku,
            receive_order_date_from: startDate,
            receive_order_date_to: endDate,
            fields: 'goods_id,quantity,receive_order_date'
          },
          undefined, // uid
          undefined, // state
          { accessToken, refreshToken }
        );

        let totalSales = 0;
        const salesHistory = [];
        
        if (data && data.data && data.data.length > 0) {
          // Group sales by date
          const salesByDate = {};
          
          for (const order of data.data) {
            const date = order.receive_order_date.split(' ')[0]; // Get date part only
            const quantity = parseInt(order.quantity) || 0;
            
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
              quantity
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