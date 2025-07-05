import { getAccessTokenFromRefreshToken, createAWSSignature } from '../amazon-spapi-auth';

interface AmazonFBAInventoryItem {
  sku: string;
  fnsku: string;
  asin: string;
  condition: string;
  totalQuantity: number;
  inboundWorkingQuantity: number;
  inboundShippedQuantity: number;
  inboundReceivingQuantity: number;
  reservedQuantity: number;
  researchingQuantity: number;
  unfulfillableQuantity: number;
}

export async function testAmazonConnection(credentials?: { 
  clientId: string; 
  clientSecret: string; 
  refreshToken: string; 
  region: string;
}) {
  try {
    const refreshToken = credentials?.refreshToken || process.env.AMAZON_REFRESH_TOKEN;
    
    if (!refreshToken) {
      return { success: false, error: 'Missing refresh token' };
    }

    // Get access token
    const tokenResponse = await getAccessTokenFromRefreshToken(refreshToken);
    
    if (tokenResponse.error) {
      return { success: false, error: tokenResponse.error_description || tokenResponse.error };
    }

    // Test with a simple SP-API call
    const headers = {
      'Host': 'sellingpartnerapi-fe.amazon.com',
      'User-Agent': 'YourApp/1.0.0 (Language=JavaScript; Platform=NextJS)',
      'x-amz-access-token': tokenResponse.access_token,
    };

    const signedHeaders = createAWSSignature(
      'GET',
      'https://sellingpartnerapi-fe.amazon.com/fba/inventory/v1/summaries',
      headers
    );

    const response = await fetch('https://sellingpartnerapi-fe.amazon.com/fba/inventory/v1/summaries', {
      method: 'GET',
      headers: signedHeaders,
    });

    if (response.ok) {
      return { success: true, message: 'Amazon SP-API connection successful' };
    } else {
      const errorData = await response.text();
      return { success: false, error: `API Error: ${response.status} - ${errorData}` };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function getAmazonFbaInventory(): Promise<AmazonFBAInventoryItem[]> {
  try {
    const refreshToken = process.env.AMAZON_REFRESH_TOKEN;
    
    if (!refreshToken) {
      throw new Error('Amazon refresh token not found');
    }

    // Get access token
    const tokenResponse = await getAccessTokenFromRefreshToken(refreshToken);
    
    if (tokenResponse.error) {
      throw new Error(`Token error: ${tokenResponse.error_description || tokenResponse.error}`);
    }

    // Prepare headers for SP-API request
    const headers = {
      'Host': 'sellingpartnerapi-fe.amazon.com',
      'User-Agent': 'YourApp/1.0.0 (Language=JavaScript; Platform=NextJS)',
      'x-amz-access-token': tokenResponse.access_token,
    };

    const url = `https://sellingpartnerapi-fe.amazon.com/fba/inventory/v1/summaries?marketplaceIds=${process.env.AMAZON_MARKETPLACE_ID}`;
    
    const signedHeaders = createAWSSignature('GET', url, headers);

    const response = await fetch(url, {
      method: 'GET',
      headers: signedHeaders,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`SP-API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    // Transform the response to our format
    const inventoryItems: AmazonFBAInventoryItem[] = data.payload?.inventorySummaries?.map((item: any) => ({
      sku: item.sellerSku || '',
      fnsku: item.fnSku || '',
      asin: item.asin || '',
      condition: item.condition || 'NEW',
      totalQuantity: item.totalQuantity || 0,
      inboundWorkingQuantity: item.inboundWorkingQuantity || 0,
      inboundShippedQuantity: item.inboundShippedQuantity || 0,
      inboundReceivingQuantity: item.inboundReceivingQuantity || 0,
      reservedQuantity: item.reservedQuantity || 0,
      researchingQuantity: item.researchingQuantity || 0,
      unfulfillableQuantity: item.unfulfillableQuantity || 0,
    })) || [];

    return inventoryItems;
  } catch (error) {
    console.error('Error fetching Amazon FBA inventory:', error);
    throw error;
  }
}
