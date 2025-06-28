#!/usr/bin/env node

// Simple test to see if interactive mode works
const { spawn } = require('child_process');
const path = require('path');

console.log('Testing Gemini Flow interactive mode...\n');

const geminiFlow = spawn('./gemini-flow', [], {
  stdio: 'inherit',
  cwd: process.cwd()
});

geminiFlow.on('error', (err) => {
  console.error('Error:', err);
});

geminiFlow.on('exit', (code) => {
  console.log('\nExited with code:', code);
});

// Send some test commands after a delay
setTimeout(() => {
  console.log('\nSending test command...');
  process.stdin.write('help\n');
}, 1000);

setTimeout(() => {
  console.log('\nExiting...');
  process.stdin.write('exit\n');
}, 2000);