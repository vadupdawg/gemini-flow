#!/usr/bin/env node
import { config } from 'dotenv';
import { AutonomousAgent } from '../src/core/AutonomousAgent';
import { Orchestrator } from '../src/core/Orchestrator';
import { ToDoManager } from '../src/core/ToDoManager';
import { ParallelExecutor } from '../src/core/ParallelExecutor';
import { ui } from '../src/core/UI';
import { Logger } from '../src/core/Logger';

// Load environment variables
config();

/**
 * Demo script showing parallel execution capabilities
 */
async function demonstrateParallelExecution() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    Logger.error('Demo', 'Please set GEMINI_API_KEY in your .env file');
    process.exit(1);
  }

  ui.header('Parallel Execution Demo', 'Demonstrating worker threads and concurrent task processing');

  // Example 1: Parallel Orchestrator
  ui.section('Example 1: Parallel Task Orchestration');
  
  const todoManager = new ToDoManager();
  const orchestrator = new Orchestrator(apiKey, todoManager, true); // Enable parallel mode
  
  // Add multiple agents
  orchestrator.addAgent('researcher', 'researcher');
  orchestrator.addAgent('analyzer', 'analyzer');
  orchestrator.addAgent('coder', 'coder');
  orchestrator.addAgent('tester', 'tester');
  
  // Add tasks that can run in parallel
  todoManager.addTask('Research best practices for Node.js worker threads', 'researcher');
  todoManager.addTask('Analyze current codebase performance bottlenecks', 'analyzer');
  todoManager.addTask('Research modern JavaScript async patterns', 'researcher');
  todoManager.addTask('Analyze memory usage patterns', 'analyzer');
  
  // Add dependent tasks
  const codingTaskId = todoManager.addTask('Implement performance optimizations', 'coder');
  todoManager.addDependency(codingTaskId, 1); // Depends on first research
  todoManager.addDependency(codingTaskId, 2); // Depends on analysis
  
  const testingTaskId = todoManager.addTask('Write comprehensive tests', 'tester');
  todoManager.addDependency(testingTaskId, codingTaskId); // Depends on coding
  
  // Execute all tasks in parallel where possible
  await orchestrator.run('Execute all tasks efficiently using parallel workers');
  
  ui.success('Parallel orchestration completed!');

  // Example 2: Direct Parallel Executor Usage
  ui.section('Example 2: Direct Parallel Executor');
  
  const parallelExecutor = new ParallelExecutor({
    maxWorkers: 4,
    enableMonitoring: true,
    taskTimeout: 60000
  });
  
  // Monitor execution progress
  parallelExecutor.on('statsUpdate', (stats) => {
    ui.dim(`Active: ${stats.activeTasks}, Queued: ${stats.queuedTasks}, Completed: ${stats.completedTasks}`);
  });
  
  parallelExecutor.start();
  
  // Submit multiple analysis tasks
  const analysisTasks = [
    {
      id: 'analyze-1',
      type: 'analysis' as const,
      priority: 8,
      data: {
        type: 'codeAnalysis',
        target: './src/core/Orchestrator.ts'
      }
    },
    {
      id: 'analyze-2',
      type: 'analysis' as const,
      priority: 7,
      data: {
        type: 'codeAnalysis',
        target: './src/core/AutonomousAgent.ts'
      }
    },
    {
      id: 'analyze-3',
      type: 'analysis' as const,
      priority: 9,
      data: {
        type: 'performanceAnalysis',
        target: './examples/test-script.js'
      }
    }
  ];
  
  // Submit all tasks and wait for results
  try {
    const results = await parallelExecutor.submitBatch(analysisTasks);
    ui.success('All analysis tasks completed!');
    results.forEach((result, index) => {
      ui.info(`Task ${analysisTasks[index].id}: ${JSON.stringify(result).substring(0, 100)}...`);
    });
  } catch (error) {
    ui.error(`Some tasks failed: ${(error as Error).message}`);
  }
  
  await parallelExecutor.stop();

  // Example 3: Autonomous Agent with Parallel Execution
  ui.section('Example 3: Autonomous Agent - Parallel Mode');
  
  const autonomousAgent = new AutonomousAgent(apiKey, true); // Enable parallel execution
  
  // Complex objective that will be decomposed into parallel tasks
  const objective = `
    Create a comprehensive performance monitoring system that:
    1. Analyzes code complexity across all source files
    2. Monitors memory usage patterns
    3. Tracks execution times for key functions
    4. Generates a performance report
    5. Suggests optimization strategies
  `;
  
  await autonomousAgent.execute(objective);
  
  ui.success('Autonomous parallel execution completed!');

  // Example 4: Performance Comparison
  ui.section('Example 4: Performance Comparison');
  
  // Sequential execution
  const sequentialAgent = new AutonomousAgent(apiKey, false);
  const startSeq = Date.now();
  
  ui.subsection('Sequential Execution');
  await sequentialAgent.execute('Analyze three different files for code quality');
  const seqTime = Date.now() - startSeq;
  
  // Parallel execution
  const parallelAgent = new AutonomousAgent(apiKey, true);
  const startPar = Date.now();
  
  ui.subsection('Parallel Execution');
  await parallelAgent.execute('Analyze three different files for code quality');
  const parTime = Date.now() - startPar;
  
  // Show comparison
  ui.section('Performance Results');
  ui.info(`Sequential Time: ${(seqTime / 1000).toFixed(2)}s`);
  ui.info(`Parallel Time: ${(parTime / 1000).toFixed(2)}s`);
  ui.success(`Speed improvement: ${((seqTime / parTime - 1) * 100).toFixed(1)}%`);

  // Example 5: Stress Test
  ui.section('Example 5: Parallel Stress Test');
  
  const stressExecutor = new ParallelExecutor({
    maxWorkers: 8,
    enableMonitoring: true
  });
  
  stressExecutor.start();
  
  // Create many small tasks
  const stressTasks = Array.from({ length: 50 }, (_, i) => ({
    id: `stress-${i}`,
    type: 'tool' as const,
    priority: Math.floor(Math.random() * 10) + 1,
    data: {
      tool: 'readFile',
      args: { filePath: './package.json' }
    }
  }));
  
  ui.info(`Submitting ${stressTasks.length} tasks to ${8} workers...`);
  const stressStart = Date.now();
  
  try {
    await stressExecutor.submitBatch(stressTasks);
    const stressTime = Date.now() - stressStart;
    
    const stats = stressExecutor.getStats();
    ui.success(`Completed ${stats.completedTasks} tasks in ${(stressTime / 1000).toFixed(2)}s`);
    ui.info(`Average time per task: ${(stressTime / stressTasks.length).toFixed(2)}ms`);
  } catch (error) {
    ui.error(`Stress test failed: ${(error as Error).message}`);
  }
  
  await stressExecutor.stop();
  
  ui.success('All parallel execution demos completed! 🚀');
}

// Run the demo
demonstrateParallelExecution().catch(error => {
  Logger.error('Demo', `Failed: ${error.message}`);
  process.exit(1);
});