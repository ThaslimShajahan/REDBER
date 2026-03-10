"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, ImagePlus, X, Phone, PhoneOff, Mic, CheckCircle2, MapPin, Calendar, ChevronRight } from "lucide-react";
import { API_BASE } from "../lib/api";
import { motion } from "framer-motion";

// ---- Inline bold/italic parser ----
function inlineBold(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// ---- Base markdown renderer (used inside rich cards too) ----
function renderMarkdown(text: string): React.ReactNode[] {
    const lines = text.split("\n");
    const nodes: React.ReactNode[] = [];
    let i = 0;
    let nodeKey = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { nodes.push(<br key={nodeKey++} />); i++; continue; }

        if (/^\s*[-*•]\s+/.test(line)) {
            const bullets: string[] = [];
            while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
                bullets.push(lines[i].replace(/^\s*[-*•]\s+/, ""));
                i++;
            }
            nodes.push(
                <ul key={nodeKey++} className="space-y-1 my-1.5">
                    {bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-2 text-sm leading-snug">
                            <span className="text-rose-400 mt-0.5 shrink-0">•</span>
                            <span dangerouslySetInnerHTML={{ __html: inlineBold(b) }} />
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        if (/^\s*\d+\.\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
                i++;
            }
            nodes.push(
                <ol key={nodeKey++} className="space-y-1 my-1.5 list-none">
                    {items.map((item, ii) => (
                        <li key={ii} className="flex gap-2 text-sm leading-snug">
                            <span className="text-rose-400 font-bold shrink-0 w-4">{ii + 1}.</span>
                            <span dangerouslySetInnerHTML={{ __html: inlineBold(item) }} />
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        if (line.includes("![")) {
            const imgRe = new RegExp("!\\[([^\\]]*)\\]\\(([^)]+)\\)", "g");
            let imgMatch;
            const lineImgs: React.ReactNode[] = [];
            const remainingText = line.replace(imgRe, "").trim();
            const imgRe2 = new RegExp("!\\[([^\\]]*)\\]\\(([^)]+)\\)", "g");
            while ((imgMatch = imgRe2.exec(line)) !== null) {
                lineImgs.push(
                    <img key={nodeKey++} src={imgMatch[2]} alt={imgMatch[1] || "Image"}
                        className="rounded-xl w-full max-w-xs h-auto object-cover border border-white/10 my-2 shadow-lg"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                );
            }
            if (lineImgs.length > 0) nodes.push(<div key={nodeKey++} className="flex flex-col gap-2">{lineImgs}</div>);
            if (remainingText) nodes.push(<p key={nodeKey++} className="text-sm leading-snug" dangerouslySetInnerHTML={{ __html: inlineBold(remainingText) }} />);
            i++; continue;
        }

        if (/^###?\s+/.test(line) || /^\*\*[^*]+\*\*:?$/.test(line.trim())) {
            const heading = line.replace(/^###?\s+/, "").replace(/\*\*/g, "").replace(/:$/, "");
            nodes.push(<p key={nodeKey++} className="text-xs font-bold uppercase tracking-widest text-rose-300 mt-3 mb-1">{heading}</p>);
            i++; continue;
        }

        if (/\[([^\]]+)\]\(([^)]+)\)/.test(line)) {
            const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
            const parts: React.ReactNode[] = [];
            let lastIdx = 0;
            let m: RegExpExecArray | null;
            while ((m = linkRe.exec(line)) !== null) {
                if (m.index > lastIdx) parts.push(<span key={nodeKey++} dangerouslySetInnerHTML={{ __html: inlineBold(line.substring(lastIdx, m.index)) }} />);
                if (m[1].toLowerCase().includes('direction') || m[2].includes('maps.google') || m[2].includes('google.com/maps')) {
                    parts.push(<a key={nodeKey++} href={m[2]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold mt-2 hover:bg-emerald-500/25 transition-colors shadow-sm">📍 {m[1]}</a>);
                } else {
                    parts.push(<a key={nodeKey++} href={m[2]} target="_blank" rel="noreferrer" className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors">{m[1]}</a>);
                }
                lastIdx = m.index + m[0].length;
            }
            if (lastIdx < line.length) parts.push(<span key={nodeKey++} dangerouslySetInnerHTML={{ __html: inlineBold(line.substring(lastIdx)) }} />);
            nodes.push(<p key={nodeKey++} className="text-sm leading-snug">{parts}</p>);
            i++; continue;
        }

        nodes.push(<p key={nodeKey++} className="text-sm leading-snug" dangerouslySetInnerHTML={{ __html: inlineBold(line) }} />);
        i++;
    }
    return nodes;
}

// ---- Smart Format Card Renderer ----
function SmartMessage({ text, formatType }: { text: string; formatType?: string }) {
    // Parse bullet/numbered lines into items
    const lines = text.split("\n").filter(l => l.trim());
    const bulletItems = lines.filter(l => /^[\s\-\*•\d+\.]/.test(l)).map(l => l.replace(/^\s*[-*•\d.]+\s*/, "").trim());
    const introLines = lines.filter(l => !/^[\s\-\*•]/.test(l) && !/^\d+\./.test(l.trim()));

    // MENU / PRICING card
    if (formatType === "menu") {
        return (
            <div className="space-y-2">
                {introLines.slice(0, 2).map((l, i) => <p key={i} className="text-sm text-gray-300 leading-snug" dangerouslySetInnerHTML={{ __html: inlineBold(l) }} />)}
                <div className="mt-2 rounded-2xl overflow-hidden border border-white/10 bg-black/30 divide-y divide-white/5">
                    {bulletItems.map((item, i) => {
                        const priceMatch = item.match(/([₹$€£]\s?[\d,]+\.?\d*|[\d,]+\.?\d*\s?[₹$€£])/i);
                        const name = item.replace(priceMatch?.[0] || '', '').replace(/[-–—:,]$/, '').trim();
                        return (
                            <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors">
                                <span className="text-sm text-white font-medium">{name || item}</span>
                                {priceMatch && <span className="text-emerald-400 font-bold text-sm ml-4 shrink-0">{priceMatch[0]}</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // STEPS card
    if (formatType === "steps") {
        const stepLines = lines.filter(l => /^\d+\./.test(l.trim()) || /^[-*•]/.test(l.trim()));
        const preamble = lines.filter(l => !/^\d+\./.test(l.trim()) && !/^[-*•]/.test(l.trim())).slice(0, 1);
        return (
            <div className="space-y-2">
                {preamble.map((l, i) => <p key={i} className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: inlineBold(l) }} />)}
                <div className="space-y-2 mt-2">
                    {stepLines.map((step, i) => {
                        const content = step.replace(/^\d+\.\s*/, '').replace(/^[-*•]\s*/, '');
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

    // BOOKING CONFIRM card
    if (formatType === "booking_confirm") {
        const details = lines.filter(l => l.includes(':'));
        const others = lines.filter(l => !l.includes(':') || l.length > 80);
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-4 py-3">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    <span className="text-emerald-300 font-bold text-sm">Booking Confirmed!</span>
                </div>
                {details.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
                        {details.map((d, i) => {
                            const [label, ...rest] = d.split(':');
                            return (
                                <div key={i} className="flex justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">{label.replace(/[-*•]/, '').trim()}</span>
                                    <span className="text-sm text-white font-semibold">{rest.join(':').trim()}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
                {others.map((l, i) => <p key={i} className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: inlineBold(l) }} />)}
            </div>
        );
    }

    // COMPARISON card
    if (formatType === "comparison") {
        return (
            <div className="space-y-2">
                {introLines.slice(0, 1).map((l, i) => <p key={i} className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: inlineBold(l) }} />)}
                <div className="grid grid-cols-1 gap-2 mt-1">
                    {bulletItems.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                            <ChevronRight size={14} className="text-purple-400 mt-0.5 shrink-0" />
                            <span className="text-sm text-gray-200" dangerouslySetInnerHTML={{ __html: inlineBold(item) }} />
                        </div>
                    ))}
                </div>
                {introLines.slice(1).map((l, i) => <p key={i} className="text-sm text-gray-400 mt-1" dangerouslySetInnerHTML={{ __html: inlineBold(l) }} />)}
            </div>
        );
    }

    // LOCATION card
    if (formatType === "location") {
        return (
            <div className="space-y-2">
                {renderMarkdown(text)}
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 mt-1">
                    <MapPin size={14} className="text-blue-400 shrink-0" />
                    <span className="text-xs text-blue-300">Tap the directions link above to open in Maps</span>
                </div>
            </div>
        );
    }

    // FAQ card — highlighted answer box
    if (formatType === "faq") {
        return (
            <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl px-4 py-3 space-y-1.5">
                {renderMarkdown(text)}
            </div>
        );
    }

    // DEFAULT — normal markdown
    return <>{renderMarkdown(text)}</>;
}

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
}

export default function Chatbot({ botId, botName, botRole, botAvatar, themeColor, fullScreen }: ChatbotProps) {
    // Stable unique session ID per browser tab session
    const [sessionId] = useState<string>(() => {
        const key = `redber_session_${botId}`;
        const existing = typeof window !== "undefined" ? sessionStorage.getItem(key) : null;
        if (existing) return existing;
        const newId = `${botId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        if (typeof window !== "undefined") sessionStorage.setItem(key, newId);
        return newId;
    });
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", sender: "bot", text: `Hi! I'm ${botName}, ${botRole}. How can I assist you today?` }
    ]);
    const [input, setInput] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCallMode, setIsCallMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [liveTranscript, setLiveTranscript] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);


    const initRecognition = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Live continuous speech recognition is not supported in this browser. Please use Chrome for the best experience.");
            return null;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Optimized for local accents

        recognition.onresult = async (event: any) => {
            let interimTrans = "";
            let finalTrans = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTrans += event.results[i][0].transcript;
                } else {
                    interimTrans += event.results[i][0].transcript;
                }
            }

            setLiveTranscript(interimTrans || finalTrans);

            if (finalTrans.trim().length > 0) {
                recognition.stop();
                setLiveTranscript("");
                await processLiveConversation(finalTrans.trim());
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            if (event.error === 'not-allowed') {
                setIsRecording(false);
                alert("Microphone access blocked.");
            }
        };

        recognition.onend = () => {
            // Auto restart if still in call mode
            if (isCallMode && !isProcessingVoice) {
                try { recognition.start(); setIsRecording(true); } catch (e) { }
            } else {
                setIsRecording(false);
            }
        };
        return recognition;
    };

    const toggleCallMode = () => {
        if (!isCallMode) {
            setIsCallMode(true);
            const rec = initRecognition();
            if (rec) {
                recognitionRef.current = rec;
                try {
                    rec.start();
                    setIsRecording(true);
                } catch (e) { }
            }
        } else {
            setIsCallMode(false);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsRecording(false);
        }
    };

    /** Automatically restarts listening once bot finishes speaking */
    const restartListening = () => {
        if (isCallMode && recognitionRef.current) {
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (e) { }
        }
    };

    const processLiveConversation = async (text: string) => {
        setIsProcessingVoice(true);
        setIsRecording(false); // Pause listening while thinking to prevent echoing

        const userMessage: Message = { id: Date.now().toString() + "1", sender: "user", text };
        // Use a functional state update to ensure latest messages are caught
        let currentHistory: Message[] = [];
        setMessages(prev => {
            currentHistory = [...prev, userMessage];
            return currentHistory;
        });

        try {
            // 1. Send the text straight to the Chat Endpoint for maximum speed!
            const chatRes = await fetch(`${API_BASE}/api/bots/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text + " [Call mode: Answer conversationally, concisely, like a human on phone. No markdown.]",
                    bot_id: botId,
                    session_id: sessionId,
                    history: currentHistory.slice(0, -1).map(m => ({ sender: m.sender, text: m.text }))
                }),
            });

            if (chatRes.ok) {
                const data = await chatRes.json();
                setMessages(prev => [...prev, { id: Date.now().toString() + "2", sender: "bot", text: data.reply }]);

                // 2. Fetch the lightning fast TTS!
                const ttsRes = await fetch(`${API_BASE}/api/bots/tts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: data.reply }),
                });

                if (ttsRes.ok) {
                    const ttsData = await ttsRes.json();
                    if (ttsData.audio_b64) {
                        const audio = new Audio("data:audio/mp3;base64," + ttsData.audio_b64);
                        audio.onended = () => {
                            setIsProcessingVoice(false);
                            restartListening(); // Auto-continue conversation perfectly like Gemini Live
                        };
                        audio.play();
                        return; // Successfully played audio, skip the finally block
                    }
                }
            }
        } catch (error) {
            console.error("Live call error:", error);
        }

        // Fallback if audio fails to play
        setIsProcessingVoice(false);
        restartListening();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() && !imagePreview) return;

        // Capture BEFORE clearing state to guarantee correct values in the API call
        const capturedImage = imagePreview || undefined;
        const capturedText = input;

        const userMessage: Message = { id: Date.now().toString(), sender: "user", text: capturedText, image: capturedImage };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setImagePreview(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/bots/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: capturedText || "Please analyze this image.",
                    bot_id: botId,
                    session_id: sessionId,
                    history: messages.map(m => ({ sender: m.sender, text: m.text })),
                    image_data: capturedImage
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prev => [...prev, { id: Date.now().toString(), sender: "bot", text: data.reply, formatType: data.format_type }]);
            } else {
                setMessages(prev => [...prev, { id: Date.now().toString(), sender: "bot", text: "Sorry, I am having trouble connecting to my brain." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: "bot", text: "Network error occurred. Is the backend running?" }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex flex-col w-full overflow-hidden bg-black/40 backdrop-blur-xl shadow-2xl ${fullScreen ? "h-full border border-gray-800 rounded-3xl" : "h-[500px] border border-gray-800 rounded-2xl max-w-sm"}`}>
            {/* Header */}
            <div className={`p-4 flex items-center justify-between border-b border-gray-800/60 bg-white/5 backdrop-blur-md relative z-10`}>
                <div className="flex items-center gap-3">
                    <div className="shrink-0 relative">
                        {botAvatar ? (
                            <img src={botAvatar} alt={botName} className={`w-12 h-12 rounded-full object-cover border-2 shadow-lg ${botId.includes('restaurant') ? 'border-rose-500/50' : 'border-blue-500/50'}`} />
                        ) : (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${themeColor}`}>
                                <Bot size={24} />
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#0a0a0a] rounded-full shadow-sm"></div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">{botName}</h3>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${botId.includes('restaurant') ? 'text-rose-400' : 'text-blue-400'}`}>{botRole}</p>
                    </div>
                </div>
                <button
                    onClick={toggleCallMode}
                    className={`hidden p-2.5 rounded-full transition-all shadow-lg ${isCallMode ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30'}`}
                    title={isCallMode ? "End Call" : "Start Voice Call"}
                >
                    {isCallMode ? <PhoneOff size={18} /> : <Phone size={18} />}
                </button>
            </div>

            {isCallMode ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black/60 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-transparent pointer-events-none" />

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative mb-12"
                    >
                        {botAvatar ? (
                            <img src={botAvatar} alt={botName} className="w-32 h-32 rounded-full object-cover shadow-[0_0_50px_rgba(16,185,129,0.3)] border-4 border-emerald-500/50" />
                        ) : (
                            <div className="w-32 h-32 rounded-full flex items-center justify-center text-4xl text-white bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                                {botName.charAt(0)}
                            </div>
                        )}
                        {isProcessingVoice && (
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
                        )}
                        {!isProcessingVoice && (
                            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 rounded-full border border-emerald-500/30 w-[120%] h-[120%] -left-[10%] -top-[10%]" />
                        )}
                    </motion.div>

                    <div className="text-center mb-12">
                        <h4 className="text-2xl font-bold text-white mb-2">{isProcessingVoice ? "Thinking..." : isRecording ? "I'm listening..." : "Call Paused"}</h4>
                        <p className="text-sm text-gray-400 max-w-[280px] mx-auto min-h-[40px]">
                            {isProcessingVoice ? "Formulating response..." : isRecording ? (liveTranscript || "Speak naturally, I'm listening.") : "Ended"}
                        </p>
                    </div>

                    <div className="mt-auto relative z-10 w-full flex justify-center pb-6">
                        <button
                            onClick={toggleCallMode}
                            className={`relative p-8 rounded-full transition-all duration-300 ${isRecording ? 'bg-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.6)]' : 'bg-rose-900 border border-rose-500 text-white'}`}
                        >
                            <PhoneOff size={32} className="relative z-10 text-white" />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        {messages.map((msg) => (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={msg.id}
                                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`w-fit max-w-[85%] p-3.5 text-[0.95rem] leading-snug shadow-sm ${msg.sender === "user"
                                        ? "bg-[#007AFF] text-white rounded-2xl rounded-tr-sm"
                                        : "bg-[#26252A] text-gray-200 rounded-2xl rounded-tl-sm border border-white/5"
                                        }`}
                                >
                                    {msg.image && <img src={msg.image} className="w-full max-w-[200px] rounded-xl mb-2 shadow-sm border border-white/10" />}
                                    {msg.sender === "bot" ? <SmartMessage text={msg.text} formatType={msg.formatType} /> : msg.text}
                                </div>
                            </motion.div>
                        ))}
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex justify-start"
                            >
                                <div className="bg-[#26252A] border border-white/5 text-gray-100 max-w-[80%] p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center justify-center gap-1.5 min-h-[44px] min-w-[60px]">
                                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.15 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.3 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t border-gray-800 bg-black/40 flex flex-col gap-2">
                        {imagePreview && (
                            <div className="relative w-20 h-20 mb-1 ml-2">
                                <img src={imagePreview} className="w-full h-full object-cover rounded-xl border border-white/10 shadow-lg" />
                                <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-md z-10 flex items-center justify-center"><X size={12} /></button>
                            </div>
                        )}
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-full py-1 pl-2 pr-4 shadow-inner"
                        >
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full">
                                <ImagePlus size={18} />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message..."
                                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-400 py-2 ml-1"
                            />
                            <button
                                type="submit"
                                disabled={(!input.trim() && !imagePreview) || isLoading}
                                className="p-1.5 bg-white text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors shadow-lg"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}
