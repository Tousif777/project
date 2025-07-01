// Mock Next Engine integration for testing purposes
// This provides sample data that matches the expected structure

import { 
  NextEngineOrder, 
  NextEngineOrderDetail, 
  NextEngineStock, 
  NextEngineGoods,
  SalesData,
  InventoryData 
} from '../../types/nextengine';

const MOCK_ENABLED = true; // Set to false when real API is working

// Mock data that represents realistic Next Engine responses
const MOCK_ORDERS: NextEngineOrder[] = [
  {
    receive_order_id: "1001",
    receive_order_date: "2025-06-20",
    receive_order_shop_id: "1",
    receive_order_shop_name: "Amazon FBA",
    receive_order_total_amount: 2500,
    receive_order_cancel_type: "0",
    receive_order_confirm_date: "2025-06-20"
  },
  {
    receive_order_id: "1002", 
    receive_order_date: "2025-06-25",
    receive_order_shop_id: "2",
    receive_order_shop_name: "Rakuten",
    receive_order_total_amount: 3200,
    receive_order_cancel_type: "0",
    receive_order_confirm_date: "2025-06-25"
  }
];

const MOCK_ORDER_DETAILS: NextEngineOrderDetail[] = [
  {
    receive_order_row_id: "1001-1",
    receive_order_id: "1001",
    goods_id: "g001",
    goods_code: "PROD001",
    goods_name: "Sample Product 1",
    receive_order_row_quantity: 2,
    receive_order_row_unit_price: 1200,
    receive_order_row_amount: 2400
  },
  {
    receive_order_row_id: "1002-1",
    receive_order_id: "1002",
    goods_id: "g002", 
    goods_code: "PROD002",
    goods_name: "Sample Product 2",
    receive_order_row_quantity: 1,
    receive_order_row_unit_price: 3200,
    receive_order_row_amount: 3200
  }
];

const MOCK_STOCK: NextEngineStock[] = [
  {
    goods_id: "g001",
    goods_code: "PROD001",
    goods_name: "Sample Product 1",
    stock_quantity: 100,
    stock_free_quantity: 90,
    stock_warehouse_id: "main",
    stock_warehouse_name: "Main Warehouse",
    stock_update_date: "2025-06-30"
  },
  {
    goods_id: "g001",
    goods_code: "PROD001", 
    goods_name: "Sample Product 1",
    stock_quantity: 25,
    stock_free_quantity: 25,
    stock_warehouse_id: "rsl",
    stock_warehouse_name: "RSL Warehouse",
    stock_update_date: "2025-06-30"
  },
  {
    goods_id: "g002",
    goods_code: "PROD002",
    goods_name: "Sample Product 2", 
    stock_quantity: 50,
    stock_free_quantity: 40,
    stock_warehouse_id: "logi",
    stock_warehouse_name: "LOGI Warehouse",
    stock_update_date: "2025-06-30"
  }
];

export async function getNextEngineDataMock(type: 'sales' | 'inventory') {
  if (!MOCK_ENABLED) {
    throw new Error('Mock data is disabled. Please configure real Next Engine API.');
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (type === 'sales') {
    return MOCK_ORDERS;
  } else if (type === 'inventory') {
    return MOCK_STOCK;
  }

  throw new Error(`Invalid data type requested: ${type}`);
}

export async function getOrderDetailsMock(orderIds: string[]): Promise<NextEngineOrderDetail[]> {
  if (!MOCK_ENABLED) {
    throw new Error('Mock data is disabled. Please configure real Next Engine API.');
  }

  await new Promise(resolve => setTimeout(resolve, 500));
  
  return MOCK_ORDER_DETAILS.filter(detail => 
    orderIds.includes(detail.receive_order_id)
  );
}

export async function getGoodsInfoMock(goodsCodes?: string[]): Promise<NextEngineGoods[]> {
  if (!MOCK_ENABLED) {
    throw new Error('Mock data is disabled. Please configure real Next Engine API.');
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  const mockGoods: NextEngineGoods[] = [
    {
      goods_id: "g001",
      goods_code: "PROD001",
      goods_name: "Sample Product 1",
      goods_price: 1200,
      goods_weight: 500,
      goods_size_width: 30,
      goods_size_height: 20,
      goods_size_depth: 2,
      goods_type: "physical",
      goods_status: "active"
    },
    {
      goods_id: "g002", 
      goods_code: "PROD002",
      goods_name: "Sample Product 2",
      goods_price: 3200,
      goods_weight: 1200,
      goods_size_width: 40,
      goods_size_height: 30,
      goods_size_depth: 5,
      goods_type: "physical",
      goods_status: "active"
    }
  ];

  if (goodsCodes && goodsCodes.length > 0) {
    return mockGoods.filter(goods => goodsCodes.includes(goods.goods_code));
  }

  return mockGoods;
}

export async function testNextEngineConnectionMock(): Promise<{ success: boolean; error?: string }> {
  if (!MOCK_ENABLED) {
    return { success: false, error: 'Mock data is disabled. Please configure real Next Engine API.' };
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('🎭 Using mock Next Engine data for testing');
  console.log('✅ Mock connection successful');
  
  return { success: true };
}
