#!/usr/bin/env node

/**
 * Simplified Gemini Flow - Direct task execution without JSON parsing issues
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function executeTask(task) {
  console.log(`\n🎯 Executing: ${task}\n`);
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found. Please set it in .env file');
    process.exit(1);
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Simple prompt that works reliably
    const prompt = `You are an AI assistant helping with development tasks.
Task: ${task}

Please provide a clear, step-by-step solution. Be concise and practical.`;
    
    console.log('🤖 Thinking...\n');
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log('📋 Solution:\n');
    console.log(response);
    
    // Save to memory
    const memoryDir = path.join(process.cwd(), 'memory');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const memoryFile = path.join(memoryDir, 'simple-tasks.json');
    
    let memory = [];
    if (fs.existsSync(memoryFile)) {
      memory = JSON.parse(fs.readFileSync(memoryFile, 'utf-8'));
    }
    
    memory.push({
      task,
      response,
      timestamp
    });
    
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
    
    console.log(`\n✅ Task completed and saved to memory!`);
    console.log(`📁 Memory location: ${memoryFile}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`
🚀 Gemini Simple - Quick task execution

Usage: node gemini-simple.js "<your task>"

Examples:
  node gemini-simple.js "Create a REST API endpoint"
  node gemini-simple.js "Fix this TypeScript error"
  node gemini-simple.js "Explain how async/await works"
`);
  process.exit(0);
}

const task = args.join(' ');
executeTask(task);