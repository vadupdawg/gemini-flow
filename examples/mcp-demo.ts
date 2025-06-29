#!/usr/bin/env node

/**
 * MCP Integration Demo
 * 
 * This example demonstrates how to use Gemini Flow's MCP integration
 * to collaborate with Claude Code for analyzing large contexts.
 */

import { ClaudeCodeMCPClient, createBridgedClient } from '../src/mcp/client';
import { GeminiMCPServer } from '../src/mcp/server';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🌉 MCP Bridge Demo: Gemini + Claude Collaboration\n');

  // Step 1: Start Gemini MCP Server (in production, this runs separately)
  console.log('1️⃣ Starting Gemini Flow MCP Server...');
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Please set GEMINI_API_KEY environment variable');
    process.exit(1);
  }

  // Step 2: Create bridged client
  console.log('2️⃣ Creating bridged MCP client...');
  const client = await createBridgedClient();

  // Step 3: Example - Analyze a large codebase
  console.log('3️⃣ Analyzing large codebase with Gemini...\n');
  
  // Create some example content (in real use, this would be actual large files)
  const exampleCodebase = `
// File: src/server.ts (1 of 100)
import express from 'express';
import { DatabaseConnection } from './database';
// ... imagine 1000s more lines across 100s of files ...

// File: src/database.ts (2 of 100)
export class DatabaseConnection {
  // Complex implementation
}
// ... continuing for many more files ...
  `.repeat(100); // Simulate large content

  try {
    // Use Gemini's large context window
    const geminiResult = await client.callTool('gemini-flow', 'analyze_large_context', {
      content: exampleCodebase,
      query: 'Identify the architecture patterns, potential issues, and improvement opportunities',
      outputFormat: 'structured'
    });

    console.log('✅ Gemini Analysis Complete:');
    console.log('- Tokens processed:', geminiResult.tokensProcessed);
    console.log('- Memory key:', geminiResult.memoryKey);
    console.log('\nAnalysis:', geminiResult.result.substring(0, 500) + '...\n');

    // Step 4: If Claude is available, enhance the analysis
    if (process.env.CLAUDE_API_KEY) {
      console.log('4️⃣ Enhancing with Claude...\n');
      
      const collaborativeResult = await client.collaborativeAnalysis(
        exampleCodebase,
        'Provide architectural recommendations and implementation plan'
      );

      console.log('🎯 Collaborative Results:');
      console.log('- Gemini provided:', collaborativeResult.geminiAnalysis.result.substring(0, 200) + '...');
      console.log('- Claude enhanced:', collaborativeResult.claudeRefinement.substring(0, 200) + '...');
    } else {
      console.log('ℹ️ Set CLAUDE_API_KEY to enable Claude collaboration');
    }

    // Step 5: Store insights in memory
    console.log('\n5️⃣ Storing insights in memory...');
    await client.callTool('gemini-flow', 'store_in_memory', {
      key: 'architecture_analysis_demo',
      value: {
        timestamp: new Date().toISOString(),
        insights: geminiResult.result,
        codebaseSize: exampleCodebase.length
      },
      tags: ['demo', 'architecture', 'mcp']
    });

    // Step 6: Search memory
    console.log('6️⃣ Searching memory for insights...');
    const searchResults = await client.callTool('gemini-flow', 'semantic_memory_search', {
      query: 'architecture patterns',
      limit: 5
    });

    console.log('Found', searchResults.totalFound, 'relevant memory entries\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    // Clean up
    await client.disconnectAll();
    console.log('\n✨ Demo complete!');
  }
}

// Run the demo
if (require.main === module) {
  main().catch(console.error);
}

// Export for use in other scripts
export { main as mcpDemo };