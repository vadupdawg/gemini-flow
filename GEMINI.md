# Gemini Flow Configuration

This document provides the context for the Gemini Flow orchestration system. It outlines the available tools, workflows, and best practices to ensure efficient and effective multi-agent collaboration.

## Core Philosophy

Gemini Flow uses a multi-agent approach to solve complex software engineering tasks. Specialized agents, guided by specific prompts, work together to achieve a common goal. The `Orchestrator` manages the workflow, and the `Memory` component allows agents to share information.

## Available Commands

- `gemini-flow init`: Initializes a new project.
- `gemini-flow sparc "<prompt>"`: Runs a workflow with specialized agents.
  - `--parallel`: Executes agents concurrently.
- `gemini-flow swarm "<prompt>"`: Runs a workflow with a swarm of agents.
- `gemini-flow start`: Starts the web monitoring UI.

## SPARC Modes

SPARC modes are specialized roles for agents. Each mode has a corresponding prompt file in `.gemini/prompts/modes` that defines its behavior, goals, and constraints.

Available modes:
- `architect`: Designs system architecture and data models.
- `coder`: Implements features and writes code.

## Workflow Guidelines

1.  **Decomposition:** Break down complex problems into smaller, manageable tasks.
2.  **Specialization:** Assign each task to the most appropriate agent (e.g., `architect` for design, `coder` for implementation).
3.  **Memory:** Use the `Memory` to store critical information, decisions, and artifacts that need to be shared between agents.
4.  **Iteration:** Start with a simple workflow and iteratively add complexity.

## Best Practices

- Write clear and concise prompts for each task.
- Ensure prompt files for SPARC modes are detailed and specific.
- Use the web UI to monitor progress and identify bottlenecks.
