#!/bin/bash
# Gemini Flow Quick Launcher

# Check if we want chat mode (default if no args)
if [[ $# -eq 0 ]] || [[ "$1" == "chat" ]] || [[ "$1" == "c" ]]; then
    exec node "$(dirname "$0")/gemini-chat.js"
fi

# Check if we want to use simple mode
if [[ "$1" == "simple" ]] || [[ "$1" == "s" ]]; then
    shift
    node "$(dirname "$0")/gemini-simple.js" "$@"
    exit 0
fi

# Check for enhanced auto command
if [[ "$1" == "auto" ]] || [[ "$1" == "a" ]]; then
    shift
    exec node "$(dirname "$0")/gemini-auto.js" "$@"
fi

# Check for enhanced swarm command
if [[ "$1" == "swarm" ]] || [[ "$1" == "sw" ]]; then
    shift
    exec node "$(dirname "$0")/gemini-swarm.js" "$@"
fi

# Otherwise use the full gemini-flow
export DISABLE_PARALLEL_EXECUTION=true
exec ./gemini-flow "$@"