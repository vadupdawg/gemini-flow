#!/usr/bin/env node

import { Command } from 'commander';
import { Memory } from './core/Memory';
import { Logger } from './core/Logger';
import { Executor } from './core/executor';
import { Orchestrator } from './core/Orchestrator';
import { ToDoManager } from './core/ToDoManager';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const program = new Command();

// Convert yargs commands to commander format
// This is a temporary implementation to fix the broken CLI

program
  .name('claude-flow')
  .description('Claude Flow: AI Agent Orchestration Platform')
  .version('1.0.0');

// Initialize project command
program
  .command('init')
  .description('Initialize a new Claude Flow project')
  .option('--sparc', 'Initialize with full SPARC development environment')
  .action(async (options) => {
    console.log('Initializing Claude Flow project...');
    // TODO: Implement init logic
  });

// SPARC command with subcommands
const sparcCmd = program
  .command('sparc')
  .description('SPARC development interface')
  .argument('[task]', 'Task to execute (default: orchestrator mode)')
  .action(async (task) => {
    if (!task) {
      // Show available modes if no task provided
      const modesDir = path.join(__dirname, 'templates', 'prompts', 'modes');
      const srcModesDir = path.join(process.cwd(), 'src', 'templates', 'prompts', 'modes');
      const checkDir = fs.existsSync(modesDir) ? modesDir : srcModesDir;
      
      if (fs.existsSync(checkDir)) {
        const modes = fs.readdirSync(checkDir)
          .filter(f => f.endsWith('.md'))
          .map(f => f.replace('.md', ''))
          .filter(m => m !== 'orchestrator'); // Exclude orchestrator from list
        
        Logger.log('[SPARC]', 'Usage: claude-flow sparc "<task>"');
        Logger.log('[SPARC]', 'Available modes:');
        console.log('  orchestrator (default)');
        modes.forEach(mode => console.log(`  ${mode}`));
      }
      return;
    }
    
    // Run orchestrator mode by default
    await runSparcMode('orchestrator', task);
  });

// SPARC run subcommand
sparcCmd
  .command('run <mode> <task>')
  .description('Run a specific SPARC mode')
  .option('--output <path>', 'Save output to file')
  .action(async (mode, task, options) => {
    await runSparcMode(mode, task, options.output);
  });

// SPARC TDD subcommand
sparcCmd
  .command('tdd <feature>')
  .description('Test-driven development mode')
  .action(async (feature) => {
    await runSparcMode('tdd', feature);
  });

// SPARC modes subcommand
sparcCmd
  .command('modes')
  .description('List all available SPARC modes')
  .action(async () => {
    const modesDir = path.join(__dirname, 'templates', 'prompts', 'modes');
    const srcModesDir = path.join(process.cwd(), 'src', 'templates', 'prompts', 'modes');
    const checkDir = fs.existsSync(modesDir) ? modesDir : srcModesDir;
    
    if (fs.existsSync(checkDir)) {
      const modes = fs.readdirSync(checkDir)
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace('.md', ''));
      
      Logger.log('[SPARC]', `Available SPARC modes (${modes.length}):`);
      modes.forEach(mode => console.log(`  - ${mode}`));
    } else {
      Logger.error('[SPARC]', 'Modes directory not found');
    }
  });

// Helper function to run SPARC modes
async function runSparcMode(mode: string, task: string, outputPath?: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    Logger.error('[SPARC]', 'API key not found. Set GEMINI_API_KEY or CLAUDE_API_KEY in .env file');
    return;
  }
  
  // Check both dist and src directories for prompts
  const distPath = path.join(__dirname, 'templates', 'prompts', 'modes', `${mode}.md`);
  const srcPath = path.join(process.cwd(), 'src', 'templates', 'prompts', 'modes', `${mode}.md`);
  const systemPromptPath = fs.existsSync(distPath) ? distPath : srcPath;
  
  if (!fs.existsSync(systemPromptPath)) {
    Logger.error('[SPARC]', `Mode '${mode}' not found`);
    return;
  }
  
  try {
    const systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');
    Logger.log('[SPARC]', `Running ${mode} mode with task: "${task}"`);
    
    const executor = new Executor();
    const result = await executor.run({
      task,
      systemPrompt,
      apiKey
    });
    
    if (result.success) {
      let output = result.output;
      try {
        const parsed = JSON.parse(output);
        if (parsed.content) {
          output = parsed.content;
        }
      } catch (e) {
        // Not JSON, use as-is
      }
      
      if (outputPath) {
        fs.writeFileSync(outputPath, output);
        Logger.success('[SPARC]', `Output saved to ${outputPath}`);
      } else {
        Logger.success('[SPARC]', 'Execution completed:');
        console.log(output);
      }
      
      // Store result in memory for coordination
      const memory = new Memory();
      memory.set(`sparc_${mode}_${Date.now()}`, {
        mode,
        task,
        output,
        timestamp: new Date().toISOString()
      });
    } else {
      Logger.error('[SPARC]', `Execution failed: ${result.error}`);
    }
  } catch (error) {
    Logger.error('[SPARC]', `Error: ${(error as Error).message}`);
  }
}

// Swarm command
program
  .command('swarm')
  .description('Multi-agent swarm coordination')
  .argument('<objective>', 'The objective for the swarm')
  .option('--strategy <strategy>', 'Swarm strategy (research, development, analysis, testing, optimization, maintenance)', 'development')
  .option('--mode <mode>', 'Coordination mode (centralized, distributed, hierarchical, mesh, hybrid)', 'centralized')
  .option('--max-agents <n>', 'Maximum number of agents', '5')
  .option('--parallel', 'Enable parallel execution')
  .option('--monitor', 'Enable real-time monitoring')
  .option('--output <format>', 'Output format (json, sqlite, csv, html)', 'json')
  .action(async (objective, options) => {
    Logger.log('[Swarm]', `Initializing swarm for: "${objective}"`);
    Logger.log('[Swarm]', `Strategy: ${options.strategy}, Mode: ${options.mode}, Max agents: ${options.maxAgents}`);
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      Logger.error('[Swarm]', 'API key not found. Set GEMINI_API_KEY or CLAUDE_API_KEY in .env file');
      return;
    }

    try {
      const toDoManager = new ToDoManager();
      const orchestrator = new Orchestrator(apiKey, toDoManager);
      const memory = new Memory();
      
      // Store swarm configuration in memory
      const swarmId = `swarm_${Date.now()}`;
      memory.set(swarmId, {
        objective,
        strategy: options.strategy,
        mode: options.mode,
        maxAgents: parseInt(options.maxAgents),
        parallel: options.parallel,
        monitor: options.monitor,
        output: options.output,
        startTime: new Date().toISOString()
      });

      // Initialize monitoring if requested
      if (options.monitor) {
        Logger.log('[Swarm]', 'Real-time monitoring enabled');
        // TODO: Implement real-time monitoring
      }

      // Create a plan using swarm-coordinator
      Logger.log('[Swarm]', 'Creating execution plan...');
      const coordinator = new Executor();
      
      // Get appropriate agents based on strategy
      const agentsByStrategy: Record<string, string[]> = {
        research: ['researcher', 'analyzer', 'documenter'],
        development: ['architect', 'coder', 'tester', 'reviewer'],
        analysis: ['analyzer', 'researcher', 'documenter'],
        testing: ['tester', 'debugger', 'reviewer'],
        optimization: ['optimizer', 'analyzer', 'coder'],
        maintenance: ['debugger', 'optimizer', 'documenter']
      };
      
      const agents = agentsByStrategy[options.strategy] || agentsByStrategy.development;
      
      // Register agents with orchestrator
      agents.forEach(agent => {
        orchestrator.addAgent(agent, agent);
      });
      
      // Create coordinated plan
      const coordinatorPromptPath = path.join(__dirname, 'templates', 'prompts', 'modes', 'swarm-coordinator.md');
      const srcCoordinatorPath = path.join(process.cwd(), 'src', 'templates', 'prompts', 'modes', 'swarm-coordinator.md');
      const promptPath = fs.existsSync(coordinatorPromptPath) ? coordinatorPromptPath : srcCoordinatorPath;
      
      if (!fs.existsSync(promptPath)) {
        Logger.error('[Swarm]', 'Swarm coordinator prompt not found');
        return;
      }
      
      const systemPrompt = fs.readFileSync(promptPath, 'utf-8');
      const planPrompt = `Create a detailed execution plan for the following objective using ${options.strategy} strategy with ${options.mode} coordination mode. Available agents: ${agents.join(', ')}. Objective: "${objective}"`;
      
      const planResult = await coordinator.run({
        task: planPrompt,
        systemPrompt,
        apiKey
      });
      
      if (planResult.success) {
        Logger.success('[Swarm]', 'Plan created successfully');
        
        // Parse and execute plan
        try {
          let plan;
          const output = planResult.output;
          
          // Try to extract JSON from output
          const jsonMatch = output.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            plan = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback to simple task creation
            plan = agents.map(agent => ({
              task: `${agent}: Work on ${objective}`,
              agent,
              dependencies: []
            }));
          }
          
          // Add tasks to todo manager
          plan.forEach((task: any) => {
            toDoManager.addTask(task.task, task.agent, task.dependencies);
          });
          
          // Execute based on mode
          if (options.parallel && options.mode === 'distributed') {
            Logger.log('[Swarm]', 'Executing tasks in parallel (distributed mode)');
            // TODO: Implement parallel execution
          } else {
            Logger.log('[Swarm]', 'Executing tasks sequentially');
            await orchestrator.processQueue();
          }
          
          // Store results in memory
          const results = toDoManager.getAllTasks();
          memory.set(`${swarmId}_results`, {
            plan,
            results,
            endTime: new Date().toISOString()
          });
          
          // Output results in requested format
          if (options.output === 'json') {
            console.log(JSON.stringify({ objective, plan, results }, null, 2));
          } else {
            Logger.log('[Swarm]', `Results stored in memory with key: ${swarmId}_results`);
          }
          
        } catch (e) {
          Logger.error('[Swarm]', `Failed to parse plan: ${(e as Error).message}`);
        }
      } else {
        Logger.error('[Swarm]', `Failed to create plan: ${planResult.error}`);
      }
      
    } catch (error) {
      Logger.error('[Swarm]', `Error: ${(error as Error).message}`);
    }
  });

// Memory command
program
  .command('memory')
  .description('Memory management')
  .addCommand(
    new Command('store')
      .description('Store data in memory')
      .argument('<key>', 'Memory key')
      .argument('<data>', 'Data to store')
      .action(async (key, data) => {
        try {
          const memory = new Memory();
          memory.set(key, data);
          Logger.success('[Memory]', `Data stored successfully with key: ${key}`);
        } catch (error) {
          Logger.error('[Memory]', `Failed to store data: ${(error as Error).message}`);
        }
      })
  )
  .addCommand(
    new Command('get')
      .description('Retrieve data from memory')
      .argument('<key>', 'Memory key')
      .action(async (key) => {
        try {
          const memory = new Memory();
          const value = memory.get(key);
          if (value !== undefined) {
            Logger.log('[Memory]', `Data for key '${key}':`);
            console.log(JSON.stringify(value, null, 2));
          } else {
            Logger.warn('[Memory]', `No data found for key: ${key}`);
          }
        } catch (error) {
          Logger.error('[Memory]', `Failed to retrieve data: ${(error as Error).message}`);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List all memory keys')
      .action(async () => {
        try {
          const memory = new Memory();
          const allData = memory.getAll();
          const keys = Object.keys(allData);
          
          if (keys.length === 0) {
            Logger.log('[Memory]', 'No stored memory entries found.');
          } else {
            Logger.log('[Memory]', `Found ${keys.length} memory entries:`);
            keys.forEach(key => {
              console.log(`  - ${key}`);
            });
          }
        } catch (error) {
          Logger.error('[Memory]', `Failed to list memory: ${(error as Error).message}`);
        }
      })
  );

// Start command
program
  .command('start')
  .description('Start orchestration system')
  .option('--ui', 'Start with web UI')
  .option('--port <port>', 'Port number', '3000')
  .option('--host <host>', 'Host address', 'localhost')
  .action(async (options) => {
    console.log('Starting orchestration system...');
    console.log('Options:', options);
    // TODO: Implement start logic
  });

// Status command
program
  .command('status')
  .description('Show comprehensive system status')
  .action(async () => {
    const memory = new Memory();
    const allData = memory.getAll();
    const memoryKeys = Object.keys(allData);
    
    // Count active swarms and sparc sessions
    const swarmKeys = memoryKeys.filter(k => k.startsWith('swarm_'));
    const sparcKeys = memoryKeys.filter(k => k.startsWith('sparc_'));
    
    Logger.log('[Status]', 'System Status Report');
    console.log('\n=== Orchestration Status ==>');
    console.log(`- Orchestration: ${process.env.ORCHESTRATION_ACTIVE === 'true' ? 'Running' : 'Not running'}`);
    console.log(`- Active Swarms: ${swarmKeys.length}`);
    console.log(`- SPARC Sessions: ${sparcKeys.length}`);
    
    console.log('\n=== Memory Status ==>');
    console.log(`- Total Entries: ${memoryKeys.length}`);
    console.log(`- Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n=== Recent Activity ==>');
    const recentEntries = memoryKeys
      .map(key => ({ key, data: allData[key] }))
      .filter(entry => entry.data && entry.data.timestamp)
      .sort((a, b) => new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime())
      .slice(0, 5);
    
    if (recentEntries.length > 0) {
      recentEntries.forEach(entry => {
        console.log(`- ${entry.key}: ${new Date(entry.data.timestamp).toLocaleString()}`);
      });
    } else {
      console.log('- No recent activity');
    }
    
    console.log('\n=== System Health ==>');
    console.log(`- API Key: ${process.env.GEMINI_API_KEY || process.env.CLAUDE_API_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`- Working Directory: ${process.cwd()}`);
    console.log(`- Node Version: ${process.version}`);
  });

// Monitor command
program
  .command('monitor')
  .description('Real-time system monitoring dashboard')
  .action(async () => {
    Logger.log('[Monitor]', 'Starting real-time monitoring...');
    Logger.log('[Monitor]', 'Press Ctrl+C to stop monitoring');
    
    const memory = new Memory();
    let lastCount = 0;
    
    const monitorInterval = setInterval(() => {
      const allData = memory.getAll();
      const currentCount = Object.keys(allData).length;
      
      if (currentCount !== lastCount) {
        Logger.log('[Monitor]', `Memory entries changed: ${lastCount} → ${currentCount}`);
        lastCount = currentCount;
      }
      
      // Show memory usage
      const memUsage = process.memoryUsage();
      process.stdout.write(`\r[Monitor] Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB | Entries: ${currentCount} | CPU: ${process.cpuUsage().user}μs`);
    }, 1000);
    
    process.on('SIGINT', () => {
      clearInterval(monitorInterval);
      console.log('\n[Monitor] Monitoring stopped');
      process.exit(0);
    });
  });

// Agent command
program
  .command('agent')
  .description('Agent management')
  .addCommand(
    new Command('spawn')
      .description('Create a new agent')
      .argument('<type>', 'Agent type')
      .option('--name <name>', 'Agent name')
      .action(async (type, options) => {
        const name = options.name || `${type}_${Date.now()}`;
        Logger.log('[Agent]', `Spawning ${type} agent: ${name}`);
        
        // Store agent info in memory
        const memory = new Memory();
        memory.set(`agent_${name}`, {
          type,
          name,
          status: 'active',
          createdAt: new Date().toISOString()
        });
        
        Logger.success('[Agent]', `Agent ${name} spawned successfully`);
      })
  )
  .addCommand(
    new Command('list')
      .description('List all active agents')
      .action(async () => {
        const memory = new Memory();
        const allData = memory.getAll();
        const agentKeys = Object.keys(allData).filter(k => k.startsWith('agent_'));
        
        if (agentKeys.length === 0) {
          Logger.log('[Agent]', 'No active agents');
        } else {
          Logger.log('[Agent]', `Active agents (${agentKeys.length}):`);
          agentKeys.forEach(key => {
            const agent = allData[key];
            console.log(`  - ${agent.name} (${agent.type}) - Status: ${agent.status}`);
          });
        }
      })
  );

// Task command
program
  .command('task')
  .description('Task management')
  .addCommand(
    new Command('create')
      .description('Create a new task')
      .argument('<type>', 'Task type')
      .argument('[description]', 'Task description')
      .action(async (type, description) => {
        const taskId = `task_${Date.now()}`;
        const memory = new Memory();
        
        memory.set(taskId, {
          type,
          description: description || `${type} task`,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        
        Logger.success('[Task]', `Task created: ${taskId}`);
      })
  )
  .addCommand(
    new Command('list')
      .description('List all tasks')
      .action(async () => {
        const memory = new Memory();
        const allData = memory.getAll();
        const taskKeys = Object.keys(allData).filter(k => k.startsWith('task_'));
        
        if (taskKeys.length === 0) {
          Logger.log('[Task]', 'No tasks found');
        } else {
          Logger.log('[Task]', `Tasks (${taskKeys.length}):`);
          taskKeys.forEach(key => {
            const task = allData[key];
            console.log(`  - ${key}: ${task.description} [${task.status}]`);
          });
        }
      })
  );

// Config command
program
  .command('config')
  .description('Configuration management')
  .addCommand(
    new Command('show')
      .description('Show current configuration')
      .action(async () => {
        Logger.log('[Config]', 'Current configuration:');
        console.log(`  - API Key: ${process.env.GEMINI_API_KEY || process.env.CLAUDE_API_KEY ? 'Set' : 'Not set'}`);
        console.log(`  - Working Directory: ${process.cwd()}`);
        console.log(`  - Memory Directory: ${path.join(process.cwd(), 'memory')}`);
      })
  );

program.parse();
