#!/usr/bin/env node

// Simple test to verify Gemini API is working
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    return;
  }
  
  console.log('✅ API Key found');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('📡 Testing API connection...');
    
    const result = await model.generateContent('Say "Hello, I am working!" and nothing else.');
    const response = result.response.text();
    
    console.log('✅ API Response:', response);
    console.log('\n✨ Gemini API is working correctly!');
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('\n⚠️  Your API key appears to be invalid. Please check your GEMINI_API_KEY in .env');
    }
  }
}

// Load environment variables
require('dotenv').config();

console.log('🧪 Testing Gemini API Connection...\n');
testAPI();