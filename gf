#!/bin/bash
# Gemini Flow Quick Launcher

# Check if we want to use simple mode
if [[ "$1" == "simple" ]] || [[ "$1" == "s" ]]; then
    shift
    node "$(dirname "$0")/gemini-simple.js" "$@"
    exit 0
fi

# Check for auto command issues
if [[ "$1" == "auto" ]]; then
    echo "⚠️  The auto command has JSON parsing issues. Using simple mode instead..."
    shift
    node "$(dirname "$0")/gemini-simple.js" "$@"
    exit 0
fi

# Otherwise use the full gemini-flow
export DISABLE_PARALLEL_EXECUTION=true
exec ./gemini-flow "$@"