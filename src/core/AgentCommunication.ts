// Enhanced agent communication system with pub/sub, message types, and priorities
export enum MessageType {
  Task = 'task',
  Result = 'result',
  Error = 'error',
  Info = 'info',
  Query = 'query',
  Response = 'response',
  Broadcast = 'broadcast',
  Event = 'event',
  Notification = 'notification',
  Request = 'request',
  EVENT = 'event', // Alias
  NOTIFICATION = 'notification', // Alias
  REQUEST = 'request' // Alias
}

export enum MessagePriority {
  Critical = 1,
  High = 2,
  Medium = 3,
  Low = 4,
  CRITICAL = 1, // Alias
  HIGH = 2, // Alias
  NORMAL = 3, // Alias
  LOW = 4 // Alias
}

export interface Message {
  id: string;
  type: MessageType;
  priority: MessagePriority;
  sender: string;
  recipient?: string;
  channel: string;
  content: any;
  timestamp: Date;
  correlationId?: string;
}

export class AgentCommunication {
  private channels: Map<string, Set<(message: Message) => void>> = new Map();
  private messageQueue: Message[] = [];
  private registeredAgents: Set<string> = new Set();
  
  constructor() {}
  
  async send(message: any): Promise<void> {
    await this.publish('default', message);
  }
  
  async publish(channel: string, message: any): Promise<void> {
    const fullMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      type: message.type || MessageType.Info,
      priority: message.priority || MessagePriority.Medium,
      sender: message.sender || 'system',
      channel,
      content: message.content || message,
      timestamp: new Date()
    };
    
    this.messageQueue.push(fullMessage);
    const subscribers = this.channels.get(channel);
    if (subscribers) {
      subscribers.forEach(callback => callback(fullMessage));
    }
  }
  
  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(callback);
  }
  
  async broadcast(message: any): Promise<void> {
    const channels = Array.from(this.channels.keys());
    for (const channel of channels) {
      await this.publish(channel, { ...message, type: MessageType.Broadcast });
    }
  }
  
  async respond(originalMessage: Message, response: any): Promise<void> {
    await this.publish(originalMessage.channel, {
      type: MessageType.Response,
      content: response,
      correlationId: originalMessage.id,
      recipient: originalMessage.sender
    });
  }
  
  registerAgent(agentId: string): void {
    this.registeredAgents.add(agentId);
  }
  
  unregisterAgent(agentId: string): void {
    this.registeredAgents.delete(agentId);
  }
  
  unsubscribe(channel: string, callback: (message: any) => void): void {
    const subscribers = this.channels.get(channel);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }
}