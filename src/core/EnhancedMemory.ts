// Enhanced memory system with semantic search, analytics, and optimization
import { Memory } from './Memory';
import { SmartMemory } from './SmartMemory';
import { AgentCommunication } from './AgentCommunication';

export interface Analytics {
  memoryUsage: number;
  entryCount: number;
  namespaceDistribution: Record<string, number>;
  accessPatterns: Record<string, number>;
  performanceMetrics: {
    averageReadTime: number;
    averageWriteTime: number;
    cacheHitRate: number;
  };
}

export class EnhancedMemory extends Memory {
  private smartMemory: SmartMemory;
  private agentComm: AgentCommunication;
  private sharedContext: Map<string, any>;
  private analytics: Analytics;
  private optimizationInterval?: NodeJS.Timeout;
  
  constructor() {
    super();
    this.smartMemory = new SmartMemory();
    this.agentComm = new AgentCommunication();
    this.sharedContext = new Map();
    this.analytics = {
      memoryUsage: 0,
      entryCount: 0,
      namespaceDistribution: {},
      accessPatterns: {},
      performanceMetrics: {
        averageReadTime: 0,
        averageWriteTime: 0,
        cacheHitRate: 0
      }
    };
  }
  
  getAgentCommunication(): AgentCommunication {
    return this.agentComm;
  }
  
  getSharedContext(): Map<string, any> {
    return this.sharedContext;
  }
  
  async semanticSearch(query: string, limit: number = 10): Promise<any[]> {
    return this.smartMemory.search(query, limit);
  }
  
  getComprehensiveAnalytics(): Analytics {
    const allData = this.getAll();
    const entries = Object.entries(allData);
    
    // Update analytics
    this.analytics.entryCount = entries.length;
    this.analytics.memoryUsage = JSON.stringify(allData).length;
    
    // Calculate namespace distribution
    this.analytics.namespaceDistribution = {};
    entries.forEach(([key]) => {
      const namespace = key.split('_')[0];
      this.analytics.namespaceDistribution[namespace] = 
        (this.analytics.namespaceDistribution[namespace] || 0) + 1;
    });
    
    return this.analytics;
  }
  
  suggest(context: string): string[] {
    // Simple suggestion system based on context
    const allKeys = Object.keys(this.getAll());
    return allKeys
      .filter(key => key.toLowerCase().includes(context.toLowerCase()))
      .slice(0, 5);
  }
  
  stopOptimization(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = undefined;
    }
  }
  
  startOptimization(intervalMs: number = 60000): void {
    this.optimizationInterval = setInterval(() => {
      // Cleanup old entries
      const allData = this.getAll();
      const now = Date.now();
      Object.entries(allData).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'timestamp' in value) {
          const timestamp = (value as any).timestamp;
          const age = now - new Date(timestamp).getTime();
          if (age > 24 * 60 * 60 * 1000) { // Remove entries older than 24 hours
            this.delete(key);
          }
        }
      });
    }, intervalMs);
  }
}