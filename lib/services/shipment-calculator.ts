import { BusinessRules } from "./business-rules";
import { ExcelFBAInventoryItem } from "./excel-processing";

export interface SalesData {
  sku: string;
  totalSales: number;
  averageDailySales: number;
  salesHistory: Array<{
    date: string;
    quantity: number;
  }>;
}

export interface InventoryData {
  sku: string;
  warehouseStock: number;
  reservedStock: number;
  availableStock: number;
}

export interface CalculationResult {
  sku: string;
  productName?: string;
  currentStock: number;
  averageDailySales: number;
  targetQuantity: number;
  recommendedQuantity: number;
  finalQuantity: number;
  toouQty: number;  // Quantity to transfer to TOOU
  logiQty: number;  // Quantity to transfer to LOGI
  reasoning: string[];
  warnings: string[];
  canShip: boolean;
  manuallyAdjusted: boolean;
}

export interface ShipmentPlan {
  items: CalculationResult[];
  summary: {
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    warnings: string[];
  };
  businessRules: BusinessRules;
  calculatedAt: string;
}

export class ShipmentCalculatorService {
  static calculateShipmentPlan(
    excelData: ExcelFBAInventoryItem[],
    salesData: SalesData[],
    inventoryData: InventoryData[],
    businessRules: BusinessRules
  ): ShipmentPlan {
    const results: CalculationResult[] = [];

    for (const excelItem of excelData) {
      const sales = salesData.find((s) => s.sku === excelItem.sku);
      const inventory = inventoryData.find((i) => i.sku === excelItem.sku);

      const result = this.calculateSingleItem(
        excelItem,
        sales,
        inventory,
        businessRules
      );

      results.push(result);
    }

    const summary = this.generateSummary(results);

    return {
      items: results,
      summary,
      businessRules,
      calculatedAt: new Date().toISOString(),
    };
  }

  private static calculateSingleItem(
    excelItem: ExcelFBAInventoryItem,
    sales: SalesData | undefined,
    inventory: InventoryData | undefined,
    rules: BusinessRules
  ): CalculationResult {
    const reasoning: string[] = [];
    const warnings: string[] = [];

    // Get basic data
    const averageDailySales = sales?.averageDailySales || 0;
    const currentStock = inventory?.availableStock || 0;

    reasoning.push(
      `Average daily sales: ${averageDailySales.toFixed(2)} units`
    );
    reasoning.push(`Current warehouse stock: ${currentStock} units`);

    // Calculate target quantity based on sales velocity
    let targetQuantity = 0;
    if (averageDailySales > 0) {
      targetQuantity = Math.ceil(averageDailySales * rules.target_cover_days);
      reasoning.push(
        `Target quantity: ${averageDailySales.toFixed(2)} × ${
          rules.target_cover_days
        } days = ${targetQuantity} units`
      );
    } else {
      targetQuantity = rules.min_units_per_sku;
      reasoning.push(
        `No sales history found, using minimum quantity: ${targetQuantity} units`
      );
      warnings.push("No sales data available for this SKU");
    }

    // Apply minimum quantity rule
    if (targetQuantity < rules.min_units_per_sku) {
      reasoning.push(
        `Applied minimum quantity rule: ${rules.min_units_per_sku} units`
      );
      targetQuantity = rules.min_units_per_sku;
    }

    // Apply maximum quantity rule
    if (targetQuantity > rules.max_units_per_sku) {
      reasoning.push(
        `Applied maximum quantity rule: ${rules.max_units_per_sku} units`
      );
      targetQuantity = rules.max_units_per_sku;
    }

    // Apply safety stock rule
    const maxAllowedFromStock = Math.floor(
      currentStock * (1 - rules.safety_stock_percent / 100)
    );
    let recommendedQuantity = Math.min(targetQuantity, maxAllowedFromStock);

    if (recommendedQuantity < targetQuantity) {
      reasoning.push(
        `Limited by safety stock (${rules.safety_stock_percent}%): ${recommendedQuantity} units`
      );
      if (recommendedQuantity < rules.min_units_per_sku) {
        warnings.push(
          "Insufficient stock to meet minimum quantity requirements"
        );
      }
    }

    // Final validation
    if (currentStock === 0) {
      recommendedQuantity = 0;
      warnings.push("No stock available in warehouse");
    }

    if (recommendedQuantity < 0) {
      recommendedQuantity = 0;
    }

    const canShip = recommendedQuantity > 0 && currentStock > 0;

    // Distribute quantity between TOOU and LOGI based on business rules
    // For now, using a simple 50/50 split, but this could be made configurable
    const toouQty = Math.floor(recommendedQuantity * 0.5);
    const logiQty = recommendedQuantity - toouQty;

    if (toouQty > 0 || logiQty > 0) {
      reasoning.push(`Distribution: TOOU ${toouQty} units, LOGI ${logiQty} units`);
    }

    return {
      sku: excelItem.sku,
      currentStock,
      averageDailySales,
      targetQuantity,
      recommendedQuantity,
      finalQuantity: recommendedQuantity,
      toouQty,
      logiQty,
      reasoning,
      warnings,
      canShip,
      manuallyAdjusted: false,
    };
  }

  private static generateSummary(results: CalculationResult[]) {
    const totalItems = results.filter((r) => r.canShip).length;
    const totalQuantity = results.reduce((sum, r) => sum + r.finalQuantity, 0);
    const warnings: string[] = [];

    // Collect unique warnings
    const allWarnings = results.flatMap((r) => r.warnings);
    const uniqueWarnings = Array.from(new Set(allWarnings));
    warnings.push(...uniqueWarnings);

    if (results.some((r) => !r.canShip)) {
      warnings.push(
        `${
          results.filter((r) => !r.canShip).length
        } SKUs cannot be shipped due to stock issues`
      );
    }

    return {
      totalItems,
      totalQuantity,
      totalValue: 0, // Could be calculated if we had pricing data
      warnings,
    };
  }

  static adjustQuantity(
    plan: ShipmentPlan,
    sku: string,
    newQuantity: number,
    rules: BusinessRules
  ): { success: boolean; error?: string; updatedPlan?: ShipmentPlan } {
    const item = plan.items.find((i) => i.sku === sku);
    if (!item) {
      return { success: false, error: "SKU not found in plan" };
    }

    // Validate new quantity
    if (newQuantity < 0) {
      return { success: false, error: "Quantity cannot be negative" };
    }

    const maxAllowed = Math.floor(
      item.currentStock * (1 - rules.safety_stock_percent / 100)
    );
    if (newQuantity > maxAllowed) {
      return {
        success: false,
        error: `Quantity exceeds available stock after safety buffer (max: ${maxAllowed})`,
      };
    }

    // Update the item
    const updatedItem = {
      ...item,
      finalQuantity: newQuantity,
      manuallyAdjusted: true,
      reasoning: [
        ...item.reasoning,
        `Manually adjusted to ${newQuantity} units`,
      ],
    };

    // Update the plan
    const updatedItems = plan.items.map((i) =>
      i.sku === sku ? updatedItem : i
    );
    const updatedSummary = this.generateSummary(updatedItems);

    const updatedPlan: ShipmentPlan = {
      ...plan,
      items: updatedItems,
      summary: updatedSummary,
    };

    return { success: true, updatedPlan };
  }
}
