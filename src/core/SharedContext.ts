import * as crypto from 'crypto';
import { SmartMemory } from './SmartMemory.js';
import { AgentCommunication, MessageType, MessagePriority } from './AgentCommunication.js';

interface ContextEntry {
  id: string;
  key: string;
  value: any;
  type: 'data' | 'state' | 'knowledge' | 'goal' | 'plan';
  owner: string;
  permissions: ContextPermissions;
  version: number;
  created: string;
  modified: string;
  modifiedBy: string;
  locked: boolean;
  lockedBy?: string;
  history: ContextVersion[];
  metadata: {
    description?: string;
    tags?: string[];
    dependencies?: string[];
    ttl?: number;
  };
}

interface ContextVersion {
  version: number;
  value: any;
  modifiedBy: string;
  timestamp: string;
  changeDescription?: string;
}

interface ContextPermissions {
  read: string[]; // Agent IDs or roles
  write: string[]; // Agent IDs or roles
  delete: string[]; // Agent IDs or roles
  public: boolean;
}

interface SharedSpace {
  id: string;
  name: string;
  description: string;
  owner: string;
  members: Set<string>;
  context: Map<string, ContextEntry>;
  permissions: SpacePermissions;
  created: string;
  lastActivity: string;
  metadata: {
    purpose?: string;
    project?: string;
    tags?: string[];
  };
}

interface SpacePermissions {
  join: 'open' | 'invite' | 'request';
  defaultRead: boolean;
  defaultWrite: boolean;
  admins: string[];
}

interface Transaction {
  id: string;
  spaceId: string;
  operations: Operation[];
  status: 'pending' | 'committed' | 'rolled_back';
  initiator: string;
  timestamp: string;
}

interface Operation {
  type: 'create' | 'update' | 'delete';
  key: string;
  value?: any;
  previousValue?: any;
}

export class SharedContext {
  private spaces: Map<string, SharedSpace>;
  private transactions: Map<string, Transaction>;
  private locks: Map<string, string>; // key -> agentId
  private memory: SmartMemory;
  private communication: AgentCommunication;
  private changeListeners: Map<string, Set<(change: ContextChange) => void>>;

  constructor(memory: SmartMemory, communication: AgentCommunication) {
    this.spaces = new Map();
    this.transactions = new Map();
    this.locks = new Map();
    this.memory = memory;
    this.communication = communication;
    this.changeListeners = new Map();
    
    this.initializeDefaultSpaces();
    this.setupCommunicationHandlers();
  }

  private initializeDefaultSpaces() {
    // Create global shared space
    this.createSpace('global', 'system', {
      name: 'Global Shared Context',
      description: 'Shared context accessible to all agents',
      permissions: {
        join: 'open',
        defaultRead: true,
        defaultWrite: true,
        admins: ['system']
      }
    });
  }

  private setupCommunicationHandlers() {
    // Subscribe to context-related messages
    this.communication.subscribe(
      'context.update',
      async (message) => {
        await this.handleContextUpdate(message);
      }
    );
    
    this.communication.subscribe(
      'context.request',
      async (message) => {
        await this.handleContextRequest(message);
      }
    );
  }

  // Create a new shared space
  createSpace(
    id: string,
    owner: string,
    options: {
      name: string;
      description: string;
      permissions?: Partial<SpacePermissions>;
      metadata?: SharedSpace['metadata'];
    }
  ): SharedSpace {
    if (this.spaces.has(id)) {
      throw new Error(`Space ${id} already exists`);
    }
    
    const space: SharedSpace = {
      id,
      name: options.name,
      description: options.description,
      owner,
      members: new Set([owner]),
      context: new Map(),
      permissions: {
        join: 'invite',
        defaultRead: false,
        defaultWrite: false,
        admins: [owner],
        ...options.permissions
      },
      created: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      metadata: options.metadata || {}
    };
    
    this.spaces.set(id, space);
    
    // Store in memory for persistence
    this.memory.setWithContext(
      `shared_space_${id}`,
      space,
      [`Shared context space: ${space.name}`]
    );
    
    // Notify about new space
    this.communication.broadcast({
      type: MessageType.EVENT,
      senderId: 'shared-context',
      content: {
        event: 'space_created',
        spaceId: id,
        space: {
          id: space.id,
          name: space.name,
          description: space.description
        }
      },
      priority: MessagePriority.NORMAL
    });
    
    return space;
  }

  // Join a shared space
  joinSpace(spaceId: string, agentId: string): void {
    const space = this.spaces.get(spaceId);
    if (!space) {
      throw new Error(`Space ${spaceId} not found`);
    }
    
    // Check permissions
    if (space.permissions.join === 'invite' && !space.members.has(agentId)) {
      throw new Error(`Agent ${agentId} not invited to space ${spaceId}`);
    }
    
    space.members.add(agentId);
    space.lastActivity = new Date().toISOString();
    
    // Notify members
    this.notifySpaceMembers(spaceId, {
      event: 'member_joined',
      agentId,
      timestamp: new Date().toISOString()
    });
  }

  // Leave a shared space
  leaveSpace(spaceId: string, agentId: string): void {
    const space = this.spaces.get(spaceId);
    if (!space) return;
    
    space.members.delete(agentId);
    
    // Remove agent from admins if present
    space.permissions.admins = space.permissions.admins.filter(id => id !== agentId);
    
    // Notify members
    this.notifySpaceMembers(spaceId, {
      event: 'member_left',
      agentId,
      timestamp: new Date().toISOString()
    });
  }

  // Set context value with versioning and permissions
  async set(
    spaceId: string,
    key: string,
    value: any,
    agentId: string,
    options: {
      type?: ContextEntry['type'];
      permissions?: Partial<ContextPermissions>;
      metadata?: ContextEntry['metadata'];
      description?: string;
    } = {}
  ): Promise<void> {
    const space = this.getSpaceOrThrow(spaceId);
    
    // Check write permissions
    if (!this.hasWritePermission(space, key, agentId)) {
      throw new Error(`Agent ${agentId} does not have write permission`);
    }
    
    // Check if locked
    const lockOwner = this.locks.get(`${spaceId}:${key}`);
    if (lockOwner && lockOwner !== agentId) {
      throw new Error(`Key ${key} is locked by ${lockOwner}`);
    }
    
    const existing = space.context.get(key);
    
    if (existing) {
      // Update existing entry
      const previousVersion: ContextVersion = {
        version: existing.version,
        value: existing.value,
        modifiedBy: existing.modifiedBy,
        timestamp: existing.modified,
        changeDescription: options.description
      };
      
      existing.value = value;
      existing.version++;
      existing.modified = new Date().toISOString();
      existing.modifiedBy = agentId;
      existing.history.push(previousVersion);
      
      // Keep only last 10 versions
      if (existing.history.length > 10) {
        existing.history = existing.history.slice(-10);
      }
    } else {
      // Create new entry
      const entry: ContextEntry = {
        id: crypto.randomUUID(),
        key,
        value,
        type: options.type || 'data',
        owner: agentId,
        permissions: {
          read: [agentId],
          write: [agentId],
          delete: [agentId],
          public: space.permissions.defaultRead,
          ...options.permissions
        },
        version: 1,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        modifiedBy: agentId,
        locked: false,
        history: [],
        metadata: options.metadata || {}
      };
      
      space.context.set(key, entry);
    }
    
    space.lastActivity = new Date().toISOString();
    
    // Store in smart memory for semantic search
    await this.memory.setWithContext(
      `context_${spaceId}_${key}`,
      value,
      {
        namespace: `shared-context-${spaceId}`,
        type: options.type,
        owner: agentId,
        tags: [
          `Shared context in space ${space.name}`,
          `Set by agent ${agentId}`,
          ...(options.metadata?.tags || [])
        ]
      }
    );
    
    // Notify listeners
    this.notifyChange(spaceId, {
      type: existing ? 'update' : 'create',
      key,
      value,
      agentId,
      version: existing ? existing.version : 1
    });
  }

  // Get context value
  get(spaceId: string, key: string, agentId: string): any {
    const space = this.getSpaceOrThrow(spaceId);
    const entry = space.context.get(key);
    
    if (!entry) return undefined;
    
    // Check read permissions
    if (!this.hasReadPermission(space, entry, agentId)) {
      throw new Error(`Agent ${agentId} does not have read permission`);
    }
    
    return entry.value;
  }

  // Get all context for a space
  getAll(spaceId: string, agentId: string): Record<string, any> {
    const space = this.getSpaceOrThrow(spaceId);
    const result: Record<string, any> = {};
    
    space.context.forEach((entry, key) => {
      if (this.hasReadPermission(space, entry, agentId)) {
        result[key] = entry.value;
      }
    });
    
    return result;
  }

  // Query context with semantic search
  async query(
    spaceId: string,
    query: string,
    agentId: string,
    options: {
      limit?: number;
      type?: ContextEntry['type'];
    } = {}
  ): Promise<Array<{ key: string; value: any; score: number }>> {
    const space = this.getSpaceOrThrow(spaceId);
    
    // Use smart memory for semantic search
    const results = await this.memory.semanticSearch(query, options.limit || 10);
    
    // Filter by permissions and type
    const filtered = results
      .map(result => {
        const key = result.key.replace(`context_${spaceId}_`, '');
        const entry = space.context.get(key);
        
        if (!entry || !this.hasReadPermission(space, entry, agentId)) {
          return null;
        }
        
        if (options.type && entry.type !== options.type) {
          return null;
        }
        
        return {
          key,
          value: entry.value,
          score: result.score
        };
      })
      .filter(Boolean) as Array<{ key: string; value: any; score: number }>;
    
    return filtered;
  }

  // Lock a key for exclusive access
  async lock(spaceId: string, key: string, agentId: string, ttl: number = 30000): Promise<void> {
    const lockKey = `${spaceId}:${key}`;
    const currentLock = this.locks.get(lockKey);
    
    if (currentLock && currentLock !== agentId) {
      throw new Error(`Key ${key} is already locked by ${currentLock}`);
    }
    
    this.locks.set(lockKey, agentId);
    
    // Auto-release after TTL
    setTimeout(() => {
      if (this.locks.get(lockKey) === agentId) {
        this.unlock(spaceId, key, agentId);
      }
    }, ttl);
    
    // Notify about lock
    this.notifySpaceMembers(spaceId, {
      event: 'key_locked',
      key,
      agentId,
      ttl
    });
  }

  // Unlock a key
  unlock(spaceId: string, key: string, agentId: string): void {
    const lockKey = `${spaceId}:${key}`;
    const currentLock = this.locks.get(lockKey);
    
    if (currentLock === agentId) {
      this.locks.delete(lockKey);
      
      // Update entry
      const space = this.spaces.get(spaceId);
      if (space) {
        const entry = space.context.get(key);
        if (entry) {
          entry.locked = false;
          entry.lockedBy = undefined;
        }
      }
      
      // Notify about unlock
      this.notifySpaceMembers(spaceId, {
        event: 'key_unlocked',
        key,
        agentId
      });
    }
  }

  // Begin a transaction
  beginTransaction(spaceId: string, agentId: string): string {
    const transactionId = crypto.randomUUID();
    
    const transaction: Transaction = {
      id: transactionId,
      spaceId,
      operations: [],
      status: 'pending',
      initiator: agentId,
      timestamp: new Date().toISOString()
    };
    
    this.transactions.set(transactionId, transaction);
    return transactionId;
  }

  // Add operation to transaction
  addOperation(
    transactionId: string,
    operation: Operation
  ): void {
    const transaction = this.transactions.get(transactionId);
    if (!transaction || transaction.status !== 'pending') {
      throw new Error(`Invalid transaction ${transactionId}`);
    }
    
    transaction.operations.push(operation);
  }

  // Commit transaction
  async commitTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction || transaction.status !== 'pending') {
      throw new Error(`Invalid transaction ${transactionId}`);
    }
    
    const space = this.getSpaceOrThrow(transaction.spaceId);
    
    try {
      // Apply all operations
      for (const op of transaction.operations) {
        switch (op.type) {
          case 'create':
          case 'update':
            await this.set(
              transaction.spaceId,
              op.key,
              op.value,
              transaction.initiator
            );
            break;
          case 'delete':
            await this.delete(
              transaction.spaceId,
              op.key,
              transaction.initiator
            );
            break;
        }
      }
      
      transaction.status = 'committed';
    } catch (error) {
      // Rollback on error
      await this.rollbackTransaction(transactionId);
      throw error;
    }
  }

  // Rollback transaction
  async rollbackTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;
    
    // Reverse operations
    for (const op of transaction.operations.reverse()) {
      if (op.previousValue !== undefined) {
        await this.set(
          transaction.spaceId,
          op.key,
          op.previousValue,
          transaction.initiator
        );
      }
    }
    
    transaction.status = 'rolled_back';
  }

  // Delete context entry
  async delete(spaceId: string, key: string, agentId: string): Promise<void> {
    const space = this.getSpaceOrThrow(spaceId);
    const entry = space.context.get(key);
    
    if (!entry) return;
    
    // Check delete permissions
    if (!entry.permissions.delete.includes(agentId) && 
        !space.permissions.admins.includes(agentId)) {
      throw new Error(`Agent ${agentId} does not have delete permission`);
    }
    
    space.context.delete(key);
    space.lastActivity = new Date().toISOString();
    
    // Remove from smart memory
    await this.memory.set(`context_${spaceId}_${key}`, null);
    
    // Notify about deletion
    this.notifyChange(spaceId, {
      type: 'delete',
      key,
      agentId
    });
  }

  // Watch for changes
  watch(
    spaceId: string,
    listener: (change: ContextChange) => void
  ): () => void {
    if (!this.changeListeners.has(spaceId)) {
      this.changeListeners.set(spaceId, new Set());
    }
    
    this.changeListeners.get(spaceId)!.add(listener);
    
    // Return unwatch function
    return () => {
      const listeners = this.changeListeners.get(spaceId);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  // Get space statistics
  getSpaceStats(spaceId: string): any {
    const space = this.getSpaceOrThrow(spaceId);
    
    const stats = {
      id: space.id,
      name: space.name,
      memberCount: space.members.size,
      contextEntries: space.context.size,
      totalSize: 0,
      typeDistribution: new Map<string, number>(),
      activityLevel: this.calculateActivityLevel(space),
      lastActivity: space.lastActivity
    };
    
    space.context.forEach(entry => {
      stats.totalSize += JSON.stringify(entry.value).length;
      const count = stats.typeDistribution.get(entry.type) || 0;
      stats.typeDistribution.set(entry.type, count + 1);
    });
    
    return stats;
  }

  // Private helper methods
  private getSpaceOrThrow(spaceId: string): SharedSpace {
    const space = this.spaces.get(spaceId);
    if (!space) {
      throw new Error(`Space ${spaceId} not found`);
    }
    return space;
  }

  private hasReadPermission(
    space: SharedSpace,
    entry: ContextEntry,
    agentId: string
  ): boolean {
    return (
      entry.permissions.public ||
      entry.permissions.read.includes(agentId) ||
      entry.owner === agentId ||
      space.permissions.admins.includes(agentId) ||
      (space.permissions.defaultRead && space.members.has(agentId))
    );
  }

  private hasWritePermission(
    space: SharedSpace,
    key: string,
    agentId: string
  ): boolean {
    const entry = space.context.get(key);
    
    if (!entry) {
      // New entry - check space permissions
      return (
        space.permissions.admins.includes(agentId) ||
        (space.permissions.defaultWrite && space.members.has(agentId))
      );
    }
    
    return (
      entry.permissions.write.includes(agentId) ||
      entry.owner === agentId ||
      space.permissions.admins.includes(agentId)
    );
  }

  private notifySpaceMembers(spaceId: string, event: any): void {
    const space = this.spaces.get(spaceId);
    if (!space) return;
    
    space.members.forEach(memberId => {
      this.communication.send({
        type: MessageType.NOTIFICATION,
        senderId: 'shared-context',
        recipientId: memberId,
        topic: `space.${spaceId}`,
        content: event,
        priority: MessagePriority.NORMAL
      });
    });
  }

  private notifyChange(spaceId: string, change: ContextChange): void {
    const listeners = this.changeListeners.get(spaceId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(change);
        } catch (error) {
          console.error('Error in change listener:', error);
        }
      });
    }
    
    // Also notify via communication system
    this.communication.broadcast({
      type: MessageType.EVENT,
      senderId: 'shared-context',
      topic: `context.change.${spaceId}`,
      content: change,
      priority: MessagePriority.NORMAL
    });
  }

  private calculateActivityLevel(space: SharedSpace): 'high' | 'medium' | 'low' {
    const lastActivity = new Date(space.lastActivity);
    const now = new Date();
    const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceActivity < 1) return 'high';
    if (hoursSinceActivity < 24) return 'medium';
    return 'low';
  }

  private async handleContextUpdate(message: any): Promise<void> {
    // Handle context update requests from other systems
    const { spaceId, key, value, agentId } = message.content;
    
    try {
      await this.set(spaceId, key, value, agentId);
      
      await this.communication.respond(message, {
        success: true,
        key,
        version: this.spaces.get(spaceId)?.context.get(key)?.version
      });
    } catch (error: any) {
      await this.communication.respond(message, {
        success: false,
        error: error.message
      });
    }
  }

  private async handleContextRequest(message: any): Promise<void> {
    // Handle context retrieval requests
    const { spaceId, key, agentId } = message.content;
    
    try {
      const value = this.get(spaceId, key, agentId);
      
      await this.communication.respond(message, {
        success: true,
        key,
        value
      });
    } catch (error: any) {
      await this.communication.respond(message, {
        success: false,
        error: error.message
      });
    }
  }
}

interface ContextChange {
  type: 'create' | 'update' | 'delete';
  key: string;
  value?: any;
  agentId: string;
  version?: number;
}