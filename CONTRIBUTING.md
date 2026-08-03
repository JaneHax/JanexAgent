# Contributing to Janex

Thank you for your interest in contributing to Janex! This document provides guidelines and instructions for contributing.

## How to Contribute

### Reporting Bugs

- Search existing issues before opening a new one
- Use the bug report template
- Include steps to reproduce, expected behavior, and actual behavior
- Include system info: Node.js version, OS, Janex version

### Suggesting Features

- Search existing issues and discussions first
- Use the feature request template
- Explain the use case and why it's valuable
- Consider if it fits Janex's scope (terminal AI agent workspace)

### Pull Requests

1. Fork the repo and create your branch from `main`
2. Make your changes following the coding conventions in AGENTS.md
3. Add tests if applicable
4. Ensure `npm run lint` passes
5. Submit PR with clear description

## Development Setup

```bash
git clone https://github.com/<your-username>/janex.git
cd janex
npm install
npm run build
npm link
```

## Coding Conventions

- TypeScript strict mode
- No comments unless explicitly requested
- Follow existing file naming patterns
- Use existing libraries and utilities
- Never commit secrets or keys
- Verify with `npm run lint` before finishing

## Code of Conduct

This project adheres to the Contributor Covenant Code of Conduct. See CODE_OF_CONDUCT.md.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
