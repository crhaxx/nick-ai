"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "ai";
  text: string;
};

type Theme = "dark" | "light";

const themeClasses: Record<Theme, Record<string, string>> = {
  dark: {
    bg: "bg-[#0d0d0d]",
    headerBg: "bg-[#0d0d0d]/80",
    headerBorder: "border-[#2a2a2a]",
    text: "text-[#f5f5f5]",
    textMuted: "text-[#888888]",
    textDim: "text-[#666666]",
    inputBg: "bg-[#1a1a1a]",
    inputBorder: "border-[#2a2a2a]",
    inputBorderHover: "hover:border-[#3a3a3a]",
    codeBlock: "bg-[#1a1a1a]",
    codeText: "text-[#e5e5e5]",
    codeInline: "bg-[#2a2a2a]",
    codeInlineText: "text-[#f97316]",
  },
  light: {
    bg: "bg-[#faf9f7]",
    headerBg: "bg-[#faf9f7]/80",
    headerBorder: "border-[#e7e5e3]",
    text: "text-[#1c1917]",
    textMuted: "text-[#78716c]",
    textDim: "text-[#a8a29e]",
    inputBg: "bg-white",
    inputBorder: "border-[#e7e5e3]",
    inputBorderHover: "hover:border-[#d6d3d1]",
    codeBlock: "bg-[#292524]",
    codeText: "text-[#faf9f7]",
    codeInline: "bg-[#f5f5f4]",
    codeInlineText: "text-[#be4d25]",
  },
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = themeClasses[theme];

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    const aiMessageId = messages.length + 1;

    try {
      setInput("");
      setIsLoading(true);
      
      setMessages((prev) => [...prev, { role: "user", text: userText }]);
      setMessages((prev) => [...prev, { role: "ai", text: "" }]);

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userText }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[aiMessageId]) {
            updated[aiMessageId] = {
              ...updated[aiMessageId],
              text: updated[aiMessageId].text + chunk,
            };
          }
          return updated;
        });
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error("Error sending message:", error.message || "An unknown error occurred.");
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[aiMessageId]) {
          updated[aiMessageId] = {
            role: "ai",
            text: `Failed to send. Please try again.`,
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className={`min-h-screen ${t.bg} transition-colors duration-300`}>
      <header className={`border-b ${t.headerBorder} ${t.headerBg} backdrop-blur-sm sticky top-0 z-10`}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white font-semibold text-sm">
              N
            </div>
            <span className={`font-medium ${t.text}`}>Nick AI</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-32">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center mb-6 text-3xl text-white shadow-lg">
              ✦
            </div>
            <h1 className={`text-3xl font-medium ${t.text} mb-3`}>
              Hello, I'm Nick AI
            </h1>
            <p className={`${t.textMuted} max-w-md`}>
              I can help you write code, answer questions, and collaborate on projects. What would you like to work on?
            </p>
          </div>
        ) : (
          <div className="py-8">
            {messages.map((m, i) => (
              <div key={i} className="py-6">
                <div className="flex gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium ${
                      m.role === "user"
                        ? theme === "dark" ? "bg-white text-black" : "bg-[#1c1917] text-white"
                        : "bg-gradient-to-br from-[#f97316] to-[#ea580c] text-white"
                    }`}
                  >
                    {m.role === "user" ? "N" : "AI"}
                  </div>
                  <div className={`flex-1 ${t.text} leading-relaxed min-h-[24px]`}>
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }) {
                          const isInline = !className;
                          return isInline ? (
                            <code className={`${t.codeInline} ${t.codeInlineText} px-1.5 py-0.5 rounded text-sm font-mono`} {...props}>
                              {children}
                            </code>
                          ) : (
                            <code
                              className={`block ${t.codeBlock} ${t.codeText} p-4 rounded-lg overflow-x-auto text-sm font-mono my-3`}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        pre({ children }) {
                          return <pre className={`${t.codeBlock} ${t.codeText} p-4 rounded-lg overflow-x-auto my-3`}>{children}</pre>;
                        },
                        ul({ children }) {
                          return <ul className={`list-disc list-inside my-3 space-y-1 ${theme === "dark" ? "text-[#a0a0a0]" : "text-[#44403c]"}`}>{children}</ul>;
                        },
                        ol({ children }) {
                          return <ol className={`list-decimal list-inside my-3 space-y-1 ${theme === "dark" ? "text-[#a0a0a0]" : "text-[#44403c]"}`}>{children}</ol>;
                        },
                        p({ children }) {
                          return <p className="my-3">{children}</p>;
                        },
                        h1({ children }) {
                          return <h1 className={`text-2xl font-semibold ${t.text} my-4`}>{children}</h1>;
                        },
                        h2({ children }) {
                          return <h2 className={`text-xl font-semibold ${t.text} my-3`}>{children}</h2>;
                        },
                        a({ href, children }) {
                          return <a href={href} className="text-[#f97316] hover:underline">{children}</a>;
                        },
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <div className={`fixed bottom-0 left-0 right-0 ${theme === "dark" ? "bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]" : "bg-gradient-to-t from-[#faf9f7] via-[#faf9f7]"} to-transparent pt-10 pb-6 px-4 transition-colors duration-300`}>
        <div className="max-w-3xl mx-auto">
          <div className={`relative ${t.inputBg} rounded-2xl shadow-lg border ${t.inputBorder} ${t.inputBorderHover} transition-colors`}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Send a message..."
              rows={1}
              className={`w-full bg-transparent ${t.text} placeholder-[#888888] px-4 py-4 pr-14 resize-none focus:outline-none rounded-2xl`}
              style={{ maxHeight: "200px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute right-3 bottom-3 p-2 rounded-lg bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className={`text-xs text-center mt-3 ${theme === "dark" ? "text-[#666666]" : "text-[#a8a29e]"}`}>
            Nick AI can make mistakes. Please check important information.
          </p>
        </div>
      </div>
    </div>
  );
}