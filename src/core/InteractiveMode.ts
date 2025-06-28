import * as readline from 'readline';
import { ui } from './UI';
import { Command } from 'commander';
import chalk from 'chalk';

export class InteractiveMode {
  private rl: readline.Interface;
  private program: Command;
  private isRunning: boolean = true;
  private static instance: InteractiveMode;
  
  constructor(program: Command) {
    this.program = program;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.hex('#4285F4')('gemini-flow > ')
    });
    InteractiveMode.instance = this;
  }
  
  static isActive(): boolean {
    return InteractiveMode.instance?.isRunning || false;
  }
  
  async start() {
    // Show welcome message
    ui.showWelcome();
    ui.info('Interactive mode - Type "help" for commands or "exit" to quit');
    console.log();
    
    // Handle line input
    this.rl.on('line', async (input) => {
      const trimmed = input.trim();
      
      if (!trimmed) {
        this.rl.prompt();
        return;
      }
      
      // Handle special commands
      if (trimmed === 'exit' || trimmed === 'quit') {
        this.stop();
        return;
      }
      
      if (trimmed === 'clear' || trimmed === 'cls') {
        console.clear();
        ui.showWelcome();
        this.rl.prompt();
        return;
      }
      
      if (trimmed === 'help') {
        this.showInteractiveHelp();
        this.rl.prompt();
        return;
      }
      
      // Parse and execute command
      try {
        // Add the command to process.argv format
        const args = this.parseCommand(trimmed);
        
        // Store original argv
        const originalArgv = process.argv;
        
        // Set up argv for commander
        process.argv = [process.argv[0], process.argv[1], ...args];
        
        // Parse with commander - but don't exit on completion
        await this.program.parseAsync(process.argv);
        
        // Restore original argv
        process.argv = originalArgv;
        
      } catch (error) {
        ui.error(`Error: ${(error as Error).message}`);
      }
      
      // Show prompt again
      if (this.isRunning) {
        console.log(); // Add spacing
        this.rl.prompt();
      }
    });
    
    // Handle close
    this.rl.on('close', () => {
      if (this.isRunning) {
        console.log();
        ui.info('Goodbye! 👋');
        process.exit(0);
      }
    });
    
    // Show initial prompt
    this.rl.prompt();
  }
  
  private parseCommand(input: string): string[] {
    // Simple command parsing - handles quotes
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          args.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current) {
      args.push(current);
    }
    
    return args;
  }
  
  private showInteractiveHelp() {
    console.log();
    ui.section('Interactive Mode Commands');
    console.log();
    console.log('  ' + chalk.cyan('help') + '              Show this help message');
    console.log('  ' + chalk.cyan('clear') + '             Clear the screen');
    console.log('  ' + chalk.cyan('exit') + '              Exit interactive mode');
    console.log();
    console.log('  ' + chalk.cyan('sparc <task>') + '      Run SPARC orchestrator');
    console.log('  ' + chalk.cyan('sparc run <mode> <task>') + '  Run specific SPARC mode');
    console.log('  ' + chalk.cyan('sparc modes') + '       List available modes');
    console.log('  ' + chalk.cyan('swarm <objective>') + ' Run agent swarm');
    console.log('  ' + chalk.cyan('status') + '            Show system status');
    console.log('  ' + chalk.cyan('memory list') + '       List memory entries');
    console.log();
    console.log('  Example: ' + chalk.green('sparc "Build a REST API"'));
    console.log('  Example: ' + chalk.green('swarm "Create e-commerce site" --strategy development'));
    console.log();
  }
  
  stop() {
    this.isRunning = false;
    this.rl.close();
  }
}