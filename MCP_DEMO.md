# MCP Integration Demo: Gemini + Claude

This demonstrates how Gemini Flow and Claude Code can work together through MCP (Model Context Protocol).

## Why This Matters

- **Gemini**: 1 million token context window - perfect for processing entire codebases, books, or massive datasets
- **Claude**: Advanced reasoning and code generation - ideal for analysis, refinement, and decision making
- **Together**: The best of both worlds!

## Quick Demo

### 1. Start Gemini MCP Server

In terminal 1:
```bash
./gemini-flow mcp start
```

This exposes these tools to Claude:
- `analyze_large_context` - Process up to 1M tokens
- `process_codebase` - Analyze entire projects
- `autonomous_execute` - Run complex multi-step tasks
- `semantic_memory_search` - Search persistent memory
- `store_in_memory` - Save data across sessions

### 2. Configure Claude Code

Add to Claude Code's MCP settings:
```json
{
  "mcpServers": {
    "gemini-flow": {
      "command": "node",
      "args": ["/path/to/gemini-flow/dist/mcp/server.js"],
      "env": {
        "GEMINI_API_KEY": "your-key"
      }
    }
  }
}
```

### 3. Use from Claude Code

Now Claude can call Gemini for large context tasks:

```javascript
// In Claude Code
const result = await useMCP('gemini-flow', 'process_codebase', {
  directory: '/path/to/large/project',
  task: 'Analyze architecture and find potential issues'
});
```

### 4. Collaborative Analysis

From Gemini Flow side:
```bash
# Analyze a 500MB log file with both models
./gemini-flow mcp collaborate "Find all errors and create fix plan" --file huge-log.txt

# Process entire codebase
./gemini-flow mcp collaborate "Modernize this legacy app" --directory ./legacy-app
```

## Real-World Example

Analyzing a large PDF with both models:

```bash
# Step 1: Gemini reads the entire 1000-page PDF
# Step 2: Gemini extracts key information using full context
# Step 3: Claude refines the analysis with advanced reasoning
# Step 4: Get combined insights from both

./gemini-flow mcp collaborate "Summarize legal document and identify risks" \
  --file contracts/merger-agreement.pdf
```

Output:
- Gemini's comprehensive extraction (using all 1000 pages)
- Claude's refined analysis and risk assessment
- Saved to: `collaboration_[timestamp].json`

## Memory Sharing

Both systems share persistent memory:

```bash
# From Gemini: Store large analysis
./gemini-flow memory store "project_analysis" "{...huge data...}"

# From Claude: Access the same data
await useMCP('gemini-flow', 'semantic_memory_search', {
  query: 'project analysis findings'
});
```

## Architecture

```
Claude Code (Advanced Reasoning) <--MCP--> Gemini Flow (1M Context)
     |                                              |
     +-------------- Shared Memory -----------------+
```

## Use Cases

1. **Code Migration**: Gemini analyzes entire legacy codebase, Claude plans the migration
2. **Document Analysis**: Gemini processes huge PDFs, Claude extracts actionable insights  
3. **Log Analysis**: Gemini finds patterns in GB of logs, Claude diagnoses issues
4. **Research**: Gemini reads all papers, Claude synthesizes findings

## Tips

- Use Gemini for scale, Claude for sophistication
- Store intermediate results in shared memory
- Enable parallel execution for faster processing
- Monitor progress with `--monitor` flag

This integration makes previously impossible tasks feasible by combining the strengths of both models!