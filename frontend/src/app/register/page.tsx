"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, AlertTriangle, UserPlus, Fingerprint, Eye, EyeOff, Radio, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Password strength calculation
    const passwordStrength = useMemo(() => {
        let score = 0;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password),
        };

        score = Object.values(checks).filter(Boolean).length;
        
        return {
            score,
            checks,
            label: score <= 1 ? "Weak" : score <= 3 ? "Moderate" : score <= 4 ? "Strong" : "Very Strong",
            color: score <= 1 ? "bg-rose-500" : score <= 3 ? "bg-yellow-500" : score <= 4 ? "bg-emerald-500" : "bg-teal-500",
        };
    }, [password]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (password !== confirmPassword) {
            setError("Security Protocol Violated: Passcodes Do Not Match");
            setIsLoading(false);
            return;
        }

        if (passwordStrength.score < 3) {
            setError("Password security level insufficient. Minimum strength: Moderate");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/v1/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: fullName
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                let errorMessage = "Registration Failed";
                try {
                    const data = JSON.parse(text);
                    errorMessage = data.detail || errorMessage;
                } catch {
                    errorMessage = text.slice(0, 100) || "Server Error (Non-JSON response)";
                }
                throw new Error(errorMessage);
            }

            // Redirect to login on success
            router.push("/login?registered=true");
        } catch (err: any) {
            setError(err.message || "Registration Denied: System Error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200 relative overflow-hidden py-12">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float pointer-events-none"></div>
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>

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
                <Radio className="w-3 h-3 text-purple-500 animate-pulse" />
                ENROLLMENT SYSTEM ACTIVE
            </div>

            <div className="w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-2xl relative z-10">
                {/* Decorative Corner Elements */}
                <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-purple-500/30 rounded-tl-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-purple-500/30 rounded-br-2xl pointer-events-none"></div>

                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">PERSONNEL REGISTRATION</h1>
                    <p className="text-slate-500 text-sm mt-2">Request Security Clearance</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="p-1.5 bg-rose-500/20 rounded-lg">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Full Name</label>
                        <div className="relative">
                            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                required
                                className="input-field pl-12"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Officer Designation"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Service ID (Email)</label>
                        <input
                            type="email"
                            required
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="officer@cyberlock.ai"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Passcode</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="input-field pl-12 pr-12"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {password && (
                            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Security Level:</span>
                                    <span className={`font-bold ${
                                        passwordStrength.score <= 1 ? 'text-rose-400' : 
                                        passwordStrength.score <= 3 ? 'text-yellow-400' : 'text-emerald-400'
                                    }`}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <PasswordCheck passed={passwordStrength.checks.length} label="8+ characters" />
                                    <PasswordCheck passed={passwordStrength.checks.uppercase} label="Uppercase" />
                                    <PasswordCheck passed={passwordStrength.checks.lowercase} label="Lowercase" />
                                    <PasswordCheck passed={passwordStrength.checks.number} label="Number" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Confirm Passcode</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className={`input-field pl-12 ${
                                    confirmPassword && (password === confirmPassword ? 'border-emerald-500/50' : 'border-rose-500/50')
                                }`}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                            {confirmPassword && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {password === confirmPassword ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-rose-500" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100"></div>
                        <span className="relative flex items-center justify-center gap-2 text-lg">
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" /> Grant Access
                                </>
                            )}
                        </span>
                    </button>
                </form>

                {/* Login Link */}
                <div className="mt-6 text-center text-sm text-slate-500 border-t border-slate-800 pt-6">
                    Already have clearance?{' '}
                    <Link href="/login" className="text-teal-400 hover:text-teal-300 font-bold transition-colors">
                        Access Terminal
                    </Link>
                </div>
            </div>
        </div>
    );
}

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
    return (
        <div className={`flex items-center gap-1 ${passed ? 'text-emerald-400' : 'text-slate-600'}`}>
            {passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            <span>{label}</span>
        </div>
    );
}
