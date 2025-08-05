import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Invalid items data provided' },
        { status: 400 }
      );
    }

    // Filter items with LOGI quantity > 0
    const logiItems = items.filter(item => item.logiQty && item.logiQty > 0);

    if (logiItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items to transfer to LOGI' },
        { status: 400 }
      );
    }

    // Generate LOGI CSV content
    const headers = ['sku', 'logi_qty'];
    const csvRows = [headers.join(',')];

    for (const item of logiItems) {
      const row = [
        item.sku,
        item.logiQty.toString()
      ];

      // Escape commas and quotes in CSV
      const escapedRow = row.map(field => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      });

      csvRows.push(escapedRow.join(','));
    }

    const csvContent = csvRows.join('\n');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `LOGI-${timestamp}.csv`;

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error generating LOGI CSV:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate LOGI CSV file' 
      },
      { status: 500 }
    );
  }
}