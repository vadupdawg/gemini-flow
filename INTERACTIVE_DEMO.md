# Gemini Flow Interactive Mode Demo

## Starting Interactive Mode

Just like Claude Flow, Gemini Flow now stays running after you start it!

### Option 1: Start without arguments
```bash
./gemini-flow
```

### Option 2: Use interactive flag
```bash
./gemini-flow --interactive
# or
./gemini-flow -i
```

## What You'll See

```
   ╔════════════════════════════════════════════════╗
   ║                                                ║
   ║               ✨ Gemini Flow ✨                ║
   ║                                                ║
   ║      AI-Powered Development Orchestration      ║
   ║            Powered by Google Gemini            ║
   ║                                                ║
   ╚════════════════════════════════════════════════╝

ℹ Interactive mode - Type "help" for commands or "exit" to quit

gemini-flow > 
```

## Available Commands in Interactive Mode

### Get Help
```
gemini-flow > help
```

### Run SPARC Commands
```
gemini-flow > sparc "Build a REST API"
gemini-flow > sparc run coder "Implement user authentication"
gemini-flow > sparc modes
```

### Run Swarm Commands
```
gemini-flow > swarm "Create e-commerce site" --strategy development
gemini-flow > swarm "Analyze performance" --monitor
```

### System Commands
```
gemini-flow > status
gemini-flow > memory list
gemini-flow > memory store "key" "value"
```

### Utility Commands
```
gemini-flow > clear    # Clear the screen
gemini-flow > exit     # Exit interactive mode
```

## Key Features

1. **Persistent Session**: No need to restart after each command
2. **Beautiful Prompt**: Google blue colored prompt
3. **Quote Support**: Use quotes for multi-word arguments
4. **Error Handling**: Graceful error messages
5. **Clean Exit**: Use exit or Ctrl+C to leave

## Example Session

```
gemini-flow > sparc modes
[Shows list of 20 SPARC modes]

gemini-flow > sparc "Create a TODO app"
[Runs orchestrator mode with animated spinner]

gemini-flow > status
[Shows system status with emoji indicators]

gemini-flow > exit
ℹ Goodbye! 👋
```

Now you can use Gemini Flow just like Claude Flow - start it once and keep working!