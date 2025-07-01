// FBA Allocation and Shipment Calculation Service
import { 
  SalesData, 
  InventoryData, 
  AllocationResult, 
  ShipmentItem 
} from '../../types/nextengine';

export class FBAAllocationService {
  /**
   * Calculate FBA allocation based on sales data and inventory
   */
  static calculateAllocation(
    salesData: SalesData[], 
    inventoryData: InventoryData[],
    currentFbaInventory: Map<string, number> = new Map()
  ): AllocationResult[] {
    const results: AllocationResult[] = [];

    for (const sales of salesData) {
      const inventory = inventoryData.find(inv => inv.productCode === sales.productCode);
      if (!inventory || inventory.totalQty === 0) {
        continue; // Skip if no inventory available
      }

      // Calculate allocation ratio based on sales
      const totalSales = sales.totalSales;
      if (totalSales === 0) {
        continue; // Skip if no sales
      }

      const fbaRatio = sales.fbaSales / totalSales;
      const othersRatio = sales.otherChannelSales / totalSales;

      // Calculate theoretical FBA allocation
      const theoreticalFbaAllocation = Math.floor(inventory.totalQty * fbaRatio);
      
      // Limit FBA allocation to actual FBA sales if theoretical is higher
      const adjustedFbaAllocation = Math.min(theoreticalFbaAllocation, sales.fbaSales);

      // Get current FBA inventory
      const currentFbaQty = currentFbaInventory.get(sales.productCode) || 0;

      // Calculate transfer quantity (what we need to send to FBA)
      const transferQty = Math.max(0, adjustedFbaAllocation - currentFbaQty);

      // Calculate warehouse allocation for transfer
      const { fromMainWarehouse, fromLogiWarehouse } = this.calculateWarehouseAllocation(
        transferQty, 
        inventory
      );

      results.push({
        productCode: sales.productCode,
        productName: sales.productName,
        requiredFbaQty: adjustedFbaAllocation,
        currentFbaQty,
        transferQty,
        fromMainWarehouse,
        fromLogiWarehouse,
        allocationRatio: {
          fba: fbaRatio,
          others: othersRatio
        }
      });
    }

    return results;
  }

  /**
   * Calculate which warehouse to ship from based on the 3PL allocation logic
   */
  private static calculateWarehouseAllocation(
    transferQty: number, 
    inventory: InventoryData
  ): { fromMainWarehouse: number; fromLogiWarehouse: number } {
    if (transferQty === 0) {
      return { fromMainWarehouse: 0, fromLogiWarehouse: 0 };
    }

    // Step 1: Calculate A = Main warehouse qty - RSL warehouse qty
    const A = inventory.mainWarehouseQty - inventory.rslWarehouseQty;

    // Step 2: Determine allocation
    if (transferQty <= A) {
      // Ship entirely from main warehouse
      return {
        fromMainWarehouse: transferQty,
        fromLogiWarehouse: 0
      };
    } else {
      // Ship A units from main warehouse, remaining from LOGI warehouse
      const fromMainWarehouse = Math.max(0, A);
      const remainingQty = transferQty - fromMainWarehouse;
      const fromLogiWarehouse = Math.min(remainingQty, inventory.logiWarehouseQty);

      return {
        fromMainWarehouse,
        fromLogiWarehouse
      };
    }
  }

  /**
   * Filter products based on shipping eligibility
   */
  static filterShippableProducts(
    allocations: AllocationResult[],
    goodsInfo: any[]
  ): ShipmentItem[] {
    const shipmentItems: ShipmentItem[] = [];

    for (const allocation of allocations) {
      if (allocation.transferQty === 0) {
        continue; // Skip if nothing to transfer
      }

      const goodsDetail = goodsInfo.find(g => g.goods_code === allocation.productCode);
      const productType = this.determineProductType(goodsDetail);
      const eligible = this.isEligibleForShipment(productType);

      // Create shipment items based on warehouse allocation
      if (allocation.fromMainWarehouse > 0) {
        shipmentItems.push({
          productCode: allocation.productCode,
          productName: allocation.productName,
          quantity: allocation.fromMainWarehouse,
          sourceWarehouse: 'main',
          productType,
          eligible
        });
      }

      if (allocation.fromLogiWarehouse > 0) {
        shipmentItems.push({
          productCode: allocation.productCode,
          productName: allocation.productName,
          quantity: allocation.fromLogiWarehouse,
          sourceWarehouse: 'logi',
          productType,
          eligible
        });
      }
    }

    return shipmentItems;
  }

  /**
   * Determine product type based on size and weight
   */
  private static determineProductType(goodsDetail: any): 'mail-size' | '60-size' | 'other' {
    if (!goodsDetail) {
      return 'other';
    }

    const width = goodsDetail.goods_size_width || 0;
    const height = goodsDetail.goods_size_height || 0;
    const depth = goodsDetail.goods_size_depth || 0;
    const weight = goodsDetail.goods_weight || 0;

    // Japanese mail-size criteria (adjust as needed)
    // Mail-size: typically up to 34cm x 25cm x 3cm, weight up to 1kg
    if (width <= 34 && height <= 25 && depth <= 3 && weight <= 1000) {
      return 'mail-size';
    }

    // 60-size criteria (adjust based on your shipping standards)
    // This is a rough estimation - you may need to adjust based on actual shipping rules
    const size = width + height + depth;
    if (size <= 60) {
      return '60-size';
    }

    return 'other';
  }

  /**
   * Check if product is eligible for shipment
   */
  private static isEligibleForShipment(productType: 'mail-size' | '60-size' | 'other'): boolean {
    // Based on project requirements: only mail-size and 60-size products are eligible
    return productType === 'mail-size' || productType === '60-size';
  }

  /**
   * Generate shipment summary
   */
  static generateShipmentSummary(shipmentItems: ShipmentItem[]) {
    const eligibleItems = shipmentItems.filter(item => item.eligible);
    const totalItems = eligibleItems.length;
    const totalQuantity = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);

    const byWarehouse = {
      main: eligibleItems.filter(item => item.sourceWarehouse === 'main').reduce((sum, item) => sum + item.quantity, 0),
      logi: eligibleItems.filter(item => item.sourceWarehouse === 'logi').reduce((sum, item) => sum + item.quantity, 0)
    };

    const byType = {
      'mail-size': eligibleItems.filter(item => item.productType === 'mail-size').reduce((sum, item) => sum + item.quantity, 0),
      '60-size': eligibleItems.filter(item => item.productType === '60-size').reduce((sum, item) => sum + item.quantity, 0)
    };

    return {
      totalItems,
      totalQuantity,
      byWarehouse,
      byType,
      eligibleItems,
      ineligibleItems: shipmentItems.filter(item => !item.eligible)
    };
  }
}
