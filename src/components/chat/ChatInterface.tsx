"use client";

import { useChat } from "ai/react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User } from "lucide-react";

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({ api: "/api/chat" });

  return (
    <div className="flex flex-col h-full max-h-[600px] rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Bot className="w-5 h-5 text-primary" />
        <span className="font-semibold text-sm">AI Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 justify-start"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl px-4 py-2">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t">
        <input
          className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          value={input}
          placeholder="Ask anything..."
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
