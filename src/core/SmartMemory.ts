import { Memory } from './Memory';

export interface SearchResult {
  key: string;
  value: any;
  score: number;
}

export interface MemoryStats {
  totalEntries: number;
  totalSize: number;
  namespaces: string[];
}

export class SmartMemory extends Memory {
  constructor() {
    super();
  }

  async semanticSearch(query: string, limit: number = 10): Promise<SearchResult[]> {
    // Simple implementation - search by substring match
    const allData = this.getAll();
    const results: SearchResult[] = [];
    
    Object.entries(allData).forEach(([key, value]) => {
      const valueStr = JSON.stringify(value).toLowerCase();
      if (valueStr.includes(query.toLowerCase())) {
        results.push({
          key,
          value,
          score: 1.0
        });
      }
    });
    
    return results.slice(0, limit);
  }
  
  // Alias for semanticSearch
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    return this.semanticSearch(query, limit);
  }
  
  // Set with additional context metadata
  setWithContext(key: string, value: any, context?: any): void {
    const enrichedValue = {
      ...value,
      _context: context,
      _timestamp: new Date().toISOString()
    };
    this.set(key, enrichedValue);
  }

  getStats(): MemoryStats {
    const allData = this.getAll();
    const namespaces = new Set<string>();
    
    Object.keys(allData).forEach(key => {
      const namespace = key.split('_')[0];
      namespaces.add(namespace);
    });
    
    return {
      totalEntries: Object.keys(allData).length,
      totalSize: JSON.stringify(allData).length,
      namespaces: Array.from(namespaces)
    };
  }
}