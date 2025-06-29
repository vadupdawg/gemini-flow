
import * as fs from 'fs';
import * as path from 'path';

interface MemoryEntry {
  key: string;
  value: any;
  timestamp: string;
  metadata?: {
    type?: string;
    owner?: string;
    description?: string;
  };
}

export class Memory {
  protected memoryDir: string;
  private dataPath: string;

  constructor() {
    this.memoryDir = path.join(process.cwd(), 'memory');
    this.dataPath = path.join(this.memoryDir, 'data', 'entries.json');

    // Ensure memory directory structure exists
    this.ensureDirectoryStructure();
  }

  private ensureDirectoryStructure() {
    const dirs = [
      this.memoryDir,
      path.join(this.memoryDir, 'data'),
      path.join(this.memoryDir, 'index'),
      path.join(this.memoryDir, 'archive'),
      path.join(this.memoryDir, 'backups')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    if (!fs.existsSync(this.dataPath)) {
      fs.writeFileSync(this.dataPath, JSON.stringify([]));
    }
  }

  set(key: string, value: any, metadata?: MemoryEntry['metadata']) {
    const entries = this.getAllEntries();
    
    // Remove existing entry with same key if exists
    const filteredEntries = entries.filter(entry => entry.key !== key);
    
    // Add new entry
    const newEntry: MemoryEntry = {
      key,
      value,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    filteredEntries.push(newEntry);
    
    // Save to disk
    fs.writeFileSync(this.dataPath, JSON.stringify(filteredEntries, null, 2));
    
    // Create backup
    this.createBackup();
  }

  get(key: string): any {
    const entries = this.getAllEntries();
    const entry = entries.find(e => e.key === key);
    return entry ? entry.value : undefined;
  }

  delete(key: string): void {
    const entries = this.getAllEntries();
    const filteredEntries = entries.filter(e => e.key !== key);
    fs.writeFileSync(this.dataPath, JSON.stringify(filteredEntries, null, 2));
  }

  getAll(): any {
    const entries = this.getAllEntries();
    const result: Record<string, any> = {};
    
    entries.forEach(entry => {
      result[entry.key] = entry.value;
    });
    
    return result;
  }

  private getAllEntries(): MemoryEntry[] {
    try {
      const content = fs.readFileSync(this.dataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return [];
    }
  }

  private createBackup() {
    const backupDir = path.join(this.memoryDir, 'backups');
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
    
    const entries = this.getAllEntries();
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      entries,
      statistics: this.generateStatistics(entries)
    };
    
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    // Keep only last 10 backups
    this.cleanupOldBackups();
  }

  private generateStatistics(entries: MemoryEntry[]) {
    return {
      overview: {
        totalEntries: entries.length,
        totalSize: JSON.stringify(entries).length,
        compressedEntries: 0,
        compressionRatio: 0,
        indexSize: 0,
        memoryUsage: process.memoryUsage().heapUsed,
        diskUsage: 0
      },
      distribution: {
        byNamespace: {},
        byType: {},
        byOwner: {},
        byAccessLevel: {}
      },
      temporal: {
        entriesCreatedLast24h: 0,
        entriesUpdatedLast24h: 0,
        entriesAccessedLast24h: 0
      },
      performance: {
        averageQueryTime: 0,
        averageWriteTime: 0,
        cacheHitRatio: 0,
        indexEfficiency: 0.95
      },
      health: {
        expiredEntries: 0,
        orphanedReferences: 0,
        duplicateKeys: 0,
        corruptedEntries: 0,
        recommendedCleanup: false
      },
      optimization: {
        suggestions: [],
        potentialSavings: {
          compression: 0,
          cleanup: 0,
          deduplication: 0
        },
        indexOptimization: [
          "Consider periodic index rebuilding for optimal performance"
        ]
      }
    };
  }

  private cleanupOldBackups() {
    const backupDir = path.join(this.memoryDir, 'backups');
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-'))
      .sort()
      .reverse();
    
    // Keep only the last 10 backups
    if (files.length > 10) {
      files.slice(10).forEach(file => {
        fs.unlinkSync(path.join(backupDir, file));
      });
    }
  }
  
  // Export memory state
  async exportMemory(filePath: string) {
    const entries = this.getAllEntries();
    const smartEntries: any[] = []; // Empty for now, can be implemented later
    const indexStats = { // Basic stats for now
      totalIndexed: entries.length,
      lastUpdated: new Date().toISOString()
    };
    
    const exportData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      entries,
      smartEntries,
      indexStats,
      metadata: {
        totalEntries: entries.length,
        totalSize: JSON.stringify(entries).length,
        exportedBy: 'enhanced-memory-system'
      }
    };
    
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
  }
  
  // Import memory state
  async importMemory(filePath: string) {
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    if (importData.version !== '2.0') {
      throw new Error('Incompatible memory export version');
    }
    
    // Import entries
    for (const entry of importData.entries) {
      await this.set(entry.key, entry.value, entry.metadata);
    }
    
    console.log(`Imported ${importData.entries.length} memory entries`);
  }
}
