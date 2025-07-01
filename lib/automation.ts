// Core automation logic for FBA shipment calculation and file generation
import { 
  getNextEngineData, 
  processSalesData, 
  processInventoryData, 
  getGoodsInfo 
} from './integrations/nextEngine';
import { getAmazonFbaInventory } from './integrations/amazon';
import { generateShipmentFile } from './integrations/googleSheets';
import { FBAAllocationService } from './services/fba-allocation';
import { NextEngineOrder, NextEngineStock } from '../types/nextengine';

export interface AutomationResult {
  success: boolean;
  message: string;
  shipmentFileUrl?: string;
  errorDetails?: string;
  summary?: {
    totalProducts: number;
    totalQuantity: number;
    eligibleItems: number;
    ineligibleItems: number;
    warehouseBreakdown: {
      main: number;
      logi: number;
    };
    productTypeBreakdown: {
      'mail-size': number;
      '60-size': number;
    };
  };
}

export async function runFbaAutomation(): Promise<AutomationResult> {
  try {
    console.log('Starting FBA automation process...');

    // Step 1: Fetch sales data from Next Engine (last 2 weeks)
    console.log('Fetching sales data from Next Engine...');
    const ordersData = await getNextEngineData('sales') as NextEngineOrder[];
    
    if (!ordersData || ordersData.length === 0) {
      throw new Error('No sales data found from Next Engine');
    }

    console.log(`Found ${ordersData.length} orders from the last 2 weeks`);

    // Step 2: Process sales data to get aggregated sales by product
    console.log('Processing sales data...');
    const salesData = await processSalesData(ordersData);
    console.log(`Processed sales data for ${salesData.length} unique products`);

    // Step 3: Fetch inventory data from Next Engine
    console.log('Fetching inventory data from Next Engine...');
    const stockData = await getNextEngineData('inventory') as NextEngineStock[];
    
    if (!stockData || stockData.length === 0) {
      throw new Error('No inventory data found from Next Engine');
    }

    console.log(`Found inventory data for ${stockData.length} stock items`);

    // Step 4: Process inventory data to get warehouse breakdown
    console.log('Processing inventory data...');
    const inventoryData = await processInventoryData(stockData);
    console.log(`Processed inventory data for ${inventoryData.length} unique products`);

    // Step 5: Fetch current FBA inventory from Amazon (placeholder for now)
    console.log('Fetching current FBA inventory...');
    let fbaInventoryMap = new Map<string, number>();
    try {
      const fbaInventory = await getAmazonFbaInventory();
      // Convert to map for easier lookup (assuming fbaInventory is an array)
      if (Array.isArray(fbaInventory)) {
        fbaInventoryMap = new Map(
          fbaInventory.map((item: any) => [item.productCode || item.sku, item.quantity || 0])
        );
      }
    } catch (error) {
      console.warn('Failed to fetch FBA inventory, proceeding with empty inventory:', error);
      // Continue with empty FBA inventory
    }

    // Step 6: Calculate FBA allocation using the allocation service
    console.log('Calculating FBA allocation...');
    const allocations = FBAAllocationService.calculateAllocation(
      salesData,
      inventoryData,
      fbaInventoryMap
    );

    console.log(`Calculated allocations for ${allocations.length} products`);

    // Step 7: Get product details for shipping eligibility filtering
    console.log('Fetching product details for shipping eligibility...');
    const productCodes = allocations.map(a => a.productCode);
    const goodsInfo = await getGoodsInfo(productCodes);

    // Step 8: Filter products based on shipping eligibility
    console.log('Filtering shippable products...');
    const shipmentItems = FBAAllocationService.filterShippableProducts(allocations, goodsInfo);
    
    // Step 9: Generate shipment summary
    const summary = FBAAllocationService.generateShipmentSummary(shipmentItems);
    console.log('Shipment summary:', summary);

    // Step 10: Generate shipment file (Google Sheets)
    console.log('Generating shipment file...');
    const shipmentFileUrl = await generateShipmentFile({
      shipmentItems: summary.eligibleItems,
      summary: summary,
      generatedAt: new Date().toISOString(),
      automationRun: {
        salesPeriod: salesData[0]?.salesPeriod || {
          startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        },
        totalProductsAnalyzed: salesData.length,
        totalInventoryItems: inventoryData.length
      }
    });

    console.log('FBA automation completed successfully');

    return {
      success: true,
      message: `Automation completed successfully. Generated shipment for ${summary.totalItems} products (${summary.totalQuantity} units total).`,
      shipmentFileUrl,
      summary: {
        totalProducts: summary.totalItems,
        totalQuantity: summary.totalQuantity,
        eligibleItems: summary.eligibleItems.length,
        ineligibleItems: summary.ineligibleItems.length,
        warehouseBreakdown: summary.byWarehouse,
        productTypeBreakdown: summary.byType
      }
    };

  } catch (err: any) {
    console.error('FBA automation failed:', err);
    return {
      success: false,
      message: 'Automation failed',
      errorDetails: err?.message || String(err)
    };
  }
}
