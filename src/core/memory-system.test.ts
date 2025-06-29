import { EnhancedMemory } from './EnhancedMemory.js';
import { MessageType, MessagePriority } from './AgentCommunication.js';

// Simple test suite for the enhanced memory system
async function runTests() {
  console.log('🧪 Running Enhanced Memory System Tests...\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ ${name}: ${error.message}`);
      testsFailed++;
    }
  }
  
  const memory = new EnhancedMemory();
  const comm = memory.getAgentCommunication();
  const shared = memory.getSharedContext();
  
  // Test 1: Basic memory operations
  await test('Basic memory set/get', async () => {
    await memory.set('test-key', { value: 'test-data' });
    const result = await memory.get('test-key');
    if (result?.value !== 'test-data') {
      throw new Error('Value mismatch');
    }
  });
  
  // Test 2: Semantic search
  await test('Semantic search', async () => {
    await memory.set('search-test-1', 'machine learning algorithms');
    await memory.set('search-test-2', 'deep learning neural networks');
    await memory.set('search-test-3', 'unrelated content');
    
    const results = await memory.semanticSearch('artificial intelligence', {
      limit: 2,
      threshold: 0.3
    });
    
    if (results.length === 0) {
      throw new Error('No search results found');
    }
  });
  
  // Test 3: Agent communication
  await test('Agent communication', async () => {
    const agent1 = comm.registerAgent('test-agent-1', 'Test Agent 1', 'tester');
    const agent2 = comm.registerAgent('test-agent-2', 'Test Agent 2', 'tester');
    
    let messageReceived = false;
    
    comm.subscribe('test-agent-2', 'test-topic', async (message) => {
      messageReceived = true;
    });
    
    await comm.send({
      type: MessageType.NOTIFICATION,
      senderId: 'test-agent-1',
      recipientId: 'test-agent-2',
      topic: 'test-topic',
      content: 'test message',
      priority: MessagePriority.NORMAL
    });
    
    // Wait for message delivery
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!messageReceived) {
      throw new Error('Message not received');
    }
    
    comm.unregisterAgent('test-agent-1');
    comm.unregisterAgent('test-agent-2');
  });
  
  // Test 4: Shared context
  await test('Shared context operations', async () => {
    const space = shared.createSpace('test-space', 'test-owner', {
      name: 'Test Space',
      description: 'Test shared context space'
    });
    
    await shared.set('test-space', 'shared-key', { data: 'shared-value' }, 'test-owner');
    const value = shared.get('test-space', 'shared-key', 'test-owner');
    
    if (value?.data !== 'shared-value') {
      throw new Error('Shared value mismatch');
    }
  });
  
  // Test 5: Memory suggestions
  await test('Memory suggestions', async () => {
    await memory.set('suggestion-test', 'test data');
    await memory.set('suggestion-example', 'example data');
    
    const suggestions = await memory.suggest('sugg', 5);
    if (suggestions.length === 0) {
      throw new Error('No suggestions found');
    }
  });
  
  // Test 6: Memory export/import
  await test('Memory export/import', async () => {
    const exportPath = './test-memory-export.json';
    await memory.exportMemory(exportPath);
    
    const fs = await import('fs');
    if (!fs.existsSync(exportPath)) {
      throw new Error('Export file not created');
    }
    
    // Clean up
    fs.unlinkSync(exportPath);
  });
  
  // Test 7: Analytics
  await test('Memory analytics', async () => {
    const analytics = await memory.getComprehensiveAnalytics();
    
    if (!analytics.memory || !analytics.communication || !analytics.sharedContext) {
      throw new Error('Incomplete analytics data');
    }
  });
  
  // Clean up
  memory.stopOptimization();
  
  console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  
  if (testsFailed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);