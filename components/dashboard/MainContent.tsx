'use client';

import { useState } from 'react';
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
  status: 'success' | 'failed' | 'partial';
  totalFbaQty: number | null;
  productsProcessed: number | null;
  shipmentFileUrl: string | null;
  errorDetails: string | null;
}

export default function MainContent() {
  const [isRunning, setIsRunning] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'operational' | 'warning' | 'error'>('operational');
  const [lastSuccessfulRun, setLastSuccessfulRun] = useState('2025-01-20 03:00 PM');
  const [nextScheduledRun, setNextScheduledRun] = useState('2025-01-21 03:00 PM');
  const [logs, setLogs] = useState<string[]>([]);

  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([
    {
      id: '2025-01-20-150000',
      timestamp: '2025-01-20 03:00 PM',
      status: 'success',
      totalFbaQty: 150,
      productsProcessed: 15,
      shipmentFileUrl: 'https://docs.google.com/spreadsheets/d/example1',
      errorDetails: null
    },
    {
      id: '2025-01-19-150000',
      timestamp: '2025-01-19 03:00 PM',
      status: 'failed',
      totalFbaQty: null,
      productsProcessed: null,
      shipmentFileUrl: null,
      errorDetails: 'API Connection Error: Next Engine - Check credentials'
    },
    {
      id: '2025-01-18-150000',
      timestamp: '2025-01-18 03:00 PM',
      status: 'success',
      totalFbaQty: 120,
      productsProcessed: 12,
      shipmentFileUrl: 'https://docs.google.com/spreadsheets/d/example2',
      errorDetails: null
    },
    {
      id: '2025-01-17-150000',
      timestamp: '2025-01-17 03:00 PM',
      status: 'partial',
      totalFbaQty: 85,
      productsProcessed: 8,
      shipmentFileUrl: 'https://docs.google.com/spreadsheets/d/example3',
      errorDetails: 'Warning: 3 products had insufficient sales data'
    }
  ]);

  const [alerts] = useState([
    {
      id: '1',
      type: 'warning' as const,
      message: 'Amazon SP-API Token expires in 7 days',
      timestamp: '2025-01-20 10:30 AM'
    }
  ]);

  const handleRunAutomation = async () => {
    if (!confirm('Are you sure you want to run the automation now? This will calculate FBA transfer quantities and generate a new shipment file.')) {
      return;
    }
    setIsRunning(true);
    setLogs(['Starting automation...']);
    try {
      const res = await fetch('/api/automation', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setLogs(prev => [...prev, 'Automation completed successfully!']);
        const newRun: AutomationRun = {
          id: `run-${Date.now()}`,
          timestamp: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }),
          status: 'success',
          totalFbaQty: 0, // TODO: update with real value
          productsProcessed: 0, // TODO: update with real value
          shipmentFileUrl: result.shipmentFileUrl,
          errorDetails: null
        };
        setAutomationRuns(prev => [newRun, ...prev]);
      } else {
        setLogs(prev => [...prev, 'Automation failed: ' + (result.errorDetails || result.message)]);
        const newRun: AutomationRun = {
          id: `run-${Date.now()}`,
          timestamp: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }),
          status: 'failed',
          totalFbaQty: null,
          productsProcessed: null,
          shipmentFileUrl: null,
          errorDetails: result.errorDetails || result.message
        };
        setAutomationRuns(prev => [newRun, ...prev]);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, 'Automation failed: ' + err.message]);
    }
    setIsRunning(false);
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
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleRunAutomation}
                disabled={isRunning}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200"
              >
                {isRunning ? (
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
                  {automationRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">{run.timestamp}</div>
                        <div className="text-xs text-slate-500">{run.id}</div>
                      </TableCell>
                      <TableCell>
                        {getRunStatusBadge(run.status)}
                      </TableCell>
                      <TableCell>
                        {run.totalFbaQty ? (
                          <span className="font-medium">{run.totalFbaQty} units</span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {run.productsProcessed ? (
                          <span className="font-medium">{run.productsProcessed}</span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {run.shipmentFileUrl ? (
                          <Button
                            variant="outline"
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
                  ))}
                </TableBody>
              </Table>
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