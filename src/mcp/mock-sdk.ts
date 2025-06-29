// Mock MCP SDK implementation for Gemini Flow
// This avoids ES module import issues

import { Readable, Writable } from 'stream';
import { EventEmitter } from 'events';

export class StdioTransport {
  constructor(
    private stdout?: Readable,
    private stdin?: Writable
  ) {}
  
  send(message: any): void {
    if (this.stdin) {
      this.stdin.write(JSON.stringify(message) + '\n');
    }
  }
  
  onMessage(handler: (message: any) => void): void {
    if (this.stdout) {
      this.stdout.on('data', (data) => {
        try {
          const message = JSON.parse(data.toString());
          handler(message);
        } catch (e) {
          // Ignore invalid JSON
        }
      });
    }
  }
}

export class Server extends EventEmitter {
  private handlers: Map<string, (request: any) => Promise<any>> = new Map();
  
  constructor(private config: {
    name: string;
    description: string;
    version: string;
  }) {
    super();
  }
  
  setRequestHandler(method: string, handler: (request: any) => Promise<any>): void {
    this.handlers.set(method, handler);
  }
  
  async start(transport: StdioTransport): Promise<void> {
    // Listen for incoming requests
    transport.onMessage(async (message) => {
      const { id, method, params } = message;
      
      const handler = this.handlers.get(method);
      if (handler) {
        try {
          const result = await handler({ method, params, ...params });
          transport.send({
            jsonrpc: '2.0',
            id,
            result
          });
        } catch (error: any) {
          transport.send({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32000,
              message: error.message
            }
          });
        }
      } else {
        transport.send({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        });
      }
    });
    
    // Send initialization
    transport.send({
      jsonrpc: '2.0',
      method: 'initialized',
      params: this.config
    });
  }
}

export class Client extends EventEmitter {
  private transport?: StdioTransport;
  private requestId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();
  
  async start(transport: StdioTransport): Promise<void> {
    this.transport = transport;
    
    transport.onMessage((message) => {
      const { id, result, error } = message;
      
      const pending = this.pendingRequests.get(id);
      if (pending) {
        if (error) {
          pending.reject(new Error(error.message));
        } else {
          pending.resolve(result);
        }
        this.pendingRequests.delete(id);
      }
    });
  }
  
  async request(method: string, params: any): Promise<any> {
    if (!this.transport) {
      throw new Error('Client not started');
    }
    
    const id = ++this.requestId;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      this.transport!.send({
        jsonrpc: '2.0',
        id,
        method,
        params
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }
  
  async stop(): Promise<void> {
    // Clean up
    this.pendingRequests.clear();
  }
}