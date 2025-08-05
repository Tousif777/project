import * as XLSX from 'xlsx';

// Interface for FBA shipment data from Excel
export interface ExcelFBAInventoryItem {
  sku: string;
  prepOwner: string;
  labelingOwner: string;
  expirationDate?: string;
  unitsPerBox: number;
  numberOfBoxes: number;
  boxLength: number;
  boxWidth: number;
  boxHeight: number;
  boxWeight: number;
  totalQuantity: number;
}

export interface ExcelValidationError {
  row: number;
  column: string;
  message: string;
  value?: any;
}

export interface ExcelProcessingResult {
  success: boolean;
  data?: ExcelFBAInventoryItem[];
  errors?: ExcelValidationError[];
  message?: string;
}

export class ExcelProcessingService {
  // Column mapping - maps various possible column names to our standard fields
  private static readonly COLUMN_MAPPINGS = {
    sku: ['Merchant SKU', 'SKU', 'sku', 'Product SKU', 'Item SKU', 'MSKU', 'Merchant SKU'],
    prepOwner: ['Prep owner', 'Prep Owner', 'prep_owner', 'Prep', 'PrepOwner'],
    labelingOwner: ['Labeling owner', 'Labeling Owner', 'labeling_owner', 'Label Owner', 'LabelingOwner'],
    expirationDate: ['Expiration date (MM/DD/YYYY)', 'Expiration Date', 'expiration_date', 'Expiry Date', 'Exp Date'],
    unitsPerBox: ['Units per box', 'Units Per Box', 'units_per_box', 'Units/Box', 'UnitsPerBox', 'Qty Per Box', 'Units per box'],
    numberOfBoxes: ['Number of boxes', 'Number Of Boxes', 'number_of_boxes', 'Box Count', 'Boxes', 'NumberOfBoxes', 'Number of boxes'],
    boxLength: ['Box length (cm)', 'Box Length', 'box_length', 'Length (cm)', 'Length', 'BoxLength', 'Box length (cm)'],
    boxWidth: ['Box width (cm)', 'Box Width', 'box_width', 'Width (cm)', 'Width', 'BoxWidth', 'Box width (cm)'],
    boxHeight: ['Box height (cm)', 'Box Height', 'box_height', 'Height (cm)', 'Height', 'BoxHeight', 'Box height (cm)'],
    boxWeight: ['Box weight (kg)', 'Box Weight', 'box_weight', 'Weight (kg)', 'Weight', 'BoxWeight', 'Box weight (kg)'],
    quantity: ['Quantity', 'quantity', 'Qty', 'Amount', 'Total Quantity', 'Total']
  };

  // Minimum required fields for basic processing
  private static readonly REQUIRED_FIELDS = ['sku'];

  /**
   * Process Excel file and return FBA inventory data
   */
  static async processExcelFile(fileBuffer: Buffer): Promise<ExcelProcessingResult> {
    try {
      // Parse Excel file
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      
      if (!sheetName) {
        return {
          success: false,
          message: 'Excel file contains no worksheets'
        };
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length === 0) {
        return {
          success: false,
          message: 'Excel file is empty'
        };
      }

      // Find the actual header row (skip instruction rows)
      let headerRowIndex = 0;
      let headers: string[] = [];
      
      for (let i = 0; i < Math.min(5, jsonData.length); i++) {
        const row = jsonData[i] as string[];
        if (row && row.some(cell => 
          cell && typeof cell === 'string' && 
          (cell.includes('SKU') || cell.includes('Merchant') || cell.includes('Quantity'))
        )) {
          headers = row.filter(cell => cell && typeof cell === 'string');
          headerRowIndex = i;
          break;
        }
      }

      if (headers.length === 0) {
        return {
          success: false,
          message: 'Could not find valid column headers in the first 5 rows'
        };
      }

      // Validate headers and create column mapping
      const validationResult = this.validateHeaders(headers);
      
      if (!validationResult.success) {
        return validationResult;
      }

      const columnMap = validationResult.columnMap!;

      // Process data rows (skip header and any rows before it)
      const dataRows = jsonData.slice(headerRowIndex + 1);
      const processedData: ExcelFBAInventoryItem[] = [];
      const errors: ExcelValidationError[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as any[];
        const rowNumber = headerRowIndex + i + 2; // Actual Excel row number

        // Skip empty rows
        if (!row || row.every(cell => !cell)) {
          continue;
        }

        const processedRow = this.processDataRow(row, headers, rowNumber, columnMap);
        
        if (processedRow.errors.length > 0) {
          errors.push(...processedRow.errors);
        }

        if (processedRow.data) {
          processedData.push(processedRow.data);
        }
      }

      return {
        success: errors.length === 0,
        data: processedData,
        errors: errors.length > 0 ? errors : undefined,
        message: errors.length > 0 
          ? `Processed with ${errors.length} validation errors` 
          : `Successfully processed ${processedData.length} items`
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate Excel headers and create column mapping
   */
  private static validateHeaders(headers: string[]): ExcelProcessingResult & { columnMap?: { [key: string]: string } } {
    const columnMap: { [key: string]: string } = {};
    const missingFields: string[] = [];

    // Try to map each field to available columns
    for (const [field, possibleColumns] of Object.entries(this.COLUMN_MAPPINGS)) {
      let found = false;
      for (const possibleColumn of possibleColumns) {
        if (headers.includes(possibleColumn)) {
          columnMap[field] = possibleColumn;
          found = true;
          break;
        }
      }
      
      // Check if this is a required field
      if (!found && this.REQUIRED_FIELDS.includes(field)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      const suggestions = missingFields.map(field => {
        const possibleColumns = this.COLUMN_MAPPINGS[field as keyof typeof this.COLUMN_MAPPINGS];
        return `${field}: expected one of [${possibleColumns.join(', ')}]`;
      }).join('\n');

      return {
        success: false,
        message: `Missing required columns. Available columns: ${headers.join(', ')}\n\nRequired mappings:\n${suggestions}`
      };
    }

    return { success: true, columnMap };
  }

  /**
   * Process a single data row
   */
  private static processDataRow(
    row: any[], 
    headers: string[], 
    rowNumber: number,
    columnMap: { [key: string]: string }
  ): { data?: ExcelFBAInventoryItem; errors: ExcelValidationError[] } {
    const errors: ExcelValidationError[] = [];
    const data: Partial<ExcelFBAInventoryItem> = {};

    // Create a map for easier column access
    const rowData: { [key: string]: any } = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index];
    });

    // Helper function to get value using column mapping
    const getValue = (field: string) => {
      const columnName = columnMap[field];
      return columnName ? rowData[columnName] : undefined;
    };

    // Process SKU (required)
    const sku = this.validateAndGetString(getValue('sku'), 'SKU', rowNumber, errors);
    if (sku) {
      data.sku = sku;
    }

    // Process optional fields with defaults
    data.prepOwner = this.validateAndGetString(getValue('prepOwner'), 'Prep Owner', rowNumber, []) || 'Merchant';
    data.labelingOwner = this.validateAndGetString(getValue('labelingOwner'), 'Labeling Owner', rowNumber, []) || 'Merchant';

    // Process Expiration date
    const expirationDate = getValue('expirationDate');
    if (expirationDate) {
      const validatedDate = this.validateDate(expirationDate, rowNumber, errors);
      if (validatedDate) {
        data.expirationDate = validatedDate;
      }
    }

    // Process numeric fields with defaults
    data.unitsPerBox = this.validateAndGetNumber(getValue('unitsPerBox'), 'Units Per Box', rowNumber, []) || 1;
    data.numberOfBoxes = this.validateAndGetNumber(getValue('numberOfBoxes'), 'Number Of Boxes', rowNumber, []) || 1;
    data.boxLength = this.validateAndGetNumber(getValue('boxLength'), 'Box Length', rowNumber, []) || 10;
    data.boxWidth = this.validateAndGetNumber(getValue('boxWidth'), 'Box Width', rowNumber, []) || 10;
    data.boxHeight = this.validateAndGetNumber(getValue('boxHeight'), 'Box Height', rowNumber, []) || 10;
    data.boxWeight = this.validateAndGetNumber(getValue('boxWeight'), 'Box Weight', rowNumber, []) || 1;

    // Check if there's a direct quantity column, otherwise calculate from boxes and units per box
    const directQuantity = this.validateAndGetNumber(getValue('quantity'), 'Quantity', rowNumber, []);
    if (directQuantity && directQuantity > 0) {
      data.totalQuantity = directQuantity;
      // If we have direct quantity but no box info, assume 1 box with all units
      if (!getValue('numberOfBoxes') && !getValue('unitsPerBox')) {
        data.numberOfBoxes = 1;
        data.unitsPerBox = directQuantity;
      }
    } else {
      // Calculate total quantity from boxes and units per box
      data.totalQuantity = (data.numberOfBoxes || 1) * (data.unitsPerBox || 1);
    }

    // Only return data if we have the minimum required fields
    if (data.sku) {
      return { data: data as ExcelFBAInventoryItem, errors };
    }

    return { errors };
  }

  /**
   * Validate and get string value
   */
  private static validateAndGetString(
    value: any, 
    columnName: string, 
    rowNumber: number, 
    errors: ExcelValidationError[]
  ): string | null {
    if (value === undefined || value === null || value === '') {
      errors.push({
        row: rowNumber,
        column: columnName,
        message: `${columnName} is required`,
        value
      });
      return null;
    }

    return String(value).trim();
  }

  /**
   * Validate and get numeric value
   */
  private static validateAndGetNumber(
    value: any, 
    columnName: string, 
    rowNumber: number, 
    errors: ExcelValidationError[]
  ): number | null {
    if (value === undefined || value === null || value === '') {
      errors.push({
        row: rowNumber,
        column: columnName,
        message: `${columnName} is required`,
        value
      });
      return null;
    }

    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
      errors.push({
        row: rowNumber,
        column: columnName,
        message: `${columnName} must be a valid positive number`,
        value
      });
      return null;
    }

    return numValue;
  }

  /**
   * Validate date format (MM/DD/YYYY)
   */
  private static validateDate(
    value: any, 
    rowNumber: number, 
    errors: ExcelValidationError[]
  ): string | null {
    if (!value) return null;

    const dateStr = String(value).trim();
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;

    if (!dateRegex.test(dateStr)) {
      errors.push({
        row: rowNumber,
        column: 'Expiration date (MM/DD/YYYY)',
        message: 'Expiration date must be in MM/DD/YYYY format',
        value
      });
      return null;
    }

    // Additional validation: check if date is valid
    const [month, day, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      errors.push({
        row: rowNumber,
        column: 'Expiration date (MM/DD/YYYY)',
        message: 'Invalid date',
        value
      });
      return null;
    }

    return dateStr;
  }

  /**
   * Generate CSV for Amazon FBA shipment
   */
  static generateAmazonFBACSV(items: ExcelFBAInventoryItem[]): string {
    const headers = [
      'Merchant SKU',
      'Prep owner',
      'Labeling owner',
      'Expiration date',
      'Units per box',
      'Number of boxes',
      'Box length (cm)',
      'Box width (cm)',
      'Box height (cm)',
      'Box weight (kg)'
    ];

    const csvRows = [headers.join(',')];

    for (const item of items) {
      const row = [
        item.sku,
        item.prepOwner,
        item.labelingOwner,
        item.expirationDate || '',
        item.unitsPerBox.toString(),
        item.numberOfBoxes.toString(),
        item.boxLength.toString(),
        item.boxWidth.toString(),
        item.boxHeight.toString(),
        item.boxWeight.toString()
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

    return csvRows.join('\n');
  }
}