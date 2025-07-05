import { NextRequest, NextResponse } from 'next/server';
import { getAmazonFbaInventory } from '@/lib/integrations/amazon';

export async function GET(req: NextRequest) {
  try {
    const inventory = await getAmazonFbaInventory();
    return NextResponse.json({
      success: true,
      data: inventory,
      count: inventory.length
    });
  } catch (error) {
    console.error('Amazon inventory error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
