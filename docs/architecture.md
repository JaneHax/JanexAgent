# Janex Architecture

## Overview

Janex is an autonomous multi-agent AI workspace for the terminal. It operates as a TUI (Terminal User Interface) application that can execute tools, browse the web, solve CAPTCHAs, and orchestrate multiple AI agents.

## System Components

```
┌──────────────────────────────────────────────────────┐
│                    TUI (Ink/React)                    │
│  ┌────────────────────────────────────────────────┐  │
│  │  CommandHandler → /help, /tools, /depth, etc   │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│                  JanexAgent (Core)                     │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │  Context   │  │  Router    │  │   Memory      │  │
│  │  (messages)│  │(multi-agent)│  │(sessions)     │  │
│  └────────────┘  └────────────┘  └───────────────┘  │
└──────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Providers   │  │ ToolRegistry │  │ SkillRegistry│
│  OpenAI/     │  │ 40+ tools:   │  │ 335 skills:  │
│  Anthropic   │  │ browser,file,│  │ bug-hunt,    │
│  Custom      │  │ git,research,│  │ trading,     │
│              │  │ osint,office,│  │ research,    │
│              │  │ deploy,cloud │  │ council, etc │
└──────────────┘  └──────────────┘  └──────────────┘
          │               │               │
          ▼               ▼               ▼
┌──────────────────────────────────────────────────────┐
│                     Runtime Layer                     │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │   MCP      │  │  Gateway   │  │   Plugins     │  │
│  │ (protocol) │  │Discord/TG/  │  │browser-enhance│  │
│  │            │  │   WhatsApp │  │captcha-resolver│ │
│  └────────────┘  └────────────┘  └───────────────┘  │
└──────────────────────────────────────────────────────┘
```

## Data Flow

1. **User Input** → TUI captures keystrokes
2. **Command Check** → CommandHandler checks for `/` prefix
3. **Routing** → MultiAgentRouter decides single/multi-agent
4. **Agent Loop** → Calls provider → executes tools → returns response
5. **Memory** → Session persisted to `~/.janex/sessions/`
6. **UI Update** → Message rendered with timestamp + role prefix

## Key Design Decisions

- **TypeScript strict mode** — type safety across all modules
- **Tool-based architecture** — all capabilities exposed as tools
- **Skill system** — markdown-based skills loaded at runtime
- **Provider abstraction** — OpenAI/Anthropic/custom via unified interface
- **Session persistence** — JSON files in `~/.janex/sessions/`
- **No database** — file-based storage for simplicity

## Directory Structure

```
src/
├── agent/        # Core agent loop, context, config, memory
├── cli/          # TUI (Ink), command handler, slash commands
├── gateway/      # Discord, Telegram, WhatsApp bots
├── mcp/          # Model Context Protocol client/registry
├── providers/    # OpenAI, Anthropic adapters
├── skills/       # Skill registry + loader
├── tools/        # 40+ tool implementations
│   ├── browser/  # Playwright + CAPTCHA
│   ├── research/ # Search, scrape, social, HAR capture
│   ├── osint/    # DNS, WHOIS, username
│   ├── office/   # PDF, Excel, Email
│   ├── deploy/   # Docker, Vercel, Cloudflare
│   └── cloud/    # VPS/SSH
├── utils/        # Logger, retry, logo, sanitize
├── plugins/      # Plugin system
├── rules/        # Permission system
└── hooks/        # Event hooks

skills/           # 335 skill markdown files
scripts/          # Build, deploy, har-capture
```

## Configuration

- **File**: `~/.janex/config.yaml`
- **Env vars**: `Janex_PROVIDER`, `Janex_API_KEY`, `Janex_BASE_URL`, `Janex_MODEL`
- **Validation**: baseUrl, model required on startup

## Extending Janex

### Add a new tool
1. Create `src/tools/<category>/<tool>.ts`
2. Export class with methods
3. Import + register in `src/tools/index.ts`

### Add a new skill
1. Create `skills/<name>/SKILL.md` with YAML frontmatter
2. Add description + tags
3. Restart Janex — auto-loaded

### Add a new provider
1. Create `src/providers/<provider>.ts`
2. Implement `ChatProvider` interface
3. Add case in `getProvider()`
