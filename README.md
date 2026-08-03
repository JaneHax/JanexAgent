# Janex

> Autonomous multi-agent AI workspace in your terminal.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >=18](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)

Janex is an open-source terminal AI agent that goes beyond chat. It can inspect and edit real files, run shell commands, perform cited research, solve CAPTCHAs, generate PDFs and reports, and coordinate multiple agents under one runtime.

Instead of a single chatbot, Janex behaves like an AI command center: it exposes real-world capabilities as tools, loads skills at runtime, and can operate from your terminal or through **Discord, Telegram, and WhatsApp** gateways.

---

## What can Janex do?

Janex ships with **40+ tools** and **335+ skills** organized in categories such as bug hunting, trading, social research, deep research, OSINT, finance, security, and engineering.

### Core capabilities

- **Terminal-first TUI** — Full-screen Ink/React interface with command palette, session browser, and streaming responses.
- **Real tool execution** — Read/write/edit files, run shell commands, SSH into VPS, manage git repos, execute browser automation.
- **Research pipeline** — Web search, forum scraping, social lookup, HAR capture, and cited deep research with multiple sources.
- **Office automation** — Generate PDFs, Excel, and slide decks from natural-language requests.
- **CAPTCHA bypass** — Built-in AudioCaptcha, reCAPTCHA, FunCaptcha, and external-solver routing.
- **Browser control** — Playwright-based browser with anti-bot handling, stealth, and session reuse.
- **Multi-provider** — OpenAI-compatible and Anthropic-compatible endpoints via a unified `ChatProvider` interface. Custom base URLs supported.
- **Gateway bots** — Deploy the same agent to Discord, Telegram, and WhatsApp without rewriting logic.
- **Skill system** — Markdown-based skills loaded at runtime. Add your own by dropping a `.md` into `skills/`.
- **Session memory** — Durable sessions with memory persistence under `~/.janex/`.
- **MCP support** — Model Context Protocol client, registry, and adapter for tool/server interoperability.

---

## Screenshots

> *Replace with your own terminal screenshot / demo GIF.*

```
Janex
Autonomous Multi-Agent AI Workspace in your terminal

> What is the current BTC price and explain the 24h trend?
[Tool: web_search] fetching market data...
[Tool: web_search] scraping exchange pages...
Janex > BTC is currently trading at $XX,XXX...
```

---

## Installation

```bash
npm install -g janex-agent
```

### Verify

```bash
janex --version
```

---

## Setup

Janex needs an LLM provider API key before it can chat.

```bash
janex setup
```

Setup asks for:

- Provider (`openai`, `anthropic`, or `custom`)
- API key
- Base URL (for custom / compatible endpoints)
- Model (e.g. `gpt-4o`, `claude-sonnet-4-20250514`, or any OpenAI-compatible model ID)

Config is stored in `~/.janex/config.yaml` by default.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `SUPABASE_MAIL_BASE` | *(required for mail gateway)* | Supabase temp-mail API URL |
| `MAIL_DOMAIN` | `jane.web.id` | Mail domain for gateway mail tools |
| `PORT` | `4000` | Port for local HTTP server / health endpoint |

Use `.env` in the project root for local development:

```bash
cp .env.example .env
# edit .env with your values
```

---

## Usage

```bash
janex
```

Lite mode for quick interactions:

```bash
janex lite
```

Available slash commands (Lite mode):

| Command | Description |
|---|---|
| `/help` | Show available commands |
| `/clear` | Clear current transcript |
| `/exit`, `/quit`, `/q` | Exit session |

From the full TUI:

| Shortcut / Command | Description |
|---|---|
| `/tools` | List registered tools |
| `/skills` | List loaded skills |
| `/depth <n>` | Set research depth |
| `/permissions <mode>` | Set permission mode (`ask`, `bypass`, `deny`) |
| `/reset` | Reset session |
| `/status` | Show model, provider, session info |

---

## Providers

Janex uses a unified `ChatProvider` interface. Built-in adapters:

- **OpenAI** (`openai`) — `gpt-4o`, `o3`, `o4-mini`, and any OpenAI-compatible endpoint.
- **Anthropic** (`anthropic`, `custom-anthropic`) — `claude-sonnet-4-20250514`, `claude-opus-4`, etc.
- **Custom** (`custom`) — Point to any OpenAI-compatible API by setting `baseUrl` + `apiKey`.

Pass a custom base URL to use non-official endpoints (e.g. local LLM servers, third-party proxies, Azure OpenAI).

---

## Skills

Skills are markdown files inside `skills/`. Janex loads them at runtime and injects their content into the agent context.

Built-in categories:

| Category | Examples |
|---|---|
| Engineering | bug-hunt, security, automation |
| Research | deep-research, research, social-research |
| Finance | trading, finance |
| OSINT | osint, username lookup, DNS, WHOIS |
| Creative | creative, council |
| Utility | api-discovery, har-capture, repo-scan |

Add your own skill by creating `skills/<category>/<skill-name>/SKILL.md`.

---

## Gateway

Run Janex as a bot on chat platforms. Configure in `~/.janex/config.yaml`:

```yaml
gateway:
  discord:
    enabled: true
    token: YOUR_DISCORD_BOT_TOKEN
  telegram:
    enabled: true
    token: YOUR_TELEGRAM_BOT_TOKEN
  whatsapp:
    enabled: true
```

Start the gateway:

```bash
janex gateway
```

The gateway exposes a curated allowlist of tools per platform, with permission modes and hooks.

---

## Architecture

```
User input (TUI / Discord / Telegram / WhatsApp)
        │
        ▼
  JanexAgent (core)
   ├─ Context       (messages, system prompt, session id)
   ├─ Router        (single vs multi-agent)
   ├─ Memory        (session persistence)
   └─ Provider      (OpenAI / Anthropic / custom)
        │
        ├── ToolRegistry (40+ tools: browser, file, git, osint, office, deploy, …)
        ├── SkillRegistry (335+ markdown skills)
        ├── PluginManager (browser-enhance, captcha-resolver, …)
        └── MCP / Gateway / Hooks
```

See [`docs/architecture.md`](docs/architecture.md) and [`AGENTS.md`](AGENTS.md) for details.

---

## Development

### Prerequisites

- Node.js `>= 18`
- npm `>= 9`
- (optional) Python `>= 3.9` for some skill/runtime scripts

### Clone and build

```bash
git clone https://github.com/JaneHax/JanexAgent.git
cd JanexAgent
npm install
npm run build
npm link
```

### Run in dev mode

```bash
npm run dev
```

### Run tests

```bash
npm test
```

### Lint

```bash
npm run lint
```

### CLI launcher

```bash
node bin/janex.js
```

---

## Roadmap

- [ ] Streaming provider responses in the terminal UI
- [ ] Persistent memory engine (currently a no-op stub)
- [ ] Full Discord / Telegram / WhatsApp gateway implementations
- [ ] Multi-agent orchestration with inter-agent messaging
- [ ] Plugin marketplace / skill registry server

See `CONTRIBUTING.md` for how to help.

---

## Contributing

PRs welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) first.

- Fork → branch from `main`
- Follow the conventions in `AGENTS.md`
- Add tests if applicable
- Run `npm run lint` before submitting
- No secrets or keys, ever

---

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).

---

## License

MIT — see [`LICENSE`](LICENSE).

---

## Links

- Repo: https://github.com/JaneHax/JanexAgent
- Issues: https://github.com/JaneHax/JanexAgent/issues
- Docs: [`docs/`](docs/)
- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Code of Conduct: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
