"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  UserPlus,
  KeyRound,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  LogIn,
} from "lucide-react";
import { useProfile } from "@/lib/games/profile-context";

const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#64748b",
  "#a855f7",
];

type View = "main" | "create" | "login" | "success";

interface ProfileSelectorProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileSelector({ open, onClose }: ProfileSelectorProps) {
  const { login, createProfile, isLoggedIn } = useProfile();

  const [view, setView] = useState<View>("main");
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [accessCode, setAccessCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setView("main");
      setName("");
      setSelectedColor(AVATAR_COLORS[0]);
      setAccessCode("");
      setCodeInput("");
      setError("");
      setLoading(false);
      setCopied(false);
      // Animate in
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  // Close if already logged in and opening main
  useEffect(() => {
    if (open && isLoggedIn && view === "main") {
      onClose();
    }
  }, [open, isLoggedIn, view, onClose]);

  // Auto-focus inputs
  useEffect(() => {
    if (view === "create") nameRef.current?.focus();
    if (view === "login") codeRef.current?.focus();
  }, [view]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a name!");
      return;
    }
    setLoading(true);
    setError("");
    const result = await createProfile(trimmed, selectedColor);
    setLoading(false);
    if (result.success && result.accessCode) {
      setAccessCode(result.accessCode);
      setView("success");
    } else {
      setError(result.error || "Something went wrong.");
    }
  };

  const handleLogin = async () => {
    const trimmed = codeInput.trim();
    if (!trimmed) {
      setError("Please enter your code!");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(trimmed);
    setLoading(false);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || "Invalid code.");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            {view !== "main" && view !== "success" && (
              <button
                type="button"
                onClick={() => {
                  setView("main");
                  setError("");
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-lg font-bold text-white">
              {view === "main" && "Join the Game Arena"}
              {view === "create" && "Create Your Profile"}
              {view === "login" && "Welcome Back!"}
              {view === "success" && "You're All Set!"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* ── Main view ── */}
          {view === "main" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400 text-center mb-6">
                Save your progress, track achievements, and keep your high
                scores across devices!
              </p>
              <button
                type="button"
                onClick={() => setView("create")}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="text-base font-bold">Create Profile</div>
                  <div className="text-sm text-indigo-200">
                    Pick a name and avatar color
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setView("login")}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <KeyRound className="w-6 h-6 text-slate-300" />
                </div>
                <div className="text-left">
                  <div className="text-base font-bold">I Have a Code</div>
                  <div className="text-sm text-slate-400">
                    Log in with your access code
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* ── Create view ── */}
          {view === "create" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Your Name
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="What should we call you?"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-base"
                  maxLength={32}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Pick a Color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-9 h-9 rounded-full transition-all ${
                        selectedColor === color
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
                          : "hover:scale-110 opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Create My Profile
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Login view ── */}
          {view === "login" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Access Code
                </label>
                <input
                  ref={codeRef}
                  type="text"
                  value={codeInput}
                  onChange={(e) =>
                    setCodeInput(e.target.value.toUpperCase().slice(0, 8))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter your code"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-center text-2xl font-mono tracking-[0.3em] uppercase"
                  maxLength={8}
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  The code you got when you created your profile
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Log In
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Success view ── */}
          {view === "success" && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Profile Created!
                </h3>
                <p className="text-sm text-slate-400">
                  Here&apos;s your secret access code. Save it somewhere safe!
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">
                  Your Access Code
                </div>
                <div className="text-3xl font-mono font-bold text-white tracking-[0.25em] mb-3">
                  {accessCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-sm transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-sm text-amber-300 font-medium">
                  Remember this code!
                </p>
                <p className="text-xs text-amber-400/70 mt-1">
                  You&apos;ll need it to log in on other devices or if you clear
                  your browser.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition-colors"
              >
                Start Playing!
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
