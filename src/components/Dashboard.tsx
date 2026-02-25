import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type MessageRole = 'user' | 'ai' | 'status' | 'thinking';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  actions?: number;
}

interface Project {
  id: string;
  name: string;
  lastActive: string;
}

const DEMO_TOKEN = 'bxr_7f3a9c12-4e81-4b2d-a938-1f0d56c8e2b1';

const PROJECTS: Project[] = [
  { id: '1', name: 'Obby World', lastActive: '2m ago' },
  { id: '2', name: 'Tycoon Simulator', lastActive: '1h ago' },
  { id: '3', name: 'Battle Royale', lastActive: 'Yesterday' },
];

const EXAMPLE_PROMPTS = [
  'Add a shop where players buy speed boosts with coins',
  'Create a stamina bar that drains when sprinting',
  'Make enemies patrol and chase players within 20 studs',
  'Add a leaderboard showing top 10 kills',
];

const CodeBlock = ({ code }: { code: string }) => (
  <div className="mt-3 rounded-xl overflow-hidden border border-white/[0.06]">
    <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/[0.06]">
      <span className="text-[11px] text-white/30 font-mono uppercase tracking-wider">Lua</span>
      <span className="text-[11px] text-[#10B981] font-medium">Pushed to Studio</span>
    </div>
    <div className="bg-[#0d0d0d] px-4 py-3 overflow-x-auto">
      <pre className="text-[13px] font-mono text-[#a8d8a8] leading-[1.7]">{code}</pre>
    </div>
  </div>
);

const renderAIContent = (content: string) => {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).replace(/^lua\n/, '');
      return <CodeBlock key={i} code={code} />;
    }
    const lines = part.split('\n').filter(Boolean);
    return (
      <div key={i} className="space-y-2">
        {lines.map((line, j) => {
          if (line.startsWith('- ')) {
            return (
              <div key={j} className="flex items-start gap-2.5">
                <div className="w-1 h-1 rounded-full bg-white/30 mt-[9px] shrink-0" />
                <span
                  className="text-white/75 text-[15px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<span class="text-white font-semibold">$1</span>') }}
                />
              </div>
            );
          }
          return (
            <p
              key={j}
              className="text-white/75 text-[15px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<span class="text-white font-semibold">$1</span>') }}
            />
          );
        })}
      </div>
    );
  });
};

const TypingDots = () => (
  <div className="flex items-center gap-1.5 py-1">
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-white/30"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </div>
);

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tokenRevealed, setTokenRevealed] = useState(false);
  const [activeProject, setActiveProject] = useState(PROJECTS[0]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const copyToken = () => {
    navigator.clipboard.writeText(DEMO_TOKEN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content }]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const thinkId = crypto.randomUUID();
    setStreaming(true);
    setMessages(prev => [...prev, { id: thinkId, role: 'thinking', content: '' }]);

    await new Promise(r => setTimeout(r, 1600));
    setMessages(prev => prev.filter(m => m.id !== thinkId));

    const aiContent = `**Done.** Here's what I built for you:\n\n- Added the core logic to **ServerScriptService**\n- Wired up a RemoteEvent for client-server sync\n- Inserted the UI into **StarterGui**\n\n\`\`\`lua\nlocal Players = game:GetService("Players")\nlocal RunService = game:GetService("RunService")\n\nlocal function onPlayerAdded(player)\n  local leaderstats = Instance.new("Folder")\n  leaderstats.Name = "leaderstats"\n  leaderstats.Parent = player\n\n  local coins = Instance.new("IntValue")\n  coins.Name = "Coins"\n  coins.Value = 0\n  coins.Parent = leaderstats\nend\n\nPlayers.PlayerAdded:Connect(onPlayerAdded)\n\`\`\``;

    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), role: 'ai', content: aiContent },
      { id: crypto.randomUUID(), role: 'status', content: '', actions: 3 },
    ]);
    setStreaming(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#080808', fontFamily: "'General Sans', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <div className="flex flex-col w-[260px] shrink-0 border-r border-white/[0.06]" style={{ background: '#0c0c0c' }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-[60px] border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                <path d="M16 4V8M16 24V28M4 16H8M24 16H28" stroke="#4F8EF7" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="16" cy="16" r="6" stroke="#4F8EF7" strokeWidth="2"/>
                <circle cx="16" cy="16" r="2.5" fill="#4F8EF7"/>
              </svg>
            </div>
            <span className="text-white text-[15px] font-bold tracking-tight">Bloxr<span className="text-[#4F8EF7]">.dev</span></span>
          </div>
        </div>

        {/* New chat */}
        <div className="px-3 pt-3">
          <button
            onClick={() => setMessages([])}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.08] hover:border-white/[0.14] hover:bg-white/[0.03] text-white/50 hover:text-white/80 text-[13px] font-medium transition-all duration-200 group"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New chat
            <span className="ml-auto text-[11px] text-white/20 font-mono">⌘N</span>
          </button>
        </div>

        {/* Projects */}
        <div className="px-3 pt-5 flex-1 overflow-y-auto">
          <p className="text-[11px] text-white/25 font-semibold uppercase tracking-[0.1em] px-1 mb-2">Projects</p>
          <div className="space-y-0.5">
            {PROJECTS.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProject(p)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                  activeProject.id === p.id
                    ? 'bg-white/[0.06] text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeProject.id === p.id ? 'bg-[#4F8EF7]' : 'bg-white/10'}`} />
                  <span className="text-[13px] font-medium truncate">{p.name}</span>
                </div>
                <span className="text-[11px] text-white/20 shrink-0 ml-2">{p.lastActive}</span>
              </button>
            ))}
          </div>

          {/* Studio status */}
          <div className="mt-5 pt-5 border-t border-white/[0.06]">
            <p className="text-[11px] text-white/25 font-semibold uppercase tracking-[0.1em] px-1 mb-3">Studio</p>

            <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-2 border ${
              connected ? 'bg-[#10B981]/[0.05] border-[#10B981]/20' : 'bg-white/[0.02] border-white/[0.06]'
            }`}>
              <div className="relative shrink-0">
                {connected && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#10B981]"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[#10B981]' : 'bg-white/20'}`} />
              </div>
              <span className={`text-[13px] font-medium ${connected ? 'text-[#10B981]' : 'text-white/35'}`}>
                {connected ? 'Studio connected' : 'Not connected'}
              </span>
            </div>

            <button
              onClick={() => setConnected(v => !v)}
              className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                connected
                  ? 'bg-white/[0.06] hover:bg-white/[0.09] text-white/60 hover:text-white/80'
                  : 'bg-[#4F8EF7] hover:bg-[#3D7BE5] text-white shadow-[0_0_20px_rgba(79,142,247,0.15)]'
              }`}
            >
              {connected ? 'Disconnect' : 'Connect Studio'}
            </button>
          </div>

          {/* Token */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between px-1 mb-2.5">
              <p className="text-[11px] text-white/25 font-semibold uppercase tracking-[0.1em]">Studio Token</p>
              <button
                onClick={() => setTokenRevealed(v => !v)}
                className="text-white/20 hover:text-white/50 transition-colors"
              >
                {tokenRevealed ? (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.2"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.2"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                )}
              </button>
            </div>

            <div className="rounded-xl border border-white/[0.07] overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-black/30">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4F8EF7]/60 shrink-0" />
                <span className="flex-1 text-[12px] font-mono text-white/40 truncate">
                  {tokenRevealed
                    ? DEMO_TOKEN
                    : 'bxr_' + '●'.repeat(12) + DEMO_TOKEN.slice(-6)}
                </span>
              </div>
              <button
                onClick={copyToken}
                className="w-full flex items-center justify-center gap-2 py-2 text-[12px] bg-white/[0.02] hover:bg-white/[0.05] border-t border-white/[0.06] transition-all duration-200"
              >
                {copied ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8L6.5 11.5L13 5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[#10B981] font-medium">Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
                      <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    <span className="text-white/30 font-medium">Copy token</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4F8EF7]/30 to-[#4F8EF7]/10 border border-[#4F8EF7]/20 flex items-center justify-center">
            <span className="text-[11px] text-[#4F8EF7] font-bold">B</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white/70 text-[12px] font-semibold truncate">Builder</p>
            <p className="text-white/25 text-[11px] truncate">Free plan</p>
          </div>
          <button className="text-white/20 hover:text-white/50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3a5 5 0 100 10A5 5 0 008 3z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M8 6v2.5L9.5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 h-[60px] border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-white text-[14px] font-semibold">{activeProject.name}</p>
              <p className="text-white/30 text-[12px]">AI coding assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {connected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/[0.08] border border-[#10B981]/20"
              >
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-[#10B981]"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[12px] text-[#10B981] font-medium">Live sync active</span>
              </motion.div>
            )}
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.14] text-white/40 hover:text-white/70 text-[12px] font-medium transition-all duration-200">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              History
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full px-8 pb-16"
              >
                {/* Glow orb */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-[#4F8EF7]/10 rounded-full blur-[60px] scale-[2]" />
                  <motion.div
                    className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4F8EF7]/20 to-[#4F8EF7]/5 border border-[#4F8EF7]/20 flex items-center justify-center"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                      <path d="M16 4V8M16 24V28M4 16H8M24 16H28" stroke="#4F8EF7" strokeWidth="1.8" strokeLinecap="round"/>
                      <circle cx="16" cy="16" r="6" stroke="#4F8EF7" strokeWidth="1.8"/>
                      <circle cx="16" cy="16" r="2.5" fill="#4F8EF7"/>
                    </svg>
                  </motion.div>
                </div>

                <h2 className="text-white text-[22px] font-semibold mb-2 tracking-tight">What do you want to build?</h2>
                <p className="text-white/35 text-[15px] text-center max-w-[360px] leading-relaxed mb-10">
                  Describe any Roblox feature in plain English. Bloxr writes the code and pushes it to your game instantly.
                </p>

                {/* Suggestions */}
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-[580px]">
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 + 0.1 }}
                      onClick={() => send(prompt)}
                      className="text-left px-4 py-3.5 rounded-xl border border-white/[0.07] hover:border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.04] text-white/50 hover:text-white/80 text-[13px] leading-relaxed transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-2.5">
                        <svg className="shrink-0 mt-0.5 text-white/20 group-hover:text-[#4F8EF7]/60 transition-colors" width="13" height="13" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {prompt}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="messages"
                className="px-8 py-8 space-y-6 max-w-[820px] mx-auto w-full"
              >
                <AnimatePresence initial={false}>
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* AI avatar */}
                      {(msg.role === 'ai' || msg.role === 'thinking') && (
                        <div className="w-7 h-7 rounded-lg bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 flex items-center justify-center shrink-0 mt-0.5">
                          <svg width="13" height="13" viewBox="0 0 32 32" fill="none">
                            <path d="M16 4V8M16 24V28M4 16H8M24 16H28" stroke="#4F8EF7" strokeWidth="2" strokeLinecap="round"/>
                            <circle cx="16" cy="16" r="6" stroke="#4F8EF7" strokeWidth="2"/>
                            <circle cx="16" cy="16" r="2.5" fill="#4F8EF7"/>
                          </svg>
                        </div>
                      )}

                      {msg.role === 'user' && (
                        <div className="max-w-[60%] bg-white text-black text-[14px] rounded-2xl rounded-tr-sm px-4 py-2.5 leading-relaxed font-medium">
                          {msg.content}
                        </div>
                      )}

                      {msg.role === 'thinking' && (
                        <div className="py-1">
                          <TypingDots />
                        </div>
                      )}

                      {msg.role === 'ai' && (
                        <div className="max-w-[640px] min-w-0">
                          {renderAIContent(msg.content)}
                        </div>
                      )}

                      {msg.role === 'status' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[13px] font-medium"
                          style={{ background: '#111', border: '1px solid rgba(16,185,129,0.2)' }}
                        >
                          <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.4 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path d="M3 8L6.5 11.5L13 5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </motion.div>
                          <span className="text-[#10B981]">{msg.actions} changes pushed to Studio</span>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={bottomRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="px-6 pb-5 shrink-0">
          <div
            className="rounded-2xl border border-white/[0.08] focus-within:border-white/[0.14] transition-colors duration-200"
            style={{ background: '#111' }}
          >
            <div className="flex items-end gap-3 px-4 pt-3.5 pb-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => { setInput(e.target.value); autoResize(); }}
                onKeyDown={onKeyDown}
                placeholder="Describe what you want to build..."
                rows={1}
                className="flex-1 bg-transparent text-[14px] text-white/90 placeholder:text-white/25 outline-none resize-none leading-relaxed"
                style={{ maxHeight: 140 }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  input.trim() && !streaming
                    ? 'bg-white hover:bg-white/90 active:scale-95'
                    : 'bg-white/[0.06] cursor-not-allowed'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 12V4M8 4L4.5 7.5M8 4L11.5 7.5"
                    stroke={input.trim() && !streaming ? '#000' : 'rgba(255,255,255,0.25)'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-3">
                {connected ? (
                  <span className="flex items-center gap-1.5 text-[11px] text-[#10B981]/70">
                    <div className="w-1 h-1 rounded-full bg-[#10B981]" />
                    Syncing to {activeProject.name}
                  </span>
                ) : (
                  <span className="text-[11px] text-white/20">Connect Studio to push code</span>
                )}
              </div>
              <span className="text-[11px] text-white/15">Enter to send · Shift+Enter for newline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
