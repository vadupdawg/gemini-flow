# 🎯 Enhanced Orchestration Modes - Important Notes

## ⚠️ Important: Directory Location

Make sure you're running commands from the correct directory:
- **Correct**: `/Users/nielsvanderwerf/Projects/gemini-cli-flow/gemini-flow`
- **Wrong**: `/Users/nielsvanderwerf/Projects/gemini-trading-system/gemini-flow/gemini-flow`

The enhanced versions are only in the `gemini-cli-flow` project.

## 🐝 Swarm Mode - Multi-Agent Orchestration

The swarm mode now properly decomposes complex tasks into multiple specialized agents:

```bash
# Basic usage
./gf swarm "Build an image trading system where price increases with volume"

# With options
./gf swarm "Create e-commerce platform" --max-agents 8 --monitor --parallel
```

### How it works:
1. **Critical Analysis**: Breaks down your objective into major components
2. **Agent Specialization**: Creates agents like:
   - Backend API Developer
   - Database Engineer  
   - Frontend UI Developer
   - Testing Engineer
   - Security Specialist
3. **Task Distribution**: Each agent gets 4-8 specific tasks matching their expertise
4. **Report Aggregation**: Collects and synthesizes all agent work
5. **Creative Synthesis**: Finds connections and suggests improvements

## 🤖 Auto Mode - Iterative Task Execution

The auto mode now ensures complex tasks are properly decomposed:

```bash
# Basic usage
./gf auto "Create an image trading system with dynamic pricing"

# With options
./gf auto "Build social media platform" --max-agents 5 --interactive
```

### How it works:
1. **Task Analysis**: Identifies all components that need to be built
2. **Master Todo Creation**: Generates 10-15 specific tasks (not just one!)
3. **Agent Distribution**: Assigns tasks to specialized agents
4. **Iterative Refinement**: Up to 5 cycles of improvement
5. **Dynamic Adaptation**: Creates new tasks based on progress

## 📋 Example: Image Trading System

For a task like "Create an image trading system where price increases with volume", the system will now:

### Break it down into components:
- Database schema for images and trades
- API endpoints for trading operations
- Price calculation algorithm
- Frontend trading interface
- User authentication system
- Transaction history tracking
- Real-time price updates
- Testing suite
- Deployment configuration

### Create specialized agents:
- **Backend Developer**: API routes, business logic
- **Database Engineer**: Schema, queries, indexes
- **Frontend Developer**: UI components, user experience
- **Algorithm Developer**: Dynamic pricing logic
- **Testing Engineer**: Unit and integration tests

## 🚀 Tips for Best Results

1. **Be Specific**: The more detailed your objective, the better the decomposition
2. **Use --monitor**: See real-time progress of agents
3. **Use --parallel**: Speed up execution for independent tasks
4. **Check Memory**: Results are saved in `memory/swarm/` and `memory/auto/`

## 🔧 Troubleshooting

### "The auto command has JSON parsing issues"
You're likely in the wrong directory with an old version. Navigate to:
```bash
cd /Users/nielsvanderwerf/Projects/gemini-cli-flow/gemini-flow
```

### Missing dependencies
Make sure uuid is installed:
```bash
npm install uuid
```

### Rate limiting
The system includes delays between API calls. Use `--parallel` carefully with many agents.

## 💡 Best Practices

1. **Complex Tasks**: These modes excel at tasks requiring multiple components
2. **Simple Tasks**: For single-action tasks, use `./gf simple "task"`
3. **Conversations**: For interactive work, use `./gf chat`
4. **Memory**: Check `memory/` folders for detailed reports and results

Remember: The orchestrator is designed to think like a project manager, breaking down complex objectives into manageable pieces for specialized agents!