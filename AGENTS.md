# AGENTS.md — Janex

This file guides AI coding agents working on the **Janex** project.

## Project Identity

Janex is an autonomous multi-agent AI workspace for the terminal.
It is modeled after Janex but rewritten from scratch as Janex.

Public npm package: **janex**
CLI binary: **janex**
Config dir: **~/.janex/**
Browser profile: **~/.janex-browser-profile**

## Architecture

- `src/agent/` — Agent loop, context, config, memory, research pipeline, multi-agent runtime
- `src/cli/` — OpenTUI React interface, command palette, input/output panels
- `src/gateway/` — Discord / Telegram / WhatsApp gateway
- `src/mcp/` — MCP client, registry, catalog, tool adapter
- `src/providers/` — OpenAI-compatible, Anthropic-compatible, and custom provider adapters
- `src/skills/` — Local skill registry and loader
- `src/tools/` — Browser, terminal, file ops, git, research, OSINT, office, deploy, cloud, etc.
- `src/utils/` — Update check, terminal sanitization, base URL helpers, ASCII logo
- `skills/` — Local skill tree (bug-hunt, trading, social-research, deep-research, council, osint, finance, creative, utility, security, engineering, research, automation)
- `bin/` — CLI launcher
- `scripts/` — Build and deploy scripts
- `contexts/` — Context templates
- `hooks/` — Event hooks
- `rules/` — Session/project rules
- `plugins/` — Plugin system
- `mcp-configs/` — MCP server presets
- `scaffolds/` — IDE scaffolds

## Dev Commands

- `npm run build` — Compile TypeScript via `scripts/build.cjs`
- `npm run dev` — Run `src/index.tsx` via `tsx`
- `npm run start` — Run built app from `dist/index.js`
- `npm run lint` — ESLint on `src/**/*.ts`
- `npm run format` — Prettier

## Coding Conventions

- TypeScript strict mode
- No comments unless explicitly requested
- Use existing libraries and utilities
- Follow existing file naming patterns
- Never commit secrets or keys
- Verify with lint/typecheck before finishing
