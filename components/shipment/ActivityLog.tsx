"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Trash2,
  Filter,
} from "lucide-react";
import {
  ActivityLogger,
  LogEntry,
  LogLevel,
} from "../../lib/services/activity-logger";

interface ActivityLogProps {
  maxHeight?: string;
  showOperationFilter?: boolean;
}

export function ActivityLog({
  maxHeight = "max-h-96",
  showOperationFilter = true,
}: ActivityLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [operationFilter, setOperationFilter] = useState<string>("all");
  const [operations, setOperations] = useState<string[]>([]);

  useEffect(() => {
    // Initial load
    refreshLogs();

    // Set up polling for real-time updates
    const interval = setInterval(refreshLogs, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, levelFilter, operationFilter]);

  const refreshLogs = () => {
    const allLogs = ActivityLogger.getLogs();
    setLogs(allLogs);

    // Extract unique operations
    const uniqueOperations = Array.from(
      new Set(allLogs.map((log) => log.operation).filter((op): op is string => Boolean(op)))
    );
    setOperations(uniqueOperations);
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (levelFilter !== "all") {
      filtered = filtered.filter((log) => log.level === levelFilter);
    }

    if (operationFilter !== "all") {
      filtered = filtered.filter((log) => log.operation === operationFilter);
    }

    setFilteredLogs(filtered);
  };

  const handleClearLogs = () => {
    ActivityLogger.clearLogs();
    refreshLogs();
  };

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLevelBadge = (level: LogLevel) => {
    const colors = {
      error: "bg-red-100 text-red-700",
      warning: "bg-yellow-100 text-yellow-700",
      success: "bg-green-100 text-green-700",
      info: "bg-blue-100 text-blue-700",
    };

    return (
      <Badge className={`text-xs ${colors[level]}`}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const summary = ActivityLogger.getLogsSummary();

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span>Activity Log</span>
            </CardTitle>
            <CardDescription>
              Real-time system activity and operation logs ({summary.total}{" "}
              entries)
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={refreshLogs}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearLogs}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="flex space-x-4 mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-1">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Info: {summary.byLevel.info}</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm">Success: {summary.byLevel.success}</span>
          </div>
          <div className="flex items-center space-x-1">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Warning: {summary.byLevel.warning}</span>
          </div>
          <div className="flex items-center space-x-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm">Error: {summary.byLevel.error}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <Select
              value={levelFilter}
              onValueChange={(value) =>
                setLevelFilter(value as LogLevel | "all")
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showOperationFilter && operations.length > 0 && (
            <Select value={operationFilter} onValueChange={setOperationFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operations</SelectItem>
                {operations.map((op) => (
                  <SelectItem key={op} value={op}>
                    {op
                      .replace("-", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Log Entries */}
        <div className={`${maxHeight} overflow-y-auto space-y-2`}>
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start space-x-3 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs text-slate-500 font-mono">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    {getLevelBadge(log.level)}
                    {log.operation && (
                      <Badge variant="outline" className="text-xs">
                        {log.operation}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-900 break-words">
                    {log.message}
                  </p>
                  {log.context && Object.keys(log.context).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                        View context
                      </summary>
                      <pre className="text-xs text-slate-600 mt-1 p-2 bg-slate-100 rounded overflow-x-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No log entries found</p>
              {(levelFilter !== "all" || operationFilter !== "all") && (
                <p className="text-sm mt-2">Try adjusting the filters above</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
