"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Lock, AlertTriangle, CheckCircle, Eye, EyeOff, Fingerprint, Radio, ArrowLeft } from "lucide-react";
import Link from "next/link";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Form URL Encoded for OAuth2
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch("/api/v1/auth/login/access-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData,
            });

            if (!res.ok) {
                const text = await res.text();
                let errorMessage = "Invalid credentials";
                try {
                    const data = JSON.parse(text);
                    errorMessage = data.detail || errorMessage;
                } catch {
                    errorMessage = text.slice(0, 100) || "Server Error (Non-JSON response)";
                }
                throw new Error(errorMessage);
            }

            const data = await res.json();
            localStorage.setItem("token", data.access_token);
            router.push("/chat");
        } catch (err: any) {
            setError(err.message || "Access Denied: Invalid Certification Credentials");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-float pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>

            {/* Back Button */}
            <Link 
                href="/" 
                className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-teal-400 transition-colors z-20"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
            </Link>

            {/* Status Indicator */}
            <div className="absolute top-6 right-6 flex items-center gap-2 text-xs font-mono text-slate-600 z-20">
                <Radio className="w-3 h-3 text-teal-500 animate-pulse" />
                SECURE GATEWAY ACTIVE
            </div>

            <div className="w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-2xl relative z-10">
                {/* Decorative Corner Elements */}
                <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-teal-500/30 rounded-tl-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-teal-500/30 rounded-br-2xl pointer-events-none"></div>

                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                        <Shield className="w-8 h-8 text-slate-900" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">CYBERLOCK ACCESS</h1>
                    <p className="text-slate-500 text-sm mt-2">Secure Gateway Authentication</p>
                </div>

                {/* Success Message */}
                {registered && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                        <span>Security clearance granted. Please authenticate.</span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="p-1.5 bg-rose-500/20 rounded-lg">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">
                            Service ID (Email)
                        </label>
                        <div className="relative">
                            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="email"
                                required
                                placeholder="agent@cyberlock.ai"
                                className="input-field pl-12"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">
                            Passcode
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="••••••••"
                                className="input-field pl-12 pr-12"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-primary py-4 text-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100"></div>
                        <span className="relative flex items-center justify-center gap-2">
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5" /> Authenticate
                                </>
                            )}
                        </span>
                    </button>
                </form>

                {/* Security Notice */}
                <div className="mt-6 text-center text-xs text-slate-600 border-t border-slate-800 pt-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Shield className="w-3 h-3" />
                        <span>Protected by CyberLock AI</span>
                    </div>
                    <span>Unauthorized access is actively monitored and logged.</span>
                </div>

                {/* Register Link */}
                <div className="mt-6 text-center text-sm text-slate-500 border-t border-slate-800 pt-6">
                    New Personnel?{' '}
                    <Link href="/register" className="text-teal-400 hover:text-teal-300 font-bold transition-colors">
                        Request Clearance
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                <div className="text-teal-500 font-mono animate-pulse">INITIALIZING SECURE GATEWAY...</div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
