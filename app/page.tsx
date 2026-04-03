"use client";
import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "ai";
  text: string;
};

const menuItems = [
  { icon: "+", label: "New chat" },
  { icon: "◷", label: "History" },
  { icon: "⚙", label: "Settings" },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);
    
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    const aiMessageId = messages.length + 1;
    setMessages((prev) => [...prev, { role: "ai", text: "" }]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
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
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[aiMessageId]) {
          updated[aiMessageId] = {
            role: "ai",
            text: "Request failed. Please try again.",
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

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-[#202123] flex flex-col border-r border-[#565869]">
        <div className="p-3">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[#565869] hover:bg-[#343541] transition-colors text-[#ececf1]">
            <span className="text-lg">+</span>
            <span>New chat</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3">
          <div className="text-xs text-[#acacbe] px-4 py-2">Today</div>
          <div className="space-y-1">
            <button className="w-full text-left px-4 py-2 rounded-lg bg-[#343541] text-[#ececf1] hover:bg-[#40414f] transition-colors">
              Help with code...
            </button>
          </div>
        </div>
        <div className="p-3 border-t border-[#565869]">
          <div className="flex items-center gap-3 px-4 py-2 text-[#ececf1]">
            <div className="w-8 h-8 rounded-full bg-[#343541] flex items-center justify-center text-sm">
              N
            </div>
            <div className="flex-1 truncate text-sm">Nick</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-[#212121]">
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-6xl mb-4">⚡</div>
              <h1 className="text-2xl font-medium text-[#ececf1] mb-2">
                What can I help you with?
              </h1>
              <p className="text-[#acacbe]">Ask me anything about your code</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-4 py-6 ${
                    m.role === "user" ? "bg-[#343541]" : ""
                  } px-4 rounded-lg mb-4`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${
                      m.role === "user"
                        ? "bg-[#5436da]"
                        : "bg-[#0fa37b]"
                    }`}
                  >
                    {m.role === "user" ? "N" : "AI"}
                  </div>
                  <div className="flex-1 text-[#ececf1] leading-relaxed whitespace-pre-wrap">
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 py-6 px-4 rounded-lg">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm bg-[#0fa37b]">
                    AI
                  </div>
                  <div className="flex-1 flex items-center gap-2 text-[#acacbe]">
                    <div className="w-2 h-2 bg-[#0fa37b] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#0fa37b] rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-[#0fa37b] rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#565869]">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-[#40414f] rounded-lg border border-[#565869]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message Nick AI..."
                rows={1}
                className="w-full bg-transparent text-[#ececf1] placeholder-[#acacbe] px-4 py-3 pr-12 resize-none focus:outline-none rounded-lg"
                style={{ maxHeight: "200px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 rounded-md bg-[#0fa37b] hover:bg-[#0d8f69] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-[#acacbe] text-center mt-2">
              AI may produce inaccurate information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
