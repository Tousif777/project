import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    // Create sample data with the expected columns
    const sampleData = [
      {
        'SKU': 'SAMPLE-001',
        'Prep Owner': 'Merchant',
        'Labeling Owner': 'Merchant', 
        'Expiration Date': '12/31/2025',
        'Units Per Box': 10,
        'Number Of Boxes': 5,
        'Box Length': 30,
        'Box Width': 20,
        'Box Height': 15,
        'Box Weight': 2.5
      },
      {
        'SKU': 'SAMPLE-002',
        'Prep Owner': 'Amazon',
        'Labeling Owner': 'Amazon',
        'Expiration Date': '',
        'Units Per Box': 1,
        'Number Of Boxes': 100,
        'Box Length': 25,
        'Box Width': 15,
        'Box Height': 10,
        'Box Weight': 1.2
      }
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FBA Inventory Template');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    });

    // Return the Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="fba-inventory-template.xlsx"'
      }
    });

  } catch (error) {
    console.error('Error generating Excel template:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel template' },
      { status: 500 }
    );
  }
}