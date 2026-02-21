"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Shield, Lock, AlertTriangle, Eye, Activity, Brain, Key, Network, Paperclip, File, Download, CheckCircle, Menu, X, Home, LogOut, Radio, User, Hash, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import Link from "next/link";

type RiskResult = {
    message_id?: number;
    ai_score: number;
    opsec_risk: "SAFE" | "SENSITIVE" | "HIGH";
    phishing_risk: "LOW" | "MODERATE" | "HIGH";
    explanation: string;
}

type Message = {
    id: string;
    text: string;
    sender: 'me' | 'them';
    timestamp: Date;
    status: 'scanning' | 'encrypted' | 'sent' | 'blocked';
    risk?: RiskResult;
    file?: {
        name: string;
        size: string;
        type: string;
        url: string;
    };
    integrityHash?: string;
    replyTo?: {
        id: string;
        text: string;
        sender: 'me' | 'them';
    };
}

const mockMessages: Message[] = [
    {
        id: '1',
        text: "Status report for sector 7?",
        sender: 'them',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        status: 'sent',
        risk: { ai_score: 12, opsec_risk: 'SAFE', phishing_risk: 'LOW', explanation: 'Routine query' }
    }
];

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [fileUpload, setFileUpload] = useState<File | null>(null);
    const [selectedChannel, setSelectedChannel] = useState("general");
    const [ttl, setTtl] = useState<number | null>(null);
    const [dms, setDms] = useState<{ id: string; name: string; status: string }[]>([]);
    const [dmEmail, setDmEmail] = useState("");
    const [showDmInput, setShowDmInput] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userInfo, setUserInfo] = useState<{ email: string; full_name: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const channels = [
        { id: "general", name: "Alpha Team", status: "ACTIVE", icon: Hash },
        { id: "bravo", name: "Bravo Squad", status: "STANDBY", icon: Hash },
        { id: "hq", name: "HQ Command", status: "ONLINE", icon: Shield },
        { id: "ops", name: "Special Ops", status: "ENCRYPTED", icon: Lock }
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`/api/v1/chat/messages?channel_id=${selectedChannel}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                // Merge logic could be simpler: just replace for now or append new ones
                // To avoid jitter, we can just setMessages if the length is different or last message ID different
                // For prototype, simple set is fine, but let's be careful about local "scanning" state

                // We only want to overwrite if we are not currently simulating a local scan that hasn't finished? 
                // Actually, the backend is the source of truth. 
                // But we want to keep the "scanning" status for the user's own messages if they just sent it.
                // The backend messages will have "sent" or "blocked". 
                // So if we replace `messages` with `data`, we might lose the "scanning" state of a just-sent message 
                // if the backend implementation doesn't return it immediately or if it returns it as "sent" immediately.

                // Better approach for prototype: 
                // If we have a local message in "scanning" state, keep it. 
                // Only merge in messages that are NOT in our local "scanning" list? 
                // OR, just simply append incoming messages that are NEW?


                setMessages(prev => {
                    // 1. Convert Backend Data to Message Objects
                    const backendMessages: Message[] = data.map((backendMsg: any) => ({
                        id: backendMsg.id.toString(),
                        text: backendMsg.content_encrypted || backendMsg.text, // Handle potential field name diffs
                        sender: (backendMsg.sender === 'me' ? 'me' : 'them'),
                        timestamp: new Date(backendMsg.timestamp.endsWith("Z") ? backendMsg.timestamp : backendMsg.timestamp + "Z"),
                        status: backendMsg.risk?.opsec_risk === 'HIGH' ? 'blocked' : 'sent',
                        risk: backendMsg.risk,
                        file: backendMsg.file_url ? {
                            url: backendMsg.file_url,
                            type: backendMsg.file_type,
                            size: backendMsg.file_size,
                            name: backendMsg.file_type || "Encrypted File"
                        } : undefined,
                        integrityHash: backendMsg.integrity_hash,
                        replyTo: backendMsg.reply_to ? {
                            id: backendMsg.reply_to.id,
                            text: backendMsg.reply_to.text,
                            sender: backendMsg.reply_to.sender
                        } : undefined
                    }));

                    // 2. Identify Pending Local Messages (Scanning/Unconfirmed)
                    // These are messages with temporary IDs (long timestamps) created locally
                    const pendingLocalMessages = prev.filter(m => m.id.length > 10 && m.sender === 'me');

                    // 3. Filter Pending Messages: Remove if they are now in Backend
                    const uniquePending = pendingLocalMessages.filter(localMsg => {
                        // Check exact hash match
                        if (localMsg.integrityHash && backendMessages.some(bm => bm.integrityHash === localMsg.integrityHash)) {
                            console.log("Removing pending msg (hash match):", localMsg.id);
                            return false;
                        }

                        // Check text match (fallback for legacy or missing hash)
                        // Only match if within reasonable time window (e.g. 10 seconds)
                        const matchingBackend = backendMessages.find(bm =>
                            bm.text === localMsg.text &&
                            bm.sender === 'me' &&
                            Math.abs(bm.timestamp.getTime() - localMsg.timestamp.getTime()) < 10000
                        );

                        if (matchingBackend) {
                            console.log("Removing pending msg (text match):", localMsg.id);
                            return false;
                        }

                        return true;
                    });

                    // 4. Merge: Backend Truth + Remaining Pending
                    const merged = [...backendMessages, ...uniquePending].sort((a, b) =>
                        a.timestamp.getTime() - b.timestamp.getTime()
                    );

                    return merged;
                });
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    useEffect(() => {
        fetchMessages();
        fetchDms(); // Fetch active DMs
        fetchUserInfo(); // Fetch user info
        // Poll more frequently for faster updates
        const interval = setInterval(() => {
            fetchMessages();
            // fetchDms(); // Optional: polling DMs
        }, 800);
        return () => clearInterval(interval);
    }, [selectedChannel]);

    const fetchUserInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/v1/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserInfo(data);
            }
        } catch (e) {
            console.error("Failed to fetch user info", e);
        }
    };

    const sendingRef = useRef(false);
    const lastSentRef = useRef<{ text: string, time: number }>({ text: "", time: 0 });

    const handleSend = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput && !fileUpload) return;

        // LOCK 1: Ref-based lock for sequential calls
        if (sendingRef.current) {
            console.log("Send blocked: already sending");
            return;
        }

        // LOCK 2: Time-based deduplication (Prevent identical text within 2 seconds)
        const now = Date.now();
        if (trimmedInput === lastSentRef.current.text && (now - lastSentRef.current.time) < 2000) {
            console.log("Send blocked: identical message within 2s");
            return;
        }

        // Check auth
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = '/login';
            return;
        }

        sendingRef.current = true;
        lastSentRef.current = { text: trimmedInput, time: now };
        setIsScanning(true);

        // Prepare File Data
        let fileData = undefined;
        if (fileUpload) {
            fileData = {
                name: fileUpload.name,
                size: (fileUpload.size / 1024).toFixed(1) + " KB",
                type: fileUpload.type,
                url: URL.createObjectURL(fileUpload) // Local preview
            };
        }

        // Compute Integrity Hash (SHA-256 simulation)
        // Use trimmedInput and now (the shared timestamp for this send session)
        const contentToHash = (trimmedInput || "") + (fileData?.name || "") + now;
        const msgBuffer = new TextEncoder().encode(contentToHash);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const integrityHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const newMessage: Message = {
            id: now.toString(),
            text: trimmedInput,
            sender: 'me',
            timestamp: new Date(now),
            status: 'scanning',
            file: fileData,
            integrityHash: integrityHash
        };

        // UI Update: Clear input immediately to visual feedback
        setMessages(prev => [...prev, newMessage]);
        setInput("");
        setFileUpload(null);
        setReplyTo(null);

        // Backend API Call
        let risk: RiskResult | null = null;
        try {
            const res = await fetch('/api/v1/threat-intel/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    lines: newMessage.text || "[Encrypted File Attachment]",
                    file_url: fileData?.url,
                    file_type: fileData?.type,
                    file_size: fileData?.size,
                    integrity_hash: integrityHash,
                    channel_id: selectedChannel,
                    ttl_seconds: ttl,
                    reply_to_id: replyTo?.id
                })
            });

            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (res.ok) {
                risk = await res.json();
            }
        } catch (e) {
            console.warn("Backend error, relying on poll for confirmation.", e);
        }

        if (risk) {
            setMessages(prev => {
                const nextMap = new Map(prev.map(m => [m.id, m]));
                // Delete the temp ID used locally
                if (nextMap.has(newMessage.id)) nextMap.delete(newMessage.id);
                // Also check if poller already added the committed ID
                const committedId = risk!.message_id ? risk!.message_id.toString() : newMessage.id;

                nextMap.set(committedId, {
                    ...newMessage,
                    id: committedId,
                    status: (risk!.opsec_risk === 'HIGH' ? 'blocked' : 'sent') as any,
                    risk: risk!
                });
                return Array.from(nextMap.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            });
        }

        setIsScanning(false);
        // Delay unlocking slightly to completely clear the race window
        setTimeout(() => {
            sendingRef.current = false;
        }, 500);

        // Auto-reply simulation (ONLY if it hasn't been blocked)
        setTimeout(() => {
            setMessages(prev => {
                const hasRecentThem = prev.slice(-3).some(m => m.sender === 'them' && m.timestamp.getTime() > now);
                if (hasRecentThem) return prev;

                const reply: Message = {
                    id: (Date.now() + 1).toString(),
                    text: "Copy that. proceeding with caution.",
                    sender: 'them',
                    timestamp: new Date(),
                    status: 'sent',
                    risk: { ai_score: 5, opsec_risk: 'SAFE', phishing_risk: 'LOW', explanation: 'Safe response' }
                };
                return [...prev, reply];
            });
        }, 2000);
    };

    const handleAddDM = async () => {
        if (!dmEmail) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/chat/dm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ identifier: dmEmail })
            });

            if (res.ok) {
                const data = await res.json();

                // Add to DMs list if not exists
                if (!dms.find(d => d.id === data.channel_id)) {
                    setDms([...dms, {
                        id: data.channel_id,
                        name: data.target_user.full_name || data.target_user.email,
                        status: "ENCRYPTED"
                    }]);
                }

                setSelectedChannel(data.channel_id);
                setDmEmail("");
                setShowDmInput(false);
            } else {
                alert("User not found via email");
            }
        } catch (e) {
            console.error("DM Error", e);
        }
    };

    // Fetch DMs on load
    const fetchDms = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/v1/chat/dms', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDms(data);
            }
        } catch (e) {
            console.error("Failed to fetch DMs", e);
        }
    };

    // Mock scan logic for UI demo
    const mockScan = async (text: string): Promise<RiskResult> => {
        const lower = text.toLowerCase();
        let opsec: "SAFE" | "SENSITIVE" | "HIGH" = "SAFE";

        // Critical threats
        const critical = ["bomb", "attack", "kill", "assassinate", "terrorism", "explosive", "weapon", "target", "strike", "ied", "hostage"];

        if (critical.some(word => lower.includes(word))) {
            opsec = "HIGH";
        } else if (lower.includes("deployment") || lower.includes("0600")) {
            opsec = "HIGH";
        } else if (lower.includes("location")) {
            opsec = "SENSITIVE";
        }

        let phishing: "LOW" | "MODERATE" | "HIGH" = "LOW";
        if (lower.includes("click here")) phishing = "HIGH";

        return {
            ai_score: Math.random() * 20,
            opsec_risk: opsec,
            phishing_risk: phishing,
            explanation: "Automated scan complete."
        };
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/";
    };

    return (
        <div className="flex w-full h-full bg-slate-950 text-slate-200">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
            >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar */}
            <aside className={clsx(
                "w-80 border-r border-slate-800 bg-slate-900/80 backdrop-blur-xl flex flex-col transition-all duration-300 z-40",
                "fixed md:relative h-full",
                sidebarOpen ? "left-0" : "-left-80 md:left-0"
            )}>
                {/* Sidebar Header with User Info */}
                <div className="p-4 border-b border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Shield className="w-5 h-5 text-slate-900" />
                        </div>
                        <div>
                            <h2 className="font-bold text-white text-lg">SENTINEL</h2>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Lock className="w-3 h-3" /> ENCRYPTED
                            </div>
                        </div>
                    </div>
                    
                    {/* User Card */}
                    {userInfo && (
                        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                    <User className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">{userInfo.full_name}</div>
                                    <div className="text-[10px] text-slate-500 truncate">{userInfo.email}</div>
                                </div>
                                <button 
                                    onClick={handleLogout}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Links */}
                <div className="px-3 py-2 border-b border-slate-800">
                    <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
                        <Home className="w-4 h-4" /> Home
                    </Link>
                    <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
                        <Activity className="w-4 h-4" /> Dashboard
                    </Link>
                </div>

                {/* Channels */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Channels
                    </div>
                    <div className="px-2 space-y-1">
                        {channels.map(channel => {
                            const Icon = channel.icon;
                            return (
                                <div
                                    key={channel.id}
                                    onClick={() => {
                                        setSelectedChannel(channel.id);
                                        setMessages([]); // Clear messages on swtich
                                        setTimeout(fetchMessages, 100); // Fetch new channel
                                        setSidebarOpen(false); // Close on mobile
                                    }}
                                    className={clsx(
                                        "p-3 rounded-xl cursor-pointer transition-all duration-200 group",
                                        selectedChannel === channel.id
                                            ? "bg-teal-500/10 border border-teal-500/30"
                                            : "hover:bg-slate-800/50 border border-transparent"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                            selectedChannel === channel.id
                                                ? "bg-teal-500/20 text-teal-400"
                                                : "bg-slate-800/50 text-slate-500 group-hover:text-slate-300"
                                        )}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={clsx(
                                                "font-medium text-sm",
                                                selectedChannel === channel.id ? "text-white" : "text-slate-300"
                                            )}>
                                                {channel.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500">{channel.status}</div>
                                        </div>
                                        {selectedChannel === channel.id && (
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Direct Messages Section */}
                    <div className="mt-6">
                        <div className="px-4 py-3 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Direct Messages</span>
                            <button 
                                onClick={() => setShowDmInput(!showDmInput)} 
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-teal-500/20 text-slate-500 hover:text-teal-400 flex items-center justify-center transition-colors text-xs"
                            >
                                +
                            </button>
                        </div>

                        {showDmInput && (
                            <div className="px-3 mb-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Email or User ID..."
                                        className="flex-1 bg-slate-800/50 border border-slate-700 text-xs p-2 rounded-lg text-slate-300 placeholder:text-slate-600 focus:border-teal-500/50 focus:outline-none transition-colors"
                                        value={dmEmail}
                                        onChange={(e) => setDmEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddDM()}
                                    />
                                    <button
                                        onClick={handleAddDM}
                                        className="px-3 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors text-xs font-medium"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="px-2 space-y-1">
                            {dms.map(dm => (
                                <div
                                    key={dm.id}
                                    onClick={() => {
                                        setSelectedChannel(dm.id);
                                        setMessages([]); // Clear messages on switch
                                        setTimeout(fetchMessages, 100); // Fetch new channel
                                        setSidebarOpen(false);
                                    }}
                                    className={clsx(
                                        "p-3 rounded-xl cursor-pointer transition-all duration-200 group",
                                        selectedChannel === dm.id
                                            ? "bg-purple-500/10 border border-purple-500/30"
                                            : "hover:bg-slate-800/50 border border-transparent"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "w-8 h-8 rounded-lg flex items-center justify-center",
                                            selectedChannel === dm.id
                                                ? "bg-purple-500/20 text-purple-400"
                                                : "bg-slate-800/50 text-slate-500"
                                        )}>
                                            <MessageSquare className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={clsx(
                                                "font-medium text-sm truncate",
                                                selectedChannel === dm.id ? "text-white" : "text-slate-300"
                                            )}>
                                                {dm.name}
                                            </div>
                                            <div className="text-[10px] text-emerald-500">{dm.status}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {dms.length === 0 && (
                                <div className="px-3 py-4 text-center text-xs text-slate-600">
                                    No direct messages yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-[10px] text-slate-600">
                        <Radio className="w-3 h-3 text-teal-500 animate-pulse" />
                        <span>SENTINEL v2.0 • E2E Encrypted</span>
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col relative bg-slate-950">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none"></div>
                
                {/* Header */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 z-10">
                    <div className="flex items-center gap-3">
                        {/* Mobile menu spacer */}
                        <div className="w-10 md:hidden"></div>
                        
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center font-bold text-slate-900 text-sm shadow-lg shadow-teal-500/20">
                            {channels.find(c => c.id === selectedChannel)?.name.substring(0, 2).toUpperCase() || 
                             dms.find(d => d.id === selectedChannel)?.name.substring(0, 2).toUpperCase() || 'CH'}
                        </div>
                        <div>
                            <h3 className="font-bold text-white leading-tight">
                                {channels.find(c => c.id === selectedChannel)?.name || 
                                 dms.find(d => d.id === selectedChannel)?.name || 'Channel'}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                SECURE CONNECTION
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Encryption Status - Hidden on small screens */}
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                            <Key className="w-3.5 h-3.5 text-emerald-400" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-emerald-400">E2E ENCRYPTED</span>
                                <span className="text-[8px] text-emerald-500/70">AES-256 • Rotating Keys</span>
                            </div>
                        </div>

                        {/* AI Analysis Toggle */}
                        <button
                            onClick={() => setShowAIPanel(!showAIPanel)}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                                showAIPanel
                                    ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                                    : "bg-purple-950/30 border-purple-500/30 text-purple-400 hover:bg-purple-900/30"
                            )}
                        >
                            <Brain className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs font-bold">AI ANALYSIS</span>
                        </button>

                        {/* Threat Level Indicator */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-xs">
                            <Activity className="w-3.5 h-3.5 text-teal-400" />
                            <span className="text-slate-400">THREAT:</span>
                            <span className="text-emerald-400 font-bold">LOW</span>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative">
                    {/* Empty State */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-4">
                                <Shield className="w-10 h-10 text-slate-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-400 mb-2">Secure Channel Active</h3>
                            <p className="text-sm text-slate-600 max-w-sm">
                                All messages are end-to-end encrypted and scanned by AI Sentinel for threats.
                            </p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            layout
                            className={clsx(
                                "flex flex-col max-w-[85%] md:max-w-[70%]",
                                msg.sender === 'me' ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                            onClick={() => {
                                setSelectedMessage(msg);
                                setShowAIPanel(true);
                            }}
                        >
                            <div className={clsx(
                                "relative p-4 rounded-2xl text-sm leading-relaxed backdrop-blur-sm shadow-lg border transition-all duration-300 cursor-pointer group",
                                msg.sender === 'me'
                                    ? "bg-gradient-to-br from-teal-950/50 to-teal-900/30 border-teal-500/30 text-teal-50 rounded-br-md"
                                    : "bg-slate-800/60 border-slate-700/50 text-slate-200 rounded-bl-md",
                                msg.status === 'blocked' ? "!border-rose-500/50 !bg-rose-950/30" : "",
                                selectedMessage?.id === msg.id ? "ring-2 ring-purple-500/50 ring-offset-2 ring-offset-slate-950 !border-purple-500/50" : "",
                                "hover:shadow-xl hover:scale-[1.01]"
                            )}>
                                {/* Reply Context Display */}
                                {msg.replyTo && (
                                    <div className="mb-3 p-2 rounded-lg bg-slate-900/50 border-l-2 border-teal-500 text-xs flex flex-col gap-0.5">
                                        <span className="font-bold text-teal-400 capitalize">{msg.replyTo.sender === 'me' ? 'You' : 'Officer'}</span>
                                        <span className="text-slate-400 truncate">{msg.replyTo.text}</span>
                                    </div>
                                )}

                                {/* Status Badges */}
                                <div className="absolute -top-2 right-2 flex gap-1">
                                    {msg.risk?.opsec_risk === 'HIGH' && (
                                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> OPSEC
                                        </span>
                                    )}
                                    {msg.risk?.ai_score && msg.risk.ai_score > 50 && (
                                        <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                                            <Eye className="w-3 h-3" /> AI
                                        </span>
                                    )}
                                </div>

                                {/* Message Text */}
                                <div className="whitespace-pre-wrap break-words">{msg.text}</div>

                                {/* File Attachment */}
                                {msg.file && (
                                    <div className="mt-3 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 flex items-center gap-3 group/file hover:border-teal-500/30 transition-colors">
                                        <div className="p-2.5 bg-teal-500/10 rounded-lg border border-teal-500/20">
                                            <File className="w-5 h-5 text-teal-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-slate-200 truncate">{msg.file.name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">{msg.file.size} • AES-256</div>
                                        </div>
                                        <button className="p-2 hover:bg-teal-500/10 rounded-lg transition-colors text-teal-400" title="Decrypt & Download">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Integrity Hash */}
                                {msg.integrityHash && msg.status === 'sent' && (
                                    <div className="mt-3 pt-2 border-t border-slate-700/30 flex items-center gap-1.5 text-[10px] text-emerald-500/70 font-mono">
                                        <Shield className="w-3 h-3" />
                                        SHA-256: {msg.integrityHash.substring(0, 12)}...
                                    </div>
                                )}

                                {/* Message Meta */}
                                <div className="mt-2 flex items-center justify-end gap-2 text-[10px]">
                                    {msg.sender === 'me' && msg.status === 'scanning' && (
                                        <span className="flex items-center gap-1 text-teal-400">
                                            <Activity className="w-3 h-3 animate-spin" /> Scanning...
                                        </span>
                                    )}
                                    {msg.sender === 'me' && msg.status === 'sent' && (
                                        <span className="flex items-center gap-1 text-emerald-400">
                                            <CheckCircle className="w-3 h-3" /> Encrypted
                                        </span>
                                    )}
                                    {msg.sender === 'me' && msg.status === 'blocked' && (
                                        <span className="flex items-center gap-1 text-rose-400">
                                            <AlertTriangle className="w-3 h-3" /> Blocked
                                        </span>
                                    )}
                                    <span className="text-slate-500">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>

                                {/* Reply Button (Hover) */}
                                <div className="absolute top-2 -left-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setReplyTo(msg); }}
                                        className="p-1.5 bg-slate-800 rounded-lg border border-slate-700 hover:bg-teal-500/20 hover:text-teal-400 hover:border-teal-500/50 transition-colors text-slate-500"
                                        title="Reply"
                                    >
                                        <div className="w-4 h-4 -scale-x-100 text-sm">↩</div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                {/* Input Area */}
                <div className="p-4 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 relative z-10">
                    {/* File Upload Indicator */}
                    {fileUpload && (
                        <div className="absolute bottom-full left-4 mb-2 p-3 bg-slate-800/90 rounded-xl border border-teal-500/30 flex items-center gap-3 text-sm text-slate-300 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                            <div className="p-2 bg-teal-500/10 rounded-lg">
                                <File className="w-4 h-4 text-teal-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate max-w-[200px]">{fileUpload.name}</div>
                                <div className="text-[10px] text-slate-500">{(fileUpload.size / 1024).toFixed(1)} KB • Ready to encrypt</div>
                            </div>
                            <button 
                                onClick={() => setFileUpload(null)} 
                                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Reply Banner */}
                    {replyTo && (
                        <div className="flex items-center justify-between p-3 mb-3 bg-slate-800/80 border-l-2 border-teal-500 rounded-xl animate-in slide-in-from-bottom-2 fade-in">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-teal-400 mb-0.5">
                                    Replying to {replyTo.sender === 'me' ? 'yourself' : 'Officer'}
                                </span>
                                <span className="text-xs text-slate-400 truncate max-w-[250px]">{replyTo.text}</span>
                            </div>
                            <button 
                                onClick={() => setReplyTo(null)} 
                                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <div className="max-w-4xl mx-auto flex items-end gap-3">
                        {/* File Upload Button */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.[0]) setFileUpload(e.target.files[0]);
                            }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={clsx(
                                "p-3 rounded-xl border transition-all hover:scale-105",
                                fileUpload 
                                    ? "bg-teal-500/20 border-teal-500/50 text-teal-400" 
                                    : "bg-slate-800/50 border-slate-700 text-slate-500 hover:border-teal-500/30 hover:text-teal-400"
                            )}
                            title="Attach File"
                        >
                            {fileUpload ? <File className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                        </button>

                        {/* Message Input */}
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSend();
                                    }
                                }}
                                placeholder="Type a secure message..."
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-slate-600"
                                disabled={isScanning}
                            />
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={(!input.trim() && !fileUpload) || isScanning}
                            className={clsx(
                                "p-3.5 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                                (!input.trim() && !fileUpload) 
                                    ? "bg-slate-800 text-slate-500" 
                                    : "bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-900 shadow-lg shadow-teal-500/25"
                            )}
                        >
                            {isScanning ? <Activity className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Bottom Controls */}
                    <div className="flex justify-between items-center mt-3 max-w-4xl mx-auto text-[10px] text-slate-600 font-mono">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <Lock className="w-3 h-3 text-emerald-500" /> AES-256 E2EE
                            </span>
                            {/* TTL Selector */}
                            <select
                                value={ttl || ""}
                                onChange={(e) => setTtl(e.target.value ? Number(e.target.value) : null)}
                                className="bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1 text-slate-400 focus:outline-none focus:border-teal-500/50 hover:border-slate-600 transition-colors cursor-pointer"
                            >
                                <option value="">∞ Keep Forever</option>
                                <option value="10">⏱ 10 Seconds</option>
                                <option value="60">⏱ 1 Minute</option>
                                <option value="3600">⏱ 1 Hour</option>
                            </select>
                        </div>
                        <span className="flex items-center gap-1.5">
                            <Brain className="w-3 h-3 text-purple-500" /> AI SENTINEL ACTIVE
                        </span>
                    </div>
                </div>

                {/* AI Analysis Panel */}
                <AnimatePresence>
                    {showAIPanel && (
                        <motion.div
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-slate-900/98 backdrop-blur-xl border-l border-purple-500/30 shadow-2xl z-20 overflow-y-auto"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/20 rounded-xl">
                                            <Brain className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">AI Analysis</h3>
                                            <div className="text-[10px] text-slate-500">Real-time threat detection</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAIPanel(false)}
                                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Real-time AI Metrics */}
                                {(() => {
                                    const currentMsg = selectedMessage || messages[messages.length - 1];
                                    return (
                                        <div className="space-y-4 mb-6">
                                            {/* AI Score Card */}
                                            <div className="bg-slate-800/50 border border-purple-500/20 rounded-2xl p-5">
                                                <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                                                    <Eye className="w-3 h-3" />
                                                    AI-GENERATED CONTENT SCORE
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-4xl font-bold text-purple-400">
                                                        {currentMsg?.risk?.ai_score?.toFixed(1) || '0.0'}%
                                                    </span>
                                                    <span className="text-xs text-slate-500 mb-2">confidence</span>
                                                </div>
                                                <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${currentMsg?.risk?.ai_score || 0}%` }}
                                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                                        transition={{ duration: 0.5 }}
                                                    />
                                                </div>
                                            </div>

                                            {/* OPSEC Risk Card */}
                                            <div className="bg-slate-800/50 border border-orange-500/20 rounded-2xl p-5">
                                                <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                                                    <Shield className="w-3 h-3" />
                                                    OPSEC CLASSIFIER OUTPUT
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={clsx(
                                                        "text-3xl font-bold",
                                                        currentMsg?.risk?.opsec_risk === 'HIGH' ? 'text-rose-400' :
                                                            currentMsg?.risk?.opsec_risk === 'SENSITIVE' ? 'text-orange-400' :
                                                                'text-emerald-400'
                                                    )}>
                                                        {currentMsg?.risk?.opsec_risk || 'SAFE'}
                                                    </span>
                                                    <div className={clsx(
                                                        "px-4 py-2 rounded-xl text-xs font-bold",
                                                        currentMsg?.risk?.opsec_risk === 'HIGH' ? 'bg-rose-500/20 text-rose-400' :
                                                            currentMsg?.risk?.opsec_risk === 'SENSITIVE' ? 'bg-orange-500/20 text-orange-400' :
                                                                'bg-emerald-500/20 text-emerald-400'
                                                    )}>
                                                        {currentMsg?.risk?.opsec_risk === 'HIGH' ? 'BLOCKED' : 'ALLOWED'}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-3">
                                                    Neural network classification • 99.2% accuracy
                                                </div>
                                            </div>

                                            {/* Phishing Risk Card */}
                                            <div className="bg-slate-800/50 border border-yellow-500/20 rounded-2xl p-5">
                                                <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    PHISHING RISK PROBABILITY
                                                </div>
                                                <div className="flex items-end gap-3">
                                                    <span className={clsx(
                                                        "text-3xl font-bold",
                                                        currentMsg?.risk?.phishing_risk === 'HIGH' ? 'text-rose-400' :
                                                            currentMsg?.risk?.phishing_risk === 'MODERATE' ? 'text-yellow-400' :
                                                                'text-emerald-400'
                                                    )}>
                                                        {currentMsg?.risk?.phishing_risk || 'LOW'}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-3">
                                                    Transformer-based detection engine
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Threat Graph Visualization */}
                                <div className="bg-slate-800/50 border border-teal-500/20 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Network className="w-4 h-4 text-teal-400" />
                                        <div className="text-xs font-bold text-teal-400">MESSAGE FLOW GRAPH</div>
                                    </div>

                                    <div className="relative h-48 bg-slate-900/50 rounded-xl p-4 overflow-hidden">
                                        {/* Graph Nodes */}
                                        <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center z-10">
                                            <span className="text-xs font-bold text-teal-400">U1</span>
                                        </div>
                                        <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center z-10">
                                            <span className="text-xs font-bold text-purple-400">U2</span>
                                        </div>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center z-10">
                                            <span className="text-xs font-bold text-emerald-400">MSG</span>
                                        </div>

                                        {/* Connection Lines */}
                                        <svg className="absolute inset-0 w-full h-full">
                                            <line x1="60" y1="30" x2="50%" y2="70%" stroke="#14b8a6" strokeWidth="2" strokeDasharray="4" opacity="0.5" />
                                            <line x1="calc(100% - 60px)" y1="30" x2="50%" y2="70%" stroke="#a855f7" strokeWidth="2" strokeDasharray="4" opacity="0.5" />
                                        </svg>

                                        {/* Alert Node */}
                                        {(() => {
                                            const currentMsg = selectedMessage || messages[messages.length - 1];
                                            if (currentMsg?.risk && (currentMsg.risk.opsec_risk === 'HIGH' || currentMsg.risk.phishing_risk === 'HIGH')) {
                                                return (
                                                    <div className="absolute top-1/2 right-8 w-10 h-10 rounded-xl bg-rose-500/30 border-2 border-rose-500 flex items-center justify-center animate-pulse z-20">
                                                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                            <span>Sent: {messages.filter(m => m.sender === 'me').length}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            <span>Total: {messages.length}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                            <span>Blocked: {messages.filter(m => m.risk?.opsec_risk === 'HIGH').length}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Models */}
                                <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700 rounded-xl">
                                    <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                                        <Cpu className="w-3 h-3" />
                                        ACTIVE AI MODELS
                                    </div>
                                    <div className="space-y-2">
                                        <ModelStatus name="GPT-4 Content Classifier" status="online" />
                                        <ModelStatus name="BERT Phishing Detector" status="online" />
                                        <ModelStatus name="OPSEC Neural Network" status="online" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
}

function ModelStatus({ name, status }: { name: string; status: 'online' | 'offline' }) {
    return (
        <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{name}</span>
            <span className={clsx(
                "flex items-center gap-1",
                status === 'online' ? "text-emerald-400" : "text-slate-600"
            )}>
                <span className={clsx(
                    "w-1.5 h-1.5 rounded-full",
                    status === 'online' ? "bg-emerald-500" : "bg-slate-600"
                )}></span>
                {status === 'online' ? 'Active' : 'Offline'}
            </span>
        </div>
    );
}

function Cpu(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
            <rect x="9" y="9" width="6" height="6"></rect>
            <line x1="9" y1="1" x2="9" y2="4"></line>
            <line x1="15" y1="1" x2="15" y2="4"></line>
            <line x1="9" y1="20" x2="9" y2="23"></line>
            <line x1="15" y1="20" x2="15" y2="23"></line>
            <line x1="20" y1="9" x2="23" y2="9"></line>
            <line x1="20" y1="14" x2="23" y2="14"></line>
            <line x1="1" y1="9" x2="4" y2="9"></line>
            <line x1="1" y1="14" x2="4" y2="14"></line>
        </svg>
    );
}
