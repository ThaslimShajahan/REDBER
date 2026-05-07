"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, X, Clock, Users, BedDouble, Phone, Mail, CheckCircle2, XCircle, AlertCircle, RefreshCw, Bot, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE, authFetch } from "../../../lib/api";

interface Booking {
    id: string;
    bot_id: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    booking_date?: string;
    check_out?: string;
    booking_time?: string;
    guests?: string;
    room_type?: string;
    notes?: string;
    status: string;
    created_at: string;
}

const STATUS = {
    confirmed: { dot: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25", icon: CheckCircle2 },
    cancelled:  { dot: "bg-rose-400",    pill: "bg-rose-500/15 text-rose-400 border border-rose-500/25",       icon: XCircle },
    pending:    { dot: "bg-amber-400",   pill: "bg-amber-500/15 text-amber-400 border border-amber-500/25",    icon: AlertCircle },
} as const;

const PALETTE = ["#6366f1","#8b5cf6","#10b981","#0ea5e9","#ec4899","#f97316","#14b8a6","#f43f5e"];
const MONTHS  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function guestLabel(b: Booking) {
    if (b.customer_name) return b.customer_name;
    if (b.customer_phone) return "·" + b.customer_phone.replace(/\D/g,"").slice(-4);
    return "Guest";
}

function parseDate(s?: string): Date | null {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

function sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateKey(y: number, m: number, d: number) {
    return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

export default function CalendarView() {
    const today = new Date();
    const [year,  setYear]  = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [selected, setSelected] = useState<Booking | null>(null);
    const [selDate,  setSelDate]  = useState<string | null>(null);
    const [botFilter,    setBotFilter]    = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_BASE}/api/admin/bookings?limit=500`);
            if (res.ok) setBookings(await res.json());
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const allBots = Array.from(new Set(bookings.map(b => b.bot_id)));
    const botColor = Object.fromEntries(allBots.map((id, i) => [id, PALETTE[i % PALETTE.length]]));

    const filtered = bookings.filter(b =>
        (botFilter === "all" || b.bot_id === botFilter) &&
        (statusFilter === "all" || b.status === statusFilter)
    );

    // date → bookings map
    const dayMap: Record<string, Booking[]> = {};
    filtered.forEach(b => {
        const d = parseDate(b.booking_date);
        if (!d) return;
        const k = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
        (dayMap[k] = dayMap[k] || []).push(b);
    });

    // calendar grid
    const firstDow  = new Date(year, month, 1).getDay();
    const daysInMo  = new Date(year, month + 1, 0).getDate();
    const cells: (number|null)[] = [...Array(firstDow).fill(null), ...Array.from({length:daysInMo},(_,i)=>i+1)];
    while (cells.length % 7) cells.push(null);

    const prevMo = () => month === 0  ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1);
    const nextMo = () => month === 11 ? (setYear(y=>y+1), setMonth(0))  : setMonth(m=>m+1);
    const goNow  = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelDate(null); };

    const selDayBookings = selDate ? (dayMap[selDate] || []) : [];

    const monthBks  = filtered.filter(b => { const d = parseDate(b.booking_date); return d && d.getFullYear()===year && d.getMonth()===month; });
    const upcoming  = filtered
        .filter(b => { const d = parseDate(b.booking_date); return d && d >= today; })
        .sort((a,b) => (parseDate(a.booking_date)?.getTime()||0) - (parseDate(b.booking_date)?.getTime()||0));

    return (
        <div className="flex gap-5 h-full">

            {/* ── Calendar column ── */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">

                {/* toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1">
                        <button onClick={prevMo} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><ChevronLeft size={15}/></button>
                        <span className="px-3 font-bold text-sm min-w-[130px] text-center">{MONTHS[month]} {year}</span>
                        <button onClick={nextMo} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><ChevronRight size={15}/></button>
                    </div>
                    <button onClick={goNow} className="px-3 py-2 text-xs font-bold bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">Today</button>
                    <button onClick={fetchBookings} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                        <RefreshCw size={13} className={loading ? "animate-spin text-indigo-400" : "text-gray-500"} />
                    </button>
                    <div className="flex-1"/>
                    <select value={botFilter} onChange={e=>setBotFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 outline-none cursor-pointer">
                        <option value="all">All Bots</option>
                        {allBots.map(id=><option key={id} value={id}>{id}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 outline-none cursor-pointer">
                        <option value="all">All Statuses</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {/* stat chips */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        {label:"This Month",  val: monthBks.length,                                           color:"text-white"},
                        {label:"Confirmed",   val: monthBks.filter(b=>b.status==="confirmed").length,         color:"text-emerald-400"},
                        {label:"All Time",    val: filtered.length,                                            color:"text-indigo-400"},
                    ].map(s=>(
                        <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-4 py-3 flex items-center gap-3">
                            <CalendarDays size={16} className="text-gray-600 shrink-0"/>
                            <div><p className={`text-2xl font-black leading-none ${s.color}`}>{s.val}</p>
                                 <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p></div>
                        </div>
                    ))}
                </div>

                {/* grid */}
                <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden flex-1 min-h-0">
                    {/* headers */}
                    <div className="grid grid-cols-7 border-b border-white/[0.07]">
                        {DAYS.map(d=>(
                            <div key={d} className="py-2.5 text-center text-[10px] font-black text-gray-600 uppercase tracking-widest">{d}</div>
                        ))}
                    </div>
                    {/* cells */}
                    <div className="grid grid-cols-7 divide-x divide-white/[0.04]">
                        {cells.map((day,i)=>{
                            if (day===null) return <div key={`e${i}`} className="border-b border-white/[0.04] min-h-[88px] bg-white/[0.005]"/>;
                            const k = dateKey(year, month, day);
                            const bks = dayMap[k] || [];
                            const isToday    = sameDay(new Date(year,month,day), today);
                            const isSel      = selDate===k;
                            const isWknd     = [0,6].includes(new Date(year,month,day).getDay());
                            return (
                                <button key={k} onClick={()=>setSelDate(isSel?null:k)}
                                    className={`border-b border-white/[0.04] min-h-[88px] p-1.5 text-left align-top transition-colors
                                        ${isSel   ? "bg-indigo-500/10" : ""}
                                        ${isWknd && !isSel ? "bg-white/[0.008]" : ""}
                                        hover:bg-white/[0.04] focus:outline-none`}>
                                    <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mb-1
                                        ${isToday ? "bg-indigo-500 text-white" : isSel ? "text-indigo-300" : isWknd ? "text-gray-600" : "text-gray-400"}`}>
                                        {day}
                                    </span>
                                    <div className="space-y-0.5">
                                        {bks.slice(0,2).map((b,bi)=>{
                                            const sc = STATUS[b.status as keyof typeof STATUS] ?? STATUS.confirmed;
                                            const bc = botColor[b.bot_id] || "#6366f1";
                                            return (
                                                <div key={b.id||bi}
                                                    onClick={e=>{e.stopPropagation();setSelected(b);setSelDate(k);}}
                                                    style={{background:`${bc}22`,borderLeft:`2px solid ${bc}`}}
                                                    className="flex items-center gap-1 rounded-r-md px-1.5 py-0.5 cursor-pointer hover:brightness-110 transition-all">
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`}/>
                                                    <span className="text-[10px] font-semibold text-white/90 truncate leading-tight">
                                                        {guestLabel(b)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        {bks.length>2 && (
                                            <p className="text-[9px] text-gray-600 font-bold pl-1">+{bks.length-2} more</p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* bot legend */}
                {allBots.length>0 && (
                    <div className="flex flex-wrap gap-2">
                        {allBots.map(id=>(
                            <button key={id} onClick={()=>setBotFilter(botFilter===id?"all":id)}
                                style={{borderColor: botFilter===id ? botColor[id]+"66" : "transparent",
                                        background:  botFilter===id ? botColor[id]+"22" : "rgba(255,255,255,0.03)"}}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold text-gray-400 hover:text-white transition-all">
                                <span className="w-2 h-2 rounded-full" style={{background:botColor[id]}}/>
                                {id}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Detail panel ── */}
            <AnimatePresence mode="wait">
                {(selDate||selected) && (
                    <motion.div key={selected?.id||selDate} initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:16}}
                        className="w-72 shrink-0 flex flex-col gap-3">

                        {selected ? (
                            /* ─ Booking card ─ */
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                                <div className="px-4 py-3 flex items-start justify-between"
                                    style={{background:`${botColor[selected.bot_id]}22`, borderBottom:`1px solid ${botColor[selected.bot_id]}33`}}>
                                    <div>
                                        <p className="font-black text-sm leading-tight">{selected.customer_name || (selected.customer_phone ? `Guest ···${selected.customer_phone.slice(-4)}` : "Guest")}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1"><Bot size={9}/>{selected.bot_id}</p>
                                    </div>
                                    <button onClick={()=>setSelected(null)} className="p-1 rounded-lg hover:bg-white/10"><X size={13}/></button>
                                </div>

                                <div className="px-4 pt-3 pb-1">
                                    {(()=>{
                                        const sc = STATUS[selected.status as keyof typeof STATUS] ?? STATUS.confirmed;
                                        const Icon = sc.icon;
                                        return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.pill}`}><Icon size={10}/>{selected.status}</span>;
                                    })()}
                                </div>

                                <div className="px-4 py-3 space-y-2.5">
                                    {[
                                        {icon:CalendarDays, label:"Check-In",    val:selected.booking_date},
                                        {icon:ArrowRight,   label:"Check-Out",   val:selected.check_out},
                                        {icon:Clock,        label:"Time",         val:selected.booking_time},
                                        {icon:BedDouble,    label:"Room / Type",  val:selected.room_type},
                                        {icon:Users,        label:"Guests",       val:selected.guests},
                                        {icon:Phone,        label:"Phone",        val:selected.customer_phone},
                                        {icon:Mail,         label:"Email",        val:selected.customer_email},
                                    ].filter(r=>r.val).map(row=>{
                                        const Icon=row.icon;
                                        return (
                                            <div key={row.label} className="flex items-start gap-2.5">
                                                <Icon size={12} className="text-gray-600 mt-0.5 shrink-0"/>
                                                <div><p className="text-[9px] text-gray-600 uppercase tracking-wider font-bold">{row.label}</p>
                                                     <p className="text-xs text-white/90 font-medium leading-tight">{row.val}</p></div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {selected.notes && (
                                    <div className="mx-4 mb-3 p-2.5 rounded-xl bg-white/5 text-[11px] text-gray-400">{selected.notes}</div>
                                )}
                                <div className="px-4 pb-3 border-t border-white/[0.05] pt-2.5">
                                    <p className="text-[9px] text-gray-700">
                                        Booked {new Date(selected.created_at).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                                    </p>
                                </div>
                            </div>
                        ) : selDate && selDayBookings.length>0 ? (
                            /* ─ Day list ─ */
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
                                    <div>
                                        <p className="font-black text-sm">
                                            {new Date(selDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{selDayBookings.length} booking{selDayBookings.length!==1?"s":""}</p>
                                    </div>
                                    <button onClick={()=>setSelDate(null)} className="p-1 rounded-lg hover:bg-white/10"><X size={13}/></button>
                                </div>
                                <div className="divide-y divide-white/[0.04] max-h-[55vh] overflow-y-auto">
                                    {selDayBookings.map(b=>{
                                        const sc = STATUS[b.status as keyof typeof STATUS] ?? STATUS.confirmed;
                                        const bc = botColor[b.bot_id]||"#6366f1";
                                        return (
                                            <button key={b.id} onClick={()=>setSelected(b)}
                                                className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3">
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`}/>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate">{guestLabel(b)}</p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                                                        {b.booking_time && <span className="flex items-center gap-0.5"><Clock size={9}/>{b.booking_time}</span>}
                                                        {b.room_type && <span className="flex items-center gap-0.5"><BedDouble size={9}/>{b.room_type.split(" ").slice(0,2).join(" ")}</span>}
                                                    </p>
                                                </div>
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{background:bc}}/>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : selDate ? (
                            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 text-center">
                                <CalendarDays size={24} className="text-gray-700 mx-auto mb-2"/>
                                <p className="text-xs text-gray-600">No bookings on this date</p>
                                <button onClick={()=>setSelDate(null)} className="mt-3 text-[10px] text-gray-700 hover:text-white transition-colors">Dismiss</button>
                            </div>
                        ) : null}

                        {/* upcoming list */}
                        {!selected && (
                            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-white/[0.05]">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upcoming</p>
                                </div>
                                <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
                                    {upcoming.slice(0,8).map(b=>{
                                        const sc = STATUS[b.status as keyof typeof STATUS] ?? STATUS.confirmed;
                                        const bc = botColor[b.bot_id]||"#6366f1";
                                        return (
                                            <button key={b.id} onClick={()=>setSelected(b)}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`}/>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold truncate">{guestLabel(b)}</p>
                                                    <p className="text-[10px] text-gray-600 truncate">{b.booking_date}</p>
                                                </div>
                                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:bc}}/>
                                            </button>
                                        );
                                    })}
                                    {upcoming.length===0 && <p className="px-4 py-3 text-xs text-gray-700">No upcoming bookings</p>}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* empty state */}
            {!loading && bookings.length===0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <CalendarDays size={36} className="text-gray-800 mx-auto mb-2"/>
                        <p className="text-gray-600 text-sm font-semibold">No bookings yet</p>
                        <p className="text-gray-700 text-xs mt-1">Confirmed bookings from the chatbot will appear here</p>
                    </div>
                </div>
            )}
        </div>
    );
}
