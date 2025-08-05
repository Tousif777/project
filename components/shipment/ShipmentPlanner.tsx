"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  FileSpreadsheet,
  Settings,
  Calculator,
  Eye,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { ExcelUploader } from "../excel/ExcelUploader";
import { BusinessRulesForm } from "./BusinessRulesForm";
import { ShipmentReview } from "./ShipmentReview";
import { ActivityLog } from "./ActivityLog";

import { ExcelFBAInventoryItem } from "../../lib/services/excel-processing";
import {
  BusinessRules,
  BusinessRulesService,
} from "../../lib/services/business-rules";
import {
  ShipmentPlan,
  ShipmentCalculatorService,
} from "../../lib/services/shipment-calculator";
import { NextEngineShipmentDataService } from "../../lib/services/nextengine-shipment-data";
import { ActivityLogger } from "../../lib/services/activity-logger";

type PlannerStep = "upload" | "configure" | "calculate" | "review";

export function ShipmentPlanner() {
  const [currentStep, setCurrentStep] = useState<PlannerStep>("upload");
  const [excelData, setExcelData] = useState<ExcelFBAInventoryItem[]>([]);
  const [businessRules, setBusinessRules] = useState<BusinessRules>(
    BusinessRulesService.loadRules()
  );
  const [shipmentPlan, setShipmentPlan] = useState<ShipmentPlan | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);
  const [calculationError, setCalculationError] = useState<string>("");
  const [nextEngineInventoryData, setNextEngineInventoryData] = useState<any[]>(
    []
  );
  const [nextEngineSalesData, setNextEngineSalesData] = useState<any[]>([]);

  const handleExcelDataProcessed = (data: ExcelFBAInventoryItem[]) => {
    setExcelData(data);
    ActivityLogger.logExcelProcessing(`Excel file processed successfully`, {
      itemCount: data.length,
    });

    if (data.length > 0) {
      setCurrentStep("configure");
    }
  };

  const handleBusinessRulesChange = (rules: BusinessRules) => {
    setBusinessRules(rules);
  };

  const handleCalculateShipment = async () => {
    // Reset all states first
    setCalculationError("");
    setShipmentPlan(null);

    if (excelData.length === 0) {
      setCalculationError(
        "No Excel data available. Please upload a file first."
      );
      return;
    }

    setIsCalculating(true);

    try {
      ActivityLogger.logCalculation("Starting shipment calculation", {
        skuCount: excelData.length,
        businessRules,
      });

      // Extract SKUs from Excel data with validation
      const skus = excelData
        .map((item) => item?.sku)
        .filter((sku): sku is string =>
          Boolean(sku && typeof sku === "string")
        );

      if (skus.length === 0) {
        throw new Error("No valid SKUs found in Excel data");
      }

      // Validate SKUs exist in Next Engine with timeout
      ActivityLogger.info("Validating SKUs in Next Engine system");
      const skuValidation = (await Promise.race([
        NextEngineShipmentDataService.validateSKUsInNextEngine(skus),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("SKU validation timeout")), 30000)
        ),
      ])) as any;

      if (skuValidation.missing && skuValidation.missing.length > 0) {
        ActivityLogger.warning(
          `${skuValidation.missing.length} SKUs not found in Next Engine`,
          { missingSKUs: skuValidation.missing.slice(0, 10) }
        );
      }

      // Fetch inventory data with timeout
      ActivityLogger.info("Fetching inventory data from Next Engine");
      const inventoryData = (await Promise.race([
        NextEngineShipmentDataService.getInventoryForSKUs(skus),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Inventory fetch timeout")), 30000)
        ),
      ])) as any;

      // Store inventory data for display
      setNextEngineInventoryData(inventoryData || []);

      // Fetch sales data with timeout
      ActivityLogger.info("Fetching sales data from Next Engine");
      const salesData = (await Promise.race([
        NextEngineShipmentDataService.getSalesDataForSKUs(
          skus,
          businessRules.look_back_days
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Sales data fetch timeout")), 30000)
        ),
      ])) as any;

      // Store sales data for display
      setNextEngineSalesData(salesData || []);

      // Validate data before calculation
      if (!Array.isArray(inventoryData) || !Array.isArray(salesData)) {
        throw new Error("Invalid data received from Next Engine");
      }

      // Calculate shipment plan with validation
      ActivityLogger.logCalculation(
        "Calculating optimal shipment quantities with Next Engine data"
      );

      const plan = ShipmentCalculatorService.calculateShipmentPlan(
        excelData,
        salesData,
        inventoryData,
        businessRules
      );

      // Validate the plan before setting state
      if (!plan || !plan.items || !plan.summary) {
        throw new Error("Invalid shipment plan generated");
      }

      setShipmentPlan(plan);
      setCurrentStep("review");

      ActivityLogger.success("Shipment calculation completed successfully", {
        totalItems: plan.summary.totalItems,
        totalQuantity: plan.summary.totalQuantity,
        warnings: plan.summary.warnings?.length || 0,
      });
    } catch (error) {
      console.error("Calculation error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setCalculationError(`Calculation failed: ${errorMessage}`);

      ActivityLogger.error("Shipment calculation failed", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Don't change step on error, stay on calculate
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePlanUpdate = (updatedPlan: ShipmentPlan) => {
    setShipmentPlan(updatedPlan);
    ActivityLogger.info("Shipment plan updated manually", {
      totalItems: updatedPlan.summary.totalItems,
      totalQuantity: updatedPlan.summary.totalQuantity,
    });
  };

  const handleGenerateCSV = async () => {
    if (!shipmentPlan) return;

    setIsGeneratingCSV(true);

    try {
      ActivityLogger.info("Generating CSV file for Amazon shipment");

      // Filter items with quantity > 0
      const shippableItems = shipmentPlan.items.filter(
        (item) => item.finalQuantity > 0
      );

      if (shippableItems.length === 0) {
        throw new Error("No items to ship. All quantities are zero.");
      }

      // Convert to Excel format for CSV generation
      const csvItems = shippableItems.map((item) => {
        const excelItem = excelData.find((e) => e.sku === item.sku);
        if (!excelItem) {
          throw new Error(`Excel data not found for SKU: ${item.sku}`);
        }

        return {
          ...excelItem,
          totalQuantity: item.finalQuantity,
        };
      });

      // Generate CSV
      const response = await fetch("/api/excel/export-csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: csvItems }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate CSV file");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `amazon-fba-shipment-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      ActivityLogger.success("CSV file generated and downloaded successfully", {
        itemCount: shippableItems.length,
        totalQuantity: shipmentPlan.summary.totalQuantity,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate CSV";
      ActivityLogger.error("CSV generation failed", { error: errorMessage });
    } finally {
      setIsGeneratingCSV(false);
    }
  };

  const getStepStatus = (step: PlannerStep) => {
    const stepOrder: PlannerStep[] = [
      "upload",
      "configure",
      "calculate",
      "review",
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const canProceedToCalculate = excelData.length > 0;
  const canProceedToReview = shipmentPlan !== null;

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {[
              { step: "upload", label: "Upload Excel", icon: FileSpreadsheet },
              { step: "configure", label: "Configure Rules", icon: Settings },
              { step: "calculate", label: "Calculate Plan", icon: Calculator },
              { step: "review", label: "Review & Export", icon: Eye },
            ].map(({ step, label, icon: Icon }, index) => {
              const status = getStepStatus(step as PlannerStep);
              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                      status === "completed"
                        ? "bg-green-100 text-green-700"
                        : status === "current"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{label}</span>
                    {status === "completed" && (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-8 h-0.5 mx-2 ${
                        getStepStatus(
                          ["configure", "calculate", "review"][
                            index
                          ] as PlannerStep
                        ) === "completed"
                          ? "bg-green-300"
                          : "bg-slate-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs
        value={currentStep}
        onValueChange={(value) => setCurrentStep(value as PlannerStep)}
      >
        <TabsContent value="upload" className="space-y-6">
          <ExcelUploader onDataProcessed={handleExcelDataProcessed} />
        </TabsContent>

        <TabsContent value="configure" className="space-y-6">
          <BusinessRulesForm
            onRulesChange={handleBusinessRulesChange}
            initialRules={businessRules}
          />

          <div className="flex justify-end">
            <Button
              onClick={() => setCurrentStep("calculate")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Proceed to Calculation
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="calculate" className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <span>Calculate Shipment Plan</span>
              </CardTitle>
              <CardDescription>
                Generate optimal shipment quantities based on your business
                rules and Next Engine data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Excel Items
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {excelData.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Look Back Days
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {businessRules.look_back_days}
                  </p>
                </div>
              </div>

              {isCalculating && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Calculating shipment plan... This may take a few moments
                    while we fetch data from Next Engine.
                  </AlertDescription>
                </Alert>
              )}

              {calculationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{calculationError}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleCalculateShipment}
                disabled={isCalculating || excelData.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Calculator className="h-5 w-5 mr-2" />
                {isCalculating ? "Calculating..." : "Calculate Shipment Plan"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          {shipmentPlan && (
            <>
              <ShipmentReview
                plan={shipmentPlan}
                onPlanUpdate={handlePlanUpdate}
                onGenerateCSV={handleGenerateCSV}
                isGeneratingCSV={isGeneratingCSV}
              />

              {/* Next Engine Data Display */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-purple-600" />
                    <span>Next Engine Data</span>
                  </CardTitle>
                  <CardDescription>
                    Raw inventory and sales data from Next Engine for debugging
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="inventory" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="inventory">
                        Inventory Data
                      </TabsTrigger>
                      <TabsTrigger value="sales">Sales Data</TabsTrigger>
                    </TabsList>

                    <TabsContent value="inventory" className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-slate-300">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border border-slate-300 p-2 text-left">
                                SKU
                              </th>
                              <th className="border border-slate-300 p-2 text-left">
                                Warehouse Stock
                              </th>
                              <th className="border border-slate-300 p-2 text-left">
                                Reserved Stock
                              </th>
                              <th className="border border-slate-300 p-2 text-left">
                                Available Stock
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {nextEngineInventoryData.map((item, index) => (
                              <tr key={index} className="hover:bg-slate-50">
                                <td className="border border-slate-300 p-2 font-medium">
                                  {item.sku}
                                </td>
                                <td className="border border-slate-300 p-2">
                                  {item.warehouseStock}
                                </td>
                                <td className="border border-slate-300 p-2">
                                  {item.reservedStock}
                                </td>
                                <td className="border border-slate-300 p-2 font-medium">
                                  {item.availableStock}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>

                    <TabsContent value="sales" className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-slate-300">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border border-slate-300 p-2 text-left">
                                SKU
                              </th>
                              <th className="border border-slate-300 p-2 text-left">
                                Total Sales
                              </th>
                              <th className="border border-slate-300 p-2 text-left">
                                Avg Daily Sales
                              </th>
                              <th className="border border-slate-300 p-2 text-left">
                                Sales History
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {nextEngineSalesData.map((item, index) => (
                              <tr key={index} className="hover:bg-slate-50">
                                <td className="border border-slate-300 p-2 font-medium">
                                  {item.sku}
                                </td>
                                <td className="border border-slate-300 p-2">
                                  {item.totalSales}
                                </td>
                                <td className="border border-slate-300 p-2">
                                  {item.averageDailySales.toFixed(2)}
                                </td>
                                <td className="border border-slate-300 p-2">
                                  {item.salesHistory.length > 0 ? (
                                    <span className="text-xs text-slate-600">
                                      {item.salesHistory.length} days of data
                                    </span>
                                  ) : (
                                    <span className="text-xs text-red-600">
                                      No sales history
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Activity Log */}
      <ActivityLog maxHeight="max-h-64" />
    </div>
  );
}
