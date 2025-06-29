# Fix for Worker Errors

If you're seeing spam of worker errors like:
```
[WorkerPool] Worker 492 error: Cannot find module '/path/to/dist/core/worker.js'
```

## Quick Fix

### Option 1: Disable Parallel Execution (Immediate fix)
```bash
export DISABLE_PARALLEL_EXECUTION=true
./gemini-flow auto "your task"
```

### Option 2: Rebuild the Project (Permanent fix)
```bash
# Make sure you're in the gemini-flow directory
cd /path/to/your/gemini-flow

# Rebuild to copy worker.js files
npm run build

# Test it
./gemini-flow auto "test task"
```

### Option 3: Add to .env file (Permanent disable)
Create or edit `.env` file:
```
DISABLE_PARALLEL_EXECUTION=true
```

## What Changed

1. **Circuit Breaker Added**: The worker pool now stops creating workers after 5 consecutive errors
2. **Build Script Updated**: Now copies `.js` files to dist directory
3. **Environment Variable**: Can disable parallel execution with `DISABLE_PARALLEL_EXECUTION=true`
4. **Fallback Mode**: Automatically falls back to sequential execution on worker errors

## Benefits of Each Mode

- **Parallel Mode**: Faster execution for multiple tasks (requires worker.js)
- **Sequential Mode**: More stable, no worker dependencies, slightly slower

The system works perfectly fine in sequential mode for most tasks!