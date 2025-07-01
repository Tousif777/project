// Types for Next Engine API responses and data structures

export interface NextEngineTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface NextEngineApiResponse<T = any> {
  result: 'success' | 'error';
  data: T;
  count?: number;
  message?: string;
}

// Sales and Order Types
export interface NextEngineOrder {
  receive_order_id: string;
  receive_order_date: string;
  receive_order_shop_id: string;
  receive_order_shop_name?: string;
  receive_order_total_amount?: number;
  receive_order_cancel_type?: string;
  receive_order_confirm_date?: string;
}

export interface NextEngineOrderDetail {
  receive_order_row_id: string;
  receive_order_id: string;
  goods_id: string;
  goods_code: string;
  goods_name: string;
  receive_order_row_quantity: number;
  receive_order_row_unit_price: number;
  receive_order_row_amount: number;
}

// Inventory Types
export interface NextEngineStock {
  goods_id: string;
  goods_code: string;
  goods_name?: string;
  stock_quantity: number;
  stock_free_quantity?: number;
  stock_defective_quantity?: number;
  stock_reserved_quantity?: number;
  stock_update_date: string;
  stock_warehouse_id?: string;
  stock_warehouse_name?: string;
}

// Goods/Product Types
export interface NextEngineGoods {
  goods_id: string;
  goods_code: string;
  goods_name: string;
  goods_price: number;
  goods_category_id?: string;
  goods_category_name?: string;
  goods_weight?: number;
  goods_size_width?: number;
  goods_size_height?: number;
  goods_size_depth?: number;
  goods_type?: string;
  goods_status?: string;
}

// Warehouse Types
export interface NextEngineWarehouse {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_type?: string;
}

// Automation specific types
export interface SalesData {
  productCode: string;
  productName: string;
  fbaSales: number;
  otherChannelSales: number;
  totalSales: number;
  salesPeriod: {
    startDate: string;
    endDate: string;
  };
}

export interface InventoryData {
  productCode: string;
  productName: string;
  mainWarehouseQty: number;
  rslWarehouseQty: number;
  logiWarehouseQty: number;
  totalQty: number;
  lastUpdated: string;
}

export interface AllocationResult {
  productCode: string;
  productName: string;
  requiredFbaQty: number;
  currentFbaQty: number;
  transferQty: number;
  fromMainWarehouse: number;
  fromLogiWarehouse: number;
  allocationRatio: {
    fba: number;
    others: number;
  };
}

export interface ShipmentItem {
  productCode: string;
  productName: string;
  quantity: number;
  sourceWarehouse: 'main' | 'logi';
  productType: 'mail-size' | '60-size' | 'other';
  eligible: boolean;
}
