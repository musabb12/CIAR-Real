'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Sparkles,
  Home,
  Lightbulb,
  Calculator,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  response: string;
  keywords: string[];
}

// ─── Simulated AI Responses ─────────────────────────────────────────────────

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Find Apartments',
    icon: <Home className="size-4" />,
    response:
      "I'd be happy to help you find apartments! Could you tell me your preferred location and budget? Our platform has properties in 60+ countries.",
    keywords: ['find', 'apartment', 'search', 'property', 'rent', 'buy', 'house'],
  },
  {
    label: 'Property Tips',
    icon: <Lightbulb className="size-4" />,
    response:
      'Here are my top tips:\n1. Set a realistic budget\n2. Research the neighborhood\n3. Check property documents\n4. Consider future resale value\n5. Get a professional inspection',
    keywords: ['tip', 'advice', 'guide', 'help', 'recommend'],
  },
  {
    label: 'Mortgage Help',
    icon: <Calculator className="size-4" />,
    response:
      'For the best mortgage rates, I recommend:\n1. Compare offers from multiple lenders\n2. Improve your credit score\n3. Save for a larger down payment\n4. Consider fixed vs variable rates',
    keywords: ['mortgage', 'loan', 'rate', 'finance', 'bank', 'interest'],
  },
  {
    label: 'Contact Agent',
    icon: <Users className="size-4" />,
    response:
      'You can browse our verified agents or contact a specific agent from any property page. Would you like me to redirect you to our agents directory?',
    keywords: ['agent', 'contact', 'broker', 'realtor', 'representative'],
  },
];

const DEFAULT_RESPONSES: string[] = [
  "That's a great question! While I'm an AI assistant with general knowledge, I'd recommend speaking with one of our verified real estate agents for personalized guidance on that topic. Would you like me to help you find one?",
  "I appreciate your interest! For detailed information on that, our property experts would be the best resource. In the meantime, feel free to explore our listings or ask me about apartment searches, property tips, or mortgage advice.",
  "Thanks for reaching out! I can help you with property searches, neighborhood insights, and general real estate advice. For specific questions, our agents are available to assist you directly.",
];

const GREETING_MESSAGE =
  "Hello! I'm your AI property assistant. How can I help you today? You can ask me about properties, neighborhoods, or get expert advice!";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function matchQuickAction(input: string): QuickAction | null {
  const normalized = input.toLowerCase().trim();
  for (const action of QUICK_ACTIONS) {
    if (action.keywords.some((kw) => normalized.includes(kw))) {
      return action;
    }
  }
  return null;
}

function getAIResponse(input: string): string {
  const match = matchQuickAction(input);
  if (match) return match.response;
  return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
}

function formatMessageContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    // Numbered items
    const numMatch = line.match(/^(\d+)\.\s(.+)/);
    if (numMatch) {
      return (
        <span key={i} className="block pl-1">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {numMatch[1]}.
          </span>{' '}
          {numMatch[2]}
        </span>
      );
    }
    return (
      <span key={i} className={i > 0 ? 'block mt-1' : 'block'}>
        {line}
      </span>
    );
  });
}

// ─── Typing Indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
        <Bot className="size-3.5 text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:bg-white/10 dark:shadow-none">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-2 rounded-full bg-emerald-500/60 dark:bg-emerald-400/50"
              animate={{
                y: [0, -6, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasGreetedRef = useRef(false);
  const isOpenRef = useRef(false);

  // Keep isOpenRef in sync with isOpen
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // ── Auto-scroll to bottom ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping, scrollToBottom]);

  // ── Send greeting on first open (called from toggleChat) ──
  const addGreeting = useCallback(() => {
    if (!hasGreetedRef.current) {
      hasGreetedRef.current = true;
      const greeting: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: GREETING_MESSAGE,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, []);

  // ── Focus input when chat opens ──
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  // ── Increment unread if chat is closed (used in message callbacks) ──
  const maybeIncrementUnread = useCallback(() => {
    if (!isOpenRef.current) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // ── Handle send message ──
  const handleSend = useCallback(
    (text?: string) => {
      const content = (text || inputValue).trim();
      if (!content || isTyping) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);

      // Simulate AI thinking delay
      const delay = 800 + Math.random() * 700;
      setTimeout(() => {
        const response = getAIResponse(content);
        const botMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
        maybeIncrementUnread();
      }, delay);
    },
    [inputValue, isTyping, maybeIncrementUnread]
  );

  // ── Handle quick action click ──
  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      if (isTyping) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: action.label,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      setTimeout(() => {
        const botMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: action.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
        maybeIncrementUnread();
      }, 1000);
    },
    [isTyping, maybeIncrementUnread]
  );

  // ── Toggle chat ──
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        // Closing chat: clear unread
        setUnreadCount(0);
      } else {
        // Opening chat: add greeting if first time
        addGreeting();
      }
      return !prev;
    });
  }, [addGreeting]);

  // ── Handle Enter key ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ── Determine if quick actions should be shown ──
  const showQuickActions = messages.length <= 1 && !isTyping;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* ── Chat Window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
            className="flex flex-col overflow-hidden rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl dark:border-white/10"
            style={{
              width: 'min(380px, calc(100vw - 3rem))',
              height: 'min(500px, calc(100vh - 8rem))',
            }}
          >
            {/* Glass background */}
            <div className="absolute inset-0 -z-10 bg-white/70 dark:bg-gray-900/70" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/40 to-transparent dark:from-emerald-950/20" />

            {/* ── Header ── */}
            <div className="relative flex shrink-0 items-center gap-3 border-b border-gray-200/50 bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 dark:border-gray-700/50">
              <div className="flex size-9 items-center justify-center rounded-full bg-white/20 shadow-inner backdrop-blur-sm">
                <Sparkles className="size-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  AI Property Assistant
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
                  </span>
                  <span className="text-xs text-white/80">Online</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="size-8 rounded-full text-white/90 hover:bg-white/20 hover:text-white"
                aria-label="Close chat"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* ── Messages Area ── */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(16,185,129,0.3) transparent',
              }}
            >
              {/* Welcome section shown when only greeting */}
              {showQuickActions && messages[0]?.role === 'assistant' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center gap-2 pb-2"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
                    <Bot className="size-6 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Powered by AI
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Chat Messages */}
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                    className={`flex items-end gap-2 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    {message.role === 'assistant' && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
                        <Bot className="size-3.5 text-white" />
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                        message.role === 'user'
                          ? 'rounded-br-md bg-gradient-to-r from-emerald-600 to-emerald-500 text-white'
                          : 'rounded-bl-md bg-white text-gray-700 dark:bg-gray-800/80 dark:text-gray-200'
                      }`}
                    >
                      {formatMessageContent(message.content)}
                    </div>

                    {/* User Avatar */}
                    {message.role === 'user' && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 shadow-sm">
                        <MessageCircle className="size-3 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              <AnimatePresence>
                {isTyping && <TypingIndicator />}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* ── Quick Actions ── */}
            <AnimatePresence>
              {showQuickActions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-t border-gray-200/30 px-3 py-2.5 dark:border-gray-700/30"
                >
                  <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Quick Actions
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition-all hover:scale-[1.03] hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-md active:scale-[0.98] dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/50"
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input Area ── */}
            <div className="shrink-0 border-t border-gray-200/30 bg-white/50 px-3 py-3 backdrop-blur-sm dark:border-gray-700/30 dark:bg-gray-900/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  disabled={isTyping}
                  className="h-9 flex-1 rounded-full border-gray-200 bg-white/80 px-4 text-sm shadow-sm placeholder:text-gray-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30 dark:border-gray-700 dark:bg-gray-800/80 dark:placeholder:text-gray-500 dark:focus-visible:border-emerald-500 dark:focus-visible:ring-emerald-500/30"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isTyping}
                  className="size-9 shrink-0 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send className="size-3.5" />
                </Button>
              </form>
              <p className="mt-1.5 text-center text-[10px] text-gray-400 dark:text-gray-500">
                AI assistant · Responses may not be accurate
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Action Button ── */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <button
          onClick={toggleChat}
          className="group relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 transition-shadow hover:shadow-xl hover:shadow-emerald-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        >
          {/* Pulse ring animation */}
          {!isOpen && (
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-20" />
          )}

          {/* Gradient overlay for depth */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-t from-black/10 to-transparent" />

          {/* Icon with transition */}
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="size-6 relative z-10" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative z-10"
              >
                <MessageCircle className="size-6" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unread badge */}
          <AnimatePresence>
            {unreadCount > 0 && !isOpen && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-900"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.div>
    </div>
  );
}
