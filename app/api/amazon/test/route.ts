import { NextRequest, NextResponse } from 'next/server';
import { testAmazonConnection } from '@/lib/integrations/amazon';

export async function GET(req: NextRequest) {
  try {
    const result = await testAmazonConnection();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Amazon test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
