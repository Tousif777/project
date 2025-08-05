import { BusinessRules } from './business-rules';

export interface ShipmentTemplate {
  id: string;
  name: string;
  description?: string;
  businessRules: BusinessRules;
  excelColumns: string[];
  createdAt: string;
  updatedAt: string;
}

export class TemplateManagerService {
  private static readonly STORAGE_KEY = 'fba_shipment_templates';

  static saveTemplate(template: Omit<ShipmentTemplate, 'id' | 'createdAt' | 'updatedAt'>): ShipmentTemplate {
    const templates = this.loadTemplates();
    
    const newTemplate: ShipmentTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    templates.push(newTemplate);
    this.saveTemplates(templates);
    
    return newTemplate;
  }

  static loadTemplates(): ShipmentTemplate[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  }

  static getTemplate(id: string): ShipmentTemplate | null {
    const templates = this.loadTemplates();
    return templates.find(t => t.id === id) || null;
  }

  static updateTemplate(id: string, updates: Partial<ShipmentTemplate>): boolean {
    const templates = this.loadTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) return false;
    
    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveTemplates(templates);
    return true;
  }

  static deleteTemplate(id: string): boolean {
    const templates = this.loadTemplates();
    const filtered = templates.filter(t => t.id !== id);
    
    if (filtered.length === templates.length) return false;
    
    this.saveTemplates(filtered);
    return true;
  }

  private static saveTemplates(templates: ShipmentTemplate[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static createDefaultTemplate(businessRules: BusinessRules, excelColumns: string[]): ShipmentTemplate {
    return this.saveTemplate({
      name: 'Default Template',
      description: 'Auto-generated default template',
      businessRules,
      excelColumns
    });
  }
}