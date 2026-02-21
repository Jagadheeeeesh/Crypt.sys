"use client";

import { useState, useEffect } from "react";
import { Activity, Shield, AlertTriangle, Map as MapIcon, Terminal, Users, Lock, Radio, Home, MessageSquare, LogOut, TrendingUp, Zap, Globe } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from "framer-motion";
import clsx from "clsx";
import Link from "next/link";

interface DashboardStats {
    system_status: string;
    active_nodes: number;
    defcon: number;
    active_threats: number;
    trend_data: { time: string; value: number }[];
    alerts: {
        id: string;
        title: string;
        risk: string;
        time: string;
        details: string;
    }[];
    logs: {
        time: string;
        type: string;
        message: string;
    }[];
    geo_risks: { lat: number; lng: number; risk: string }[];
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers: any = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;

            // Use relative path for Vercel/Local compatibility
            const res = await fetch("/api/v1/dashboard/stats", { headers });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error("Dashboard poll failed", e);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 3000); // Poll every 3s
        const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => {
            clearInterval(interval);
            clearInterval(timeInterval);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/";
    };

    if (!stats) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-teal-500" />
            </div>
            <div className="text-teal-500 font-mono animate-pulse text-lg">ESTABLISHING SECURE UPLINK...</div>
            <div className="flex items-center gap-2 text-slate-600 text-xs">
                <Radio className="w-3 h-3 animate-pulse" />
                Connecting to satellite network
            </div>
        </div>
    );

    return (
        <main className="min-h-screen bg-slate-950 font-mono text-slate-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>

            {/* Navigation Bar */}
            <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-xl">
                <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                                <Shield className="w-6 h-6 text-slate-900" />
                            </div>
                            <div>
                                <span className="font-bold text-white text-lg">CYBERLOCK<span className="text-teal-400"> AI</span></span>
                                <div className="text-[10px] text-slate-500">HQ COMMAND CENTER</div>
                            </div>
                        </div>
                        
                        <div className="hidden md:flex items-center gap-1 border-l border-slate-800 pl-6">
                            <Link href="/" className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors flex items-center gap-2">
                                <Home className="w-4 h-4" /> Home
                            </Link>
                            <Link href="/chat" className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> Chat
                            </Link>
                            <div className="px-3 py-2 text-sm text-teal-400 bg-teal-500/10 rounded-lg flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Dashboard
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Live Clock */}
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700 text-xs">
                            <Globe className="w-3 h-3 text-teal-400" />
                            <span className="text-slate-400">UTC</span>
                            <span className="text-white font-bold">{currentTime.toUTCString().slice(17, 25)}</span>
                        </div>

                        {/* System Status Badge */}
                        <div className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold",
                            stats.system_status === "OPERATIONAL" 
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                        )}>
                            <span className={clsx(
                                "w-2 h-2 rounded-full animate-pulse",
                                stats.system_status === "OPERATIONAL" ? "bg-emerald-500" : "bg-rose-500"
                            )}></span>
                            {stats.system_status}
                        </div>

                        <button 
                            onClick={handleLogout}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-[1800px] mx-auto p-6">
                {/* Top Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard 
                        icon={<Activity className="w-5 h-5" />}
                        label="Active Nodes"
                        value={stats.active_nodes.toLocaleString()}
                        color="teal"
                    />
                    <StatCard 
                        icon={<AlertTriangle className="w-5 h-5" />}
                        label="Active Threats"
                        value={stats.active_threats.toString()}
                        color={stats.active_threats > 0 ? "rose" : "emerald"}
                    />
                    <StatCard 
                        icon={<Zap className="w-5 h-5" />}
                        label="DEFCON Level"
                        value={`LEVEL ${stats.defcon}`}
                        color={stats.defcon <= 2 ? "rose" : stats.defcon === 3 ? "yellow" : "teal"}
                    />
                    <StatCard 
                        icon={<Users className="w-5 h-5" />}
                        label="Active Sessions"
                        value="24"
                        color="purple"
                    />
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">

                    {/* Main Chart Area */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-teal-500/20 transition-colors">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-teal-400" /> Threat Intelligence Feed
                                </h2>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                                    LIVE DATA STREAM
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.trend_data}>
                                        <defs>
                                            <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorThreat)" name="Threat Events" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Active Alerts */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-500" /> ACTIVE ALERTS
                                    {stats.alerts.length > 0 && (
                                        <span className="ml-auto px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full text-[10px] font-bold">
                                            {stats.alerts.length}
                                        </span>
                                    )}
                                </h3>
                                <div className="space-y-3 max-h-[280px] overflow-y-auto">
                                    {stats.alerts.length === 0 && (
                                        <div className="text-center py-8">
                                            <Shield className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
                                            <div className="text-emerald-500 text-sm font-medium">All Clear</div>
                                            <div className="text-slate-600 text-xs">No active threats detected</div>
                                        </div>
                                    )}
                                    {stats.alerts.map((alert, i) => (
                                        <motion.div
                                            key={alert.id + i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-start gap-3 p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl hover:bg-rose-500/10 cursor-pointer transition group"
                                        >
                                            <div className="p-1.5 bg-rose-500/20 rounded-lg group-hover:scale-110 transition-transform">
                                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white text-sm font-bold">{alert.title}</div>
                                                <div className="text-xs text-rose-300/60 truncate">{alert.details}</div>
                                                <div className="text-[10px] text-slate-500 mt-1">{new Date(alert.time).toLocaleTimeString()}</div>
                                            </div>
                                            <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-1 rounded-lg font-bold whitespace-nowrap">
                                                HIGH
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Geolocation Map */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <MapIcon className="w-4 h-4 text-blue-500" /> GEOLOCATION RISK MAP
                                </h3>
                                <div className="h-[280px] w-full bg-slate-800/50 rounded-xl flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                                    {/* World Map Outline (Simplified) */}
                                    <div className="absolute inset-4 border border-slate-700/50 rounded-lg"></div>
                                    
                                    {/* Simulated Map Nodes */}
                                    <div className="relative w-full h-full">
                                        {stats.geo_risks.map((pt, i) => (
                                            <div
                                                key={i}
                                                className="absolute"
                                                style={{
                                                    top: `${((pt.lat % 7) + 2) * 12}%`,
                                                    left: `${((pt.lng % 7) + 2) * 12}%`
                                                }}
                                            >
                                                <div className="w-4 h-4 bg-rose-500/20 rounded-full animate-ping"></div>
                                                <div className="absolute top-1 left-1 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_10px_#ef4444]"></div>
                                            </div>
                                        ))}
                                        {stats.geo_risks.length === 0 && (
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                                <Globe className="w-12 h-12 text-emerald-500/30 mx-auto mb-2" />
                                                <div className="text-xs text-emerald-500 font-bold">GLOBAL THREAT LEVEL: MINIMAL</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded">
                                        LIVE SATELLITE FEED
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-emerald-500" /> SYSTEM LOGS
                            </h3>
                            {/* Scrollable container for logs */}
                            <div className="h-[400px] overflow-y-auto relative text-xs font-mono space-y-2 opacity-80 pr-2">
                                {stats.logs.map((log, i) => (
                                    <div key={i} className="flex gap-2 text-slate-500 animate-in fade-in slide-in-from-right-2 duration-300 p-2 rounded hover:bg-slate-800/30">
                                        <span className="text-slate-700 whitespace-nowrap">{log.time}</span>
                                        <span className={clsx(
                                            "break-all",
                                            log.type.includes("WARN") ? "text-rose-400" :
                                                log.type.includes("SYS") ? "text-slate-400" : "text-teal-500"
                                        )}>
                                            {log.type} {log.message}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    const colorClasses: Record<string, string> = {
        teal: "text-teal-400 bg-teal-500/10 border-teal-500/30",
        rose: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    };

    const iconColor: Record<string, string> = {
        teal: "text-teal-400",
        rose: "text-rose-400",
        emerald: "text-emerald-400",
        yellow: "text-yellow-400",
        purple: "text-purple-400",
    };

    return (
        <div className={clsx("p-4 rounded-xl border backdrop-blur-sm transition-all hover:scale-[1.02]", colorClasses[color])}>
            <div className="flex items-center justify-between mb-2">
                <span className={iconColor[color]}>{icon}</span>
                <span className="text-[10px] text-slate-500 uppercase">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    );
}
