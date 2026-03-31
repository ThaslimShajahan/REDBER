"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Shared animated shimmer progress bar + skeleton loader for admin panel
export function TopProgressBar() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    return createPortal(
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] overflow-hidden pointer-events-none">
            <div style={{
                height: "100%",
                background: "linear-gradient(to right, #6366f1, #a855f7, #ec4899)",
                animation: "progressBar 1.4s ease-in-out infinite",
            }} />
            <style>{`
                @keyframes progressBar {
                    0%   { transform: translateX(-100%); width: 60%; }
                    50%  { transform: translateX(30%); width: 80%; }
                    100% { transform: translateX(110%); width: 60%; }
                }
            `}</style>
        </div>,
        document.body
    );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
    return (
        <tr>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-4">
                    <div className="h-3 bg-white/5 rounded-full animate-pulse" style={{ width: `${60 + (i * 13) % 40}%` }} />
                </td>
            ))}
        </tr>
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-3 animate-pulse">
            <div className="h-3 bg-white/5 rounded-full w-1/3" />
            <div className="h-3 bg-white/5 rounded-full w-2/3" />
            <div className="h-3 bg-white/5 rounded-full w-1/2" />
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <>
            <TopProgressBar />
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonRow key={i} cols={cols} />
            ))}
        </>
    );
}

