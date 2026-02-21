import Link from "next/link";
import { Shield, Lock, Eye, AlertTriangle, UserPlus, Zap, Radio, Activity, ChevronRight, Cpu, Fingerprint } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-950 text-white">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none z-0"></div>

      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-float pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '4s' }}></div>

      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Shield className="w-6 h-6 text-slate-900" />
            </div>
            <span className="font-mono font-bold text-teal-400 text-lg tracking-wider">SENTINEL<span className="text-white">.NET</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              SYSTEM OPERATIONAL
            </div>
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/register" className="px-4 py-2 text-sm font-bold bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-lg transition-all hover:scale-105">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative flex place-items-center z-10 mt-20">
        <div className="text-center space-y-8 max-w-3xl">
          {/* Version Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm">
            <Zap className="w-4 h-4 text-teal-400" />
            <span className="text-slate-400">Version 2.0</span>
            <span className="text-teal-400 font-bold">Now with AI Threat Analysis</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Defense-Grade
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 text-glow">
              Secure Communication
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            AI-defended platform protecting against{" "}
            <span className="text-rose-400 font-semibold">Deepfakes</span>,{" "}
            <span className="text-rose-400 font-semibold">Phishing</span>, and{" "}
            <span className="text-rose-400 font-semibold">OPSEC Leaks</span>.
            Real-time threat intelligence with military-grade encryption.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link 
              href="/register" 
              className="group relative px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-900 rounded-xl transition-all duration-300 shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 animate-shimmer"></div>
              <span className="relative flex items-center justify-center gap-2 font-bold text-lg">
                <UserPlus className="w-5 h-5" /> Start Secure Access
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link 
              href="/login" 
              className="group px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-white rounded-xl border border-slate-700 hover:border-teal-500/50 transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2 font-bold text-lg">
                <Lock className="w-5 h-5 text-teal-400" /> Secure Login
              </span>
            </Link>

            <Link 
              href="/dashboard" 
              className="group px-8 py-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2 font-bold text-lg">
                <Eye className="w-5 h-5" /> HQ Command
              </span>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-500" />
              <span>AES-256 Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-500" />
              <span>AI-Powered Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-emerald-500" />
              <span>Zero-Trust Architecture</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid text-center lg:max-w-6xl lg:w-full lg:grid-cols-3 lg:text-left gap-6 mt-24 z-10 px-4">
        <FeatureCard
          title="E2E Encryption"
          desc="AES-256 + RSA-2048 encryption with forward secrecy. Every session uses rotating keys for maximum protection."
          icon={<Lock className="w-8 h-8" />}
          color="teal"
        />
        <FeatureCard
          title="AI Threat Scan"
          desc="Real-time detection of AI-generated content, deepfakes, and social engineering attempts using transformer models."
          icon={<Eye className="w-8 h-8" />}
          color="purple"
        />
        <FeatureCard
          title="OPSEC Guardian"
          desc="Automated risk assessment prevents sensitive operational data leakage. Blocks high-risk messages in real-time."
          icon={<AlertTriangle className="w-8 h-8" />}
          color="rose"
        />
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 z-10 max-w-4xl w-full px-4">
        <StatCard value="256-bit" label="Encryption" />
        <StatCard value="<100ms" label="Scan Latency" />
        <StatCard value="99.9%" label="Uptime SLA" />
        <StatCard value="24/7" label="AI Monitoring" />
      </div>

      {/* Footer */}
      <footer className="mt-24 pb-8 z-10 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-600 text-sm font-mono">
          <Radio className="w-4 h-4 animate-pulse text-teal-500" />
          <span>SENTINEL.NET v2.0 // CLASSIFIED SYSTEM // AUTHORIZED ACCESS ONLY</span>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ 
  title, 
  desc, 
  icon, 
  color 
}: { 
  title: string; 
  desc: string; 
  icon: React.ReactNode;
  color: 'teal' | 'purple' | 'rose';
}) {
  const colorClasses = {
    teal: {
      icon: "text-teal-400",
      border: "hover:border-teal-500/50",
      glow: "group-hover:shadow-teal-500/10",
      gradient: "from-teal-500/20",
    },
    purple: {
      icon: "text-purple-400",
      border: "hover:border-purple-500/50",
      glow: "group-hover:shadow-purple-500/10",
      gradient: "from-purple-500/20",
    },
    rose: {
      icon: "text-rose-400",
      border: "hover:border-rose-500/50",
      glow: "group-hover:shadow-rose-500/10",
      gradient: "from-rose-500/20",
    },
  };

  const c = colorClasses[color];

  return (
    <div className={`group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-500 ${c.border} hover:bg-slate-800/60 backdrop-blur-sm overflow-hidden hover:scale-[1.02] ${c.glow} hover:shadow-2xl cursor-pointer`}>
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      <div className="relative flex flex-col items-center lg:items-start">
        <div className={`${c.icon} mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700 group-hover:border-current/30 transition-colors`}>
          {icon}
        </div>
        <h2 className="mb-3 text-xl font-bold text-white group-hover:text-glow transition-all">
          {title}
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-card text-center">
      <div className="text-2xl md:text-3xl font-bold text-teal-400 mb-1">{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}
