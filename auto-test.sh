#!/bin/bash

# Quick test script for auto command with better settings

# Disable parallel execution to avoid worker errors
export DISABLE_PARALLEL_EXECUTION=true

# Set a shorter timeout for testing
export TASK_TIMEOUT=30000

# Disable the spinner to see actual output
export NO_SPINNER=true

echo "🚀 Testing Gemini Flow Auto Command"
echo "=================================="
echo ""

# Run with a simple test
node dist/index.js auto "Create a simple hello world function in JavaScript" --dry-run

echo ""
echo "✅ Test completed!"