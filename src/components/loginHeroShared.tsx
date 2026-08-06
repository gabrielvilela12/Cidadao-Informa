import React, { useLayoutEffect, useRef, useState } from 'react';

// Cards cascade natural design size (px). Scaled down as a unit only on the narrowest panels.
export const CASCADE_WIDTH = 760;
export const CASCADE_HEIGHT = 225;

export function SendIcon() {
    return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
            <path d="M22 2 L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2 L15 22 L11 13 L2 9 Z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    );
}

export function SearchIcon() {
    return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <circle cx="10" cy="10" r="7" stroke="#fff" strokeWidth="2.2" />
            <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
    );
}

export function CheckIcon() {
    return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path d="M4 12 L9.5 17.5 L20 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function useFitScale(naturalWidth: number) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        const observer = new ResizeObserver(([entry]) => {
            setScale(Math.min(1, entry.contentRect.width / naturalWidth));
        });
        observer.observe(wrapper);
        return () => observer.disconnect();
    }, [naturalWidth]);

    return { wrapperRef, scale };
}

// Horizontal "S" connector: a short straight lead-out from x1,y1, a smooth dip/rise through the
// middle, then a short straight lead-in ending at x2,y2. The Bézier's control points (cx1/cx2/midX)
// are computed from the true card-edge anchors and never change — that's the curve's geometry.
// The only thing trimmed for the card-to-dot gap is how much of each straight lead is actually
// drawn/dotted, which shortens without touching the curve itself.
export function Connector({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
    const LEAD = 14; // straight run length baked into the curve's control points — unchanged
    const GAP = 5; // clear space kept between a card's edge and the nearest dot
    const R_START = 4; // big hollow dot, at the top of each connector
    const R_END = 2.5; // small solid dot, where the dashes terminate

    const cx1 = x1 + LEAD;
    const cx2 = x2 - LEAD;
    const midX = (cx1 + cx2) / 2;

    const drawStartX = x1 + GAP + R_START; // where the dashed line actually begins (under the big dot)
    const drawEndX = x2 - GAP - R_END; // where the dashed line actually ends (under the small dot)

    return (
        <>
            <path
                d={`M ${drawStartX} ${y1} L ${cx1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${cx2} ${y2} L ${drawEndX} ${y2}`}
                fill="none"
                stroke="#1741c4"
                strokeWidth={3.5}
                strokeDasharray="0.1 8"
                strokeLinecap="round"
            />
            <circle cx={drawStartX} cy={y1} r={R_START} fill="#fff" stroke="#12297a" strokeWidth={2} />
            <circle cx={drawEndX} cy={y2} r={R_END} fill="#1741c4" />
        </>
    );
}

export function StatusCard({ top, left, color, icon, label }: { top: number; left: number; color: string; icon: React.ReactNode; label: string }) {
    return (
        <div
            className="absolute box-border flex items-center gap-3.5 rounded-2xl bg-white"
            style={{ top, left, width: 220, height: 90, padding: '0 22px', boxShadow: '0 10px 24px rgba(30,60,120,0.12)' }}
        >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full" style={{ background: color }}>
                {icon}
            </div>
            <div className="flex items-center gap-2">
                <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
                <span className="text-[15px] font-semibold leading-tight text-slate-800">{label}</span>
            </div>
        </div>
    );
}

export function FeatureItem({ icon, color, label }: { icon: React.ReactNode; color: string; label: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`flex size-11 shrink-0 items-center justify-center rounded-full ${color}`}>
                {icon}
            </div>
            <span
                className="text-sm font-semibold leading-tight text-slate-800"
                style={{ textShadow: '0 1px 2px rgba(255,255,255,0.85), 0 1px 8px rgba(255,255,255,0.5)' }}
            >
                {label}
            </span>
        </div>
    );
}
