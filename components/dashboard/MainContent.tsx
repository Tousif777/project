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

  const [alerts] = useState([
    {
      id: '1',
      type: 'warning' as const,
      message: 'Amazon SP-API Token expires in 7 days',
      timestamp: '2025-01-20 10:30 AM'
    }
  ]);

  const fetchRecentRuns = async () => {
    setIsLoadingRuns(true);
    try {
      const res = await fetch('/api/automation/recent');
      if (!res.ok) throw new Error('Network response was not ok');
      const jobs: Job[] = await res.json();

      const formattedRuns: AutomationRun[] = jobs.map(job => ({
        id: job._id,
        timestamp: new Date(job.updatedAt).toLocaleString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        }),
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
      await fetchRecentRuns();
      setLogs(prev => [...prev, "The job is now running in the background. The status will update on refresh."]);

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
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="flex gap-4">
            <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Automation Now
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Automation Run</DialogTitle>
                  <DialogDescription>
                    This will start the FBA shipment automation process. Are you sure you want to continue?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleRunAutomation} className="bg-blue-600 hover:bg-blue-700">
                    Yes, Run Automation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              onClick={handleDownloadLastFile}
              disabled={!automationRuns.some(run => run.status === 'success' && run.shipmentFileUrl)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Last Shipment File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Automation Runs */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <span>Recent Automation Runs</span>
          </CardTitle>
          <CardDescription>
            View the history and status of recent automation runs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRuns ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">Loading recent runs...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {automationRuns.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Total Qty</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automationRuns.slice(0, 5).map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-medium text-sm">{run.timestamp}</TableCell>
                        <TableCell>{getRunStatusBadge(run.status)}</TableCell>
                        <TableCell>{run.productsProcessed || '-'}</TableCell>
                        <TableCell>{run.totalFbaQty || '-'}</TableCell>
                        <TableCell>
                          {run.status === 'success' && run.shipmentFileUrl && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(run.shipmentFileUrl!, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          )}
                          {run.status === 'failed' && run.errorDetails && (
                            <span className="text-xs text-red-600" title={run.errorDetails}>
                              View Error
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No automation runs found. Start your first automation run above.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Console/Logs */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-green-600" />
            <span>Console & Logs</span>
          </CardTitle>
          <CardDescription>
            Real-time logs and system messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="bg-slate-950 text-green-400 p-4 rounded-lg font-mono text-sm max-h-48 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No recent logs. Run the automation to see real-time progress.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
