'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Settings, 
  Clock, 
  Save,
  CheckCircle2,
  Database,
  Calendar
} from 'lucide-react';
import Header from '@/components/dashboard/Header';

export default function SettingsContent() {
  const [automation, setAutomation] = useState({
    autoRun: false,
    schedule: '15:00',
    selectedDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    }
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDayChange = (day: string, checked: boolean) => {
    setAutomation(prev => ({
      ...prev,
      selectedDays: {
        ...prev.selectedDays,
        [day]: checked
      }
    }));
  };

  const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-slate-600">Configure your automation preferences</p>
            </div>
          </div>

          {saved && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                Settings saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Automation Settings */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span>Automation Schedule</span>
              </CardTitle>
              <CardDescription>
                Configure when calculations run automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Enable Auto-run</Label>
                  <p className="text-xs text-slate-500">Automatically run calculations on schedule</p>
                </div>
                <Switch 
                  checked={automation.autoRun}
                  onCheckedChange={(checked) => setAutomation(prev => ({ ...prev, autoRun: checked }))}
                />
              </div>

              {automation.autoRun && (
                <div className="space-y-6 pl-4 border-l-2 border-blue-100">
                  <div className="space-y-2">
                    <Label htmlFor="schedule" className="text-sm font-medium">Daily Run Time</Label>
                    <Input
                      id="schedule"
                      type="time"
                      value={automation.schedule}
                      onChange={(e) => setAutomation(prev => ({ ...prev, schedule: e.target.value }))}
                      className="w-32"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Run on Days</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(dayLabels).map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={automation.selectedDays[key as keyof typeof automation.selectedDays]}
                            onCheckedChange={(checked) => handleDayChange(key, checked as boolean)}
                          />
                          <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <strong>Selected schedule:</strong> {
                          Object.entries(automation.selectedDays)
                            .filter(([_, selected]) => selected)
                            .map(([day, _]) => dayLabels[day as keyof typeof dayLabels])
                            .join(', ')
                        } at {automation.schedule}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-emerald-600" />
                <span>System Status</span>
              </CardTitle>
              <CardDescription>
                Current system information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Version</span>
                  <Badge variant="secondary">v1.0.0</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Status</span>
                  <Badge className="bg-emerald-100 text-emerald-700">Operational</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Last Update</span>
                  <span className="text-sm text-slate-900">2 days ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Uptime</span>
                  <span className="text-sm text-slate-900">99.9%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}