import { SalesData, InventoryData } from './shipment-calculator';
import { ActivityLogger } from './activity-logger';

export class NextEngineShipmentDataService {
  static async getInventoryForSKUs(skus: string[]): Promise<InventoryData[]> {
    ActivityLogger.logNextEngineOperation('Fetching inventory data for SKUs', { skuCount: skus.length });
    
    try {
      // Check if Next Engine tokens are available
      const tokenResponse = await fetch('/api/nextengine/tokens');
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.success || !tokenData.hasTokens) {
        throw new Error('Next Engine access token not available');
      }

      const inventoryData: InventoryData[] = [];
      
      // Process SKUs in batches to avoid API limits
      const batchSize = 50;
      for (let i = 0; i < skus.length; i += batchSize) {
        const batch = skus.slice(i, i + batchSize);
        const batchData = await this.fetchInventoryBatch(batch);
        inventoryData.push(...batchData);
      }

      ActivityLogger.success(`Retrieved inventory data for ${inventoryData.length} SKUs`, {
        requested: skus.length,
        found: inventoryData.length
      }, 'next-engine');

      return inventoryData;
    } catch (error) {
      ActivityLogger.error('Failed to fetch inventory data', { error: error instanceof Error ? error.message : error }, 'next-engine');
      throw error;
    }
  }

  static async getSalesDataForSKUs(skus: string[], lookBackDays: number): Promise<SalesData[]> {
    ActivityLogger.logNextEngineOperation('Fetching sales data for SKUs', { 
      skuCount: skus.length, 
      lookBackDays 
    });

    try {
      // Check if Next Engine tokens are available
      const tokenResponse = await fetch('/api/nextengine/tokens');
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.success || !tokenData.hasTokens) {
        throw new Error('Next Engine access token not available');
      }

      const salesData: SalesData[] = [];
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - lookBackDays);

      // Process SKUs in batches
      const batchSize = 50;
      for (let i = 0; i < skus.length; i += batchSize) {
        const batch = skus.slice(i, i + batchSize);
        const batchData = await this.fetchSalesBatch(batch, startDate, endDate);
        salesData.push(...batchData);
      }

      ActivityLogger.success(`Retrieved sales data for ${salesData.length} SKUs`, {
        requested: skus.length,
        found: salesData.length,
        dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
      }, 'next-engine');

      return salesData;
    } catch (error) {
      ActivityLogger.error('Failed to fetch sales data', { error: error instanceof Error ? error.message : error }, 'next-engine');
      throw error;
    }
  }

  private static async fetchInventoryBatch(skus: string[]): Promise<InventoryData[]> {
    const retryCount = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const response = await fetch('/api/nextengine/inventory-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            skus
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.inventory || [];
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < retryCount) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          ActivityLogger.warning(`Inventory fetch attempt ${attempt} failed, retrying in ${delay}ms`, {
            error: lastError.message,
            attempt,
            skuCount: skus.length
          }, 'next-engine');
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to fetch inventory after retries');
  }

  private static async fetchSalesBatch(
    skus: string[], 
    startDate: Date, 
    endDate: Date
  ): Promise<SalesData[]> {
    const retryCount = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const response = await fetch('/api/nextengine/sales-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            skus,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.sales || [];
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < retryCount) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          ActivityLogger.warning(`Sales fetch attempt ${attempt} failed, retrying in ${delay}ms`, {
            error: lastError.message,
            attempt,
            skuCount: skus.length
          }, 'next-engine');
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to fetch sales data after retries');
  }

  static async validateSKUsInNextEngine(skus: string[]): Promise<{ found: string[]; missing: string[] }> {
    ActivityLogger.logNextEngineOperation('Validating SKUs in Next Engine', { skuCount: skus.length });

    try {
      const inventoryData = await this.getInventoryForSKUs(skus);
      const foundSKUs = inventoryData.map(item => item.sku);
      const missingSKUs = skus.filter(sku => !foundSKUs.includes(sku));

      ActivityLogger.info(`SKU validation complete`, {
        total: skus.length,
        found: foundSKUs.length,
        missing: missingSKUs.length,
        missingSKUs: missingSKUs.slice(0, 10) // Log first 10 missing SKUs
      }, 'next-engine');

      return {
        found: foundSKUs,
        missing: missingSKUs
      };
    } catch (error) {
      ActivityLogger.error('SKU validation failed', { error: error instanceof Error ? error.message : error }, 'next-engine');
      throw error;
    }
  }
}