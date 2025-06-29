#!/usr/bin/env node

import { AutonomousAgentV2 } from '../core/AutonomousAgentV2';
import { ErrorRecovery } from '../core/ErrorRecovery';
import { RetryStrategy } from '../core/RetryStrategy';
import { LearningSystem } from '../core/LearningSystem';
import { KnowledgeBase } from '../core/KnowledgeBase';
import { ui } from '../core/UI';

/**
 * Demonstration of Gemini Flow's resilience and learning capabilities
 */
async function demonstrateResilience() {
  ui.header('Gemini Flow Resilience Demo', 'Showcasing self-healing and learning capabilities');
  
  const apiKey = process.env.GEMINI_API_KEY || '';
  
  // Initialize systems
  const agent = new AutonomousAgentV2(apiKey);
  const errorRecovery = new ErrorRecovery(apiKey);
  const retryStrategy = new RetryStrategy();
  const learningSystem = new LearningSystem(apiKey);
  const knowledgeBase = new KnowledgeBase(apiKey);
  
  // Demo 1: Error Recovery
  ui.section('Demo 1: Self-Healing Error Recovery');
  await demonstrateErrorRecovery(errorRecovery);
  
  // Demo 2: Smart Retry Strategies
  ui.section('Demo 2: Intelligent Retry Strategies');
  await demonstrateRetryStrategies(retryStrategy);
  
  // Demo 3: Learning System
  ui.section('Demo 3: ML-Inspired Learning');
  await demonstrateLearningSystem(learningSystem);
  
  // Demo 4: Knowledge Base Analytics
  ui.section('Demo 4: Knowledge Base Intelligence');
  await demonstrateKnowledgeBase(knowledgeBase);
  
  // Demo 5: Full Autonomous Execution
  ui.section('Demo 5: Resilient Autonomous Execution');
  await demonstrateAutonomousExecution(agent);
  
  ui.success('Resilience demonstration completed!');
}

/**
 * Demonstrate error recovery capabilities
 */
async function demonstrateErrorRecovery(errorRecovery: ErrorRecovery) {
  ui.subsection('Simulating various error scenarios');
  
  const errorScenarios = [
    {
      error: new Error('API rate limit exceeded'),
      context: {
        task: 'Fetch data from API',
        agent: 'data-fetcher',
        timestamp: new Date()
      }
    },
    {
      error: new Error('Out of memory: heap allocation failed'),
      context: {
        task: 'Process large dataset',
        agent: 'analyzer',
        timestamp: new Date()
      }
    },
    {
      error: new Error('Task too complex to execute'),
      context: {
        task: 'Build entire application in one step',
        agent: 'builder',
        timestamp: new Date()
      }
    }
  ];
  
  for (const scenario of errorScenarios) {
    ui.info(`\nTesting error: ${scenario.error.message}`);
    
    const recovery = await errorRecovery.handleError(
      scenario.error,
      scenario.context as any
    );
    
    if (recovery.success) {
      ui.success(`✓ Recovered using strategy: ${recovery.strategy}`);
      if (recovery.alternativeTask) {
        ui.dim(`  Alternative: ${recovery.alternativeTask}`);
      }
    } else {
      ui.warning(`✗ Recovery failed: ${recovery.message}`);
    }
    
    // Show recommendations
    const recommendations = errorRecovery.getRecommendations(scenario.error);
    if (recommendations.length > 0) {
      ui.dim('  Recommendations:');
      recommendations.forEach(r => ui.dim(`    • ${r}`));
    }
  }
  
  // Show error trends
  const trends = errorRecovery.analyzeErrorTrends();
  ui.info(`\nError Analytics: ${trends.totalErrors} errors, ${(trends.recoveryRate * 100).toFixed(1)}% recovery rate`);
}

/**
 * Demonstrate retry strategies
 */
async function demonstrateRetryStrategies(retryStrategy: RetryStrategy) {
  ui.subsection('Testing adaptive retry mechanisms');
  
  // Simulate a flaky task
  let attemptCount = 0;
  const flakyTask = async () => {
    attemptCount++;
    ui.dim(`  Attempt ${attemptCount}`);
    
    if (attemptCount < 3) {
      throw new Error('Network timeout');
    }
    return 'Success!';
  };
  
  // Test adaptive retry
  const result = await retryStrategy.executeWithAdaptiveRetry(
    flakyTask,
    'network-operation'
  );
  
  if (result.success) {
    ui.success(`✓ Task succeeded after ${result.attempts} attempts (${result.totalTime}ms total)`);
  } else {
    ui.error(`✗ Task failed after ${result.attempts} attempts`);
  }
  
  // Show retry analytics
  const analytics = retryStrategy.getAnalytics();
  ui.info('\nRetry Analytics:');
  ui.dim(`  Total tasks: ${analytics.overallStats.totalTasks}`);
  ui.dim(`  Success rate: ${(analytics.overallStats.successRate * 100).toFixed(1)}%`);
  ui.dim(`  Retry success rate: ${(analytics.overallStats.retrySuccessRate * 100).toFixed(1)}%`);
  
  if (analytics.recommendations.length > 0) {
    ui.dim('  Recommendations:');
    analytics.recommendations.forEach(r => ui.dim(`    • ${r}`));
  }
}

/**
 * Demonstrate learning system
 */
async function demonstrateLearningSystem(learningSystem: LearningSystem) {
  ui.subsection('Recording execution patterns and learning');
  
  // Record some sample learnings
  const learnings = [
    {
      context: { task: 'Parse JSON data', agent: 'parser', objective: 'Data processing' },
      action: { type: 'parse', parameters: { format: 'json' } },
      outcome: { success: true, duration: 1500 }
    },
    {
      context: { task: 'Parse XML data', agent: 'parser', objective: 'Data processing' },
      action: { type: 'parse', parameters: { format: 'xml' } },
      outcome: { success: false, duration: 3000, error: 'Invalid XML structure' }
    },
    {
      context: { task: 'Parse JSON data', agent: 'parser', objective: 'Data processing' },
      action: { type: 'parse', parameters: { format: 'json', streaming: true } },
      outcome: { success: true, duration: 800 }
    }
  ];
  
  for (const learning of learnings) {
    await learningSystem.recordLearning(learning as any);
  }
  
  // Make prediction
  const prediction = await learningSystem.predict({
    task: 'Parse JSON data from API',
    agent: 'parser',
    objective: 'Data processing'
  });
  
  ui.info('\nAI Prediction:');
  ui.success(`  Action: ${prediction.action}`);
  ui.dim(`  Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
  ui.dim('  Reasoning:');
  prediction.reasoning.forEach(r => ui.dim(`    • ${r}`));
  
  // Show insights
  const insights = learningSystem.getInsights();
  ui.info('\nLearning Insights:');
  ui.dim(`  Total learnings: ${insights.totalLearnings}`);
  ui.dim(`  Patterns identified: ${insights.patternCount}`);
  ui.dim(`  Overall success rate: ${(insights.successRate * 100).toFixed(1)}%`);
  
  if (insights.topPatterns.length > 0) {
    ui.dim('  Top patterns:');
    insights.topPatterns.slice(0, 3).forEach(p => 
      ui.dim(`    • ${p.name}: ${(p.successRate * 100).toFixed(1)}% success`)
    );
  }
}

/**
 * Demonstrate knowledge base
 */
async function demonstrateKnowledgeBase(knowledgeBase: KnowledgeBase) {
  ui.subsection('Analyzing execution history and generating insights');
  
  // Add some knowledge
  knowledgeBase.addKnowledge({
    category: 'best-practice',
    subject: 'API Rate Limiting',
    content: 'Use exponential backoff with jitter for API rate limits. Initial delay: 1s, max: 60s',
    metadata: {
      source: 'learned-from-experience',
      confidence: 0.9,
      verified: true,
      usageCount: 15,
      tags: ['api', 'rate-limit', 'retry'],
      relatedEntries: []
    }
  });
  
  // Query knowledge
  const relatedKnowledge = knowledgeBase.getRelatedKnowledge('Handle API rate limits', 3);
  
  if (relatedKnowledge.length > 0) {
    ui.info('\nRelated Knowledge Found:');
    relatedKnowledge.forEach(k => {
      ui.success(`  • ${k.subject}`);
      ui.dim(`    ${k.content.substring(0, 100)}...`);
      ui.dim(`    Confidence: ${(k.metadata.confidence * 100).toFixed(0)}%`);
    });
  }
  
  // Analyze history
  const analysis = await knowledgeBase.analyzeHistory();
  
  ui.info('\nExecution Analysis:');
  ui.dim(`  ${analysis.summary}`);
  
  if (analysis.trends.length > 0) {
    ui.dim('\n  Trends:');
    analysis.trends.forEach(t => 
      ui.dim(`    • ${t.name}: ${t.direction} (${(t.significance * 100).toFixed(0)}% significant)`)
    );
  }
  
  if (analysis.recommendations.length > 0) {
    ui.dim('\n  Top Recommendations:');
    analysis.recommendations.slice(0, 3).forEach(r => {
      ui.dim(`    • [${r.priority.toUpperCase()}] ${r.action}`);
      ui.dim(`      Rationale: ${r.rationale}`);
    });
  }
}

/**
 * Demonstrate full autonomous execution
 */
async function demonstrateAutonomousExecution(agent: AutonomousAgentV2) {
  ui.subsection('Executing complex objective with full resilience');
  
  const objective = 'Create a simple REST API with error handling and tests';
  
  try {
    await agent.execute(objective);
  } catch (error) {
    ui.error(`Execution failed: ${(error as Error).message}`);
    ui.info('But the system learned from this failure and will perform better next time!');
  }
}

// Error simulation helpers
class SimulatedError extends Error {
  constructor(message: string, public recoverable: boolean = true) {
    super(message);
    this.name = 'SimulatedError';
  }
}

// Run the demo
if (require.main === module) {
  demonstrateResilience().catch(error => {
    ui.error(`Demo failed: ${error.message}`);
    process.exit(1);
  });
}

export { demonstrateResilience };