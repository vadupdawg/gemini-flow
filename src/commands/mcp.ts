import { Command } from 'commander';
import { ui } from '../core/UI';
import { Logger } from '../core/Logger';
import { GeminiMCPServer } from '../mcp/server';
import { ClaudeCodeMCPClient, createBridgedClient } from '../mcp/client';
import { Memory } from '../core/Memory';
import * as fs from 'fs';
import * as path from 'path';

export function createMCPCommand(): Command {
  const mcp = new Command('mcp')
    .description('Model Context Protocol integration with Claude Code');

  // Start MCP server
  mcp
    .command('start')
    .description('Start Gemini Flow MCP server to expose 1M context window')
    .option('--port <port>', 'Port number', '3001')
    .option('--host <host>', 'Host address', 'localhost')
    .action(async (options) => {
      ui.header('Starting MCP Server', 'Exposing Gemini\'s 1M token context to Claude');
      
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      
      if (!apiKey) {
        ui.error('No API key found. Set GEMINI_API_KEY or GOOGLE_API_KEY');
        return;
      }
      
      ui.agentStart('mcp-server', 'Initializing MCP server...');
      
      try {
        const server = new GeminiMCPServer({ apiKey });
        await server.start();
        
        ui.agentSuccess('mcp-server', 'MCP server started successfully');
        ui.info('Claude Code can now connect to gemini-flow MCP server');
        ui.section('Available Tools');
        ui.log('• analyze_large_context - Process up to 1M tokens');
        ui.log('• process_codebase - Analyze entire codebases');
        ui.log('• autonomous_execute - Run complex tasks autonomously');
        ui.log('• semantic_memory_search - Search Gemini Flow memory');
        ui.log('• store_in_memory - Store data persistently');
        
        // Keep server running
        process.on('SIGINT', () => {
          ui.info('Shutting down MCP server...');
          process.exit(0);
        });
      } catch (error: any) {
        ui.agentError('mcp-server', `Failed to start: ${error.message}`);
      }
    });

  // Connect to Claude Code
  mcp
    .command('connect')
    .description('Connect to Claude Code via MCP')
    .action(async () => {
      ui.header('MCP Bridge', 'Connecting Gemini Flow to Claude Code');
      
      const spinner = ui.agentStart('bridge', 'Establishing connections...');
      
      try {
        const client = await createBridgedClient();
        
        ui.agentSuccess('bridge', 'Successfully connected to Claude Code');
        
        // List available tools from Claude
        const claudeTools = await client.listTools('claude-code');
        ui.section('Claude Code Tools');
        claudeTools.forEach(tool => {
          ui.log(`• ${tool.name} - ${tool.description}`);
        });
        
        // Store connection
        const memory = new Memory();
        memory.set('mcp_bridge_active', {
          status: 'connected',
          timestamp: new Date().toISOString(),
          claudeTools: claudeTools.length
        });
        
        ui.success('Bridge established! Use "gemini-flow mcp collaborate" to start');
        
        await client.disconnectAll();
      } catch (error: any) {
        ui.agentError('bridge', `Connection failed: ${error.message}`);
      }
    });

  // Collaborate command
  mcp
    .command('collaborate')
    .description('Collaborate between Gemini and Claude on a task')
    .argument('<task>', 'Task description')
    .option('--file <path>', 'File to analyze')
    .option('--directory <path>', 'Directory to analyze')
    .action(async (task, options) => {
      ui.header('AI Collaboration', 'Gemini + Claude working together');
      
      try {
        const client = await createBridgedClient();
        
        let content = '';
        
        // Load content based on options
        if (options.file) {
          ui.info(`Loading file: ${options.file}`);
          content = fs.readFileSync(options.file, 'utf-8');
        } else if (options.directory) {
          ui.info(`Loading directory: ${options.directory}`);
          content = await loadDirectory(options.directory);
        } else {
          ui.error('Please provide --file or --directory');
          return;
        }
        
        ui.agentStart('gemini', `Analyzing with 1M context window (${Math.round(content.length / 1024)}KB)...`);
        
        // Collaborative analysis
        const result = await client.collaborativeAnalysis(content, task);
        
        ui.agentSuccess('gemini', 'Analysis complete');
        ui.agentSuccess('claude', 'Refinement complete');
        
        ui.section('Gemini Analysis (using full context)');
        ui.log(result.geminiAnalysis.result);
        
        ui.section('Claude Refinement');
        ui.log(result.claudeRefinement);
        
        // Save results
        const outputPath = `collaboration_${Date.now()}.json`;
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        ui.success(`Results saved to ${outputPath}`);
        
        await client.disconnectAll();
      } catch (error: any) {
        ui.error(`Collaboration failed: ${error.message}`);
      }
    });

  // Bridge status
  mcp
    .command('status')
    .description('Show MCP bridge status')
    .action(async () => {
      const memory = new Memory();
      const bridgeStatus = memory.get('mcp_bridge_active');
      const connections = Object.keys(memory.getAll())
        .filter(k => k.startsWith('mcp_connection_'));
      
      ui.header('MCP Bridge Status', new Date().toLocaleString());
      
      if (bridgeStatus) {
        ui.section('Bridge Status');
        ui.log(`Status: ${bridgeStatus.status}`);
        ui.log(`Connected at: ${bridgeStatus.timestamp}`);
        ui.log(`Claude tools available: ${bridgeStatus.claudeTools || 0}`);
      } else {
        ui.warning('No active bridge connection');
      }
      
      if (connections.length > 0) {
        ui.section('Recent Connections');
        connections.forEach(key => {
          const conn = memory.get(key);
          ui.log(`• ${conn.name} - ${conn.status} (${conn.connectedAt})`);
        });
      }
    });

  // Call Claude tool directly
  mcp
    .command('call-claude')
    .description('Call a specific Claude Code tool')
    .argument('<tool>', 'Tool name')
    .argument('<args>', 'JSON arguments')
    .action(async (tool, argsStr) => {
      try {
        const args = JSON.parse(argsStr);
        const client = await createBridgedClient();
        
        ui.agentStart('claude', `Calling tool: ${tool}`);
        const result = await client.callClaudeTool(tool, args);
        
        ui.agentSuccess('claude', 'Tool executed successfully');
        ui.section('Result');
        console.log(JSON.stringify(result, null, 2));
        
        await client.disconnectAll();
      } catch (error: any) {
        ui.error(`Tool call failed: ${error.message}`);
      }
    });

  return mcp;
}

// Helper to load directory content
async function loadDirectory(dirPath: string): Promise<string> {
  const files: string[] = [];
  
  const readDir = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        readDir(fullPath);
      } else if (entry.isFile() && !entry.name.startsWith('.')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          files.push(`\n=== ${fullPath} ===\n${content}`);
        } catch (e) {
          // Skip binary files
        }
      }
    }
  };
  
  readDir(dirPath);
  return files.join('\n\n');
}