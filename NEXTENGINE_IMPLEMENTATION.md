# Next Engine Integration Implementation

## Overview
This document describes the complete implementation of Next Engine API integration for the FBA Shipment Automation Dashboard, based on the requirements in `projectinfo.txt`.

## Implementation Components

### 1. Environment Configuration
- **Location**: `.env.local`
- **Credentials**: 
  - Production: `NEXT_ENGINE_CLIENT_ID=lm14ufypwQY8NG`, `NEXT_ENGINE_CLIENT_SECRET=flEyMQx9CIvdcKptRgmkjOisBS5G4TqPWYA2XhwU`
  - Test: `NEXT_ENGINE_CLIENT_ID=8Dm17jfXKeLnYo`, `NEXT_ENGINE_CLIENT_SECRET=Lpxa63k2JGcDreK4Q9wt1jWyIRH7hVXlvmAFCUfY`

### 2. Core Integration Files

#### 2.1 Next Engine API Client (`lib/nextengine-api.ts`)
- OAuth 2.0 token management with automatic refresh
- Base API client for making authenticated requests
- Error handling and retry logic

#### 2.2 Next Engine Integration Service (`lib/integrations/nextEngine.ts`)
- **Functions**:
  - `getNextEngineData(type)`: Fetch sales or inventory data
  - `getOrderDetails(orderIds)`: Get detailed order information  
  - `getGoodsInfo(goodsCodes)`: Fetch product details
  - `processSalesData(orders)`: Process raw orders into sales analytics
  - `processInventoryData(stocks)`: Process raw stock data by warehouse
  - `testNextEngineConnection()`: Test API connectivity

#### 2.3 Type Definitions (`types/nextengine.ts`)
- Complete TypeScript interfaces for Next Engine API responses
- Business logic types for sales and inventory processing
- Allocation and shipment data structures

### 3. Business Logic Implementation

#### 3.1 FBA Allocation Service (`lib/services/fba-allocation.ts`)
Implements the complete allocation algorithm from project requirements:

1. **Sales-Based Allocation Calculation**:
   - Uses last 2 weeks of sales data (FBA vs other channels)
   - Calculates allocation ratio: `FBA : Others = FBA_sales : Other_sales`
   - Applies theoretical allocation with actual sales limits

2. **3PL Inventory Allocation Logic**:
   - Step 1: Calculate `A = Main_warehouse_qty - RSL_warehouse_qty`  
   - Step 2: If `required_qty ≤ A`, ship from main warehouse only
   - Step 3: If `required_qty > A`, ship `A` from main + remainder from LOGI

3. **Product Filtering**:
   - Filters for mail-size and 60-size products only
   - Excludes ineligible products from shipment

#### 3.2 Main Automation Logic (`lib/automation.ts`)
Complete automation workflow:
1. Fetch sales data (last 14 days)
2. Process sales by product and channel
3. Fetch current inventory by warehouse
4. Get current FBA inventory levels
5. Calculate optimal FBA allocations
6. Generate filtered shipment list
7. Create Google Sheets shipment file
8. Return detailed results with statistics

### 4. User Interface Components

#### 4.1 Dashboard (`components/dashboard/MainContent.tsx`)
- **Next Engine Statistics Section**: Shows data processing metrics
- **Automation Controls**: Manual trigger and file download
- **Results Display**: Detailed breakdown by warehouse and product type
- **Real-time Status**: Processing logs and error handling

#### 4.2 API Settings (`components/api-settings/ApiSettingsContent.tsx`)
- Next Engine credential management (Client ID/Secret)
- Environment selection (Production/Test)
- Connection testing functionality
- Secure credential storage and display

### 5. Google Sheets Integration (`lib/integrations/googleSheets.ts`)
- Generates comprehensive shipment files with:
  - Detailed shipment items list
  - Summary statistics
  - Warehouse and product type breakdowns
  - Processing metadata
- Automatic formatting and sharing

### 6. API Endpoints

#### 6.1 Automation Endpoint (`app/api/automation/route.ts`)
- `POST /api/automation`: Trigger manual automation run
- Background job processing with status tracking

#### 6.2 Settings Management (`app/api/api-settings/`)
- `GET /api/api-settings`: Retrieve stored credentials
- `PUT /api/api-settings`: Update credentials
- `POST /api/api-settings/test`: Test API connections

## Usage Instructions

### 1. Setup
1. Configure credentials in `.env.local`
2. Run `npm install` to install dependencies
3. Test connection: `npm run test:nextengine`

### 2. Manual Automation
1. Navigate to Dashboard
2. Click "Run Automation Now"
3. Monitor progress in real-time
4. Download generated shipment file

### 3. Scheduled Automation
- Configured to run every 7 days automatically
- Adjustable frequency based on requirements
- Error notifications and retry logic

## Data Flow

```
Next Engine API → Raw Data → Processing → FBA Allocation → Filtering → Google Sheets
     ↓              ↓           ↓              ↓             ↓            ↓
- Orders         - Sales    - Inventory   - Transfer    - Eligible  - Shipment
- Inventory      - Products - Breakdown   - Quantities  - Products  - File
- Products       
```

## Key Features Implemented

✅ **Sales-based allocation calculation** (2-week rolling window)  
✅ **3PL inventory allocation logic** (Main/RSL/LOGI warehouses)  
✅ **Product filtering** (mail-size and 60-size products)  
✅ **Google Sheets integration** (automated file generation)  
✅ **Dashboard interface** (results viewing and file download)  
✅ **Manual and scheduled automation** (7-day interval)  
✅ **Error handling and logging** (detailed error reporting)  
✅ **Credential management** (secure API settings)  
✅ **Real-time monitoring** (automation progress tracking)

## Testing

Run the Next Engine integration test:
```bash
npm run test:nextengine
```

This will:
1. Test API connectivity
2. Fetch sample sales data
3. Fetch sample inventory data  
4. Process and display results
5. Validate data transformation logic

## Future Enhancements

- Amazon Seller Central integration for FBA inventory
- Advanced scheduling options
- Email notifications for automation results
- Historical data analysis and trends
- Multi-warehouse support expansion
