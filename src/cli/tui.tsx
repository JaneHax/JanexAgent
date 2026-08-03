// @ts-nocheck
import React, { useState, useCallback, useRef } from 'react';
import { render, Box, Text, useInput, useApp, Newline } from 'ink';
import { JanexAgent } from '../agent/agent.js';
import { AgentContext } from '../agent/context.js';
import { JanexConfig } from '../agent/Config.js';
import { toolRegistry } from '../tools/index.js';
import { skillRegistry } from '../skills/registry.js';
import { AgentMemory } from '../agent/memory.js';
import { slashCommands, formatCommands } from './commands.js';
import { CommandHandler } from './command-handler.js';
import { pluginManager } from '../plugins/index.js';
import { browserEnhancePlugin } from '../plugins/browser-enhance.js';
import { captchaResolverPlugin } from '../plugins/captcha-resolver.js';

const MAX_HISTORY = 200;

const COLORS = {
  primary: 'cyan',
  secondary: 'magenta',
  success: 'green',
  warning: 'yellow',
  error: 'red',
  dim: 'gray',
  user: 'green',
  assistant: 'white',
  system: 'cyan',
  tool: 'yellow',
  border: 'gray'
};

const JANEX_LOGO = `
 ██╗ █████╗ ██╗  ██╗██████╗  ██████╗ ██╗    ██╗███╗   ██╗███████╗██████╗
 ██║██╔══██╗██║  ██║██╔══██╗██╔═══██╗██║    ██║████╗  ██║██╔════╝██╔══██╗
 ██║███████║███████║██████╔╝██║   ██║██║ █╗ ██║██╔██╗ ██║█████╗  ██████╔╝
 ██║██╔══██║██╔══██║██╔══██╗██║   ██║██║███╗██║██╔╚██╗██║██╔══╝  ██╔══██╗
 ██║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝██║ ╚████║███████╗██║  ██║
 ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝`;

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool' | 'error';
  content: string;
  timestamp: number;
}

export class JanexCLI {
  private agent: JanexAgent | null = null;
  private context: AgentContext | null = null;
  private config: JanexConfig | null = null;
  private inputHistory: string[] = [];
  private historyIndex = -1;

  async start(): Promise<void> {
    this.config = await loadConfig();
    const context = new AgentContext();
    const memory = new AgentMemory();

    toolRegistry.registerAll(this.config);
    await skillRegistry.loadAll();

    pluginManager.register(browserEnhancePlugin);
    pluginManager.register(captchaResolverPlugin);
    await pluginManager.initAll();

    this.agent = new JanexAgent({
      config: this.config,
      context,
      toolRegistry,
      skillRegistry,
      memory
    });

    this.context = context;

    const initialMessages: Message[] = [];
    const latestId = await memory.getLatestSessionId();
    if (latestId) {
      const session = await memory.loadSession(latestId);
      if (session && session.messages.length > 0) {
        for (const msg of session.messages) {
          initialMessages.push({
            role: msg.role as Message['role'],
            content: msg.content,
            timestamp: msg.timestamp || Date.now()
          });
        }
      }
    }

    const TUI = () => {
      const { exit } = useApp();
      const [input, setInput] = useState('');
      const [messages, setMessages] = useState<Message[]>(initialMessages);
      const [thinking, setThinking] = useState(false);
      const [showHelp, setShowHelp] = useState(false);
      const [status, setStatus] = useState('Ready');
      const [inputHistory, setInputHistory] = useState<string[]>([]);
      const [historyIdx, setHistoryIdx] = useState(-1);
      const [sessionId] = useState(() => context.getSessionId().slice(0, 8));

      const addMessage = useCallback((msg: Message) => {
        setMessages(prev => {
          const next = [...prev, msg];
          return next.slice(-MAX_HISTORY);
        });
      }, []);

      const commandHandlerRef = useRef<CommandHandler | null>(null);
      if (!commandHandlerRef.current) {
        commandHandlerRef.current = new CommandHandler({
          config: this.config!,
          toolRegistry,
          skillRegistry,
          memory,
          addMessage,
          setStatus
        });
      }

      const processInput = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const handler = commandHandlerRef.current;
        if (!handler) return;

        const handled = await handler.handle(trimmed);
        if (handled) {
          const now = Date.now();
          const sysMsgs = messages.filter(m => m.role === 'system' && m.timestamp > now - 1000);
          if (sysMsgs.length > 0) {
            const lastSys = sysMsgs[sysMsgs.length - 1];
            if (lastSys.content === '__CLEAR__') {
              setMessages([]);
              setStatus('Context cleared');
              setInput('');
              return;
            }
            if (lastSys.content === '__RESET__') {
              context.reset();
              setMessages([]);
              setStatus('Session reset');
              setInput('');
              return;
            }
          }
          setInput('');
          return;
        }

        setInputHistory(prev => [...prev, trimmed]);
        setHistoryIdx(-1);

        setThinking(true);
        setStatus('Thinking...');

        try {
          const response = await this.agent!.processMessage(trimmed);
          addMessage({ role: 'user', content: trimmed, timestamp: Date.now() });
          addMessage({ role: 'assistant', content: response, timestamp: Date.now() });
          setStatus('Ready');
        } catch (error: any) {
          addMessage({ role: 'user', content: trimmed, timestamp: Date.now() });
          addMessage({ role: 'error', content: `Error: ${error.message}`, timestamp: Date.now() });
          setStatus('Error');
        }

        setThinking(false);
        setInput('');
      }, [addMessage, context, messages, this.agent]);

      useInput(async (text, key) => {
        if (showHelp) {
          if (key.return || key.escape) {
            setShowHelp(false);
            return;
          }
          return;
        }

        if (key.ctrl && text === 'c') {
          exit();
          return;
        }

        if (key.return) {
          await processInput(input);
          return;
        }

        if (key.upArrow) {
          const newIdx = historyIdx < inputHistory.length - 1 ? historyIdx + 1 : historyIdx;
          setHistoryIdx(newIdx);
          if (inputHistory[newIdx]) setInput(inputHistory[newIdx]);
          return;
        }

        if (key.downArrow) {
          const newIdx = historyIdx > 0 ? historyIdx - 1 : -1;
          setHistoryIdx(newIdx);
          setInput(newIdx === -1 ? '' : inputHistory[newIdx] || '');
          return;
        }

        if (key.tab) {
          const commands = slashCommands.map(c => c.name);
          const matching = commands.filter(c => c.startsWith(input.toLowerCase()));
          if (matching.length > 0) {
            setInput('/' + matching[0] + ' ');
          }
          return;
        }

        if (text) {
          setInput(prev => prev + text);
        }
      });

      const renderMessage = (msg: Message, idx: number) => {
        const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        let roleColor = COLORS.assistant;
        let prefix = '';

        if (msg.role === 'user') {
          roleColor = COLORS.user;
          prefix = '❯ ';
        } else if (msg.role === 'system') {
          roleColor = COLORS.system;
          prefix = '⚙ ';
        } else if (msg.role === 'tool') {
          roleColor = COLORS.tool;
          prefix = '🔧 ';
        } else if (msg.role === 'error') {
          roleColor = COLORS.error;
          prefix = '✖ ';
        } else {
          prefix = '◆ ';
        }

        return (
          <Box key={idx} flexDirection="column" marginBottom={1}>
            <Box>
              <Text color={roleColor} bold>{prefix}</Text>
              <Text color={COLORS.dim} dimColor>{time}</Text>
            </Box>
            <Box marginLeft={2}>
              <Text wrap="wrap">{msg.content}</Text>
            </Box>
          </Box>
        );
      };

      const renderHelp = () => (
        <Box flexDirection="column" padding={1}>
          <Text color={COLORS.primary} bold>JANEX Commands</Text>
          <Newline />
          <Text>{formatCommands()}</Text>
          <Newline />
          <Text color={COLORS.dim}>Press any key to close</Text>
        </Box>
      );

      const renderStatusBar = () => {
        if (!this.config) return null;
        const toolCount = toolRegistry.list().length;
        const skillCount = skillRegistry.list().length;
        const model = this.config.model || 'unknown';
        const provider = this.config.provider || 'unknown';
        const depth = this.config.researchMode || 'low';

        return (
          <Box borderStyle="single" borderColor={COLORS.border} paddingX={1}>
            <Box flexGrow={1}>
              <Text color={COLORS.primary} bold>JANEX</Text>
              <Text color={COLORS.dim}> | {provider} | {model} | depth:{depth}</Text>
            </Box>
            <Box>
              <Text color={COLORS.dim}>tools:{toolCount} skills:{skillCount} | {sessionId}...</Text>
            </Box>
            <Box marginLeft={2}>
              <Text color={thinking ? COLORS.warning : COLORS.success} bold>
                {thinking ? '● THINKING' : '○ READY'}
              </Text>
            </Box>
          </Box>
        );
      };

      return (
        <Box flexDirection="column" padding={0}>
          <Box flexDirection="column" padding={1}>
            <Box marginBottom={1}>
              <Text color={COLORS.primary} bold>{JANEX_LOGO}</Text>
            </Box>

            <Box marginBottom={1}>
              <Text color={COLORS.secondary} bold>Autonomous Multi-Agent AI Workspace</Text>
            </Box>

            {showHelp && renderHelp()}

            {!showHelp && messages.map((msg, i) => renderMessage(msg, i))}

            {thinking && (
              <Box marginBottom={1}>
                <Text color={COLORS.warning}>⟳ Processing...</Text>
              </Box>
            )}

            {!showHelp && (
              <Box marginTop={1}>
                <Text color={COLORS.primary} bold>{'>'}</Text>
                <Text color={COLORS.dim}>{' '}</Text>
                <Text>{input}</Text>
                <Text color={COLORS.dim} inverse>{'\u2588'}</Text>
              </Box>
            )}
          </Box>

          {renderStatusBar()}
        </Box>
      );
    };

    await render(<TUI />);
  }

  async showStatus(): Promise<void> {
    if (!this.config) {
      this.config = await loadConfig();
    }
    console.log(`Model: ${this.config?.model}`);
    console.log(`Provider: ${this.config?.provider}`);
    console.log(`Research: ${this.config?.researchMode}`);
  }

  async continueLatest(): Promise<void> {
    const memory = new AgentMemory();
    const id = await memory.getLatestSessionId();
    if (!id) {
      console.log('No previous session found');
      return;
    }
    const session = await memory.loadSession(id);
    if (session) {
      this.context = new AgentContext(session.id);
    }
  }

  async resume(id: string): Promise<void> {
    const memory = new AgentMemory();
    const session = await memory.loadSession(id);
    if (session) {
      this.context = new AgentContext(session.id);
    } else {
      console.log('Session not found');
    }
  }

  stop(): void {
    this.agent?.stop();
  }
}

async function loadConfig(): Promise<JanexConfig> {
  const { loadConfig } = await import('../../agent/config.js');
  return loadConfig();
}

