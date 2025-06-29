// Use mock SDK to avoid ES module issues
import { Client, StdioTransport } from './mock-sdk';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { Logger } from '../core/Logger';
import { Memory } from '../core/Memory';

export interface MCPConnection {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export class ClaudeCodeMCPClient {
  private clients: Map<string, Client> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private memory: Memory;

  constructor() {
    this.memory = new Memory();
  }

  /**
   * Connect to Claude Code's MCP server
   */
  async connectToClaude(): Promise<void> {
    await this.connect({
      name: 'claude-code',
      command: 'claude-code',
      args: ['mcp', 'server'],
      env: {
        CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || ''
      }
    });
  }

  /**
   * Connect to any MCP server
   */
  async connect(connection: MCPConnection): Promise<void> {
    Logger.log('[MCP Client]', `Connecting to ${connection.name}...`);
    
    try {
      // Spawn the MCP server process
      const serverProcess = spawn(connection.command, connection.args || [], {
        env: { ...process.env, ...connection.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.processes.set(connection.name, serverProcess);

      // Create transport
      const transport = new StdioTransport(
        serverProcess.stdout!,
        serverProcess.stdin!
      );

      // Create client
      const client = new Client();
      await client.start(transport);
      
      this.clients.set(connection.name, client);
      
      Logger.success('[MCP Client]', `Connected to ${connection.name}`);
      
      // Store connection info
      this.memory.set(`mcp_connection_${connection.name}`, {
        name: connection.name,
        command: connection.command,
        connectedAt: new Date().toISOString(),
        status: 'connected'
      });
    } catch (error: any) {
      Logger.error('[MCP Client]', `Failed to connect to ${connection.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Call a tool on Claude Code
   */
  async callClaudeTool(toolName: string, args: any): Promise<any> {
    return this.callTool('claude-code', toolName, args);
  }

  /**
   * Call a tool on any connected MCP server
   */
  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const client = this.clients.get(serverName);
    
    if (!client) {
      throw new Error(`Not connected to ${serverName}`);
    }
    
    try {
      Logger.log('[MCP Client]', `Calling ${toolName} on ${serverName}`);
      
      const result = await client.request('tools/call', {
        name: toolName,
        arguments: args
      });
      
      // Store the interaction
      this.memory.set(`mcp_call_${Date.now()}`, {
        server: serverName,
        tool: toolName,
        args,
        result,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error: any) {
      Logger.error('[MCP Client]', `Tool call failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * List available tools from a server
   */
  async listTools(serverName: string = 'claude-code'): Promise<any[]> {
    const client = this.clients.get(serverName);
    
    if (!client) {
      throw new Error(`Not connected to ${serverName}`);
    }
    
    const response = await client.request('tools/list', {});
    return response.tools || [];
  }

  /**
   * List available resources from a server
   */
  async listResources(serverName: string = 'claude-code'): Promise<any[]> {
    const client = this.clients.get(serverName);
    
    if (!client) {
      throw new Error(`Not connected to ${serverName}`);
    }
    
    const response = await client.request('resources/list', {});
    return response.resources || [];
  }

  /**
   * Read a resource from a server
   */
  async readResource(serverName: string, uri: string): Promise<string> {
    const client = this.clients.get(serverName);
    
    if (!client) {
      throw new Error(`Not connected to ${serverName}`);
    }
    
    const response = await client.request('resources/read', { uri });
    return response.content;
  }

  /**
   * High-level helper: Ask Claude to analyze something using its tools
   */
  async askClaude(prompt: string, context?: any): Promise<any> {
    // First, check if Claude has relevant tools
    const tools = await this.listTools('claude-code');
    
    // Find the most appropriate tool
    let toolToUse = 'general_analysis'; // Default
    
    if (prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('implement')) {
      toolToUse = 'code_generation';
    } else if (prompt.toLowerCase().includes('debug') || prompt.toLowerCase().includes('error')) {
      toolToUse = 'debug_analysis';
    } else if (prompt.toLowerCase().includes('test')) {
      toolToUse = 'test_generation';
    }
    
    // Call Claude's tool
    return this.callClaudeTool(toolToUse, {
      prompt,
      context,
      requestFrom: 'gemini-flow'
    });
  }

  /**
   * Collaborate: Send large context to Gemini, get analysis, send to Claude for refinement
   */
  async collaborativeAnalysis(largeContent: string, task: string): Promise<any> {
    // Step 1: Use Gemini's large context window via our MCP server
    const geminiResult = await this.callTool('gemini-flow', 'analyze_large_context', {
      content: largeContent,
      query: task,
      outputFormat: 'structured'
    });
    
    // Step 2: Send Gemini's analysis to Claude for refinement
    const claudeResult = await this.askClaude(
      `Please refine and enhance this analysis:\n\n${geminiResult.result}`,
      {
        originalTask: task,
        contentSize: largeContent.length,
        source: 'gemini-1m-context'
      }
    );
    
    // Store collaboration result
    this.memory.set(`collaboration_${Date.now()}`, {
      task,
      geminiResult,
      claudeResult,
      timestamp: new Date().toISOString()
    });
    
    return {
      geminiAnalysis: geminiResult,
      claudeRefinement: claudeResult,
      collaborative: true
    };
  }

  /**
   * Disconnect from a server
   */
  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    const process = this.processes.get(serverName);
    
    if (client) {
      await client.stop();
      this.clients.delete(serverName);
    }
    
    if (process) {
      process.kill();
      this.processes.delete(serverName);
    }
    
    Logger.log('[MCP Client]', `Disconnected from ${serverName}`);
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    for (const [name] of this.clients) {
      await this.disconnect(name);
    }
  }
}

// Helper function to create a client with both connections
export async function createBridgedClient(): Promise<ClaudeCodeMCPClient> {
  const client = new ClaudeCodeMCPClient();
  
  // Connect to Claude Code
  if (process.env.CLAUDE_API_KEY) {
    try {
      await client.connectToClaude();
      Logger.success('[MCP Bridge]', 'Connected to Claude Code');
    } catch (e) {
      Logger.warn('[MCP Bridge]', 'Could not connect to Claude Code');
    }
  }
  
  // Connect to local Gemini Flow MCP server
  try {
    await client.connect({
      name: 'gemini-flow',
      command: 'node',
      args: [path.join(__dirname, 'server.js')],
      env: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
      }
    });
    Logger.success('[MCP Bridge]', 'Connected to Gemini Flow MCP Server');
  } catch (e) {
    Logger.warn('[MCP Bridge]', 'Could not connect to Gemini Flow MCP Server');
  }
  
  return client;
}