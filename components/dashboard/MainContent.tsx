'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  Play, 
  Clock, 
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  FileText,
  Activity,
  Calendar,
  TrendingUp,
  Shield,
  Database,
  AlertTriangle
} from 'lucide-react';

interface AutomationRun {
  id: string;
  timestamp: string;
  status: 'success' | 'failed' | 'partial' | 'processing' | 'pending';
  totalFbaQty: number | null;
  productsProcessed: number | null;
  shipmentFileUrl: string | null;
  errorDetails: string | null;
}

// This is the type from our backend
interface Job {
  _id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    success: boolean;
    message: string;
    shipmentFileUrl?: string;
    errorDetails?: string;
    summary?: {
      totalProducts: number;
      totalQuantity: number;
      eligibleItems: number;
      ineligibleItems: number;
      warehouseBreakdown: {
        main: number;
        logi: number;
      };
      productTypeBreakdown: {
        'mail-size': number;
        '60-size': number;
      };
    };
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MainContent() {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [systemStatus, setSystemStatus] = useState<'operational' | 'warning' | 'error'>('operational');
  const [lastSuccessfulRun, setLastSuccessfulRun] = useState('N/A');
  const [nextScheduledRun, setNextScheduledRun] = useState('2025-01-21 03:00 PM');
  const [logs, setLogs] = useState<string[]>([]);
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([]);

  // Add state for detailed automation results
  const [automationStats, setAutomationStats] = useState({
    totalProductsAnalyzed: 0,
    totalInventoryItems: 0,
    fbaTransferItems: 0,
    totalTransferQuantity: 0,
    warehouseBreakdown: { main: 0, logi: 0 },
    productTypeBreakdown: { 'mail-size': 0, '60-size': 0 }
  });

  const fetchRecentRuns = async () => {
    setIsLoadingRuns(true);
    try {
      const res = await fetch('/api/automation/recent');
      if (!res.ok) throw new Error('Network response was not ok');
      const jobs: Job[] = await res.json();

      const formattedRuns: AutomationRun[] = jobs.map(job => ({
        id: job._id,
        timestamp: new Date(job.updatedAt).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }),
        status: job.status === 'completed' ? (job.result?.success ? 'success' : 'failed') : job.status as any,
        totalFbaQty: job.result?.summary?.totalQuantity || null,
        productsProcessed: job.result?.summary?.totalProducts || null,
        shipmentFileUrl: job.result?.shipmentFileUrl || null,
        errorDetails: job.error || job.result?.errorDetails || null,
      }));
      setAutomationRuns(formattedRuns);

      const lastSuccess = formattedRuns.find(run => run.status === 'success');
      if (lastSuccess) {
        setLastSuccessfulRun(lastSuccess.timestamp);
      }

      // Update automation stats from the most recent successful run
      const mostRecentSuccess = jobs.find(job => job.status === 'completed' && job.result?.success);
      if (mostRecentSuccess?.result?.summary) {
        setAutomationStats({
          totalProductsAnalyzed: mostRecentSuccess.result.summary.totalProducts || 0,
          totalInventoryItems: mostRecentSuccess.result.summary.totalProducts || 0, // Placeholder
          fbaTransferItems: mostRecentSuccess.result.summary.eligibleItems || 0,
          totalTransferQuantity: mostRecentSuccess.result.summary.totalQuantity || 0,
          warehouseBreakdown: mostRecentSuccess.result.summary.warehouseBreakdown || { main: 0, logi: 0 },
          productTypeBreakdown: mostRecentSuccess.result.summary.productTypeBreakdown || { 'mail-size': 0, '60-size': 0 }
        });
      }
    } catch (error) {
      console.error("Failed to fetch recent runs", error);
      setLogs(prev => [...prev, 'Error: Could not load recent automation runs.']);
    } finally {
      setIsLoadingRuns(false);
    }
  };

  useEffect(() => {
    fetchRecentRuns();
  }, []);

  const [alerts] = useState([
    {
      id: '1',
      type: 'warning' as const,
      message: 'Amazon SP-API Token expires in 7 days',
      timestamp: '2025-01-20 10:30 AM'
    }
  ]);



  const handleRunAutomation = async () => {
    setIsConfirmModalOpen(false);
    setIsRunning(true);
    setLogs(['Starting automation...']);

    try {
      const res = await fetch('/api/automation', { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to start automation job.' }));
        throw new Error(errorData.message || 'Failed to start automation job.');
      }
      const { jobId } = await res.json();

      setLogs(prev => [...prev, `Automation job started with ID: ${jobId}`]);
      
      // Immediately fetch recent runs to show the new 'processing' job
      await fetchRecentRuns();

      // We can inform the user that the job is running in the background
      setLogs(prev => [...prev, "The job is now running in the background. The status will update on the next refresh."]);

    } catch (error: any) {
      setLogs(prev => [...prev, `Error starting automation: ${error.message}`]);
      setSystemStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadLastFile = () => {
    const lastSuccessfulRun = automationRuns.find(run => run.status === 'success' && run.shipmentFileUrl);
    if (lastSuccessfulRun?.shipmentFileUrl) {
      window.open(lastSuccessfulRun.shipmentFileUrl, '_blank');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" />Operational</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRunStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertTriangle className="w-3 h-3 mr-1" />Partial Success</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Activity className="h-5 w-5 text-blue-600" />
                <span>Current Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getStatusBadge(systemStatus)}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Last Successful Run</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-slate-900">{lastSuccessfulRun}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Calendar className="h-5 w-5 text-purple-600" />
                <span>Next Scheduled Run</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-slate-900">{nextScheduledRun}</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
              Alerts & Notifications
            </h3>
            {alerts.map((alert) => (
              <Alert key={alert.id} className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <div className="flex justify-between items-start">
                    <span>{alert.message}</span>
                    <span className="text-xs text-yellow-600 ml-4">{alert.timestamp}</span>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-blue-600" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Manually trigger automation or download recent files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={isRunning}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200"
                  >
                    {isRunning && !isConfirmModalOpen ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running Automation...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Run Automation Now
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Confirm Automation Run</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to run the automation now? This will calculate FBA transfer quantities and generate a new shipment file. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" disabled={isRunning}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleRunAutomation} disabled={isRunning}>
                      {isRunning && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Confirm & Run
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={handleDownloadLastFile}
                variant="outline"
                size="lg"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                disabled={!automationRuns.find(run => run.status === 'success' && run.shipmentFileUrl)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Last Shipment File
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Automation Runs History */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span>Recent Automation Runs</span>
            </CardTitle>
            <CardDescription>
              Track automation activity and access generated files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run ID/Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total FBA Qty</TableHead>
                    <TableHead>Products Processed</TableHead>
                    <TableHead>Shipment File</TableHead>
                    <TableHead>Error Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingRuns ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        <div className="flex justify-center items-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                          <span className="ml-2 text-slate-500">Loading recent runs...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : automationRuns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500 py-10">
                        No recent automation runs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    automationRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>
                          <div className="font-medium text-slate-900">{run.timestamp}</div>
                          <div className="text-xs text-slate-500">{run.id}</div>
                        </TableCell>
                        <TableCell>
                          {getRunStatusBadge(run.status)}
                        </TableCell>
                        <TableCell className="text-right">{run.totalFbaQty ?? 'N/A'}</TableCell>
                        <TableCell className="text-right">{run.productsProcessed ?? 'N/A'}</TableCell>
                        <TableCell>
                          {run.shipmentFileUrl ? (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => window.open(run.shipmentFileUrl!, '_blank')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View/Download
                            </Button>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {run.errorDetails ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              View Logs
                            </Button>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Next Engine Integration Statistics */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-600" />
              <span>Next Engine Data Processing</span>
            </CardTitle>
            <CardDescription>
              Latest statistics from Next Engine API integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">Products Analyzed</p>
                <p className="text-2xl font-bold text-blue-700">{automationStats.totalProductsAnalyzed}</p>
                <p className="text-xs text-slate-500">from sales data</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">Inventory Items</p>
                <p className="text-2xl font-bold text-emerald-700">{automationStats.totalInventoryItems}</p>
                <p className="text-xs text-slate-500">processed</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">FBA Transfer Items</p>
                <p className="text-2xl font-bold text-purple-700">{automationStats.fbaTransferItems}</p>
                <p className="text-xs text-slate-500">eligible for shipment</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">Total Transfer Qty</p>
                <p className="text-2xl font-bold text-orange-700">{automationStats.totalTransferQuantity}</p>
                <p className="text-xs text-slate-500">units to ship</p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Warehouse Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Main Warehouse</span>
                    <Badge className="bg-blue-100 text-blue-700">{automationStats.warehouseBreakdown.main} units</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">LOGI Warehouse</span>
                    <Badge className="bg-green-100 text-green-700">{automationStats.warehouseBreakdown.logi} units</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Product Type Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Mail-size Products</span>
                    <Badge className="bg-purple-100 text-purple-700">{automationStats.productTypeBreakdown['mail-size']} units</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">60-size Products</span>
                    <Badge className="bg-orange-100 text-orange-700">{automationStats.productTypeBreakdown['60-size']} units</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Stockout Avoidance Rate</p>
                  <p className="text-2xl font-bold text-emerald-700">94.2%</p>
                </div>
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg. FBA Days of Cover</p>
                  <p className="text-2xl font-bold text-blue-700">28 days</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Est. Storage Savings</p>
                  <p className="text-2xl font-bold text-purple-700">$2,340</p>
                </div>
                <Database className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span>Automation Logs</span>
            </CardTitle>
            <CardDescription>
              Real-time logs from the most recent automation run
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{log}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No recent logs. Run the automation to see real-time progress.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}