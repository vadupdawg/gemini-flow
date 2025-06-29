#!/usr/bin/env node

/**
 * Gemini Auto - Enhanced autonomous task execution with orchestration
 * Manages sub-agents with todo lists and dynamic task creation
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class AutoOrchestrator {
  constructor(task, options = {}) {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.error(chalk.red('❌ GEMINI_API_KEY not found. Please set it in .env file'));
      process.exit(1);
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    this.task = task;
    this.maxAgents = options.maxAgents || 3;
    this.interactive = options.interactive || false;
    
    this.masterTodos = [];
    this.agents = new Map();
    this.reports = [];
    this.iterations = 0;
    this.maxIterations = 5;
    
    // Ensure memory directory exists
    this.memoryDir = path.join(process.cwd(), 'memory', 'auto');
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }
  
  async start() {
    console.clear();
    console.log(chalk.bold.cyan(`
╭─────────────────────────────────────────╮
│                                         │
│        🤖 Gemini Auto Mode 🤖          │
│                                         │
│     Autonomous Task Orchestration       │
│                                         │
╰─────────────────────────────────────────╯
`));
    
    console.log(chalk.yellow(`📋 Task: ${this.task}\n`));
    
    try {
      // Start the autonomous cycle
      await this.runAutonomousCycle();
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Auto Error: ${error.message}`));
    }
  }
  
  async runAutonomousCycle() {
    while (this.iterations < this.maxIterations) {
      this.iterations++;
      console.log(chalk.blue(`\n🔄 Iteration ${this.iterations}/${this.maxIterations}\n`));
      
      // Step 1: Critical thinking - analyze current state
      const analysis = await this.analyzeCurrentState();
      
      // Step 2: Create or update master todo list
      await this.updateMasterTodos(analysis);
      
      // Step 3: Check if we're done
      if (this.isTaskComplete()) {
        console.log(chalk.green('\n✅ Task completed successfully!\n'));
        break;
      }
      
      // Step 4: Distribute todos to agents
      await this.distributeTodos();
      
      // Step 5: Execute agent tasks
      await this.executeAgentTasks();
      
      // Step 6: Collect and analyze reports
      const insights = await this.analyzeReports();
      
      // Step 7: Creative thinking - generate new approaches
      await this.creativeIteration(insights);
      
      // Interactive check
      if (this.interactive && this.iterations < this.maxIterations) {
        const shouldContinue = await this.askUserToContinue();
        if (!shouldContinue) break;
      }
    }
    
    // Generate final summary
    await this.generateFinalSummary();
  }
  
  async analyzeCurrentState() {
    console.log(chalk.cyan('🔍 Analyzing current state...\n'));
    
    const statePrompt = `
You are an AI orchestrator analyzing a complex task that MUST be broken down into multiple sub-tasks.

Task: ${this.task}
Iteration: ${this.iterations}
Previous Reports: ${this.reports.length > 0 ? this.reports.map(r => r.summary).join('\n') : 'None yet'}

IMPORTANT: This task is TOO COMPLEX for a single agent. You MUST decompose it into multiple specialized sub-tasks.

Provide critical analysis:
1. What major components need to be built? (e.g., backend API, frontend UI, database, authentication)
2. What technical decisions need to be made? (e.g., tech stack, architecture, frameworks)
3. What features are required? (list each feature separately)
4. What obstacles or challenges exist?
5. Is the current approach working?

Think like a project manager - identify ALL the different pieces that need to be built separately.`;

    const result = await this.model.generateContent(statePrompt);
    const analysis = result.response.text();
    
    console.log(chalk.gray('Critical Analysis:'));
    console.log(this.formatOutput(this.truncateText(analysis, 300)));
    
    return analysis;
  }
  
  async updateMasterTodos(analysis) {
    console.log(chalk.cyan('\n📝 Updating master todo list...\n'));
    
    const todoPrompt = `
Based on this analysis, create a DETAILED master todo list with MANY specific sub-tasks.

Task: ${this.task}
Analysis: ${analysis}
Current Todos: ${this.masterTodos.map(t => `${t.task} (${t.status})`).join('\n') || 'None'}

IMPORTANT RULES:
1. Create AT LEAST 10-15 specific todos for a complex task
2. Each todo should be a concrete, actionable item that one agent can complete
3. Break down high-level features into multiple smaller tasks
4. Include tasks for: planning, implementation, testing, documentation
5. Think like you're creating a project board with many cards

Examples of good task decomposition:
- Instead of "Create user system", break it into:
  - Design user database schema
  - Implement user registration endpoint
  - Create login authentication logic
  - Build password reset functionality
  - Add user profile management
  - Write unit tests for user operations
  - Create API documentation for user endpoints

For each todo item, include:
- Clear, specific description
- Priority (high/medium/low)
- Estimated complexity (simple/moderate/complex)
- Dependencies (if any)

Format:
TODO: [specific description]
PRIORITY: [level]
COMPLEXITY: [level]
DEPENDS: [other todo or none]`;

    const result = await this.model.generateContent(todoPrompt);
    const todoText = result.response.text();
    
    // Parse and update todos
    this.parseMasterTodos(todoText);
    
    console.log(chalk.green(`✅ Master todo list updated: ${this.masterTodos.length} items\n`));
    
    // Display current todos
    this.masterTodos.forEach((todo, index) => {
      const status = todo.status === 'completed' ? chalk.green('✓') : 
                     todo.status === 'in_progress' ? chalk.yellow('⏳') : 
                     chalk.gray('○');
      console.log(`${status} ${index + 1}. ${todo.task} [${todo.priority}]`);
    });
  }
  
  parseMasterTodos(todoText) {
    const lines = todoText.split('\n');
    const newTodos = [];
    let currentTodo = null;
    
    lines.forEach(line => {
      if (line.startsWith('TODO:')) {
        if (currentTodo) newTodos.push(currentTodo);
        currentTodo = {
          id: uuidv4(),
          task: line.replace('TODO:', '').trim(),
          status: 'pending',
          priority: 'medium',
          complexity: 'moderate',
          dependencies: []
        };
      } else if (currentTodo) {
        if (line.includes('PRIORITY:')) {
          currentTodo.priority = line.split(':')[1].trim().toLowerCase();
        } else if (line.includes('COMPLEXITY:')) {
          currentTodo.complexity = line.split(':')[1].trim().toLowerCase();
        } else if (line.includes('DEPENDS:')) {
          const deps = line.split(':')[1].trim();
          if (deps !== 'none') {
            currentTodo.dependencies.push(deps);
          }
        }
      }
    });
    
    if (currentTodo) newTodos.push(currentTodo);
    
    // Merge with existing todos
    newTodos.forEach(newTodo => {
      const existing = this.masterTodos.find(t => 
        t.task.toLowerCase().includes(newTodo.task.toLowerCase().substring(0, 20))
      );
      
      if (!existing) {
        this.masterTodos.push(newTodo);
      }
    });
  }
  
  isTaskComplete() {
    const pendingTodos = this.masterTodos.filter(t => t.status !== 'completed');
    return pendingTodos.length === 0 && this.masterTodos.length > 0;
  }
  
  async distributeTodos() {
    console.log(chalk.cyan('\n👥 Distributing todos to agents...\n'));
    
    // Clear previous agents
    this.agents.clear();
    
    // Get pending todos
    const pendingTodos = this.masterTodos.filter(t => t.status === 'pending');
    if (pendingTodos.length === 0) return;
    
    // Group todos by complexity and type
    const distributionPrompt = `
Distribute these todos among ${this.maxAgents} specialized agents:

Todos:
${pendingTodos.map(t => `- ${t.task} [${t.priority}/${t.complexity}]`).join('\n')}

IMPORTANT: Create specialized agents with clear roles:
- Backend Developer: APIs, database, server logic
- Frontend Developer: UI components, user interactions
- Database Architect: Schema design, queries, optimization
- Testing Engineer: Unit tests, integration tests
- DevOps Engineer: Deployment, configuration, infrastructure
- Security Expert: Authentication, authorization, data protection
- etc.

For each agent, specify:
AGENT: [specific role/specialty]
TODOS: [list of todo tasks that match their expertise]

Each agent should get 2-5 related tasks. Distribute based on expertise.`;

    const result = await this.model.generateContent(distributionPrompt);
    const distribution = result.response.text();
    
    // Parse distribution
    this.parseAgentDistribution(distribution, pendingTodos);
    
    // Display distribution
    for (const [id, agent] of this.agents) {
      console.log(chalk.yellow(`${agent.role}:`));
      agent.todos.forEach(todo => {
        console.log(chalk.gray(`  • ${todo.task}`));
      });
      console.log();
    }
  }
  
  parseAgentDistribution(distribution, pendingTodos) {
    const sections = distribution.split(/AGENT:/i).filter(s => s.trim());
    
    sections.forEach((section, index) => {
      if (index >= this.maxAgents) return;
      
      const lines = section.trim().split('\n');
      const role = lines[0].trim();
      const agentId = uuidv4();
      
      const agentTodos = [];
      
      lines.forEach(line => {
        if (line.includes('TODO:') || line.trim().startsWith('-')) {
          const taskText = line.replace(/TODO:|^-/, '').trim();
          
          // Find matching todo from pending list
          const matchingTodo = pendingTodos.find(t => 
            t.task.toLowerCase().includes(taskText.toLowerCase().substring(0, 20)) ||
            taskText.toLowerCase().includes(t.task.toLowerCase().substring(0, 20))
          );
          
          if (matchingTodo) {
            agentTodos.push({...matchingTodo});
            matchingTodo.status = 'assigned';
          }
        }
      });
      
      if (agentTodos.length > 0) {
        this.agents.set(agentId, {
          id: agentId,
          role,
          todos: agentTodos,
          report: null
        });
      }
    });
  }
  
  async executeAgentTasks() {
    console.log(chalk.cyan('⚡ Executing agent tasks...\n'));
    
    for (const [id, agent] of this.agents) {
      console.log(chalk.yellow(`🤖 ${agent.role} working...\n`));
      
      const agentResults = [];
      
      for (const todo of agent.todos) {
        process.stdout.write(chalk.gray(`  Working on: ${this.truncateText(todo.task, 50)}...`));
        
        const taskPrompt = `
You are a ${agent.role} working on this task: ${this.task}

Your specific todo: ${todo.task}
Priority: ${todo.priority}
Complexity: ${todo.complexity}

Previous context:
${this.getRelevantContext()}

Complete this todo item. Provide concrete results, code, or specific outcomes.
Be practical and actionable.`;

        try {
          const result = await this.model.generateContent(taskPrompt);
          const response = result.response.text();
          
          todo.result = response;
          todo.status = 'completed';
          
          // Update master todo
          const masterTodo = this.masterTodos.find(t => t.id === todo.id);
          if (masterTodo) {
            masterTodo.status = 'completed';
            masterTodo.result = response;
          }
          
          agentResults.push({
            task: todo.task,
            result: response
          });
          
          process.stdout.write(chalk.green(' ✓\n'));
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          process.stdout.write(chalk.red(' ✗\n'));
          todo.status = 'failed';
          todo.error = error.message;
        }
      }
      
      // Generate agent report
      agent.report = {
        role: agent.role,
        completedTasks: agentResults.length,
        results: agentResults,
        timestamp: new Date()
      };
    }
  }
  
  getRelevantContext() {
    if (this.reports.length === 0) return 'This is the first iteration.';
    
    const lastReport = this.reports[this.reports.length - 1];
    return `Previous iteration summary: ${lastReport.summary}`;
  }
  
  async analyzeReports() {
    console.log(chalk.cyan('\n📊 Analyzing agent reports...\n'));
    
    const allReports = Array.from(this.agents.values())
      .filter(a => a.report)
      .map(a => `${a.role}: Completed ${a.report.completedTasks} tasks`)
      .join('\n');
    
    const analysisPrompt = `
Analyze these agent reports and extract key insights:

${allReports}

Provide:
1. What was accomplished in this iteration
2. Quality assessment of the work
3. Gaps or missing pieces
4. Recommendations for next iteration
5. Overall progress toward the goal`;

    const result = await this.model.generateContent(analysisPrompt);
    const insights = result.response.text();
    
    console.log(chalk.gray('Insights:'));
    console.log(this.formatOutput(this.truncateText(insights, 300)));
    
    // Save iteration report
    this.reports.push({
      iteration: this.iterations,
      agents: Array.from(this.agents.values()).map(a => ({
        role: a.role,
        completedTasks: a.report?.completedTasks || 0
      })),
      insights,
      summary: insights.split('\n')[0]
    });
    
    return insights;
  }
  
  async creativeIteration(insights) {
    console.log(chalk.cyan('\n🎨 Creative iteration...\n'));
    
    const creativePrompt = `
Think creatively about this task and suggest innovative approaches:

Task: ${this.task}
Current Progress: ${this.getProgressSummary()}
Latest Insights: ${insights}

Suggest:
1. Alternative approaches not yet tried
2. Creative combinations of existing work
3. Unexpected solutions or shortcuts
4. Ways to exceed the original requirements
5. Future enhancements or possibilities

Be bold and imaginative.`;

    const result = await this.model.generateContent(creativePrompt);
    const creative = result.response.text();
    
    console.log(chalk.magenta('Creative ideas:'));
    console.log(this.formatOutput(this.truncateText(creative, 300)));
    
    this.saveMemory(`iteration_${this.iterations}`, {
      insights,
      creative,
      todos: this.masterTodos,
      agents: Array.from(this.agents.values())
    });
  }
  
  getProgressSummary() {
    const completed = this.masterTodos.filter(t => t.status === 'completed').length;
    const total = this.masterTodos.length;
    return `${completed}/${total} todos completed`;
  }
  
  async askUserToContinue() {
    // For now, always continue unless max iterations reached
    // In a real implementation, this would prompt the user
    return true;
  }
  
  async generateFinalSummary() {
    console.log(chalk.blue('\n📋 Final Summary\n'));
    
    const completed = this.masterTodos.filter(t => t.status === 'completed');
    const pending = this.masterTodos.filter(t => t.status !== 'completed');
    
    console.log(chalk.green('✅ Completed Tasks:'));
    completed.forEach(todo => {
      console.log(chalk.gray(`  • ${todo.task}`));
    });
    
    if (pending.length > 0) {
      console.log(chalk.yellow('\n⏳ Pending Tasks:'));
      pending.forEach(todo => {
        console.log(chalk.gray(`  • ${todo.task}`));
      });
    }
    
    console.log(chalk.white(`\n📊 Statistics:`));
    console.log(chalk.gray(`  • Iterations: ${this.iterations}`));
    console.log(chalk.gray(`  • Total agents used: ${this.iterations * this.maxAgents}`));
    console.log(chalk.gray(`  • Tasks completed: ${completed.length}/${this.masterTodos.length}`));
    
    // Save final state
    this.saveMemory('final_state', {
      task: this.task,
      iterations: this.iterations,
      todos: this.masterTodos,
      reports: this.reports,
      timestamp: new Date()
    });
    
    console.log(chalk.gray(`\n💾 Full report saved to: memory/auto/final_state.json`));
  }
  
  formatOutput(text) {
    text = text.replace(/^(\s*)-\s+/gm, (match, spaces) => {
      return spaces + chalk.cyan('•') + ' ';
    });
    
    text = text.replace(/^(\s*)(\d+)\.\s+/gm, (match, spaces, num) => {
      return spaces + chalk.cyan(num + '.') + ' ';
    });
    
    return text;
  }
  
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  saveMemory(key, data) {
    const filePath = path.join(this.memoryDir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error(chalk.red('Usage: ./gemini-auto.js "<task>" [options]'));
    console.log('\nOptions:');
    console.log('  --max-agents <n>    Maximum agents per iteration (default: 3)');
    console.log('  --interactive       Ask for confirmation between iterations');
    process.exit(1);
  }
  
  const task = args[0];
  const options = {
    maxAgents: 3,
    interactive: false
  };
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--max-agents':
        options.maxAgents = parseInt(args[++i]) || 3;
        break;
      case '--interactive':
        options.interactive = true;
        break;
    }
  }
  
  const orchestrator = new AutoOrchestrator(task, options);
  await orchestrator.start();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Fatal error:', error.message));
    process.exit(1);
  });
}

module.exports = AutoOrchestrator;