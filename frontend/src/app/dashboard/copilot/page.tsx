"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { copilotApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Bot, Send, Sparkles, MessageCircle, Lightbulb, Copy, Loader2, User,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);

    try {
      for await (const chunk of copilotApi.chat(text)) {
        if (chunk.type === "content" && chunk.text) {
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, content: m.content + chunk.text } : m)
          );
        }
        if (chunk.type === "done") break;
        if (chunk.type === "error") {
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, content: "Sorry, something went wrong. Please try again." } : m)
          );
          break;
        }
      }
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, content: "Connection failed. Make sure you're logged in and the server is running." } : m)
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="animate-fade-in mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Copilot</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Ask about submissions, projects, budget, or development priorities
            <br />Disclaimer: Kindly wait for ateast 1-2 minute after one query.
          </p>
        </div>
        <Badge variant="info" size="sm" className="ml-auto">
          <Sparkles className="h-3 w-3 mr-1" /> RAG + Gemini Flash
        </Badge>
      </div>

      {/* Messages Area */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="h-12 w-12 text-primary-300 mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">How can I help?</h3>
              <p className="text-sm text-[var(--text-tertiary)] mt-1 max-w-md">
                I can answer questions about citizen submissions, project priorities, budget utilization, and more.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
                {[
                  "What should I prioritize this quarter?",
                  "Which villages have the greatest healthcare deficit?",
                  "Show me top 5 projects by citizen demand",
                  "How much budget is remaining for water projects?",
                  "Summarize submissions from Pindra block",
                  "Compare infrastructure scores across villages",
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setInput(example)}
                    className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:border-primary-400 hover:text-primary-600 transition-colors"
                  >
                    <Lightbulb className="inline h-3 w-3 mr-1" />
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={cn(
                "max-w-[75%] rounded-xl px-4 py-2.5",
                msg.role === "user"
                  ? "bg-primary-600 text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]"
              )}>
                <p className="text-sm whitespace-pre-wrap">{msg.content || (streaming ? "..." : "")}</p>
                {msg.role === "assistant" && msg.content && (
                  <button onClick={() => copyMessage(msg.content)} className="mt-1 text-[10px] text-[var(--text-tertiary)] hover:text-primary-500 flex items-center gap-1">
                    <Copy className="h-2.5 w-2.5" /> Copy
                  </button>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
                  <User className="h-4 w-4 text-[var(--text-secondary)]" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[var(--border-primary)] p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about submissions, projects, budget..."
              rows={1}
              className="flex-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              icon={streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            >
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
