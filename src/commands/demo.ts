import { Command } from 'commander';
import { ui } from '../core/UI';

export function createDemoCommand(): Command {
  const demo = new Command('demo');
  
  demo
    .description('Demo the UI components')
    .action(async () => {
      // Show welcome
      ui.showWelcome();
      
      await sleep(1000);
      
      // Header demo
      ui.header('UI Component Demo', 'Showcasing all the beautiful UI elements');
      
      await sleep(1000);
      
      // Agent spinners demo
      ui.section('🤖 Agent Activity Demo');
      
      // Start multiple agents
      ui.agentStart('researcher', 'Searching for best practices...');
      await sleep(2000);
      ui.agentInfo('researcher', 'Found 15 relevant articles');
      await sleep(1000);
      ui.agentSuccess('researcher', 'Research completed successfully');
      
      await sleep(500);
      
      ui.agentStart('architect', 'Designing system architecture...');
      await sleep(1500);
      ui.agentInfo('architect', 'Creating component diagrams');
      await sleep(1500);
      ui.agentSuccess('architect', 'Architecture design complete');
      
      await sleep(500);
      
      ui.agentStart('coder', 'Implementing features...');
      await sleep(1000);
      ui.agentInfo('coder', 'Writing authentication module');
      await sleep(1000);
      ui.agentInfo('coder', 'Adding database models');
      await sleep(1000);
      ui.agentSuccess('coder', 'Implementation complete');
      
      await sleep(500);
      
      // Error demo
      ui.agentStart('tester', 'Running test suite...');
      await sleep(1500);
      ui.agentError('tester', 'Tests failed: 3 errors found');
      
      await sleep(1000);
      
      // Progress demo
      ui.section('📊 Progress Tracking Demo');
      const tasks = ['Initialize project', 'Install dependencies', 'Configure environment', 'Run migrations', 'Start server'];
      ui.startProgress('Building Application', tasks);
      
      for (let i = 0; i < tasks.length; i++) {
        await sleep(800);
        ui.updateProgress(i, tasks.length, tasks[i]);
      }
      
      await sleep(1000);
      
      // Task list demo
      const mockTasks = [
        { id: 1, task: 'Design user authentication flow', agent: 'architect', status: 'completed' },
        { id: 2, task: 'Implement JWT tokens', agent: 'coder', status: 'completed' },
        { id: 3, task: 'Write unit tests', agent: 'tester', status: 'in_progress' },
        { id: 4, task: 'Setup CI/CD pipeline', agent: 'devops', status: 'in_progress' },
        { id: 5, task: 'Write API documentation', agent: 'documenter', status: 'pending' },
        { id: 6, task: 'Performance optimization', agent: 'optimizer', status: 'pending' },
        { id: 7, task: 'Security audit', agent: 'security-reviewer', status: 'pending' }
      ];
      
      ui.showTaskList(mockTasks);
      
      await sleep(2000);
      
      // Messages demo
      ui.section('💬 Message Types Demo');
      ui.success('Build completed successfully!');
      await sleep(500);
      ui.error('Failed to connect to database');
      await sleep(500);
      ui.warning('Deprecation warning: This method will be removed in v3.0');
      await sleep(500);
      ui.info('Server running on http://localhost:3000');
      await sleep(500);
      ui.dim('Debug: Cache hit for key user_123');
      
      await sleep(2000);
      
      // Command execution demo
      ui.section('🚀 Command Execution Demo');
      ui.showCommand('npm install express mongoose jsonwebtoken');
      await sleep(1000);
      ui.showOutput('+ express@4.18.2\n+ mongoose@7.0.3\n+ jsonwebtoken@9.0.0\nadded 3 packages in 2.145s', 'success');
      
      await sleep(2000);
      
      // Concurrent agents demo
      ui.section('⚡ Parallel Execution Demo');
      ui.info('Starting 3 agents in parallel...');
      
      // Start all three at once
      ui.agentStart('agent1', 'Processing data batch 1...');
      ui.agentStart('agent2', 'Processing data batch 2...');
      ui.agentStart('agent3', 'Processing data batch 3...');
      
      // Simulate parallel work
      await sleep(1000);
      ui.agentInfo('agent2', 'Halfway done...');
      await sleep(500);
      ui.agentSuccess('agent1', 'Batch 1 complete');
      await sleep(700);
      ui.agentInfo('agent3', 'Almost finished...');
      await sleep(300);
      ui.agentSuccess('agent2', 'Batch 2 complete');
      await sleep(500);
      ui.agentSuccess('agent3', 'Batch 3 complete');
      
      await sleep(1000);
      
      ui.success('✨ Demo completed! This is what Gemini Flow looks like in action.');
      
      // Cleanup any remaining spinners
      ui.cleanup();
    });
  
  return demo;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}