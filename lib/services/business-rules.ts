export interface BusinessRules {
  look_back_days: number;
  target_cover_days: number;
  min_units_per_sku: number;
  max_units_per_sku: number;
  safety_stock_percent: number;
}

export const DEFAULT_BUSINESS_RULES: BusinessRules = {
  look_back_days: 30,
  target_cover_days: 14,
  min_units_per_sku: 10,
  max_units_per_sku: 100,
  safety_stock_percent: 20
};

export interface ValidationError {
  field: string;
  message: string;
}

export class BusinessRulesService {
  static validateRules(rules: BusinessRules): ValidationError[] {
    const errors: ValidationError[] = [];

    if (rules.look_back_days < 1 || rules.look_back_days > 365) {
      errors.push({
        field: 'look_back_days',
        message: 'Look back days must be between 1 and 365'
      });
    }

    if (rules.target_cover_days < 1 || rules.target_cover_days > 90) {
      errors.push({
        field: 'target_cover_days',
        message: 'Target cover days must be between 1 and 90'
      });
    }

    if (rules.min_units_per_sku < 0 || rules.min_units_per_sku > 1000) {
      errors.push({
        field: 'min_units_per_sku',
        message: 'Minimum units per SKU must be between 0 and 1000'
      });
    }

    if (rules.max_units_per_sku < rules.min_units_per_sku || rules.max_units_per_sku > 10000) {
      errors.push({
        field: 'max_units_per_sku',
        message: 'Maximum units per SKU must be greater than minimum and less than 10000'
      });
    }

    if (rules.safety_stock_percent < 0 || rules.safety_stock_percent > 100) {
      errors.push({
        field: 'safety_stock_percent',
        message: 'Safety stock percentage must be between 0 and 100'
      });
    }

    return errors;
  }

  static saveRules(rules: BusinessRules): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fba_business_rules', JSON.stringify(rules));
    }
  }

  static loadRules(): BusinessRules {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fba_business_rules');
      if (saved) {
        try {
          return { ...DEFAULT_BUSINESS_RULES, ...JSON.parse(saved) };
        } catch (error) {
          console.error('Error loading business rules:', error);
        }
      }
    }
    return DEFAULT_BUSINESS_RULES;
  }
}