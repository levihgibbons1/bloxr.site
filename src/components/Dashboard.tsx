import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type MessageRole = 'user' | 'ai' | 'status' | 'loading';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  actions?: number;
}

const DEMO_TOKEN = 'bxr_7f3a9c12-4e81-4b2d-a938-1f0d56c8e2b1';

const MarkdownText = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith('- ') || line.startsWith('• ')) {
          const content = line.slice(2);
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-white/30 mt-1 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        );
      })}
    </div>
  );
};

const Dashboard = () => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userName = 'Builder';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resizeTextarea = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 128) + 'px';
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(DEMO_TOKEN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setStreaming(true);

    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: loadingId, role: 'loading', content: '' }]);

    await new Promise(r => setTimeout(r, 1200));

    setMessages(prev => prev.filter(m => m.id !== loadingId));

    const aiResponse = `**Got it.** Here's what I'll build for you:\n\n- Setting up the core script in **ServerScriptService**\n- Wiring up RemoteEvents for client-server communication\n- Adding the UI component to **StarterGui**\n\nPushing to Studio now...`;

    setMessages(prev => [
      ...prev,
      { id: (Date.now() + 2).toString(), role: 'ai', content: aiResponse },
      { id: (Date.now() + 3).toString(), role: 'status', content: '', actions: 3 },
    ]);

    setStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <div className="w-[260px] shrink-0 bg-[#0f0f0f] border-r border-white/[0.06] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-6 pb-5">
          <p className="text-[11px] text-white/30 font-semibold uppercase tracking-[0.12em] mb-1">Dashboard</p>
          <p className="text-[18px] font-semibold text-white">Hey, {userName}</p>
        </div>

        <div className="h-[1px] bg-white/[0.06] mx-5" />

        <div className="flex flex-col gap-5 px-5 pt-5 flex-1 overflow-y-auto">
          {/* Studio status */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-[#10B981]' : 'bg-white/20'}`} />
              <span className={`text-[13px] font-medium ${connected ? 'text-[#10B981]' : 'text-white/40'}`}>
                {connected ? 'Studio connected' : 'Studio not connected'}
              </span>
            </div>
            <button
              onClick={() => setConnected(v => !v)}
              className="w-full bg-[#4F8EF7] hover:bg-[#3D7BE5] text-white text-[13px] font-semibold rounded-lg py-2.5 transition-colors duration-200"
            >
              {connected ? 'Disconnect Studio' : 'Connect Studio'}
            </button>
            <p className="text-[12px] text-white/20 mt-2 leading-relaxed">
              Open Roblox Studio and install the Bloxr plugin to connect.
            </p>
          </div>

          <div className="h-[1px] bg-white/[0.06]" />

          {/* Token */}
          <div>
            <p className="text-[11px] text-white/30 font-semibold uppercase tracking-[0.1em] mb-2">Your Studio Token</p>
            <div className="bg-black/40 border border-white/[0.06] rounded-lg px-3 py-2 mb-2">
              <p className="text-[#4F8EF7] text-[12px] font-mono truncate">{DEMO_TOKEN}</p>
            </div>
            <button
              onClick={handleCopyToken}
              className="w-full flex items-center justify-center gap-2 border border-white/[0.08] hover:border-white/20 text-white/50 hover:text-white/80 text-[13px] font-medium rounded-lg py-2.5 transition-all duration-200"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8L6.5 11.5L13 5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[#10B981]">Copied</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Copy Token
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom logo */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-white text-[16px] font-bold tracking-tight">Bloxr</span>
            <span className="text-[#4F8EF7] text-[16px] font-bold">.dev</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center h-full gap-4 px-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-[#4F8EF7]/10 rounded-full blur-2xl animate-pulse scale-150" />
                <div className="relative w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                    <path d="M16 4V8M16 24V28M4 16H8M24 16H28" stroke="#4F8EF7" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="16" cy="16" r="6" stroke="#4F8EF7" strokeWidth="1.5"/>
                    <circle cx="16" cy="16" r="2" fill="#4F8EF7"/>
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[22px] font-semibold text-white/90 mb-2">What do you want to build?</p>
                <p className="text-[15px] text-white/40 max-w-[340px] leading-relaxed">
                  Describe a Roblox feature and Bloxr will build and push it to Studio.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="px-8 py-10 flex flex-col gap-5 max-w-[860px] mx-auto w-full">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'user' && (
                      <div className="bg-white text-black text-[15px] rounded-2xl px-4 py-2.5 max-w-[60%] leading-relaxed">
                        {msg.content}
                      </div>
                    )}
                    {msg.role === 'ai' && (
                      <div className="text-white/85 text-[15px] leading-relaxed max-w-[640px]">
                        <MarkdownText text={msg.content} />
                      </div>
                    )}
                    {msg.role === 'loading' && (
                      <div className="text-white/40 text-[14px] flex items-center gap-2">
                        <motion.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        >
                          Getting context...
                        </motion.span>
                      </div>
                    )}
                    {msg.role === 'status' && (
                      <div className="inline-flex items-center gap-2 bg-[#1c1c20] rounded-full px-4 py-2">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6.5 11.5L13 5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-[14px] text-[#10B981] font-medium">{msg.actions} actions completed</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="px-6 pb-4 shrink-0">
          <div className="bg-[#111] border border-white/10 rounded-2xl shadow-lg flex items-end gap-3 px-4 py-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); resizeTextarea(); }}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build..."
              rows={1}
              className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 outline-none resize-none leading-relaxed"
              style={{ maxHeight: 128 }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                input.trim() && !streaming
                  ? 'bg-white hover:bg-white/90 active:scale-95'
                  : 'bg-white/10 cursor-not-allowed'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 12V4M8 4L4.5 7.5M8 4L11.5 7.5" stroke={input.trim() && !streaming ? '#000' : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p className="text-center text-[12px] text-white/15 mt-2">
            Enter to send &middot; Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
