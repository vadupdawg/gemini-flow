# 🚀 Gemini Flow Quick Start

## 🎯 NEW: Interactive Chat Mode!

Start an ongoing conversation with Gemini, just like Claude Code:

```bash
# Start chat mode (3 ways):
./gf              # No arguments = chat mode
./gf chat         # Explicit chat command
./gf c            # Short version

# Or directly:
node gemini-chat.js
```

**Chat Features:**
- 💬 Continuous conversation (doesn't exit after each response)
- 📜 Conversation history (persists between sessions)
- 🎨 Formatted output with syntax highlighting
- 💾 Auto-save every 5 messages
- 🔄 Reset conversation anytime

**Chat Commands:**
- `help` - Show available commands
- `clear` - Clear screen (keeps history)
- `reset` - Start fresh conversation
- `history` - View conversation history
- `save` - Save current session
- `exit` - Exit chat mode

## ✅ Working Commands

### 1. Simple Task Execution (Recommended)
```bash
# Direct and reliable - no JSON parsing issues
./gf simple "Create a REST API with user authentication"
./gf s "Fix this bug in my code"

# Or directly:
node gemini-simple.js "Your task here"
```

### 2. SPARC Commands (Working)
```bash
# Run specific development modes
./gemini-flow sparc "Build a todo app"
./gemini-flow sparc run coder "Implement user login"
./gemini-flow sparc run tester "Write unit tests"
./gemini-flow sparc modes  # List all available modes
```

### 3. Memory Commands (Working)
```bash
# Store and retrieve data
./gemini-flow memory store "api_design" "REST API with JWT auth"
./gemini-flow memory get "api_design"
./gemini-flow memory list
```

### 4. Swarm Coordination (Partially Working)
```bash
# Multi-agent coordination (may have JSON issues)
./gemini-flow swarm "Build e-commerce site" --strategy development
```

### 5. MCP Integration (Experimental)
```bash
# Connect with Claude Code
./gemini-flow mcp start  # Start MCP server
./gemini-flow mcp status # Check status
```

## ⚠️ Known Issues

1. **Auto Command**: Has JSON parsing issues. Use `./gf simple` instead
2. **Worker Errors**: Set `DISABLE_PARALLEL_EXECUTION=true` in .env
3. **Interactive Mode**: May exit unexpectedly

## 🛠️ Troubleshooting

### If you get worker errors:
```bash
echo "DISABLE_PARALLEL_EXECUTION=true" >> .env
```

### If commands don't work:
```bash
# Rebuild the project
npm run build

# Use the simple version
./gf simple "your task"
```

### Test your setup:
```bash
# Test API connection
node test-simple.js
```

## 📝 Examples

```bash
# Quick coding task
./gf simple "Create a React component for user profile"

# Research task
./gemini-flow sparc run researcher "Best practices for API security"

# Code review
./gemini-flow sparc run reviewer "Review this authentication code"

# Testing
./gemini-flow sparc run tester "Write tests for login functionality"
```

## 💡 Tips

- Use `./gf simple` for quick, reliable results
- Use SPARC modes for specialized tasks
- Store important results in memory for later use
- The simple mode saves all responses to `memory/simple-tasks.json`

Happy coding! 🎉