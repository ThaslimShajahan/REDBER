"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { API_BASE } from "../lib/api";

const MASCOT_BOT_ID = "redber-assistant-001";

const QUIPS = [
    "Peeking at you! 👀",
    "Ask me about Redber! 🧠",
    "I see you scrolling… 😏",
    "Wanna chat? 😄",
    "Build a bot like me! 🤖",
    "Say hiiii! 👋",
    "Got questions? 🤔",
];

// ─── Cute blob SVG ──────────────────────────────────────────
function CuteBlob({ mood = "happy", size = 100, blinking = false }: {
    mood?: "happy" | "surprised" | "excited" | "shy";
    size?: number;
    blinking?: boolean;
}) {
    const eyeRY = blinking ? 0.6 : 11;
    return (
        <svg viewBox="0 0 100 105" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="bg" cx="50%" cy="38%" r="58%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6d28d9" />
                </radialGradient>
                <radialGradient id="belly" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ede9fe" />
                    <stop offset="100%" stopColor="#c4b5fd" />
                </radialGradient>
            </defs>

            {/* Body */}
            <ellipse cx="50" cy="58" rx="40" ry="44" fill="url(#bg)" />

            {/* Ear left */}
            <ellipse cx="22" cy="22" rx="10" ry="16" fill="#7c3aed" transform="rotate(-18,22,22)" />
            <ellipse cx="22" cy="20" rx="6" ry="10" fill="#f9a8d4" transform="rotate(-18,22,20)" />
            {/* Ear right */}
            <ellipse cx="78" cy="22" rx="10" ry="16" fill="#7c3aed" transform="rotate(18,78,22)" />
            <ellipse cx="78" cy="20" rx="6" ry="10" fill="#f9a8d4" transform="rotate(18,78,20)" />

            {/* Belly patch */}
            <ellipse cx="50" cy="68" rx="23" ry="25" fill="url(#belly)" opacity="0.55" />

            {/* Logo on belly */}
            <image
                href="/redber_logo_transperent.png"
                x="34" y="56" width="32" height="24"
                preserveAspectRatio="xMidYMid meet"
                style={{ filter: "brightness(0.8)" }}
            />

            {/* Shine */}
            <ellipse cx="50" cy="36" rx="22" ry="10" fill="rgba(255,255,255,0.08)" />

            {/* Left eye socket */}
            <circle cx="34" cy="50" r="13" fill="#1a0533" />
            {/* Left iris */}
            <circle cx="34" cy="50" r="9" fill="#7c3aed" />
            <circle cx="34" cy="50" r="5.5" fill="#3b0764" />
            <ellipse cx="34" cy="50" rx="12" ry={eyeRY} fill="#1a0533" />
            <circle cx="38" cy="45" r="3.5" fill="white" opacity="0.95" />
            <circle cx="31" cy="52" r="1.8" fill="white" opacity="0.6" />

            {/* Right eye socket */}
            <circle cx="66" cy="50" r="13" fill="#1a0533" />
            <circle cx="66" cy="50" r="9" fill="#7c3aed" />
            <circle cx="66" cy="50" r="5.5" fill="#3b0764" />
            <ellipse cx="66" cy="50" rx="12" ry={eyeRY} fill="#1a0533" />
            <circle cx="70" cy="45" r="3.5" fill="white" opacity="0.95" />
            <circle cx="63" cy="52" r="1.8" fill="white" opacity="0.6" />

            {/* Cheeks */}
            <ellipse cx="21" cy="64" rx="9" ry="6" fill="#f9a8d4" opacity="0.5" />
            <ellipse cx="79" cy="64" rx="9" ry="6" fill="#f9a8d4" opacity="0.5" />

            {/* Mouth */}
            {mood === "surprised" && <ellipse cx="50" cy="77" rx="7" ry="8" fill="#1a0533" />}
            {mood === "excited" && <path d="M37 75 Q50 90 63 75" fill="#f9a8d4" stroke="#1a0533" strokeWidth="2" strokeLinecap="round" />}
            {mood === "shy" && <path d="M42 75 Q50 79 58 75" stroke="#1a0533" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
            {mood === "happy" && <path d="M37 73 Q50 86 63 73" stroke="#1a0533" strokeWidth="2.5" fill="none" strokeLinecap="round" />}

            {/* Arms */}
            <ellipse cx="12" cy="70" rx="8" ry="5" fill="#8b5cf6" transform="rotate(-35,12,70)" />
            <ellipse cx="88" cy="70" rx="8" ry="5" fill="#8b5cf6" transform="rotate(35,88,70)" />

            {/* Feet */}
            <ellipse cx="36" cy="100" rx="13" ry="7" fill="#7c3aed" />
            <ellipse cx="64" cy="100" rx="13" ry="7" fill="#7c3aed" />
        </svg>
    );
}

// ─── Dust cloud particle ─────────────────────────────────────
function DustPuff({ delay = 0, x = 0 }: { delay?: number; x?: number }) {
    return (
        <motion.div
            className="absolute bottom-[-10px] pointer-events-none"
            style={{ left: x }}
            initial={{ opacity: 1, scale: 0.5, y: 0 }}
            animate={{ opacity: 0, scale: 2.5, y: -40 }}
            transition={{ duration: 1.1, delay, ease: "easeOut", type: "tween" }}
        >
            <svg width="40" height="40" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="rgba(167,139,250,0.7)" />
                <circle cx="10" cy="18" r="8" fill="rgba(196,181,253,0.6)" />
                <circle cx="22" cy="18" r="8" fill="rgba(139,92,246,0.6)" />
            </svg>
        </motion.div>
    );
}

function DustTrail({ direction }: { direction: "left" | "right" }) {
    const [puffs, setPuffs] = useState<{ id: number; x: number; delay: number }[]>([]);
    const counterRef = useRef(0);

    useEffect(() => {
        const iv = setInterval(() => {
            const id = counterRef.current++;
            // Dust appears behind the character based on direction
            setPuffs(p => [
                ...p.slice(-10),   // more puffs trailing
                { id, x: direction === "right" ? -30 : 30, delay: 0 },
            ]);
        }, 120); // Faster frequency
        return () => clearInterval(iv);
    }, [direction]);

    return (
        <div className="relative">
            {puffs.map(p => <DustPuff key={p.id} x={p.x} delay={p.delay} />)}
        </div>
    );
}

// ─── Peek configs per position ───────────────────────────────
// We position the character so that MOST of the body is off-screen
// Only the eyes / top / side peeking into view

type PeekPos = "top" | "left" | "right" | "bottom-left" | "bottom-right" | "run-left" | "run-right";

const PEEK_POSITIONS: PeekPos[] = ["top", "left", "right", "bottom-left", "bottom-right"];

interface PeekConfig {
    // Tailwind fixed position classes
    posClass: string;
    // translateX/Y when SHOWN (peeking)
    shownX: string;
    shownY: string;
    // translateX/Y when HIDDEN (off screen)
    hiddenX: string;
    hiddenY: string;
    // visual rotation of the creature
    rotation: number;
    flipX?: boolean;
    mood: "happy" | "surprised" | "excited" | "shy";
    bubbleDir: "below" | "above" | "right" | "left";
    quipClass: string;
}

const CONFIGS: Record<PeekPos, PeekConfig> = {
    top: {
        posClass: "top-0 left-[45%]",
        shownX: "0px", shownY: "70px",      // Hanging down to show body
        hiddenX: "0px", hiddenY: "-160px",
        rotation: 0,
        mood: "surprised",
        bubbleDir: "below",
        quipClass: "mt-[95px]",
    },
    left: {
        posClass: "top-[35%] left-0",
        shownX: "-55px", shownY: "0px",       // right half peeks from left
        hiddenX: "-140px", hiddenY: "0px",
        rotation: 90,
        mood: "surprised",
        bubbleDir: "right",
        quipClass: "ml-[80px] -mt-16",
    },
    right: {
        posClass: "top-[35%] right-0",
        shownX: "55px", shownY: "0px",        // left half peeks from right
        hiddenX: "140px", hiddenY: "0px",
        rotation: -90,
        mood: "surprised",
        bubbleDir: "left",
        quipClass: "mr-[80px] -mt-16",
    },
    "bottom-left": {
        posClass: "bottom-0 left-8",
        shownX: "0px", shownY: "60px",        // just top (eyes) above bottom edge
        hiddenX: "0px", hiddenY: "150px",
        rotation: 0,
        mood: "shy",
        bubbleDir: "above",
        quipClass: "mb-[60px]",
    },
    "bottom-right": {
        posClass: "bottom-0 right-8",
        shownX: "0px", shownY: "60px",
        hiddenX: "0px", hiddenY: "150px",
        rotation: 0,
        mood: "excited",
        bubbleDir: "above",
        quipClass: "mb-[60px]",
    },
    "run-left": {
        posClass: "bottom-4 left-0",
        shownX: "110vw", shownY: "0px",
        hiddenX: "-140px", hiddenY: "0px",
        rotation: 0,
        flipX: true,
        mood: "excited",
        bubbleDir: "above",
        quipClass: "",
    },
    "run-right": {
        posClass: "bottom-4 right-0",
        shownX: "-110vw", shownY: "0px",
        hiddenX: "140px", hiddenY: "0px",
        rotation: 0,
        mood: "excited",
        bubbleDir: "above",
        quipClass: "",
    },
};

export default function RedberMascot() {
    const [chatOpen, setChatOpen] = useState(false);
    const [peekPos, setPeekPos] = useState<PeekPos>("bottom-right");
    const [visible, setVisible] = useState(true);
    const [quipIdx, setQuipIdx] = useState(0);
    const [showQuip, setShowQuip] = useState(true);
    const [blinking, setBlinking] = useState(false);
    const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
        { sender: "bot", text: "Hey! 👋 I'm Redber! Ask me anything about this platform — features, pricing, or just say hi! 😄" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const sessionId = useRef(`landing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastScrollY = useRef(0);
    const cooldown = useRef(false);

    // Scroll → re-peek from new position
    const onScroll = useCallback(() => {
        if (chatOpen || cooldown.current) return;
        const diff = Math.abs(window.scrollY - lastScrollY.current);
        lastScrollY.current = window.scrollY;
        if (diff < 80) return;

        cooldown.current = true;
        setVisible(false);
        setTimeout(() => {
            const pool = PEEK_POSITIONS.filter(p => p !== peekPos);
            setPeekPos(pool[Math.floor(Math.random() * pool.length)]);
            setVisible(true);
            setTimeout(() => { cooldown.current = false; }, 1500);
        }, 550);
    }, [chatOpen, peekPos]);

    useEffect(() => {
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [onScroll]);

    // Quip cycle
    useEffect(() => {
        const iv = setInterval(() => {
            setShowQuip(false);
            setTimeout(() => { setQuipIdx(i => (i + 1) % QUIPS.length); setShowQuip(true); }, 350);
        }, 5000);
        return () => clearInterval(iv);
    }, []);

    // Blink
    useEffect(() => {
        const iv = setInterval(() => {
            setBlinking(true); setTimeout(() => setBlinking(false), 280);
        }, 3500);
        return () => clearInterval(iv);
    }, []);

    // Random run across screen
    useEffect(() => {
        const iv = setInterval(() => {
            if (chatOpen) return;
            if (Math.random() > 0.55) {
                const dir = Math.random() > 0.5 ? "run-left" : "run-right";
                setVisible(false);
                setTimeout(() => { setPeekPos(dir as PeekPos); setVisible(true); }, 400);
                setTimeout(() => {
                    setVisible(false);
                    setTimeout(() => {
                        const pool = PEEK_POSITIONS;
                        setPeekPos(pool[Math.floor(Math.random() * pool.length)]);
                        setVisible(true);
                    }, 400);
                }, 3400);
            }
        }, 18000);
        return () => clearInterval(iv);
    }, [chatOpen]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;
        const txt = input.trim(); setInput("");
        setMessages(p => [...p, { sender: "user", text: txt }]);
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/bots/chat`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: txt, bot_id: MASCOT_BOT_ID, session_id: sessionId.current, history: messages.map(m => ({ sender: m.sender, text: m.text })) }),
            });
            const d = await res.json();
            setMessages(p => [...p, { sender: "bot", text: d.reply || "Hmm... 🤔" }]);
        } catch { setMessages(p => [...p, { sender: "bot", text: "Brain glitch! 🤕 Try again." }]); }
        finally { setIsLoading(false); }
    };

    const cfg = CONFIGS[peekPos];
    const isRunning = peekPos.startsWith("run");

    return (
        <>
            {/* ── Mascot ── */}
            <AnimatePresence mode="wait">
                {!chatOpen && visible && (
                    <motion.div
                        key={peekPos}
                        className={`fixed ${cfg.posClass} z-[999] cursor-pointer select-none`}
                        style={{ willChange: "transform" }}
                        initial={{ x: cfg.hiddenX, y: cfg.hiddenY, opacity: 0 }}
                        animate={{ x: cfg.shownX, y: cfg.shownY, opacity: 1 }}
                        exit={{ x: cfg.hiddenX, y: cfg.hiddenY, opacity: 0 }}
                        transition={isRunning
                            ? { duration: 2.8, ease: "linear", type: "tween" }
                            : { type: "spring", stiffness: 140, damping: 16 }}
                        onClick={() => { if (!isRunning) setChatOpen(true); }}
                    >
                        <div className="flex flex-col items-center relative">
                            {/* Quip bubble – shown above/below depending on position */}
                            {!isRunning && cfg.bubbleDir === "above" && (
                                <AnimatePresence>
                                    {showQuip && (
                                        <motion.div
                                            key={quipIdx}
                                            initial={{ opacity: 0, y: 8, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.2, type: "tween" }}
                                            className="absolute bottom-[108px] left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-gray-900 text-[11px] font-semibold px-3.5 py-2 rounded-2xl shadow-xl"
                                        >
                                            {QUIPS[quipIdx]}
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-l-[7px] border-r-[7px] border-t-[9px] border-l-transparent border-r-transparent border-t-white" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}

                            {/* Quip bubble – below */}
                            {!isRunning && cfg.bubbleDir === "below" && (
                                <AnimatePresence>
                                    {showQuip && (
                                        <motion.div
                                            key={quipIdx}
                                            initial={{ opacity: 0, y: -8, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.2, type: "tween" }}
                                            className="absolute top-[108px] left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-gray-900 text-[11px] font-semibold px-3.5 py-2 rounded-2xl shadow-xl"
                                        >
                                            {QUIPS[quipIdx]}
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-l-[7px] border-r-[7px] border-b-[9px] border-l-transparent border-r-transparent border-b-white" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}

                            {/* Quip bubble – right side */}
                            {!isRunning && cfg.bubbleDir === "right" && (
                                <AnimatePresence>
                                    {showQuip && (
                                        <motion.div
                                            key={quipIdx}
                                            initial={{ opacity: 0, x: -8, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.2, type: "tween" }}
                                            className="absolute left-[115px] top-1/2 -translate-y-1/2 whitespace-nowrap bg-white text-gray-900 text-[11px] font-semibold px-3.5 py-2 rounded-2xl shadow-xl"
                                        >
                                            {QUIPS[quipIdx]}
                                            <div className="absolute left-[-9px] top-1/2 -translate-y-1/2 border-r-[9px] border-t-[7px] border-b-[7px] border-r-white border-t-transparent border-b-transparent" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}

                            {/* Quip bubble – left side */}
                            {!isRunning && cfg.bubbleDir === "left" && (
                                <AnimatePresence>
                                    {showQuip && (
                                        <motion.div
                                            key={quipIdx}
                                            initial={{ opacity: 0, x: 8, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.2, type: "tween" }}
                                            className="absolute right-[115px] top-1/2 -translate-y-1/2 whitespace-nowrap bg-white text-gray-900 text-[11px] font-semibold px-3.5 py-2 rounded-2xl shadow-xl"
                                        >
                                            {QUIPS[quipIdx]}
                                            <div className="absolute right-[-9px] top-1/2 -translate-y-1/2 border-l-[9px] border-t-[7px] border-b-[7px] border-l-white border-t-transparent border-b-transparent" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}

                            {/* Rope for top hang */}
                            {peekPos === "top" && (
                                <div className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[1px] h-[130px] bg-gradient-to-t from-gray-400/50 via-gray-600/30 to-transparent z-[-1]">
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-400" />
                                </div>
                            )}

                            {/* The creature itself */}
                            <div className="relative">
                                {isRunning && (
                                    <div className="absolute top-1/2 -translate-y-1/2">
                                        <DustTrail direction={peekPos === "run-left" ? "right" : "left"} />
                                    </div>
                                )}
                                <motion.div
                                    style={{ 
                                        rotate: cfg.rotation, 
                                        scaleX: cfg.flipX ? -1 : 1,
                                        transformOrigin: peekPos === "top" ? "center -100px" : "center center" 
                                    }}
                                    animate={isRunning 
                                        ? { y: [0, -12, 0, -12, 0] } 
                                        : peekPos === "top"
                                            ? { rotate: [-3, 3, -3], y: [0, 4, 0] }
                                            : { y: [0, -5, 0] }
                                    }
                                    transition={{ repeat: Infinity, duration: isRunning ? 0.45 : 3.5, ease: "easeInOut", type: "tween" }}
                                >
                                    <CuteBlob mood={cfg.mood} size={isRunning ? 80 : 110} blinking={blinking} />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Chat widget ── */}
            <AnimatePresence>
                {chatOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.82, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.82, y: 20 }}
                        transition={{ type: "spring", stiffness: 320, damping: 26 }}
                        className="fixed bottom-6 right-6 z-[1000] flex flex-col bg-[#0a0a12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden w-[375px]"
                        style={{ maxHeight: "88vh" }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-violet-900/50 to-purple-950/40">
                            <div className="w-12 h-12 shrink-0">
                                <CuteBlob mood="happy" size={48} blinking={false} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-sm">Redber</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest">AI Assistant · Online</span>
                                </div>
                            </div>
                            <button onClick={() => setChatOpen(false)} className="p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide" style={{ maxHeight: 420 }}>
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[84%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${m.sender === "user"
                                        ? "bg-violet-600 text-white rounded-tr-sm"
                                        : "bg-white/6 border border-white/10 text-gray-100 rounded-tl-sm"}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/6 border border-white/10 px-4 py-3 rounded-2xl flex gap-1.5">
                                        {[0, 0.2, 0.4].map((d, i) => (
                                            <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.65, delay: d, ease: "easeInOut", type: "tween" }}
                                                className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-white/10 bg-black/30">
                            <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything…"
                                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
                                <button type="submit" disabled={!input.trim() || isLoading}
                                    className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center disabled:opacity-40 transition-all shrink-0">
                                    <Send size={14} className="text-white" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
