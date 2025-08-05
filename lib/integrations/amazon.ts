import {
  ExcelProcessingService,
  ExcelFBAInventoryItem,
} from "../services/excel-processing";

export async function getAmazonFbaInventoryFromExcel(
  fileBuffer: Buffer
): Promise<ExcelFBAInventoryItem[]> {
  try {
    const result = await ExcelProcessingService.processExcelFile(fileBuffer);

    if (!result.success) {
      throw new Error(result.message || "Failed to process Excel file");
    }

    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors
        .map((err) => `Row ${err.row}, Column "${err.column}": ${err.message}`)
        .join("\n");
      throw new Error(`Excel validation errors:\n${errorMessages}`);
    }

    return result.data || [];
  } catch (error) {
    console.error("Error processing Excel file for FBA inventory:", error);
    throw error;
  }
}
