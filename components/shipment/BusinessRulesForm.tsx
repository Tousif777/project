'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { BusinessRules, BusinessRulesService, DEFAULT_BUSINESS_RULES, ValidationError } from '../../lib/services/business-rules';

interface BusinessRulesFormProps {
  onRulesChange?: (rules: BusinessRules) => void;
  initialRules?: BusinessRules;
}

export function BusinessRulesForm({ onRulesChange, initialRules }: BusinessRulesFormProps) {
  const [rules, setRules] = useState<BusinessRules>(initialRules || DEFAULT_BUSINESS_RULES);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  useEffect(() => {
    if (!initialRules) {
      const savedRules = BusinessRulesService.loadRules();
      setRules(savedRules);
      onRulesChange?.(savedRules);
    }
  }, [initialRules, onRulesChange]);

  const handleInputChange = (field: keyof BusinessRules, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newRules = { ...rules, [field]: numValue };
    setRules(newRules);
    
    // Clear previous errors for this field
    setErrors(prev => prev.filter(e => e.field !== field));
    
    onRulesChange?.(newRules);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    const validationErrors = BusinessRulesService.validateRules(rules);
    setErrors(validationErrors);
    
    if (validationErrors.length === 0) {
      try {
        BusinessRulesService.saveRules(rules);
        setSaveMessage('Business rules saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error) {
        setSaveMessage('Failed to save business rules');
      }
    }
    
    setIsSaving(false);
  };

  const handleReset = () => {
    setRules(DEFAULT_BUSINESS_RULES);
    setErrors([]);
    setSaveMessage('');
    onRulesChange?.(DEFAULT_BUSINESS_RULES);
  };

  const getFieldError = (field: string) => {
    return errors.find(e => e.field === field)?.message;
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-blue-600" />
          <span>Business Rules Configuration</span>
        </CardTitle>
        <CardDescription>
          Configure the parameters used for calculating optimal shipment quantities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {saveMessage && (
          <Alert className={saveMessage.includes('success') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription className={saveMessage.includes('success') ? 'text-green-700' : 'text-red-700'}>
              {saveMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="look_back_days">Look Back Days</Label>
            <Input
              id="look_back_days"
              type="number"
              min="1"
              max="365"
              value={rules.look_back_days}
              onChange={(e) => handleInputChange('look_back_days', e.target.value)}
              className={getFieldError('look_back_days') ? 'border-red-300' : ''}
            />
            <p className="text-sm text-slate-600">
              Number of days to analyze for sales history (1-365)
            </p>
            {getFieldError('look_back_days') && (
              <p className="text-sm text-red-600">{getFieldError('look_back_days')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_cover_days">Target Cover Days</Label>
            <Input
              id="target_cover_days"
              type="number"
              min="1"
              max="90"
              value={rules.target_cover_days}
              onChange={(e) => handleInputChange('target_cover_days', e.target.value)}
              className={getFieldError('target_cover_days') ? 'border-red-300' : ''}
            />
            <p className="text-sm text-slate-600">
              Target days of inventory to maintain (1-90)
            </p>
            {getFieldError('target_cover_days') && (
              <p className="text-sm text-red-600">{getFieldError('target_cover_days')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_units_per_sku">Minimum Units per SKU</Label>
            <Input
              id="min_units_per_sku"
              type="number"
              min="0"
              max="1000"
              value={rules.min_units_per_sku}
              onChange={(e) => handleInputChange('min_units_per_sku', e.target.value)}
              className={getFieldError('min_units_per_sku') ? 'border-red-300' : ''}
            />
            <p className="text-sm text-slate-600">
              Minimum quantity to ship for any SKU (0-1000)
            </p>
            {getFieldError('min_units_per_sku') && (
              <p className="text-sm text-red-600">{getFieldError('min_units_per_sku')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_units_per_sku">Maximum Units per SKU</Label>
            <Input
              id="max_units_per_sku"
              type="number"
              min="1"
              max="10000"
              value={rules.max_units_per_sku}
              onChange={(e) => handleInputChange('max_units_per_sku', e.target.value)}
              className={getFieldError('max_units_per_sku') ? 'border-red-300' : ''}
            />
            <p className="text-sm text-slate-600">
              Maximum quantity to ship for any SKU (1-10000)
            </p>
            {getFieldError('max_units_per_sku') && (
              <p className="text-sm text-red-600">{getFieldError('max_units_per_sku')}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="safety_stock_percent">Safety Stock Percentage</Label>
            <Input
              id="safety_stock_percent"
              type="number"
              min="0"
              max="100"
              value={rules.safety_stock_percent}
              onChange={(e) => handleInputChange('safety_stock_percent', e.target.value)}
              className={getFieldError('safety_stock_percent') ? 'border-red-300' : ''}
            />
            <p className="text-sm text-slate-600">
              Percentage of warehouse stock to keep as safety buffer (0-100%)
            </p>
            {getFieldError('safety_stock_percent') && (
              <p className="text-sm text-red-600">{getFieldError('safety_stock_percent')}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || errors.length > 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Rules'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}