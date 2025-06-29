#!/usr/bin/env node

import { EnhancedMemory } from './EnhancedMemory.js';
import { MessageType, MessagePriority } from './AgentCommunication.js';

// Example usage of the enhanced memory system
async function demonstrateMemoryFeatures() {
  console.log('🧠 Initializing Enhanced Memory System...\n');
  
  const memory = new EnhancedMemory();
  const comm = memory.getAgentCommunication();
  const sharedContext = memory.getSharedContext();
  
  // 1. Register agents
  console.log('📌 Registering agents...');
  const agent1 = comm.registerAgent('agent-1', 'Research Agent', 'researcher', ['search', 'analyze']);
  const agent2 = comm.registerAgent('agent-2', 'Analysis Agent', 'analyzer', ['compute', 'visualize']);
  console.log('✅ Agents registered\n');
  
  // 2. Store data with semantic search
  console.log('💾 Storing data with semantic context...');
  await memory.set('project-overview', {
    name: 'Gemini Flow Enhancement',
    description: 'Building intelligent memory and communication system',
    status: 'in-progress',
    components: ['SmartMemory', 'AgentCommunication', 'SharedContext']
  }, {
    type: 'project',
    owner: 'system',
    description: 'Main project overview'
  });
  
  await memory.set('architecture-decisions', {
    memory: 'Use vector embeddings for semantic search',
    communication: 'Implement pub/sub pattern for agent messaging',
    optimization: 'Automatic cleanup of old entries'
  }, {
    type: 'documentation',
    owner: 'architect'
  });
  console.log('✅ Data stored\n');
  
  // 3. Semantic search
  console.log('🔍 Performing semantic search...');
  const searchResults = await memory.semanticSearch('communication system', {
    limit: 5,
    threshold: 0.5
  });
  console.log(`Found ${searchResults.length} relevant results:`);
  searchResults.forEach(result => {
    console.log(`  - ${result.entry.key} (score: ${result.score.toFixed(2)})`);
  });
  console.log();
  
  // 4. Agent communication
  console.log('📡 Setting up agent communication...');
  
  // Subscribe to messages
  const sub1 = comm.subscribe(
    'agent-1',
    'research-topic',
    async (message) => {
      console.log(`  Agent-1 received: ${JSON.stringify(message.content)}`);
    }
  );
  
  // Send a message
  await comm.send({
    type: MessageType.REQUEST,
    senderId: 'agent-2',
    recipientId: 'agent-1',
    topic: 'research-topic',
    content: { task: 'Research memory optimization techniques' },
    priority: MessagePriority.HIGH
  });
  console.log('✅ Communication established\n');
  
  // 5. Shared context
  console.log('🌐 Creating shared context space...');
  const space = sharedContext.createSpace('research-space', 'agent-1', {
    name: 'Research Collaboration Space',
    description: 'Shared workspace for research agents',
    permissions: {
      join: 'open',
      defaultRead: true,
      defaultWrite: true
    }
  });
  
  // Join space with second agent
  sharedContext.joinSpace('research-space', 'agent-2');
  
  // Store collaborative data
  await sharedContext.set('research-space', 'findings', {
    topic: 'Memory Optimization',
    insights: ['Vector embeddings improve search', 'Compression reduces storage'],
    timestamp: new Date().toISOString()
  }, 'agent-1', {
    type: 'knowledge',
    metadata: {
      tags: ['optimization', 'memory', 'research']
    }
  });
  console.log('✅ Shared context created\n');
  
  // 6. Memory analytics
  console.log('📊 Getting memory analytics...');
  const analytics = await memory.getComprehensiveAnalytics();
  console.log('Memory Statistics:');
  console.log(`  - Total entries: ${analytics.memory.totalEntries}`);
  console.log(`  - Total size: ${(analytics.memory.totalSize / 1024).toFixed(2)} KB`);
  console.log(`  - Active agents: ${analytics.communication.totalAgents}`);
  console.log(`  - Shared spaces: ${analytics.sharedContext.spaces.length}`);
  console.log();
  
  // 7. Query shared context
  console.log('🔎 Querying shared context...');
  const contextResults = await sharedContext.query(
    'research-space',
    'optimization',
    'agent-2',
    { limit: 3 }
  );
  console.log(`Found ${contextResults.length} context matches:`);
  contextResults.forEach(result => {
    console.log(`  - ${result.key}: ${JSON.stringify(result.value).substring(0, 50)}...`);
  });
  console.log();
  
  // 8. Export memory
  console.log('💾 Exporting memory state...');
  await memory.exportMemory('./memory-export.json');
  console.log('✅ Memory exported to memory-export.json\n');
  
  // Cleanup
  comm.unsubscribe(sub1);
  comm.unregisterAgent('agent-1');
  comm.unregisterAgent('agent-2');
  memory.stopOptimization();
  
  console.log('✨ Enhanced Memory System demonstration complete!');
}

// Run the demonstration
demonstrateMemoryFeatures().catch(console.error);