import { fetchNextEngineData, fetchNextEngineDataWithCookies, isNextEngineAuthenticated } from '../nextengine-api';
import { 
  NextEngineOrder, 
  NextEngineOrderDetail, 
  NextEngineStock, 
  NextEngineGoods,
  SalesData,
  InventoryData 
} from '../../types/nextengine';

export async function getNextEngineData(type: 'sales' | 'inventory') {
  // Check if user is authenticated first
  const isAuthenticated = await isNextEngineAuthenticated();
  if (!isAuthenticated) {
    throw new Error('Next Engine authentication required. Please authorize the application first.');
  }

  try {
    let endpoint = '';
    let params = {};

    // Endpoints based on the official Next Engine API documentation
    if (type === 'sales') {
      // Fetch order data (受注伝票検索)
      endpoint = 'api_v1_receiveorder_base/search';
      // Get orders from the last 2 weeks
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const dateFrom = twoWeeksAgo.toISOString().split('T')[0];
      
      params = { 
        fields: 'receive_order_id,receive_order_date,receive_order_shop_id,receive_order_shop_name,receive_order_total_amount,receive_order_confirm_date,receive_order_cancel_type',
        receive_order_date_from: dateFrom,
        receive_order_cancel_type: '0' // Only non-cancelled orders
      };
    } else if (type === 'inventory') {
      // Fetch stock data (在庫マスタ検索)
      endpoint = 'api_v1_master_stock/search';
      params = { 
        fields: 'goods_id,goods_code,goods_name,stock_quantity,stock_free_quantity,stock_warehouse_id,stock_warehouse_name,stock_update_date',
        stock_quantity_from: '1' // Only items with stock
      };
    } else {
      throw new Error(`Invalid data type requested: ${type}`);
    }

    const data = await fetchNextEngineDataWithCookies(endpoint, params);
    return data;

  } catch (error: any) {
    console.error(`Failed to fetch ${type} data from Next Engine:`, error);
    throw new Error(`Failed to fetch ${type} data from Next Engine: ${error.message}`);
  }
}

export async function getOrderDetails(orderIds: string[]): Promise<NextEngineOrderDetail[]> {
  // Check if user is authenticated first
  const isAuthenticated = await isNextEngineAuthenticated();
  if (!isAuthenticated) {
    throw new Error('Next Engine authentication required. Please authorize the application first.');
  }

  try {
    // Fetch order details (受注明細検索)
    const endpoint = 'api_v1_receiveorder_row/search';
    const params = {
      fields: 'receive_order_row_id,receive_order_id,goods_id,goods_code,goods_name,receive_order_row_quantity,receive_order_row_unit_price,receive_order_row_amount',
      receive_order_id: orderIds.join(',')
    };

    const data = await fetchNextEngineDataWithCookies(endpoint, params);
    return data;
  } catch (error: any) {
    console.error('Failed to fetch order details from Next Engine:', error);
    throw new Error(`Failed to fetch order details from Next Engine: ${error.message}`);
  }
}

export async function getGoodsInfo(goodsCodes?: string[]): Promise<NextEngineGoods[]> {
  // Check if user is authenticated first
  const isAuthenticated = await isNextEngineAuthenticated();
  if (!isAuthenticated) {
    throw new Error('Next Engine authentication required. Please authorize the application first.');
  }

  try {
    // Fetch goods data (商品マスタ検索)
    const endpoint = 'api_v1_master_goods/search';
    const params: any = {
      fields: 'goods_id,goods_code,goods_name,goods_price,goods_category_id,goods_category_name,goods_weight,goods_size_width,goods_size_height,goods_size_depth,goods_type,goods_status'
    };

    if (goodsCodes && goodsCodes.length > 0) {
      params.goods_code = goodsCodes.join(',');
    }

    const data = await fetchNextEngineDataWithCookies(endpoint, params);
    return data;
  } catch (error: any) {
    console.error('Failed to fetch goods info from Next Engine:', error);
    throw new Error(`Failed to fetch goods info from Next Engine: ${error.message}`);
  }
}

export async function processSalesData(orders: NextEngineOrder[]): Promise<SalesData[]> {
  try {
    // Get order details for all orders
    const orderIds = orders.map(order => order.receive_order_id);
    const orderDetails = await getOrderDetails(orderIds);

    // Group sales by product and channel
    const salesMap = new Map<string, {
      productCode: string;
      productName: string;
      fbaSales: number;
      otherChannelSales: number;
    }>();

    for (const detail of orderDetails) {
      const order = orders.find(o => o.receive_order_id === detail.receive_order_id);
      if (!order) continue;

      const key = detail.goods_code;
      if (!salesMap.has(key)) {
        salesMap.set(key, {
          productCode: detail.goods_code,
          productName: detail.goods_name || '',
          fbaSales: 0,
          otherChannelSales: 0
        });
      }

      const salesData = salesMap.get(key)!;
      const quantity = detail.receive_order_row_quantity;

      // Determine if this is FBA or other channel based on shop name
      // This logic may need adjustment based on your specific shop naming convention
      const isFBA = order.receive_order_shop_name?.toLowerCase().includes('amazon') || 
                   order.receive_order_shop_name?.toLowerCase().includes('fba');

      if (isFBA) {
        salesData.fbaSales += quantity;
      } else {
        salesData.otherChannelSales += quantity;
      }
    }

    // Convert to array and calculate totals
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    return Array.from(salesMap.values()).map(item => ({
      ...item,
      totalSales: item.fbaSales + item.otherChannelSales,
      salesPeriod: {
        startDate: twoWeeksAgo.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }
    }));

  } catch (error: any) {
    console.error('Failed to process sales data:', error);
    throw new Error(`Failed to process sales data: ${error.message}`);
  }
}

export async function processInventoryData(stocks: NextEngineStock[]): Promise<InventoryData[]> {
  try {
    // Group inventory by product code and warehouse
    const inventoryMap = new Map<string, {
      productCode: string;
      productName: string;
      mainWarehouseQty: number;
      rslWarehouseQty: number;
      logiWarehouseQty: number;
      lastUpdated: string;
    }>();

    for (const stock of stocks) {
      const key = stock.goods_code;
      if (!inventoryMap.has(key)) {
        inventoryMap.set(key, {
          productCode: stock.goods_code,
          productName: stock.goods_name || '',
          mainWarehouseQty: 0,
          rslWarehouseQty: 0,
          logiWarehouseQty: 0,
          lastUpdated: stock.stock_update_date
        });
      }

      const inventoryData = inventoryMap.get(key)!;
      const quantity = stock.stock_quantity;

      // Classify warehouse based on name
      const warehouseName = stock.stock_warehouse_name?.toLowerCase() || '';
      
      if (warehouseName.includes('rsl') || warehouseName.includes('rakuten')) {
        inventoryData.rslWarehouseQty += quantity;
      } else if (warehouseName.includes('logi') || warehouseName.includes('logistics')) {
        inventoryData.logiWarehouseQty += quantity;
      } else {
        // Default to main warehouse
        inventoryData.mainWarehouseQty += quantity;
      }

      // Update last updated date if newer
      if (stock.stock_update_date > inventoryData.lastUpdated) {
        inventoryData.lastUpdated = stock.stock_update_date;
      }
    }

    // Convert to array and calculate totals
    return Array.from(inventoryMap.values()).map(item => ({
      ...item,
      totalQty: item.mainWarehouseQty + item.rslWarehouseQty + item.logiWarehouseQty
    }));

  } catch (error: any) {
    console.error('Failed to process inventory data:', error);
    throw new Error(`Failed to process inventory data: ${error.message}`);
  }
}

export async function testNextEngineConnection(credentials: {
  clientId: string;
  clientSecret: string;
  environment: string;
}): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    if (!credentials.clientId || !credentials.clientSecret) {
      return { success: false, error: 'Client ID and Client Secret are required' };
    }

    console.log('Testing Next Engine API credentials...');
    console.log('Note: Next Engine requires OAuth authentication flow for full API access.');
    console.log();
    console.log('To complete the integration, you need to:');
    console.log('1. Implement OAuth flow: Redirect user to get uid/state');
    console.log('2. Handle callback to get access_token');
    console.log('3. Store tokens securely');
    console.log('4. Use access_token for all API calls');
    console.log();

    // Validate credentials format
    if (credentials.clientId.length < 10) {
      return {
        success: false,
        error: 'Client ID appears to be too short. Please verify your Next Engine client ID.',
        details: { clientIdLength: credentials.clientId.length }
      };
    }

    if (credentials.clientSecret.length < 10) {
      return {
        success: false,
        error: 'Client Secret appears to be too short. Please verify your Next Engine client secret.',
        details: { clientSecretLength: credentials.clientSecret.length }
      };
    }

    // For testing purposes, we'll just validate the credential format
    // Real API calls require OAuth access tokens
    return {
      success: true,
      details: {
        message: 'Credentials format validation passed',
        note: 'Next Engine requires OAuth authentication. Implement OAuth flow for full API access.',
        oauthFlow: {
          step1: 'GET https://base.next-engine.org/users/sign_in?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI',
          step2: 'Handle callback with uid and state parameters',
          step3: 'POST https://api.next-engine.org/api_neauth with uid, state, client_id, client_secret',
          step4: 'Use returned access_token for API calls'
        }
      }
    };

  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Connection test failed',
      details: { error: error.toString() }
    };
  }
}
