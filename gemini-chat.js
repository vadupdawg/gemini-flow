#!/usr/bin/env node

/**
 * Gemini Chat - Interactive conversation mode
 * Have ongoing conversations with Gemini, just like Claude Code!
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

class GeminiChat {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.error(chalk.red('❌ GEMINI_API_KEY not found. Please set it in .env file'));
      process.exit(1);
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.chat = null;
    this.history = [];
    this.sessionFile = path.join(process.cwd(), 'memory', 'chat-session.json');
    
    // Create readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('\n💬 You: ')
    });
    
    // Ensure memory directory exists
    const memoryDir = path.join(process.cwd(), 'memory');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
  }
  
  async start() {
    console.clear();
    console.log(chalk.bold.cyan(`
╭─────────────────────────────────────────╮
│                                         │
│        🤖 Gemini Chat Mode 🤖          │
│                                         │
│   Interactive AI Conversation System    │
│                                         │
╰─────────────────────────────────────────╯
`));
    
    console.log(chalk.gray('Type "help" for commands, "exit" to quit\n'));
    
    // Load previous session if exists
    this.loadSession();
    
    // Start chat
    this.chat = this.model.startChat({
      history: this.history.map(msg => ({
        role: msg.role,
        parts: msg.parts
      })),
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });
    
    // Show prompt
    this.rl.prompt();
    
    // Handle user input
    this.rl.on('line', async (input) => {
      await this.handleInput(input.trim());
    });
    
    // Handle exit
    this.rl.on('close', () => {
      this.saveSession();
      console.log(chalk.yellow('\n\n👋 Goodbye! Chat session saved.\n'));
      process.exit(0);
    });
  }
  
  async handleInput(input) {
    // Handle special commands
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      this.rl.close();
      return;
    }
    
    if (input.toLowerCase() === 'help') {
      this.showHelp();
      this.rl.prompt();
      return;
    }
    
    if (input.toLowerCase() === 'clear') {
      console.clear();
      console.log(chalk.gray('Chat cleared. History preserved.\n'));
      this.rl.prompt();
      return;
    }
    
    if (input.toLowerCase() === 'reset') {
      this.resetChat();
      return;
    }
    
    if (input.toLowerCase() === 'history') {
      this.showHistory();
      this.rl.prompt();
      return;
    }
    
    if (input.toLowerCase() === 'save') {
      this.saveSession();
      console.log(chalk.green('\n✅ Session saved!\n'));
      this.rl.prompt();
      return;
    }
    
    if (input.trim() === '') {
      this.rl.prompt();
      return;
    }
    
    // Send message to Gemini
    await this.sendMessage(input);
  }
  
  async sendMessage(message) {
    try {
      // Show thinking indicator
      process.stdout.write(chalk.gray('\n🤔 Thinking...'));
      
      // Send message
      const result = await this.chat.sendMessage(message);
      const response = result.response.text();
      
      // Clear thinking indicator
      process.stdout.write('\r' + ' '.repeat(20) + '\r');
      
      // Display response with formatting
      console.log(chalk.green('\n🤖 Gemini:'));
      console.log(this.formatResponse(response));
      
      // Save to history
      this.history.push(
        { role: 'user', parts: message },
        { role: 'model', parts: response }
      );
      
      // Auto-save every 5 messages
      if (this.history.length % 10 === 0) {
        this.saveSession();
      }
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
    
    // Show prompt again
    this.rl.prompt();
  }
  
  formatResponse(text) {
    // Format code blocks
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return chalk.bgGray.white(`\n${lang || 'code'}:\n`) + chalk.yellow(code.trim()) + '\n';
    });
    
    // Format inline code
    text = text.replace(/`([^`]+)`/g, (match, code) => {
      return chalk.bgGray.white(` ${code} `);
    });
    
    // Format bold
    text = text.replace(/\*\*(.*?)\*\*/g, (match, content) => {
      return chalk.bold(content);
    });
    
    // Format lists
    text = text.replace(/^(\s*)-\s+/gm, (match, spaces) => {
      return spaces + chalk.cyan('•') + ' ';
    });
    
    // Format numbered lists
    text = text.replace(/^(\s*)(\d+)\.\s+/gm, (match, spaces, num) => {
      return spaces + chalk.cyan(num + '.') + ' ';
    });
    
    return text;
  }
  
  showHelp() {
    console.log(chalk.yellow(`
📚 Available Commands:
────────────────────
  ${chalk.cyan('help')}     - Show this help message
  ${chalk.cyan('clear')}    - Clear the screen (keeps history)
  ${chalk.cyan('reset')}    - Start a new conversation
  ${chalk.cyan('history')}  - Show conversation history
  ${chalk.cyan('save')}     - Save current session
  ${chalk.cyan('exit')}     - Exit the chat

💡 Tips:
  • Just type normally to chat
  • Code snippets are automatically formatted
  • Session auto-saves every 5 messages
  • History persists between sessions
`));
  }
  
  showHistory() {
    console.log(chalk.yellow('\n📜 Conversation History:\n'));
    
    this.history.forEach((msg, index) => {
      if (msg.role === 'user') {
        console.log(chalk.cyan(`You: ${msg.parts}`));
      } else {
        console.log(chalk.green(`Gemini: ${msg.parts.substring(0, 100)}...`));
      }
    });
    
    console.log(chalk.gray(`\nTotal messages: ${this.history.length}`));
  }
  
  resetChat() {
    this.history = [];
    this.chat = this.model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });
    
    console.clear();
    console.log(chalk.yellow('🔄 Chat reset! Starting fresh conversation.\n'));
    this.rl.prompt();
  }
  
  saveSession() {
    try {
      const sessionData = {
        timestamp: new Date().toISOString(),
        history: this.history,
        messageCount: this.history.length
      };
      
      fs.writeFileSync(this.sessionFile, JSON.stringify(sessionData, null, 2));
    } catch (error) {
      console.error(chalk.red('Failed to save session:', error.message));
    }
  }
  
  loadSession() {
    try {
      if (fs.existsSync(this.sessionFile)) {
        const data = JSON.parse(fs.readFileSync(this.sessionFile, 'utf-8'));
        
        console.log(chalk.gray(`Loading previous session (${data.messageCount} messages)...`));
        console.log(chalk.gray('Type "reset" to start fresh, or continue the conversation.\n'));
        
        this.history = data.history || [];
      }
    } catch (error) {
      console.log(chalk.gray('Starting new session...\n'));
    }
  }
}

// Start the chat
const chat = new GeminiChat();
chat.start();