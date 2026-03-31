"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Chatbot from "../../../components/Chatbot";
import { Loader2 } from "lucide-react";
import { API_BASE } from "../../../lib/api";

/**
 * Embed page — renders ONLY the bare Chatbot component.
 * This is loaded inside an iframe by widget.js on external websites.
 * It must NOT contain any landing page chrome (no hero, no nav, no address cards).
 */
export default function EmbedChatPage() {
    const params = useParams();
    const botId = params.botId as string;
    const [bot, setBot] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!botId) return;
        fetch(`${API_BASE}/api/bots/public/list`)
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : (Array.isArray(data?.bots) ? data.bots : []);
                const found = list.find((b: any) =>
                    b.name.toLowerCase() === botId.toLowerCase() || b.id === botId
                );
                if (found) setBot(found);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [botId]);

    if (loading) {
        return (
            <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
                <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
        );
    }

    if (!bot) {
        return (
            <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "white" }}>
                <p>Chatbot not found.</p>
            </div>
        );
    }

    const isRestaurant = bot.id?.includes("restaurant");
    const accentGrad = isRestaurant ? "from-rose-500 to-orange-400" : "from-red-600 to-rose-500";
    const themeColor = bot.theme_color || `bg-gradient-to-br ${accentGrad}`;

    return (
        <div style={{ width: "100%", height: "100vh", background: "#0a0a0a", overflow: "hidden", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
            <Chatbot
                botId={bot.id}
                botName={bot.name}
                botRole={bot.role}
                botAvatar={bot.avatar}
                themeColor={themeColor}
                fullScreen={true}
                suggestedQuestions={bot.page_config?.suggested_questions || []}
                voiceEnabled={!!bot.persona_config?.voice_enabled}
            />
        </div>
    );
}
