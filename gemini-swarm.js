#!/usr/bin/env node

/**
 * Gemini Swarm - Enhanced multi-agent orchestration system
 * Manages agents with individual todo lists and report aggregation
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class SwarmOrchestrator {
  constructor(objective, options = {}) {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.error(chalk.red('❌ GEMINI_API_KEY not found. Please set it in .env file'));
      process.exit(1);
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    this.objective = objective;
    this.maxAgents = options.maxAgents || 5;
    this.strategy = options.strategy || 'development';
    this.mode = options.mode || 'hierarchical';
    this.parallel = options.parallel || false;
    this.monitor = options.monitor || false;
    
    this.agents = new Map();
    this.globalTodos = [];
    this.reports = new Map();
    this.completedTasks = [];
    this.insights = [];
    
    // Ensure memory directory exists
    this.memoryDir = path.join(process.cwd(), 'memory', 'swarm');
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }
  
  async start() {
    console.clear();
    console.log(chalk.bold.cyan(`
╭─────────────────────────────────────────╮
│                                         │
│        🐝 Gemini Swarm Mode 🐝         │
│                                         │
│   Enhanced Multi-Agent Orchestration    │
│                                         │
╰─────────────────────────────────────────╯
`));
    
    console.log(chalk.yellow(`📋 Objective: ${this.objective}`));
    console.log(chalk.gray(`Strategy: ${this.strategy} | Mode: ${this.mode} | Max Agents: ${this.maxAgents}\n`));
    
    try {
      // Phase 1: Critical Analysis & Planning
      await this.analyzeObjective();
      
      // Phase 2: Create Initial Todo Lists
      await this.createInitialTodos();
      
      // Phase 3: Spawn Agents
      await this.spawnAgents();
      
      // Phase 4: Execute Tasks
      await this.executeTasks();
      
      // Phase 5: Collect Reports
      await this.collectReports();
      
      // Phase 6: Creative Synthesis
      await this.creativeSynthesis();
      
      // Phase 7: Generate Final Report
      await this.generateFinalReport();
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Orchestration Error: ${error.message}`));
    }
  }
  
  async analyzeObjective() {
    console.log(chalk.blue('\n🔍 Phase 1: Critical Analysis\n'));
    
    const analysisPrompt = `
You are a critical thinking orchestrator analyzing a COMPLEX objective that requires multiple agents.

Objective: ${this.objective}
Strategy: ${this.strategy}

IMPORTANT: This is a complex task requiring multiple specialized agents working together.

Provide a critical analysis covering:
1. Major Components - Break down into distinct parts (e.g., backend, frontend, database, APIs, UI, testing)
2. Technical Requirements - What technologies, frameworks, and tools are needed
3. Feature Breakdown - List each feature as a separate item
4. Agent Specializations - What types of expert agents are needed (e.g., Backend Dev, Frontend Dev, Database Expert, etc.)
5. Dependencies and Integration Points - How different parts connect

Think like a technical project manager breaking down a large project into sprints and tasks.`;

    const result = await this.model.generateContent(analysisPrompt);
    const analysis = result.response.text();
    
    console.log(chalk.gray('Critical Analysis:'));
    console.log(this.formatOutput(analysis));
    
    this.analysis = analysis;
    this.saveMemory('analysis', { objective: this.objective, analysis, timestamp: new Date() });
  }
  
  async createInitialTodos() {
    console.log(chalk.blue('\n📝 Phase 2: Creating Todo Lists\n'));
    
    const todoPrompt = `
Based on this analysis, create DETAILED todo lists for ${this.maxAgents} SPECIALIZED agents.

Objective: ${this.objective}
Analysis: ${this.analysis}
Strategy: ${this.strategy}

IMPORTANT INSTRUCTIONS:
1. Create ${this.maxAgents} agents with SPECIFIC technical roles (not generic)
2. Each agent should have 4-8 concrete, actionable tasks
3. Tasks should be specific enough to implement (not vague)
4. Include different types of work: design, implementation, testing, documentation

Example of good agent specialization:
- Backend API Developer (handles server routes, controllers, middleware)
- Database Engineer (schema design, queries, optimization)
- Frontend UI Developer (components, layouts, user interactions)
- Testing Engineer (unit tests, integration tests, test data)
- DevOps Engineer (deployment, CI/CD, monitoring)
- Security Specialist (authentication, authorization, data protection)

Format each agent section clearly with:
AGENT: [specific technical role]
TASKS:
- Task 1 (deliverable: concrete output)
- Task 2 (deliverable: specific implementation)
- Task 3 (deliverable: measurable result)
etc.

Make sure tasks are distributed based on technical expertise, not randomly.`;

    const result = await this.model.generateContent(todoPrompt);
    const todoPlan = result.response.text();
    
    // Parse the todo plan
    this.parseTodoLists(todoPlan);
    
    console.log(chalk.green(`✅ Created todo lists for ${this.agents.size} agents\n`));
    
    // Display agent assignments
    for (const [id, agent] of this.agents) {
      console.log(chalk.cyan(`${agent.role}:`));
      agent.todos.forEach((todo, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${todo.task}`));
      });
      console.log();
    }
  }
  
  parseTodoLists(todoPlan) {
    const agentSections = todoPlan.split(/AGENT:/i).filter(s => s.trim());
    
    agentSections.forEach((section, index) => {
      if (index >= this.maxAgents) return;
      
      const lines = section.trim().split('\n');
      const role = lines[0].trim();
      const agentId = uuidv4();
      
      const todos = [];
      let inTasks = false;
      
      lines.forEach(line => {
        if (line.includes('TASKS:') || line.includes('TODO:')) {
          inTasks = true;
          return;
        }
        
        if (inTasks && line.trim().startsWith('-')) {
          const taskMatch = line.match(/- (.+?)(?:\(deliverable: (.+?)\))?$/);
          if (taskMatch) {
            todos.push({
              id: uuidv4(),
              task: taskMatch[1].trim(),
              deliverable: taskMatch[2] || 'Complete task',
              status: 'pending',
              result: null
            });
          }
        }
      });
      
      if (todos.length > 0) {
        this.agents.set(agentId, {
          id: agentId,
          role,
          todos,
          status: 'idle',
          report: null
        });
      }
    });
  }
  
  async spawnAgents() {
    console.log(chalk.blue('🚀 Phase 3: Spawning Agents\n'));
    
    for (const [id, agent] of this.agents) {
      console.log(chalk.yellow(`✨ Spawning ${agent.role} agent...`));
      agent.status = 'active';
      
      // Create agent-specific memory
      this.saveMemory(`agent_${id}`, {
        role: agent.role,
        todos: agent.todos,
        objective: this.objective,
        spawnTime: new Date()
      });
    }
    
    console.log(chalk.green(`\n✅ All ${this.agents.size} agents spawned and ready\n`));
  }
  
  async executeTasks() {
    console.log(chalk.blue('⚡ Phase 4: Executing Tasks\n'));
    
    if (this.parallel) {
      // Execute all agents in parallel
      const agentPromises = Array.from(this.agents.values()).map(agent => 
        this.executeAgentTasks(agent)
      );
      await Promise.all(agentPromises);
    } else {
      // Execute agents sequentially
      for (const agent of this.agents.values()) {
        await this.executeAgentTasks(agent);
      }
    }
  }
  
  async executeAgentTasks(agent) {
    console.log(chalk.cyan(`\n🤖 ${agent.role} starting work...\n`));
    
    for (const todo of agent.todos) {
      if (this.monitor) {
        process.stdout.write(chalk.gray(`  Working on: ${todo.task}...`));
      }
      
      const taskPrompt = `
You are a ${agent.role} agent working on this objective: ${this.objective}

Your specific task: ${todo.task}
Expected deliverable: ${todo.deliverable}

Previous context:
${this.getRelevantContext(agent)}

Complete this task thoroughly. Provide specific, actionable results.
If you need to reference other agents' work, mention it clearly.`;

      try {
        const result = await this.model.generateContent(taskPrompt);
        const response = result.response.text();
        
        todo.status = 'completed';
        todo.result = response;
        
        if (this.monitor) {
          process.stdout.write(chalk.green(' ✓\n'));
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        todo.status = 'failed';
        todo.error = error.message;
        
        if (this.monitor) {
          process.stdout.write(chalk.red(' ✗\n'));
        }
      }
    }
    
    agent.status = 'completed';
    console.log(chalk.green(`✅ ${agent.role} completed all tasks\n`));
  }
  
  getRelevantContext(currentAgent) {
    // Get completed work from other agents that might be relevant
    const context = [];
    
    for (const [id, agent] of this.agents) {
      if (agent.id === currentAgent.id) continue;
      
      const completedTasks = agent.todos.filter(t => t.status === 'completed');
      if (completedTasks.length > 0) {
        context.push(`${agent.role} has completed:`);
        completedTasks.forEach(task => {
          context.push(`- ${task.task}`);
        });
      }
    }
    
    return context.join('\n') || 'No other agents have completed work yet.';
  }
  
  async collectReports() {
    console.log(chalk.blue('📊 Phase 5: Collecting Agent Reports\n'));
    
    for (const [id, agent] of this.agents) {
      const reportPrompt = `
You are the ${agent.role} agent. Generate a comprehensive report of your work.

Tasks completed:
${agent.todos.map(t => `- ${t.task}: ${t.status}`).join('\n')}

Based on your completed work, provide:
1. Summary of achievements
2. Key findings or implementations
3. Challenges encountered
4. Recommendations for next steps
5. Dependencies or handoffs to other agents

Be specific and include important details.`;

      try {
        const result = await this.model.generateContent(reportPrompt);
        const report = result.response.text();
        
        agent.report = report;
        this.reports.set(id, {
          role: agent.role,
          report,
          timestamp: new Date()
        });
        
        console.log(chalk.cyan(`📝 Report from ${agent.role}:`));
        console.log(chalk.gray(this.truncateText(report, 200)));
        console.log();
        
      } catch (error) {
        console.error(chalk.red(`Failed to get report from ${agent.role}: ${error.message}`));
      }
    }
  }
  
  async creativeSynthesis() {
    console.log(chalk.blue('🎨 Phase 6: Creative Synthesis\n'));
    
    const allReports = Array.from(this.reports.values())
      .map(r => `${r.role} Report:\n${r.report}`)
      .join('\n\n---\n\n');
    
    const synthesisPrompt = `
You are a creative synthesis orchestrator. Review all agent reports and think creatively about:

Objective: ${this.objective}

Agent Reports:
${allReports}

Provide creative synthesis:
1. Unexpected connections between different agents' work
2. Innovative solutions that combine multiple perspectives
3. Future possibilities not originally considered
4. Potential pivot opportunities
5. Novel applications of the work done

Think outside the box. Make surprising connections. Suggest bold ideas.`;

    const result = await this.model.generateContent(synthesisPrompt);
    const synthesis = result.response.text();
    
    console.log(chalk.magenta('Creative Insights:'));
    console.log(this.formatOutput(synthesis));
    
    this.creativeSynthesis = synthesis;
    
    // Generate new tasks based on synthesis
    await this.generateNewTasks(synthesis);
  }
  
  async generateNewTasks(synthesis) {
    console.log(chalk.blue('\n🔄 Generating New Tasks\n'));
    
    const newTaskPrompt = `
Based on this creative synthesis, suggest 3-5 new tasks that could enhance the objective.

Synthesis: ${synthesis}
Original Objective: ${this.objective}

For each new task, specify:
- Task description
- Which type of agent should handle it
- Why it's valuable
- Priority (high/medium/low)

Format:
TASK: [description]
AGENT: [role]
VALUE: [why it matters]
PRIORITY: [level]`;

    const result = await this.model.generateContent(newTaskPrompt);
    const newTasks = result.response.text();
    
    console.log(chalk.yellow('Proposed New Tasks:'));
    console.log(this.formatOutput(newTasks));
    
    this.saveMemory('new_tasks', {
      synthesis,
      newTasks,
      timestamp: new Date()
    });
  }
  
  async generateFinalReport() {
    console.log(chalk.blue('\n📋 Phase 7: Final Orchestration Report\n'));
    
    const summary = {
      objective: this.objective,
      strategy: this.strategy,
      agentsUsed: this.agents.size,
      tasksCompleted: Array.from(this.agents.values())
        .flatMap(a => a.todos)
        .filter(t => t.status === 'completed').length,
      totalTasks: Array.from(this.agents.values())
        .flatMap(a => a.todos).length,
      timestamp: new Date()
    };
    
    console.log(chalk.green('✅ Swarm Orchestration Complete!\n'));
    console.log(chalk.white('Summary:'));
    console.log(chalk.gray(`• Agents deployed: ${summary.agentsUsed}`));
    console.log(chalk.gray(`• Tasks completed: ${summary.tasksCompleted}/${summary.totalTasks}`));
    console.log(chalk.gray(`• Reports collected: ${this.reports.size}`));
    
    // Save complete swarm state
    this.saveMemory('final_report', {
      summary,
      agents: Array.from(this.agents.values()),
      reports: Array.from(this.reports.values()),
      creativeSynthesis: this.creativeSynthesis,
      analysis: this.analysis
    });
    
    console.log(chalk.gray(`\n💾 Full report saved to: memory/swarm/final_report.json`));
  }
  
  formatOutput(text) {
    // Format lists
    text = text.replace(/^(\s*)-\s+/gm, (match, spaces) => {
      return spaces + chalk.cyan('•') + ' ';
    });
    
    // Format numbered lists
    text = text.replace(/^(\s*)(\d+)\.\s+/gm, (match, spaces, num) => {
      return spaces + chalk.cyan(num + '.') + ' ';
    });
    
    // Format headers
    text = text.replace(/^(#{1,3})\s+(.+)$/gm, (match, hashes, content) => {
      return chalk.bold(content);
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
    console.error(chalk.red('Usage: ./gemini-swarm.js "<objective>" [options]'));
    console.log('\nOptions:');
    console.log('  --max-agents <n>    Maximum number of agents (default: 5)');
    console.log('  --strategy <type>   Strategy: research, development, analysis, testing, optimization, maintenance');
    console.log('  --mode <type>       Mode: centralized, distributed, hierarchical, mesh, hybrid');
    console.log('  --parallel          Enable parallel execution');
    console.log('  --monitor           Show real-time progress');
    process.exit(1);
  }
  
  const objective = args[0];
  const options = {
    maxAgents: 5,
    strategy: 'development',
    mode: 'hierarchical',
    parallel: false,
    monitor: false
  };
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--max-agents':
        options.maxAgents = parseInt(args[++i]) || 5;
        break;
      case '--strategy':
        options.strategy = args[++i] || 'development';
        break;
      case '--mode':
        options.mode = args[++i] || 'hierarchical';
        break;
      case '--parallel':
        options.parallel = true;
        break;
      case '--monitor':
        options.monitor = true;
        break;
    }
  }
  
  const orchestrator = new SwarmOrchestrator(objective, options);
  await orchestrator.start();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Fatal error:', error.message));
    process.exit(1);
  });
}

module.exports = SwarmOrchestrator;