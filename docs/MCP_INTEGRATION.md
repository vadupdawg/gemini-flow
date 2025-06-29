# MCP Integration: Bridging Gemini Flow and Claude Code

## Overview

Gemini Flow now supports Model Context Protocol (MCP) integration, enabling seamless communication between Gemini's 1M token context window and Claude Code. This creates a powerful collaboration where:

- **Gemini** handles large context analysis, entire codebase processing, and memory-intensive tasks
- **Claude** provides sophisticated reasoning, code generation, and refinement
- **Both** work together through MCP for optimal results

## Key Features

### 1. Gemini MCP Server
Exposes Gemini's capabilities to Claude Code:
- **1M Token Context Window**: Process massive documents and codebases
- **Autonomous Agents**: Execute complex multi-step tasks
- **Semantic Memory**: Persistent storage with intelligent search
- **Parallel Execution**: True multi-agent parallel processing

### 2. Claude Code MCP Client
Connect from Gemini Flow to Claude Code:
- Call Claude's advanced reasoning tools
- Leverage Claude's code generation capabilities
- Collaborative analysis with context handoff

## Installation

1. Install dependencies:
```bash
npm install
npm run build
```

2. Set up environment variables:
```bash
# .env file
GEMINI_API_KEY=your_gemini_api_key
CLAUDE_API_KEY=your_claude_api_key  # Optional for client
```

## Usage

### Starting the MCP Server

Make Gemini's capabilities available to Claude Code:

```bash
# Start MCP server
./gemini-flow mcp start

# The server exposes these tools:
# - analyze_large_context
# - process_codebase
# - autonomous_execute
# - semantic_memory_search
# - store_in_memory
```

### Connecting to Claude Code

```bash
# Connect to Claude Code's MCP server
./gemini-flow mcp connect

# Check connection status
./gemini-flow mcp status
```

### Collaborative Analysis

Process large content with Gemini, refine with Claude:

```bash
# Analyze a large file
./gemini-flow mcp collaborate "Analyze this codebase architecture" --file large-doc.pdf

# Analyze entire directory
./gemini-flow mcp collaborate "Find security vulnerabilities" --directory ./src

# The workflow:
# 1. Gemini processes the full context (up to 1M tokens)
# 2. Gemini provides comprehensive analysis
# 3. Claude refines and enhances the analysis
# 4. Results are saved with both perspectives
```

### Direct Tool Calls

Call Claude tools from Gemini Flow:

```bash
# Call a specific Claude tool
./gemini-flow mcp call-claude "code_generation" '{"prompt": "Create a REST API", "language": "typescript"}'
```

## Claude Code Configuration

To use Gemini Flow from Claude Code, add to your Claude Code MCP config:

```json
{
  "mcpServers": {
    "gemini-flow": {
      "command": "npx",
      "args": ["gemini-flow", "mcp", "start"],
      "env": {
        "GEMINI_API_KEY": "${GEMINI_API_KEY}"
      }
    }
  }
}
```

## Use Cases

### 1. Large Document Analysis
```bash
# Gemini handles the full document, Claude provides insights
./gemini-flow mcp collaborate "Summarize this 500-page report" --file report.pdf
```

### 2. Codebase Understanding
```bash
# Gemini processes all files, Claude suggests improvements
./gemini-flow mcp collaborate "Modernize this legacy codebase" --directory ./legacy-app
```

### 3. Cross-Model Memory
```javascript
// From Claude Code:
await mcp.call('gemini-flow', 'store_in_memory', {
  key: 'project_context',
  value: { /* large context data */ },
  tags: ['architecture', 'decisions']
});

// Later, search from either system:
await mcp.call('gemini-flow', 'semantic_memory_search', {
  query: 'architecture decisions'
});
```

## Architecture

```
┌─────────────────┐         MCP          ┌─────────────────┐
│   Claude Code   │◄──────────────────────►│  Gemini Flow   │
│                 │                        │                 │
│ • Reasoning     │                        │ • 1M Context    │
│ • Refinement    │                        │ • Parallel Exec │
│ • Code Gen      │                        │ • Memory System │
└─────────────────┘                        └─────────────────┘
         │                                          │
         └──────────────┐      ┌───────────────────┘
                        │      │
                   ┌────┴──────┴────┐
                   │ Shared Memory  │
                   │ Persistent Data│
                   └────────────────┘
```

## Advanced Features

### Parallel Processing
```javascript
// Gemini processes multiple large files in parallel
const results = await mcp.call('gemini-flow', 'autonomous_execute', {
  objective: 'Analyze all PDFs in directory',
  parallelExecution: true
});
```

### Memory Synchronization
Both systems share a unified memory space:
- Store from either system
- Search across all stored data
- Persistent across sessions

### Context Bridging
- Send large context to Gemini for initial processing
- Pass condensed insights to Claude for reasoning
- Combine results for comprehensive output

## Best Practices

1. **Use Gemini for**:
   - Large file/codebase analysis
   - Parallel task execution
   - Memory-intensive operations
   - Semantic search across large datasets

2. **Use Claude for**:
   - Complex reasoning tasks
   - Code generation and refinement
   - Natural language understanding
   - Decision making

3. **Use Both Together for**:
   - Analyzing large codebases with intelligent suggestions
   - Processing extensive documentation with actionable insights
   - Building systems that require both scale and sophistication

## Troubleshooting

### Connection Issues
```bash
# Check if MCP server is running
ps aux | grep "gemini-flow mcp"

# View logs
./gemini-flow mcp status

# Test connection
./gemini-flow mcp connect
```

### API Key Issues
Ensure both API keys are set:
```bash
export GEMINI_API_KEY=your_key
export CLAUDE_API_KEY=your_key  # For client features
```

### Memory Permissions
```bash
# Ensure memory directory exists
mkdir -p ./memory

# Check permissions
ls -la ./memory
```

## Future Enhancements

- Streaming large context processing
- Real-time collaboration mode
- Automatic context optimization
- Cross-model agent coordination
- Unified debugging interface

---

For more information, see the main [Gemini Flow documentation](../README.md).