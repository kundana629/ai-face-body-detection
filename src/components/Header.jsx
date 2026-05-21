import React from 'react';
import { Cpu, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function Header({ apiStatus = 'ready' }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-cardBorder/60 bg-dark-obsidian/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-glow-primary">
            <Sparkles className="h-5 w-5 text-white" />
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 opacity-30 blur-sm animate-pulse-slow"></div>
          </div>
          <div>
            <span className="font-sans font-bold text-xl tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              SmartCrop <span className="text-brand-400 font-extrabold">AI</span>
            </span>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Intelligent Framing Engine</p>
          </div>
        </div>

        {/* Engine Status */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 rounded-full border border-dark-cardBorder bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-brand-400" />
            <span className="font-medium text-[11px] text-slate-400">TensorFlow.js WASM</span>
          </div>

          <div className="flex items-center space-x-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-[11px] uppercase tracking-wider">Local AI Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
