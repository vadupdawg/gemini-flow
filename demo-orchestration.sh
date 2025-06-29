#!/bin/bash
# Demo script for new orchestration features

echo "🎯 Gemini Flow Enhanced Orchestration Demo"
echo "=========================================="
echo ""
echo "This demo showcases the new swarm and auto commands"
echo "with enhanced orchestration capabilities."
echo ""

# Demo 1: Auto mode for quick task
echo "1️⃣ Demo: Auto mode for a simple task"
echo "Command: ./gf auto \"Create a hello world REST API\""
echo ""
echo "This will:"
echo "- Analyze the task critically"
echo "- Create a master todo list"
echo "- Spawn up to 3 agents per iteration"
echo "- Each agent gets specific todos"
echo "- Collect reports and iterate"
echo ""
read -p "Press Enter to run this demo..."
./gf auto "Create a hello world REST API" --max-agents 2

echo ""
echo "----------------------------------------"
echo ""

# Demo 2: Swarm mode for complex project
echo "2️⃣ Demo: Swarm mode for complex orchestration"
echo "Command: ./gf swarm \"Build a todo list application\" --max-agents 5 --monitor"
echo ""
echo "This will:"
echo "- Perform critical analysis of the objective"
echo "- Create todo lists for up to 5 specialized agents"
echo "- Execute tasks with progress monitoring"
echo "- Collect and aggregate reports"
echo "- Generate creative insights and new tasks"
echo ""
read -p "Press Enter to run this demo..."
./gf swarm "Build a todo list application" --max-agents 5 --monitor

echo ""
echo "✅ Demo complete!"
echo ""
echo "Check the memory/auto and memory/swarm directories for detailed reports."