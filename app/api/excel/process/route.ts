import { NextRequest, NextResponse } from 'next/server';
import { getAmazonFbaInventoryFromExcel } from '../../../../lib/integrations/amazon';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process the Excel file
    const inventoryData = await getAmazonFbaInventoryFromExcel(buffer);

    return NextResponse.json({
      success: true,
      data: inventoryData,
      message: `Successfully processed ${inventoryData.length} items from Excel file`
    });

  } catch (error) {
    console.error('Error processing Excel file:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process Excel file' 
      },
      { status: 500 }
    );
  }
}