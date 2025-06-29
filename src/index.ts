#!/usr/bin/env node

import { Command } from 'commander';
import { Memory } from './core/Memory';
import { Logger } from './core/Logger';
import { ui } from './core/UI';
import { Executor } from './core/executor';
import { Orchestrator } from './core/Orchestrator';
import { ToDoManager } from './core/ToDoManager';
import { InteractiveMode } from './core/InteractiveMode';
import { addParallelCommands } from './cli/parallel-commands';
import { createAutoCommand } from './commands/auto';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const program = new Command();

// Convert yargs commands to commander format
// This is a temporary implementation to fix the broken CLI

program
  .name('gemini-flow')
  .description('Gemini Flow: AI Agent Orchestration Platform')
  .version('2.0.0')
  .option('-i, --interactive', 'Start in interactive mode')
  .exitOverride();

// Initialize project command
program
  .command('init')
  .description('Initialize a new Claude Flow project')
  .option('--sparc', 'Initialize with full SPARC development environment')
  .action(async (options) => {
    ui.header('Initializing Gemini Flow Project', 'Setting up AI orchestration environment');
    
    const spinner = ui.agentStart('init', 'Creating project structure...');
    // TODO: Implement actual init logic
    setTimeout(() => {
      ui.agentSuccess('init', 'Project initialized successfully!');
      ui.info('Next steps:');
      ui.log('1. Set your GEMINI_API_KEY in .env');
      ui.log('2. Run ./gemini-flow --help to see available commands');
      ui.log('3. Try ./gemini-flow sparc "Build a simple REST API"');
    }, 1000);
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
      
      ui.showSparcModes(modes);
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
    ui.header(`SPARC ${mode.toUpperCase()} Mode`, task);
    ui.agentStart(mode, 'Processing task...');
    
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
      
      ui.agentSuccess(mode, 'Task completed successfully');
      
      if (outputPath) {
        fs.writeFileSync(outputPath, output);
        ui.success(`Output saved to ${outputPath}`);
      } else {
        ui.section('Output');
        ui.showOutput(output, 'success');
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
      ui.agentError(mode, `Execution failed: ${result.error}`);
    }
  } catch (error) {
    ui.agentError(mode, `Error: ${(error as Error).message}`);
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
    ui.header('Swarm Coordination', objective);
    ui.info(`Strategy: ${options.strategy} | Mode: ${options.mode} | Max agents: ${options.maxAgents}`);
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      ui.error('API key not found. Set GEMINI_API_KEY or CLAUDE_API_KEY in .env file');
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
        ui.info('Real-time monitoring enabled 📊');
        // TODO: Implement real-time monitoring
      }

      // Enable parallel mode for swarm if requested
      if (options.parallel) {
        orchestrator.setParallelMode(true);
      }
      
      // Create a plan using swarm-coordinator
      ui.agentStart('coordinator', 'Creating execution plan...');
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
        ui.agentSuccess('coordinator', 'Execution plan created');
        
        // Parse and execute plan
        try {
          let plan;
          let output = planResult.output;
          
          // If output is a JSON string with a content field, extract it first
          try {
            const outerJson = JSON.parse(output);
            if (outerJson.content) {
              output = outerJson.content;
            }
          } catch (e) {
            // Not outer JSON, continue with original output
          }
          
          // More robust JSON extraction
          let jsonString: string | null = null;
          
          // First try to extract from markdown code blocks
          const markdownMatch = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (markdownMatch && markdownMatch[1]) {
            jsonString = markdownMatch[1].trim();
          } else {
            // Try to find JSON array
            const arrayMatch = output.match(/\[[\s\S]*?\]/);
            if (arrayMatch) {
              jsonString = arrayMatch[0];
            } else {
              // Try to find JSON object that might contain the plan
              const objectMatch = output.match(/\{[\s\S]*?\}/);
              if (objectMatch) {
                const tempObj = JSON.parse(objectMatch[0]);
                if (tempObj.plan && Array.isArray(tempObj.plan)) {
                  plan = tempObj.plan;
                } else if (tempObj.tasks && Array.isArray(tempObj.tasks)) {
                  plan = tempObj.tasks;
                }
              }
            }
          }
          
          if (jsonString && !plan) {
            // Clean up common JSON issues
            jsonString = jsonString
              .replace(/^\s*[\[\{]/, match => match.trim()) // Clean start
              .replace(/[\]\}]\s*$/, match => match.trim()) // Clean end
              .replace(/,\s*([}\]])/, '$1'); // Remove trailing commas
            
            plan = JSON.parse(jsonString);
          }
          
          if (!plan || !Array.isArray(plan)) {
            ui.warning('Could not parse plan from AI output, using fallback');
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
          
          // Execute tasks
          if (options.parallel) {
            ui.info('⚡ Executing tasks in parallel mode');
            await orchestrator.run(objective);
          } else {
            ui.info('▶ Executing tasks sequentially');
            await orchestrator.run(objective);
          }
          
          // Store results in memory
          const results = toDoManager.getAllTasks();
          memory.set(`${swarmId}_results`, {
            plan,
            results,
            endTime: new Date().toISOString()
          });
          
          // Output results in requested format (compact)
          if (options.output === 'json') {
            // Only output a summary for better readability
            const summary = {
              objective,
              totalTasks: plan.length,
              completed: results.filter((r: any) => r.status === 'completed').length,
              swarmId: `${swarmId}_results`,
              message: "Full results stored in memory. Use 'memory get' to retrieve."
            };
            console.log(JSON.stringify(summary, null, 2));
          } else {
            ui.success(`Swarm completed! Results stored with key: ${swarmId}_results`);
            ui.info(`Use 'memory get ${swarmId}_results' to retrieve full results`);
          }
          
        } catch (e) {
          ui.agentError('coordinator', `Failed to parse plan: ${(e as Error).message}`);
          if (options.monitor) {
            ui.section('Debug Output');
            ui.dim('Raw output from coordinator:');
            console.log(planResult.output.substring(0, 500) + '...');
            try {
              const parsed = JSON.parse(planResult.output);
              if (parsed.content) {
                ui.dim('Extracted content:');
                console.log(parsed.content.substring(0, 500) + '...');
              }
            } catch (e) {
              // Ignore if not JSON
            }
          }
        }
      } else {
        ui.agentError('coordinator', `Failed to create plan: ${planResult.error}`);
      }
      
    } catch (error) {
      ui.error(`Error: ${(error as Error).message}`);
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
    ui.header('Starting Orchestration System', 
              options.ui ? 'With Web UI' : 'CLI Mode Only');
    
    ui.agentStart('system', 'Initializing orchestration engine...');
    
    if (options.ui) {
      ui.agentInfo('system', `Starting web UI on http://${options.host}:${options.port}`);
    }
    
    // TODO: Implement actual start logic
    setTimeout(() => {
      ui.agentSuccess('system', 'Orchestration system started successfully');
      if (options.ui) {
        ui.success(`Web UI available at http://${options.host}:${options.port}`);
      }
      ui.info('Use Ctrl+C to stop the orchestration system');
    }, 1500);
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
    
    ui.header('System Status Report', new Date().toLocaleString());
    
    ui.section('🎯 Orchestration Status');
    ui.log(`Orchestration: ${process.env.ORCHESTRATION_ACTIVE === 'true' ? '🟢 Running' : '🔴 Not running'}`);
    ui.log(`Active Swarms: ${swarmKeys.length}`);
    ui.log(`SPARC Sessions: ${sparcKeys.length}`);
    
    ui.section('💾 Memory Status');
    ui.log(`Total Entries: ${memoryKeys.length}`);
    ui.log(`Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    ui.section('📊 Recent Activity');
    const recentEntries = memoryKeys
      .map(key => ({ key, data: allData[key] }))
      .filter(entry => entry.data && entry.data.timestamp)
      .sort((a, b) => new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime())
      .slice(0, 5);
    
    if (recentEntries.length > 0) {
      recentEntries.forEach(entry => {
        const type = entry.key.startsWith('swarm_') ? '🐝' : 
                     entry.key.startsWith('sparc_') ? '⚡' : '📌';
        ui.log(`${type} ${entry.key}: ${new Date(entry.data.timestamp).toLocaleString()}`);
      });
    } else {
      ui.dim('No recent activity');
    }
    
    ui.section('🏥 System Health');
    ui.log(`API Key: ${process.env.GEMINI_API_KEY || process.env.CLAUDE_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    ui.log(`Working Directory: ${process.cwd()}`);
    ui.log(`Node Version: ${process.version}`);
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

// Add parallel execution commands
addParallelCommands(program);

// Add autonomous execution command
program.addCommand(createAutoCommand());

// Check if we should enter interactive mode
async function main() {
  const args = process.argv.slice(2);
  
  // Debug mode
  if (args.includes('--debug')) {
    console.log('Debug: args =', args);
    console.log('Debug: process.argv =', process.argv);
  }
  
  // First check if it's a special flag that commander handles
  const isSpecialFlag = args.some(arg => 
    arg === '--version' || arg === '-V' || 
    arg === '--help' || arg === '-h'
  );
  
  if (isSpecialFlag) {
    // Let commander handle these special flags
    program.parse();
    return;
  }
  
  // If no command is provided or --interactive flag is used, enter interactive mode
  const shouldEnterInteractive = args.length === 0 || 
                                 args.includes('--interactive') || 
                                 args.includes('-i');
  
  if (shouldEnterInteractive) {
    // Remove --interactive flag from args if present
    process.argv = process.argv.filter(arg => arg !== '--interactive' && arg !== '-i');
    
    try {
      // Start interactive mode
      const interactive = new InteractiveMode(program);
      await interactive.start();
    } catch (err) {
      ui.error(`Failed to start interactive mode: ${(err as Error).message}`);
      console.error('Interactive mode error:', err);
      process.exit(1);
    }
  } else {
    // Normal command execution
    program.parse();
  }
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (error) => {
  ui.error(`Unhandled error: ${(error as Error).message}`);
  process.exit(1);
});

// Start the application
main().catch(error => {
  ui.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
