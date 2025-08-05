import { NextRequest, NextResponse } from 'next/server';
import { ExcelProcessingService } from '../../../../lib/services/excel-processing';

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Invalid items data provided' },
        { status: 400 }
      );
    }

    // Generate CSV content
    const csvContent = ExcelProcessingService.generateAmazonFBACSV(items);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `amazon-fba-shipment-${timestamp}.csv`;

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error generating CSV:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate CSV file' 
      },
      { status: 500 }
    );
  }
}