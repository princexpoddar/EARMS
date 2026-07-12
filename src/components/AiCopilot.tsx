"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface Message {
  id: string;
  sender: "user" | "copilot";
  text: string;
}

// Helper to render markdown-like structures (tables, bullets, bold text)
export function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split("\n");
  const parsedElements: React.ReactNode[] = [];
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const renderText = (str: string) => {
    // Bold parsing
    const parts = str.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-extrabold text-foreground">{part}</strong>;
      }
      // Inline code formatting
      const codeParts = part.split(/`(.*?)`/g);
      return codeParts.map((cp, cIndex) => {
        if (cIndex % 2 === 1) {
          return <code key={cIndex} className="bg-secondary px-1.5 py-0.5 rounded font-mono text-[10px] text-primary">{cp}</code>;
        }
        return cp;
      });
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Check table row
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      const columns = trimmed.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      
      // Ignore separator rows (like | :--- | :--- |)
      if (trimmed.includes("---")) {
        return;
      }

      if (tableHeaders.length === 0) {
        tableHeaders = columns;
      } else {
        tableRows.push(columns);
      }
      return;
    } else if (inTable) {
      // Table ended, push table element
      parsedElements.push(
        <div key={`table-${idx}`} className="my-3 overflow-x-auto border border-border rounded-lg max-w-full">
          <table className="min-w-full divide-y divide-border text-[11px]">
            <thead className="bg-muted/50">
              <tr>
                {tableHeaders.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-bold text-muted-foreground uppercase tracking-wider">{renderText(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card/40">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-muted/20">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 whitespace-nowrap text-foreground font-medium">{renderText(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }

    // List items
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      parsedElements.push(
        <ul key={idx} className="list-disc pl-5 my-1.5 space-y-1">
          <li className="text-xs leading-relaxed text-muted-foreground">{renderText(trimmed.substring(2))}</li>
        </ul>
      );
      return;
    }

    // Heading 3
    if (trimmed.startsWith("### ")) {
      parsedElements.push(
        <h4 key={idx} className="text-xs font-black uppercase text-primary tracking-wider mt-4 mb-2">{renderText(trimmed.substring(4))}</h4>
      );
      return;
    }

    // Paragraph
    if (trimmed) {
      parsedElements.push(
        <p key={idx} className="text-xs leading-relaxed my-1.5 text-muted-foreground">{renderText(trimmed)}</p>
      );
    }
  });

  // Flush table if file ends
  if (inTable && tableHeaders.length > 0) {
    parsedElements.push(
      <div key={`table-end`} className="my-3 overflow-x-auto border border-border rounded-lg max-w-full">
        <table className="min-w-full divide-y divide-border text-[11px]">
          <thead className="bg-muted/50">
            <tr>
              {tableHeaders.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-bold text-muted-foreground uppercase tracking-wider">{renderText(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card/40">
            {tableRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-muted/20">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 whitespace-nowrap text-foreground font-medium">{renderText(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div className="space-y-0.5">{parsedElements}</div>;
}

const QUICK_CHIPS = [
  "Show all laptops assigned to HR",
  "Who currently has AST-0005?",
  "List overdue assets",
  "Show pending maintenance requests",
  "Show idle assets",
  "Who has the highest number of allocated assets?",
  "How many bookings are today?",
  "Generate an operational summary",
];

export default function AiCopilot() {
  const { user } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "copilot",
      text: `Hello ${user?.name || "there"}! I am your **AI Asset Copilot**. 

I query your live database records safely. Try asking me one of the quick prompts or type your own below!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, sender: "user", text: textToSend }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { id: `copilot-${Date.now()}`, sender: "copilot", text: data.markdown },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: `err-${Date.now()}`, sender: "copilot", text: `⚠️ **Error**: ${data.error || "Failed to process query."}` },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, sender: "copilot", text: "⚠️ **Connection Error**: Check your local dev server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-45 h-13 w-13 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        title="AI Asset Copilot"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
        </span>
      </button>

      {/* Expandable Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-45 w-[380px] sm:w-[480px] max-w-[calc(100vw-40px)] h-[580px] max-h-[calc(100vh-120px)] rounded-2xl border border-border bg-card/85 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Chat Header */}
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-foreground tracking-tight">AI Asset Copilot</h3>
                <span className="text-[9px] font-semibold text-emerald-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  Live Sync (SQLite)
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-normal ${
                    m.sender === "user"
                      ? "bg-primary text-primary-foreground font-medium rounded-tr-none shadow-sm"
                      : "bg-muted/50 border border-border/80 text-foreground rounded-tl-none"
                  }`}
                >
                  {m.sender === "user" ? (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  ) : (
                    <MarkdownRenderer text={m.text} />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted/50 border border-border/80 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground tracking-wide uppercase animate-pulse">
                    Parsing live query...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick chips (Static helpers) */}
          <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none border-t border-border/40 bg-muted/10 shrink-0">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="px-2.5 py-1 bg-secondary hover:bg-muted text-[10px] text-muted-foreground hover:text-foreground font-semibold rounded-full border border-border/60 transition cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Form Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 border-t border-border bg-muted/30 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me: Who currently has AST-0005?"
              className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-primary/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-primary text-primary-foreground hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:scale-100 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
