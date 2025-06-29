# Parallel Execution Guide for Gemini Flow

## Overview

Gemini Flow now supports true parallel execution using Node.js worker threads. This feature enables concurrent processing of multiple tasks, significantly improving performance for complex workflows.

## Key Features

- **Worker Thread Pool**: Efficient management of multiple worker threads
- **Priority-based Task Queue**: Tasks are executed based on priority levels
- **Dependency Management**: Respects task dependencies while maximizing parallelism
- **Automatic Retry**: Failed tasks are automatically retried with exponential backoff
- **Real-time Monitoring**: Track execution progress and performance metrics
- **Configurable Performance Profiles**: Choose from pre-configured performance settings

## Architecture

### Components

1. **ParallelExecutor**: Main orchestration engine for parallel execution
2. **WorkerPool**: Manages worker threads and task distribution
3. **TaskQueue**: Priority-based queue with dependency tracking
4. **Worker Script**: Executes tasks in isolated worker threads

### How It Works

```
┌─────────────────┐
│ ParallelExecutor│
└────────┬────────┘
         │
    ┌────▼─────┐
    │TaskQueue │
    └────┬─────┘
         │
   ┌─────▼──────┐
   │ WorkerPool │
   └─────┬──────┘
         │
   ┌─────▼─────────────────────┐
   │  Worker 1  Worker 2  ...  │
   └───────────────────────────┘
```

## Quick Start

### Enable Parallel Execution

```bash
# Enable parallel mode
./gemini-flow parallel enable

# Set number of workers
./gemini-flow parallel workers 8

# Check status
./gemini-flow parallel status
```

### Using Parallel Mode in Code

```typescript
// Create orchestrator with parallel mode enabled
const orchestrator = new Orchestrator(apiKey, todoManager, true);

// Or use autonomous agent with parallel execution
const agent = new AutonomousAgent(apiKey, true);
```

## Configuration

### Environment Variables

```bash
# Enable/disable parallel execution
PARALLEL_EXECUTION_ENABLED=true

# Maximum number of worker threads
PARALLEL_MAX_WORKERS=8

# Task timeout in milliseconds
PARALLEL_TASK_TIMEOUT=300000

# Number of retry attempts
PARALLEL_RETRY_ATTEMPTS=3

# Enable performance monitoring
PARALLEL_MONITORING=true

# Batch size for task processing
PARALLEL_BATCH_SIZE=10

# Memory limit per worker (MB)
PARALLEL_MEMORY_LIMIT=512
```

### Performance Profiles

Choose a pre-configured profile based on your needs:

```bash
# Conservative - Low resource usage
./gemini-flow parallel profile conservative

# Balanced - General purpose (default)
./gemini-flow parallel profile balanced

# Performance - High throughput
./gemini-flow parallel profile performance

# Maximum - Maximum performance (use with caution)
./gemini-flow parallel profile maximum
```

### Profile Specifications

| Profile | Workers | Timeout | Memory | Batch Size |
|---------|---------|---------|---------|-----------|
| Conservative | 2 | 10 min | 256 MB | 5 |
| Balanced | CPU/2 | 5 min | 512 MB | 10 |
| Performance | CPU | 3 min | 1 GB | 20 |
| Maximum | CPU×2 | 2 min | 2 GB | 50 |

## Usage Examples

### Example 1: Parallel Task Orchestration

```typescript
// Create tasks with dependencies
const tasks = [
  { id: 1, task: "Research topic A", agent: "researcher" },
  { id: 2, task: "Research topic B", agent: "researcher" },
  { id: 3, task: "Analyze results", agent: "analyzer", deps: [1, 2] },
  { id: 4, task: "Generate report", agent: "writer", deps: [3] }
];

// Tasks 1 & 2 run in parallel
// Task 3 waits for both to complete
// Task 4 runs after task 3
```

### Example 2: Direct Parallel Executor

```typescript
const executor = new ParallelExecutor({
  maxWorkers: 4,
  enableMonitoring: true
});

// Submit multiple tasks
const tasks = [
  { id: '1', type: 'gemini', priority: 10, data: {...} },
  { id: '2', type: 'analysis', priority: 8, data: {...} },
  { id: '3', type: 'tool', priority: 5, data: {...} }
];

const results = await executor.submitBatch(tasks);
```

### Example 3: Autonomous Agent with Dependencies

```typescript
const agent = new AutonomousAgent(apiKey, true);

await agent.execute(`
  Build a web scraper that:
  1. Fetches data from multiple sources concurrently
  2. Processes the data in parallel
  3. Aggregates results efficiently
  4. Generates a comprehensive report
`);
```

## Performance Benchmarking

Run the built-in benchmark to test parallel performance:

```bash
# Run benchmark with default settings
./gemini-flow parallel benchmark

# Custom benchmark (50 tasks, 8 workers)
./gemini-flow parallel benchmark -t 50 -w 8
```

### Expected Performance Gains

| Task Type | Sequential | Parallel (4 workers) | Speedup |
|-----------|-----------|---------------------|---------|
| I/O Bound | 10s | 3s | 3.3x |
| CPU Light | 8s | 2.5s | 3.2x |
| Mixed | 12s | 4s | 3.0x |

## Monitoring

### Real-time Monitoring

```bash
# Start the monitor
./gemini-flow parallel monitor
```

Displays:
- Active tasks
- Queued tasks
- Completed/Failed counts
- Average execution time

### Programmatic Monitoring

```typescript
executor.on('statsUpdate', (stats) => {
  console.log(`Active: ${stats.activeTasks}`);
  console.log(`Completed: ${stats.completedTasks}`);
});

executor.on('taskComplete', ({ task, result }) => {
  console.log(`Task ${task.id} completed`);
});
```

## Best Practices

### 1. Task Granularity
- Break large tasks into smaller, independent units
- Aim for tasks that take 10s-60s each
- Avoid tasks shorter than 1s (overhead)

### 2. Dependency Management
- Minimize dependencies between tasks
- Group related tasks to reduce coordination overhead
- Use batch operations where possible

### 3. Resource Management
- Monitor memory usage per worker
- Set appropriate timeouts for long-running tasks
- Use worker recycling for memory-intensive operations

### 4. Error Handling
- Implement idempotent tasks for safe retries
- Log errors comprehensively
- Use alternative approaches for critical tasks

### 5. Performance Tuning
- Start with balanced profile
- Monitor and adjust based on workload
- Consider system resources and other processes

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   ```bash
   # Reduce workers and memory limit
   ./gemini-flow parallel workers 2
   PARALLEL_MEMORY_LIMIT=256
   ```

2. **Tasks Timing Out**
   ```bash
   # Increase timeout
   PARALLEL_TASK_TIMEOUT=600000  # 10 minutes
   ```

3. **Poor Performance**
   - Check CPU utilization
   - Verify tasks are truly parallel
   - Review task dependencies

4. **Worker Crashes**
   - Check error logs
   - Reduce memory per worker
   - Enable worker recycling

### Debug Mode

Enable detailed logging:

```bash
DEBUG=parallel:* ./gemini-flow run "your task"
```

## Advanced Features

### Custom Worker Scripts

Create specialized workers for specific task types:

```javascript
// custom-worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', async (message) => {
  if (message.type === 'custom-task') {
    // Custom processing logic
    const result = await processCustomTask(message.data);
    parentPort.postMessage({ taskId: message.id, result });
  }
});
```

### Task Prioritization

```typescript
// Higher priority tasks execute first
const urgentTask = {
  id: 'urgent-1',
  type: 'analysis',
  priority: 10,  // Highest priority
  data: {...}
};

const normalTask = {
  id: 'normal-1',
  type: 'analysis', 
  priority: 5,   // Normal priority
  data: {...}
};
```

### Conditional Execution

```typescript
// Execute tasks based on previous results
const result1 = await executor.submitTask(task1);

if (result1.success) {
  await executor.submitTask(task2);
} else {
  await executor.submitTask(alternativeTask);
}
```

## Performance Metrics

Track key metrics to optimize performance:

1. **Task Throughput**: Tasks completed per minute
2. **Worker Utilization**: % time workers are busy
3. **Queue Length**: Average tasks waiting
4. **Execution Time**: Average task duration
5. **Memory Usage**: Per-worker memory consumption

## Integration with Existing Features

### Memory System
- Tasks can share data through the Memory system
- Results are automatically stored for dependent tasks

### Tool System
- All existing tools work in parallel mode
- File operations are thread-safe

### Agent Coordination
- Agents can work concurrently on independent tasks
- Results are aggregated efficiently

## Future Enhancements

- GPU acceleration for AI tasks
- Distributed execution across machines
- Advanced scheduling algorithms
- Real-time task migration
- Automatic performance optimization

## Conclusion

Parallel execution in Gemini Flow provides significant performance improvements for complex workflows. By leveraging worker threads and intelligent task scheduling, you can achieve near-linear speedup for many workloads.

Start with the balanced profile and adjust based on your specific needs. Monitor performance and optimize task granularity for best results.