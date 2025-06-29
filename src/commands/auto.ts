import { Command } from 'commander';
import { ui } from '../core/UI';
import { AutonomousAgent } from '../core/AutonomousAgent';
import { Memory } from '../core/Memory';
import * as dotenv from 'dotenv';

dotenv.config();

export function createAutoCommand(): Command {
  const auto = new Command('auto');
  
  auto
    .description('Execute any complex objective autonomously')
    .argument('<objective>', 'What you want to accomplish')
    .option('--parallel', 'Enable parallel execution (default: true, unless DISABLE_PARALLEL_EXECUTION=true)')
    .option('--max-agents <number>', 'Maximum parallel agents', '5')
    .option('--learn', 'Enable learning mode (default: true)')
    .option('--monitor', 'Show real-time monitoring')
    .option('--dry-run', 'Show execution plan without running')
    .action(async (objective: string, options: any) => {
      const apiKey = process.env.GEMINI_API_KEY || process.env.CLAUDE_API_KEY;
      
      if (!apiKey) {
        ui.error('API key not found. Set GEMINI_API_KEY or CLAUDE_API_KEY in .env file');
        return;
      }
      
      // Show impressive start
      console.clear();
      ui.showWelcome();
      
      ui.header('🧠 Autonomous Execution Mode', 'AI-Powered Task Completion');
      ui.info(`Objective: ${objective}`);
      console.log();
      
      // Configuration
      const forceDisableParallel = process.env.DISABLE_PARALLEL_EXECUTION === 'true';
      const config = {
        parallel: forceDisableParallel ? false : (options.parallel !== false),
        maxAgents: parseInt(options.maxAgents || '5'),
        learning: options.learn !== false,
        monitoring: options.monitor || false,
        dryRun: options.dryRun || false
      };
      
      if (forceDisableParallel) {
        ui.warning('ℹ️ Parallel execution disabled by environment variable');
      }
      
      ui.section('Configuration');
      ui.log(`🔄 Parallel Execution: ${config.parallel ? 'Enabled' : 'Disabled'}`);
      ui.log(`👥 Max Agents: ${config.maxAgents}`);
      ui.log(`🧠 Learning Mode: ${config.learning ? 'Enabled' : 'Disabled'}`);
      ui.log(`📊 Monitoring: ${config.monitoring ? 'Enabled' : 'Disabled'}`);
      console.log();
      
      try {
        // Initialize autonomous agent
        const agent = new AutonomousAgent(apiKey);
        
        if (config.dryRun) {
          ui.section('Execution Plan (Dry Run)');
          ui.info('Analyzing objective and creating execution plan...');
          // TODO: Show plan without executing
          return;
        }
        
        // Execute autonomously
        ui.section('Starting Autonomous Execution');
        ui.info('The AI will now break down and execute your objective...');
        console.log();
        
        // Start execution with monitoring
        if (config.monitoring) {
          // TODO: Start real-time monitoring in separate thread
        }
        
        await agent.execute(objective);
        
        // Show results
        console.log();
        ui.section('🎉 Mission Accomplished!');
        
        // Get execution summary from memory
        const memory = new Memory();
        const allData = memory.getAll();
        const executions = Object.entries(allData)
          .filter(([key]) => key.startsWith('execution_'))
          .map(([key, value]) => ({ key, value }))
          .sort((a, b) => b.key.localeCompare(a.key))
          .slice(0, 1);
        
        if (executions.length > 0) {
          const lastExecution = executions[0].value as any;
          ui.success(`Completed in ${lastExecution.duration.toFixed(1)} minutes`);
          ui.info(`Success rate: ${(lastExecution.successRate * 100).toFixed(1)}%`);
          
          if (lastExecution.learnings && lastExecution.learnings.length > 0) {
            ui.subsection('AI Learnings');
            lastExecution.learnings.forEach((learning: string) => {
              ui.dim(`• ${learning}`);
            });
          }
        }
        
      } catch (error) {
        ui.error(`Autonomous execution failed: ${(error as Error).message}`);
        ui.info('The AI will learn from this and try better next time.');
      }
    });
  
  // Add sub-commands
  auto
    .command('history')
    .description('Show execution history')
    .action(() => {
      const memory = new Memory();
      const allData = memory.getAll();
      const executions = Object.entries(allData)
        .filter(([key]) => key.startsWith('execution_'))
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) => b.key.localeCompare(a.key))
        .slice(0, 10);
      
      ui.header('Execution History', 'Past autonomous runs');
      
      if (executions.length === 0) {
        ui.info('No execution history found');
        return;
      }
      
      executions.forEach((exec: any, index: number) => {
        const data = exec.value as any;
        ui.subsection(`${index + 1}. ${data.objective}`);
        ui.log(`⏱️  Duration: ${data.duration.toFixed(1)} minutes`);
        ui.log(`✅ Success Rate: ${(data.successRate * 100).toFixed(1)}%`);
        ui.log(`📅 Date: ${new Date(data.startTime).toLocaleString()}`);
        console.log();
      });
    });
  
  auto
    .command('clear')
    .description('Clear execution history and learnings')
    .action(() => {
      const memory = new Memory();
      
      ui.warning('This will clear all execution history and AI learnings.');
      // TODO: Add confirmation prompt
      
      // Clear relevant memory entries
      const keys = Object.keys(memory.getAll());
      keys.forEach(key => {
        if (key.startsWith('execution_') || 
            key.startsWith('error_') || 
            key === 'learnings') {
          const data = memory.get(key);
          if (data) {
            memory.set(key, null);
          }
        }
      });
      
      ui.success('Execution history and learnings cleared');
    });
  
  return auto;
}