# Gemini Flow 🚀

**A hobby project exploring the power of Gemini AI and Claude Code**

> ⚠️ **Disclaimer**: This project is heavily inspired by and based on [Claude Flow](https://github.com/ruvnet/claude-code-flow). It's a personal experiment to test the capabilities of Google's Gemini AI using similar patterns and concepts. This is NOT an official project and should be viewed as a learning exercise and tribute to the excellent work done on Claude Flow.

## About This Project

Gemini Flow is an experimental port of Claude Flow's concepts to work with Google's Gemini AI. It demonstrates how powerful AI orchestration patterns can be adapted across different AI providers. This project exists to:

- Test Gemini AI's capabilities in multi-agent scenarios
- Explore AI orchestration patterns
- Learn from and appreciate the architecture of Claude Flow
- Provide a playground for experimenting with AI-driven development workflows

## 🌟 Features

- **20+ SPARC Development Modes**: Specialized AI agents for coding, testing, debugging, architecture, and more
- **Multi-Agent Swarm Coordination**: Orchestrate multiple AI agents working in parallel
- **Persistent Memory System**: Store and retrieve context across sessions
- **Task Management**: Track and manage complex workflows with dependencies
- **Real-time Monitoring**: Monitor agent activities and system status
- **MCP Integration**: Connect with Claude Code to leverage Gemini's 1M token context window
- **Extensible Architecture**: Easy to add new commands, modes, and capabilities

## 📋 Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Google Gemini API key

## 🛠️ Installation

### From GitHub

```bash
# Clone the repository
git clone https://github.com/vadupdawg/gemini-flow.git
cd gemini-flow

# Install dependencies
npm install

# Build the project
npm run build

# Set up your Gemini API key
export GEMINI_API_KEY="your-api-key-here"

# Run Gemini Flow
./gemini-flow --help
```

### Quick Setup Script

```bash
# One-liner installation
git clone https://github.com/vadupdawg/gemini-flow.git && cd gemini-flow && npm install && npm run build
```

## 🔑 Configuration

### API Key Setup

Gemini Flow requires a Google Gemini API key. Set it as an environment variable:

```bash
export GEMINI_API_KEY="your-api-key-here"
```

Or create a `.env` file in the project root:

```env
GEMINI_API_KEY=your-api-key-here
```

### Optional: Add to PATH

For global access, add the gemini-flow directory to your PATH:

```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$PATH:/path/to/gemini-flow"
```

## 🚀 Quick Start

### Basic Commands

```bash
# Show all available commands
./gemini-flow --help

# Check system status
./gemini-flow status

# List available SPARC modes
./gemini-flow sparc modes
```

### SPARC Development Modes

Run specialized AI agents for different tasks:

```bash
# Run the default orchestrator mode
./gemini-flow sparc "Build a REST API with authentication"

# Run specific SPARC modes
./gemini-flow sparc run coder "Implement user authentication"
./gemini-flow sparc run tester "Write unit tests for auth module"
./gemini-flow sparc run architect "Design microservices architecture"

# Test-Driven Development mode
./gemini-flow sparc tdd "Shopping cart feature with checkout"
```

### Multi-Agent Swarm Coordination

Coordinate multiple agents for complex tasks:

```bash
# Research swarm
./gemini-flow swarm "Research modern web frameworks" \
  --strategy research \
  --mode distributed \
  --max-agents 5 \
  --parallel

# Development swarm
./gemini-flow swarm "Build e-commerce platform" \
  --strategy development \
  --mode hierarchical \
  --max-agents 8 \
  --monitor

# Analysis swarm with output
./gemini-flow swarm "Analyze codebase performance" \
  --strategy analysis \
  --output json
```

### Memory Management

Store and retrieve information across sessions:

```bash
# Store data
./gemini-flow memory store "project_specs" "E-commerce platform with React and Node.js"

# Retrieve data
./gemini-flow memory get "project_specs"

# List all stored keys
./gemini-flow memory list

# Export memory for backup
./gemini-flow memory export backup.json

# Import memory from file
./gemini-flow memory import backup.json
```

### MCP Integration with Claude Code

Bridge Gemini's 1M token context window with Claude Code:

```bash
# Start MCP server to expose Gemini capabilities
./gemini-flow mcp start

# Connect to Claude Code
./gemini-flow mcp connect

# Collaborative analysis (Gemini + Claude)
./gemini-flow mcp collaborate "Analyze this large codebase" --directory ./src

# The workflow:
# 1. Gemini processes full context (up to 1M tokens)
# 2. Claude refines the analysis
# 3. Get combined insights from both models
```

See [MCP Integration Guide](docs/MCP_INTEGRATION.md) for detailed setup.

### Agent Management

```bash
# Spawn a new agent
./gemini-flow agent spawn researcher --name "market_analyst"

# List active agents
./gemini-flow agent list
```

## 📚 Available SPARC Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `orchestrator` | Default mode for complex multi-step tasks | General project coordination |
| `coder` | Focused on implementation and coding | Writing new features |
| `researcher` | Information gathering and analysis | Technical research |
| `tdd` | Test-driven development workflow | Building with tests first |
| `architect` | System design and architecture | Planning system structure |
| `reviewer` | Code review and quality assessment | PR reviews, audits |
| `debugger` | Bug fixing and troubleshooting | Solving issues |
| `tester` | Test creation and validation | Writing test suites |
| `analyzer` | Performance and code analysis | Optimization |
| `optimizer` | Code and performance optimization | Improving efficiency |
| `documenter` | Documentation generation | Creating docs |
| `designer` | UI/UX and system design | Interface design |
| `innovator` | Creative problem solving | Novel solutions |
| `devops` | Infrastructure and deployment | CI/CD, deployment |
| `security-reviewer` | Security analysis | Security audits |

## 🔧 Advanced Usage

### Workflow Automation

Create complex workflows by chaining commands:

```bash
# Research → Design → Implement → Test workflow
./gemini-flow sparc run researcher "Best practices for JWT authentication"
./gemini-flow sparc run architect "Design secure auth system"
./gemini-flow sparc tdd "JWT authentication module"
./gemini-flow sparc run security-reviewer "Audit authentication implementation"
```

### Integration with Development Tools

```bash
# Save SPARC output to file
./gemini-flow sparc run documenter "Generate API documentation" --output docs/api.md

# Use with version control
./gemini-flow sparc run reviewer "Review changes in feature branch" | tee review.md
git add review.md
git commit -m "Add code review feedback"
```

## 🏗️ Project Structure

```
gemini-flow/
├── src/
│   ├── commands/        # CLI command implementations
│   ├── core/           # Core components (Agent, Memory, Orchestrator)
│   ├── agents/         # Agent type definitions
│   └── templates/      # SPARC mode prompts
├── dist/              # Compiled JavaScript
├── memory/            # Persistent storage
└── gemini-flow        # CLI executable
```

## 🧪 Development

### Running Tests

```bash
npm test
```

### Building from Source

```bash
# Install dependencies
npm install

# Run TypeScript compiler
npm run build

# Run linting
npm run lint

# Type checking
npm run typecheck
```

### Adding New SPARC Modes

1. Create a new prompt file in `src/templates/prompts/modes/`
2. Add the mode to the SPARC_MODES array in `src/commands/sparc.ts`
3. Rebuild the project

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments & Credits

### This project wouldn't exist without:

- **[Claude Flow](https://github.com/anthropics/claude-flow)** - The original implementation and inspiration for this entire project. Most concepts, commands, and architecture patterns are directly adapted from Claude Flow.
- **[Claude Code](https://claude.ai/code)** - Used to help port and adapt the concepts to work with Gemini AI
- **Google's Gemini AI** - The AI engine powering this experimental version
- **The open source community** - For making projects like this possible

### Important Note

This is a **hobby project** created to explore and learn. If you're looking for a production-ready AI orchestration tool, please check out the original [Claude Flow](https://github.com/anthropics/claude-flow). 

The goal here is purely educational: to understand how AI orchestration works and to test if similar patterns can work across different AI providers. All credit for the innovative concepts goes to the Claude Flow team.

## 🐛 Troubleshooting

### Common Issues

**"GEMINI_API_KEY is not set"**
- Ensure you've exported your API key: `export GEMINI_API_KEY="your-key"`

**"Command not found: gemini-flow"**
- Run with `./gemini-flow` from the project directory
- Or add the directory to your PATH

**"Module not found" errors**
- Run `npm install` to install dependencies
- Run `npm run build` to compile TypeScript

## 📞 Support

Since this is a hobby project:
- Feel free to create issues, but please understand this is maintained in spare time
- PRs and contributions are welcome if you want to experiment
- For production use cases, consider using [Claude Flow](https://github.com/anthropics/claude-flow) instead

---

An experimental project built with ❤️ to explore AI orchestration patterns
