# 🤖 Gemini Chat - Interactive Conversation Mode

Finally! A proper interactive chat mode for Gemini Flow, just like Claude Code!

## 🚀 Quick Start

```bash
# Just run without arguments:
./gf

# Or explicitly:
./gf chat
```

## 💬 What Makes It Special

This is a **real conversation mode** that:
- ✅ **Stays running** - No more exiting after each question!
- ✅ **Remembers context** - Full conversation history
- ✅ **Beautiful formatting** - Syntax highlighting for code
- ✅ **Persists sessions** - Continue where you left off
- ✅ **Smart commands** - Built-in helpers

## 🎯 Example Session

```
╭─────────────────────────────────────────╮
│                                         │
│        🤖 Gemini Chat Mode 🤖          │
│                                         │
│   Interactive AI Conversation System    │
│                                         │
╰─────────────────────────────────────────╯

💬 You: How do I create a REST API?

🤖 Gemini: 
Here's how to create a REST API:

**1. Choose your framework:**
• Express.js (Node.js)
• FastAPI (Python)
• Spring Boot (Java)

**2. Basic Express example:**
```javascript
const express = require('express');
const app = express();

app.get('/api/users', (req, res) => {
  res.json({ users: [...] });
});
```

💬 You: Can you add authentication?

🤖 Gemini:
Sure! Here's how to add JWT authentication...

[conversation continues...]
```

## 📚 Commands

While in chat mode:

| Command | Description |
|---------|-------------|
| `help` | Show all commands |
| `clear` | Clear screen (keeps history) |
| `reset` | Start new conversation |
| `history` | Show full conversation |
| `save` | Save session now |
| `exit` | Exit chat mode |

## 🎨 Features

### Syntax Highlighting
- Code blocks are automatically colored
- Inline `code` is highlighted
- **Bold text** stands out
- Lists are formatted nicely

### Persistent History
- Auto-saves every 5 messages
- Resume previous conversations
- Export chat history anytime

### Smart Context
- Gemini remembers the entire conversation
- Ask follow-up questions naturally
- Build on previous responses

## 💾 Where Data is Stored

- Session history: `memory/chat-session.json`
- Auto-backups: Every 5 messages
- Manual saves: Use `save` command

## 🔧 Configuration

Set in your `.env` file:
```
GEMINI_API_KEY=your-api-key-here
```

## 🎯 Use Cases

Perfect for:
- **Coding help**: Interactive debugging sessions
- **Learning**: Ask follow-up questions
- **Brainstorming**: Develop ideas over time
- **Documentation**: Build docs conversationally
- **Problem solving**: Work through issues step-by-step

## 🚀 Tips

1. **Start simple**: Just run `./gf` 
2. **Be conversational**: Talk naturally
3. **Use context**: Reference previous messages
4. **Save important chats**: Use the `save` command
5. **Reset when needed**: `reset` for fresh start

---

This is what the `auto` command should have been - a proper interactive experience! 🎉