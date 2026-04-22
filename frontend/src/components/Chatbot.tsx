"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Send, Bot, Loader2, ImagePlus, X, Phone, PhoneOff,
    Mic, MicOff, CheckCircle2, MapPin, ChevronRight, WifiOff
} from "lucide-react";
import { API_BASE } from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Derive WS base from API_BASE ─────────────────────────────────────────────
const WS_BASE = API_BASE.replace(/^http/, "ws");

// ─── Inline formatting ────────────────────────────────────────────────────────
function inlineBold(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noreferrer" style="pointer-events: auto;" class="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors pointer-events-auto">$1</a>'
        );
}

const markdownComponents: any = {
    p: ({ children }: any) => <p className="text-[15px] leading-relaxed mb-3 last:mb-0 text-gray-200/90">{children}</p>,
    ul: ({ children }: any) => <ul className="space-y-2 my-3 list-disc list-outside ml-6 text-gray-200/90">{children}</ul>,
    ol: ({ children }: any) => <ol className="space-y-2 my-3 list-decimal list-outside ml-6 text-gray-200/90">{children}</ol>,
    li: ({ children }: any) => <li className="text-[15px] leading-relaxed pl-1">{children}</li>,
    table: ({ children }: any) => <div className="overflow-x-auto my-4 w-full rounded-2xl border border-white/10 shadow-2xl"><table className="w-full text-[14px] text-left border-collapse bg-white/5">{children}</table></div>,
    thead: ({ children }: any) => <thead className="bg-white/10 text-xs uppercase text-gray-400 border-b border-white/10">{children}</thead>,
    tbody: ({ children }: any) => <tbody className="divide-y divide-white/5">{children}</tbody>,
    th: ({ children }: any) => <th className="px-5 py-3 font-black text-gray-200">{children}</th>,
    td: ({ children }: any) => <td className="px-5 py-3 align-top">{children}</td>,
    h1: ({ children }: any) => <h1 className="text-lg font-black text-white mt-6 mb-3">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-base font-black uppercase tracking-widest text-indigo-300 mt-6 mb-3">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-sm font-black uppercase tracking-widest text-rose-300 mt-5 mb-2">{children}</h3>,
    a: ({ href, children }: any) => {
        if (href?.includes("maps.google") || href?.includes("google.com/maps")) {
            return (
                <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-2xl text-xs font-black mt-2 hover:bg-emerald-500/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] pointer-events-auto">
                    📍 {children}
                </a>
            );
        }
        return <a href={href} target="_blank" rel="noreferrer" className="text-indigo-400 underline underline-offset-4 hover:text-indigo-300 transition-colors pointer-events-auto font-bold">{children}</a>;
    },
    img: ({ src, alt }: any) => <img src={src} alt={alt} className="rounded-2xl w-full max-w-sm h-auto object-cover border border-white/10 my-4 shadow-2xl" />,
    strong: ({ children }: any) => <strong className="font-black text-white">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-gray-200 font-medium">{children}</em>,
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-indigo-500/50 pl-5 py-2 my-4 text-gray-300 italic bg-white/5 rounded-r-2xl font-medium">{children}</blockquote>,
    hr: () => <hr className="border-white/10 my-5" />,
};

// ─── Smart Message Renderer ───────────────────────────────────────────────────
function SmartMessage({ text, formatType }: { text: string; formatType?: string }) {
    const lines = text.split("\n").filter((l) => l.trim());
    const bulletItems = lines.filter((l) => /^[\s\-\*•\d+\.]/.test(l)).map((l) => l.replace(/^\s*[-*•\d.]+\s*/, "").trim());
    const introLines = lines.filter((l) => !/^[\s\-\*•]/.test(l) && !/^\d+\./.test(l.trim()));

    if (formatType === "menu") {
        return (
            <div className="space-y-4">
                <div className="space-y-2">{introLines.map((l, i) => <p key={i} className="text-sm text-gray-300 leading-snug pointer-events-auto" dangerouslySetInnerHTML={{ __html: inlineBold(l) }} />)}</div>
                <div className="mt-2 rounded-2xl overflow-hidden border border-white/10 bg-black/30 divide-y divide-white/5">
                    {bulletItems.map((item, i) => {
                        const priceMatch = item.match(/([₹$€£]\s?[\d,]+\.?\d*|[\d,]+\.?\d*\s?[₹$€£])/i);
                        const name = item.replace(priceMatch?.[0] || "", "").replace(/[-–—:,]$/, "").trim();
                        return (
                            <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors">
                                <span className="text-sm text-white font-medium" dangerouslySetInnerHTML={{ __html: inlineBold(name || item) }} />
                                {priceMatch && <span className="text-emerald-400 font-bold text-sm ml-4 shrink-0">{priceMatch[0]}</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    if (formatType === "steps") {
        const stepLines = lines.filter((l) => /^\d+\./.test(l.trim()) || /^[-*•]/.test(l.trim()));
        const preamble = lines.filter((l) => !/^\d+\./.test(l.trim()) && !/^[-*•]/.test(l.trim())).slice(0, 1);
        return (
            <div className="space-y-2">
                {preamble.map((l, i) => <p key={i} className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: inlineBold(l) }} />)}
                <div className="space-y-2 mt-2">
                    {stepLines.map((step, i) => {
                        const content = step.replace(/^\d+\.\s*/, "").replace(/^[-*•]\s*/, "");
                        return (
                            <div key={i} className="flex gap-3 items-start bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{i + 1}</span>
                                <span className="text-sm text-gray-200 leading-snug" dangerouslySetInnerHTML={{ __html: inlineBold(content) }} />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    if (formatType === "booking_confirm") {
        const details = lines.filter((l) => l.includes(":"));
        const others = lines.filter((l) => !l.includes(":") || l.length > 80);
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-4 py-3">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    <span className="text-emerald-300 font-bold text-sm">Booking Confirmed!</span>
                </div>
                {details.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
                        {details.map((d, i) => {
                            const [label, ...rest] = d.split(":");
                            return (
                                <div key={i} className="flex justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">{label.replace(/[-*•]/, "").trim()}</span>
                                    <span className="text-sm text-white font-semibold">{rest.join(":").trim()}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
                {others.map((l, i) => <p key={i} className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: inlineBold(l) }} />)}
            </div>
        );
    }
    if (formatType === "location") {
        return (
            <div className="space-y-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{text}</ReactMarkdown>
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 mt-1">
                    <MapPin size={14} className="text-blue-400 shrink-0" />
                    <span className="text-xs text-blue-300">Tap the directions link above to open in Maps</span>
                </div>
            </div>
        );
    }
    if (formatType === "faq") {
        return (
            <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl px-4 py-3 space-y-1.5">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{text}</ReactMarkdown>
            </div>
        );
    }
    return <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{text}</ReactMarkdown>;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    sender: "user" | "bot";
    text: string;
    image?: string;
    formatType?: string;
}

interface ChatbotProps {
    botId: string;
    botName: string;
    botRole: string;
    botAvatar?: string;
    themeColor: string;
    fullScreen?: boolean;
    suggestedQuestions?: string[];
    voiceEnabled?: boolean;
    onClose?: () => void;
}

// ─── Call status type ─────────────────────────────────────────────────────────
type CallStatus = "idle" | "connecting" | "listening" | "thinking" | "speaking";

// ─── PCM16 player — plays raw Int16 PCM at 24 kHz from OpenAI Realtime ───────
class PCM16Player {
    private ctx: AudioContext;
    private nextStart = 0;
    private pending = 0;
    // Only fire onAllDone once the server signals the response is complete AND
    // all enqueued audio has finished playing. This prevents premature "done"
    // from brief gaps between small PCM chunks mid-stream.
    private streamDone = false;
    public onAllDone?: () => void;

    constructor() {
        // Use browser's native rate — forcing 24000Hz is unreliable across browsers.
        // AudioBuffer is still declared at 24000Hz so the browser auto-resamples cleanly.
        this.ctx = new AudioContext();
    }

    enqueue(pcm16: ArrayBuffer) {
        if (this.ctx.state === "suspended") this.ctx.resume();
        const int16 = new Int16Array(pcm16);
        const f32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768;
        // Buffer declared at 24000Hz; context resamples to native rate automatically
        const buf = this.ctx.createBuffer(1, f32.length, 24000);
        buf.copyToChannel(f32, 0);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this.ctx.destination);
        const startAt = Math.max(this.ctx.currentTime, this.nextStart);
        src.start(startAt);
        this.nextStart = startAt + buf.duration;
        this.pending++;
        src.onended = () => {
            this.pending--;
            if (this.pending === 0 && this.streamDone && this.onAllDone) {
                this.streamDone = false;
                this.onAllDone();
            }
        };
    }

    /** Call when the server sends bot_complete — fires onAllDone once all audio is played. */
    markStreamComplete() {
        this.streamDone = true;
        if (this.pending === 0 && this.onAllDone) {
            this.streamDone = false;
            this.onAllDone();
        }
    }

    interrupt() {
        try { this.ctx.close(); } catch (_) {}
        this.ctx = new AudioContext();
        this.nextStart = 0;
        this.pending = 0;
        this.streamDone = false;
    }

    reset() {
        try { this.ctx.close(); } catch (_) {}
        this.pending = 0;
        this.nextStart = 0;
        this.streamDone = false;
        this.onAllDone = undefined;
    }
}

// ─── Main Chatbot Component ───────────────────────────────────────────────────
export default function Chatbot({ botId, botName, botRole, botAvatar, themeColor, fullScreen, suggestedQuestions, voiceEnabled = false, onClose }: ChatbotProps) {
    // Session id
    const [sessionId] = useState<string>(() => {
        const key = `redber_session_${botId}`;
        const existing = typeof window !== "undefined" ? sessionStorage.getItem(key) : null;
        if (existing) return existing;
        const newId = `${botId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        if (typeof window !== "undefined") sessionStorage.setItem(key, newId);
        return newId;
    });

    // Chat state
    const [messages, setMessages] = useState<Message[]>(() => {
        const key = `redber_chat_msgs_${botId}`;
        const existing = typeof window !== "undefined" ? sessionStorage.getItem(key) : null;
        if (existing) {
            try {
                const parsed = JSON.parse(existing);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) {}
        }
        return [
            { id: "1", sender: "bot", text: `Hi! I'm ${botName}, ${botRole}. How can I assist you today?` },
        ];
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem(`redber_chat_msgs_${botId}`, JSON.stringify(messages));
        }
    }, [messages, botId]);

    const [input, setInput] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Call state
    const [isCallMode, setIsCallMode] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>("idle");
    const [liveTranscript, setLiveTranscript] = useState("");

    // Refs (used inside WS callbacks to avoid stale closures)
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const captureCtxRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioPlayerRef = useRef<PCM16Player | null>(null);
    const isBotSpeakingRef = useRef(false);   // gates mic → WS while bot audio plays
    const isCallModeRef = useRef(false);
    const callStatusRef = useRef<CallStatus>("idle");

    useEffect(() => {
        isCallModeRef.current = isCallMode;
    }, [isCallMode]);

    // Keep callStatusRef in sync so WS callbacks can read latest status
    const setCallStatusSafe = useCallback((s: CallStatus) => {
        callStatusRef.current = s;
        setCallStatus(s);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── WebSocket Call Logic ────────────────────────────────────────────────
    const startCall = useCallback(async () => {
        setIsCallMode(true);
        setCallStatus("connecting");
        setLiveTranscript("");

        // Get microphone
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,   // prevents bot speaker audio looping back into mic
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            });
            streamRef.current = stream;
        } catch {
            alert("Microphone access denied. Please allow microphone access to use the AI Call feature.");
            setIsCallMode(false);
            setCallStatus("idle");
            return;
        }

        // Init PCM16 player (plays audio received from OpenAI Realtime at 24 kHz)
        const player = new PCM16Player();
        audioPlayerRef.current = player;
        player.onAllDone = () => {
            isBotSpeakingRef.current = false;   // unmute mic — bot finished, user's turn
            if (isCallModeRef.current) setCallStatusSafe("listening");
        };

        // Open WebSocket to backend relay
        const wsUrl = `${WS_BASE}/api/bots/ws/call/${botId}?session_id=${sessionId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.binaryType = "arraybuffer";

        ws.onopen = async () => {
            // Start mic capture — try AudioWorklet first, fall back to ScriptProcessorNode
            const captureCtx = new AudioContext();
            captureCtxRef.current = captureCtx;
            const source = captureCtx.createMediaStreamSource(stream);

            // Inline worklet: Float32 mic → Int16 PCM at 24 kHz, sent as binary WS frames
            const workletCode = `class P extends AudioWorkletProcessor{process(inputs){const ch=inputs[0]?.[0];if(!ch)return true;const r=sampleRate/24000,n=Math.floor(ch.length/r),o=new Int16Array(n);for(let i=0;i<n;i++){const s=Math.max(-1,Math.min(1,ch[Math.floor(i*r)]));o[i]=s<0?s*32768:s*32767;}this.port.postMessage(o.buffer,[o.buffer]);return true;}}registerProcessor('pcm16-proc',P);`;
            const blobUrl = URL.createObjectURL(new Blob([workletCode], { type: "application/javascript" }));
            try {
                await captureCtx.audioWorklet.addModule(blobUrl);
                URL.revokeObjectURL(blobUrl);
                const node = new AudioWorkletNode(captureCtx, "pcm16-proc");
                workletNodeRef.current = node;
                node.port.onmessage = (e) => {
                    // Mute mic while bot is playing — prevents coughs/noise from triggering barge-in
                    if (!isBotSpeakingRef.current && ws.readyState === WebSocket.OPEN) ws.send(e.data);
                };
                source.connect(node);
            } catch {
                // ScriptProcessorNode fallback (deprecated but widely supported)
                URL.revokeObjectURL(blobUrl);
                const spn = captureCtx.createScriptProcessor(4096, 1, 1);
                workletNodeRef.current = spn;
                spn.onaudioprocess = (e) => {
                    if (isBotSpeakingRef.current || ws.readyState !== WebSocket.OPEN) return;
                    const f32 = e.inputBuffer.getChannelData(0);
                    const ratio = captureCtx.sampleRate / 24000;
                    const out = new Int16Array(Math.floor(f32.length / ratio));
                    for (let i = 0; i < out.length; i++) {
                        const s = Math.max(-1, Math.min(1, f32[Math.floor(i * ratio)]));
                        out[i] = s < 0 ? s * 32768 : s * 32767;
                    }
                    ws.send(out.buffer);
                };
                source.connect(spn);
                spn.connect(captureCtx.destination);
            }
        };

        ws.onmessage = (event) => {
            // Binary = raw PCM16 audio from OpenAI Realtime
            if (event.data instanceof ArrayBuffer) {
                isBotSpeakingRef.current = true;   // mute mic until playback finishes
                if (callStatusRef.current !== "speaking") setCallStatusSafe("speaking");
                audioPlayerRef.current?.enqueue(event.data);
                return;
            }

            // Text = JSON control message
            try {
                const msg = JSON.parse(event.data as string);

                if (msg.type === "session_ready") {
                    setCallStatusSafe("listening");
                }

                if (msg.type === "speech_started") {
                    // Only reached if mic gate was somehow open — clean up gracefully
                    isBotSpeakingRef.current = false;
                    audioPlayerRef.current?.interrupt();
                    if (isCallModeRef.current) setCallStatusSafe("listening");
                }

                if (msg.type === "transcript" && msg.text) {
                    setLiveTranscript(msg.text);
                    setMessages((prev) => [
                        ...prev,
                        { id: Date.now().toString(), sender: "user", text: msg.text },
                    ]);
                    setLiveTranscript("");
                }

                if (msg.type === "thinking") {
                    setCallStatusSafe("thinking");
                }

                if (msg.type === "bot_reply" && msg.text) {
                    setMessages((prev) => [
                        ...prev,
                        { id: Date.now().toString() + "b", sender: "bot", text: msg.text },
                    ]);
                }

                if (msg.type === "bot_complete") {
                    // Signal the player that no more audio chunks are coming.
                    // onAllDone fires once the last chunk finishes playing → back to listening.
                    audioPlayerRef.current?.markStreamComplete();
                }

                if (msg.type === "error") {
                    console.error("[Call] backend error:", msg.message);
                }
            } catch (_) {}
        };

        ws.onerror = (err) => {
            console.error("WS error", err);
        };

        ws.onclose = () => {
            if (isCallModeRef.current) endCall(false);
        };
    }, [botId, sessionId, setCallStatusSafe]);

    const endCall = useCallback((stopWs = true) => {
        isCallModeRef.current = false;
        isBotSpeakingRef.current = false;
        setIsCallMode(false);
        setCallStatusSafe("idle");
        setLiveTranscript("");

        // Disconnect capture worklet and close capture context
        try { workletNodeRef.current?.disconnect(); } catch (_) {}
        workletNodeRef.current = null;
        try { captureCtxRef.current?.close(); } catch (_) {}
        captureCtxRef.current = null;

        // Stop mic stream
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        // Close WS
        if (stopWs && wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
            try { wsRef.current.close(); } catch (_) {}
        }
        wsRef.current = null;

        // Reset PCM16 player
        audioPlayerRef.current?.reset();
        audioPlayerRef.current = null;
    }, [setCallStatusSafe]);

    const toggleCall = useCallback(() => {
        if (isCallMode) {
            endCall(true);
        } else {
            startCall();
        }
    }, [isCallMode, startCall, endCall]);

    // ── Text Chat Logic ─────────────────────────────────────────────────────
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    // Strip AI signal tags that sometimes leak into streamed text before the final "done" event
    const stripSignalTags = (text: string) =>
        text.replace(/\[FORMAT:.*?\]/g, "").replace(/\[CONFIDENCE:.*?\]/g, "").replace(/\[GAP:.*?\]/g, "").trimEnd();

    const handleSend = async (overrideText?: string) => {
        const textToSend = overrideText !== undefined ? overrideText : input;
        if (!textToSend.trim() && !imagePreview) return;

        const capturedImage = imagePreview || undefined;
        const capturedText = textToSend;

        const userMessage: Message = { id: Date.now().toString(), sender: "user", text: capturedText, image: capturedImage };
        setMessages((prev) => [...prev, userMessage]);
        if (overrideText === undefined) {
            setInput("");
            setImagePreview(null);
        }
        setIsLoading(true);

        const streamingId = `stream-${Date.now()}`;
        let streamStarted = false;

        try {
            const response = await fetch(`${API_BASE}/api/bots/chat/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: capturedText || "Please analyze this image.",
                    bot_id: botId,
                    session_id: sessionId,
                    history: messages.map((m) => ({ sender: m.sender, text: m.text })),
                    image_data: capturedImage,
                }),
            });

            if (!response.ok || !response.body) throw new Error("Stream request failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? ""; // keep any incomplete line

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    try {
                        const event = JSON.parse(line.slice(6));

                        if (event.type === "token" && event.content) {
                            if (!streamStarted) {
                                // First token — show the bot bubble, hide loading dots
                                streamStarted = true;
                                setIsLoading(false);
                                setMessages((prev) => [...prev, { id: streamingId, sender: "bot", text: event.content }]);
                            } else {
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === streamingId
                                            ? { ...m, text: stripSignalTags(m.text + event.content) }
                                            : m
                                    )
                                );
                            }
                        } else if (event.type === "done") {
                            // Replace streamed draft with the clean, formatted final reply
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === streamingId
                                        ? { ...m, text: event.reply, formatType: event.format_type }
                                        : m
                                )
                            );
                        }
                    } catch {
                        // Malformed SSE line — skip
                    }
                }
            }

            if (!streamStarted) {
                // Stream ended with no tokens (e.g. rate-limited "done" sent directly)
                setMessages((prev) => [...prev, { id: streamingId, sender: "bot", text: "Sorry, I am having trouble connecting to my brain." }]);
            }
        } catch {
            const errorText =
                typeof navigator !== "undefined" && !navigator.onLine
                    ? "Network connection is down. Please check your internet connection."
                    : "Sorry, I am having trouble connecting to my brain.";
            setMessages((prev) => {
                const hasPlaceholder = prev.some((m) => m.id === streamingId);
                if (hasPlaceholder) return prev.map((m) => (m.id === streamingId ? { ...m, text: errorText } : m));
                return [...prev, { id: streamingId, sender: "bot", text: errorText }];
            });
        } finally {
            setIsLoading(false);
        }
    };

    // ── Call Status Display ─────────────────────────────────────────────────
    const statusLabel: Record<CallStatus, string> = {
        idle: "Tap to start",
        connecting: "Connecting...",
        listening: "I'm listening...",
        thinking: "Thinking...",
        speaking: "Speaking...",
    };

    const statusSubLabel: Record<CallStatus, string> = {
        idle: "",
        connecting: "Requesting microphone...",
        listening: liveTranscript || "Speak naturally — I'll hear you.",
        thinking: "Formulating response...",
        speaking: "Playing response...",
    };

    const statusColor: Record<CallStatus, string> = {
        idle: "text-gray-400",
        connecting: "text-yellow-400",
        listening: "text-emerald-400",
        thinking: "text-indigo-400",
        speaking: "text-blue-400",
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className={`flex flex-col w-full overflow-hidden bg-black/40 backdrop-blur-xl shadow-2xl ${fullScreen ? "h-full border border-gray-800 rounded-3xl" : "h-[500px] border border-gray-800 rounded-2xl max-w-sm"}`}>
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-800/60 bg-white/5 backdrop-blur-md relative z-10">
                <div className="flex items-center gap-3">
                    <div className="shrink-0 relative">
                        {botAvatar ? (
                            <img src={botAvatar} alt={botName} className={`w-12 h-12 rounded-full object-cover border-2 shadow-lg ${botId.includes("restaurant") ? "border-rose-500/50" : "border-blue-500/50"}`} />
                        ) : (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${themeColor}`}>
                                <Bot size={24} />
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#0a0a0a] rounded-full shadow-sm" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">{botName}</h3>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${botId.includes("restaurant") ? "text-rose-400" : "text-blue-400"}`}>{botRole}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Phone Button — only shown when voice is enabled */}
                    {voiceEnabled && (
                    <button
                        onClick={toggleCall}
                        className={`p-2.5 rounded-full transition-all shadow-lg ${isCallMode
                            ? "bg-rose-500 text-white shadow-rose-500/30 animate-pulse"
                            : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30"
                            }`}
                        title={isCallMode ? "End Call" : "Start AI Voice Call"}
                    >
                        {isCallMode ? <PhoneOff size={18} /> : <Phone size={18} />}
                    </button>
                    )}
                    {/* Close Button for Widget Mode */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg border border-white/5"
                            title="Close Chat"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Call Mode UI */}
            <AnimatePresence mode="wait">
                {isCallMode ? (
                    <motion.div
                        key="call-mode"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center p-8 bg-black/70 relative"
                    >
                        {/* Ambient glow */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className={`absolute inset-0 transition-all duration-1000 ${callStatus === "listening" ? "bg-gradient-to-t from-emerald-900/30 to-transparent" : callStatus === "thinking" ? "bg-gradient-to-t from-indigo-900/30 to-transparent" : callStatus === "speaking" ? "bg-gradient-to-t from-blue-900/30 to-transparent" : "bg-gradient-to-t from-gray-900/10 to-transparent"}`} />
                        </div>

                        {/* Avatar */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative mb-10"
                        >
                            {botAvatar ? (
                                <img src={botAvatar} alt={botName} className="w-28 h-28 rounded-full object-cover shadow-[0_0_50px_rgba(16,185,129,0.3)] border-4 border-emerald-500/50" />
                            ) : (
                                <div className="w-28 h-28 rounded-full flex items-center justify-center text-4xl text-white bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                                    {botName.charAt(0)}
                                </div>
                            )}

                            {/* Pulsing rings based on state */}
                            {callStatus === "listening" && (
                                <>
                                    <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }} className="absolute inset-0 rounded-full border-2 border-emerald-400" style={{ margin: "-8px" }} />
                                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.4 }} className="absolute inset-0 rounded-full border border-emerald-400" style={{ margin: "-16px" }} />
                                </>
                            )}
                            {callStatus === "speaking" && (
                                <>
                                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }} className="absolute inset-0 rounded-full border-2 border-blue-400" style={{ margin: "-8px" }} />
                                    <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.2 }} className="absolute inset-0 rounded-full border border-blue-400" style={{ margin: "-18px" }} />
                                </>
                            )}
                            {callStatus === "thinking" && (
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-3 border-t-transparent border-indigo-400 animate-spin" style={{ borderWidth: "3px" }} />
                            )}
                            {callStatus === "connecting" && (
                                <div className="absolute inset-0 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" />
                            )}
                        </motion.div>

                        {/* Status Text */}
                        <div className="text-center mb-8 relative z-10">
                            <h4 className={`text-xl font-bold mb-1 transition-colors duration-500 ${statusColor[callStatus]}`}>
                                {statusLabel[callStatus]}
                            </h4>
                            <p className="text-sm text-gray-400 max-w-[260px] mx-auto min-h-[40px] transition-all duration-300">
                                {statusSubLabel[callStatus]}
                            </p>
                        </div>

                        {/* Recent messages in call mode mini-feed */}
                        {messages.length > 1 && (
                            <div className="w-full max-w-[280px] mb-6 space-y-2 max-h-20 overflow-hidden relative z-10">
                                {messages.slice(-2).map((m) => (
                                    <div key={m.id} className={`text-xs px-3 py-1.5 rounded-xl truncate ${m.sender === "user" ? "bg-white/10 text-gray-200 text-right" : "bg-white/5 text-gray-400"}`}>
                                        {m.text.slice(0, 80)}{m.text.length > 80 ? "…" : ""}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* End Call Button */}
                        <button
                            onClick={() => endCall(true)}
                            className="relative z-10 p-6 rounded-full bg-rose-500 hover:bg-rose-400 transition-all duration-300 shadow-[0_0_30px_rgba(244,63,94,0.5)] hover:shadow-[0_0_50px_rgba(244,63,94,0.7)]"
                        >
                            <PhoneOff size={28} className="text-white" />
                        </button>
                        <p className="text-xs text-gray-600 mt-3 relative z-10">Tap to end call</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="chat-mode"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                            {messages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    key={msg.id}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`w-fit max-w-[88%] p-4 sm:p-5 text-[0.98rem] leading-relaxed shadow-2xl relative group ${msg.sender === "user"
                                        ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2rem] rounded-tr-sm shadow-blue-500/20"
                                        : "bg-white/[0.06] backdrop-blur-xl text-gray-100 rounded-[2rem] rounded-tl-sm border border-white/10 shadow-black/40"
                                        }`}>
                                        {/* Subtle internal glow for bot bubble */}
                                        {msg.sender === "bot" && (
                                            <div className="absolute inset-0 rounded-[2rem] rounded-tl-sm bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                        )}
                                        
                                        {msg.image && (
                                            <div className="relative mb-3 group-hover:scale-[1.02] transition-transform duration-300">
                                                <img src={msg.image} className="w-full max-w-[280px] rounded-2xl shadow-2xl border border-white/10" />
                                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent" />
                                            </div>
                                        )}
                                        
                                        <div className="relative z-10">
                                            {msg.sender === "bot" ? (
                                                <SmartMessage text={msg.text} formatType={msg.formatType} />
                                            ) : (
                                                <span className="font-medium">{msg.text}</span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Suggested questions */}
                            {messages.length === 1 && suggestedQuestions && suggestedQuestions.length > 0 && !isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex flex-wrap justify-start gap-2 pt-2 px-1"
                                >
                                    {suggestedQuestions.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(q)}
                                            className="text-xs font-semibold px-4 py-2 rounded-full border border-white/10 hover:border-white/30 transition-all shadow-sm bg-white/5 hover:bg-white/10 text-white"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {isLoading && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-start">
                                    <div className="bg-[#26252A] border border-white/5 text-gray-100 max-w-[80%] p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center justify-center gap-1.5 min-h-[44px] min-w-[60px]">
                                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.15 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.3 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Offline Banner */}
                        {!isOnline && (
                            <div className="bg-rose-500/10 text-rose-400 px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-t border-rose-500/20 backdrop-blur-md">
                                <WifiOff size={14} className="animate-pulse" />
                                Network connection down. Chat is offline.
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 border-t border-gray-800 bg-black/40 flex flex-col gap-2">
                            {imagePreview && (
                                <div className="relative w-20 h-20 mb-1 ml-2">
                                    <img src={imagePreview} className="w-full h-full object-cover rounded-xl border border-white/10 shadow-lg" />
                                    <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-md z-10 flex items-center justify-center">
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-full py-1 pl-2 pr-4 shadow-inner"
                            >
                                <button type="button" disabled={!isOnline} onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
                                    <ImagePlus size={18} />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={!isOnline ? "Offline..." : "Message..."}
                                    disabled={!isOnline}
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-400 py-2 ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    type="submit"
                                    disabled={(!input.trim() && !imagePreview) || isLoading || !isOnline}
                                    className="p-1.5 bg-white text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors shadow-lg"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
