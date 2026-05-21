import React from 'react';
import { 
  Instagram, 
  Tv, 
  Smartphone, 
  Grid, 
  Sliders, 
  Maximize, 
  Move, 
  Download, 
  RefreshCw, 
  Blur,
  Layers,
  Image as ImageIcon
} from 'lucide-react';

const ratios = [
  { label: '1:1 Square', value: 1.0, sub: 'Instagram Feed', icon: Instagram },
  { label: '16:9 Wide', value: 16/9, sub: 'YouTube / Web', icon: Tv },
  { label: '9:16 Story', value: 9/16, sub: 'Reels / TikTok', icon: Smartphone },
  { label: '4:3 Standard', value: 4/3, sub: 'Classic Photo', icon: Grid },
];

export default function ControlSidebar({
  options,
  onChange,
  onDownload,
  onReset,
  hasImage,
  isDetecting,
  hasFaces
}) {
  const setRatio = (ratioValue) => {
    onChange({ ...options, targetRatio: ratioValue });
  };

  const handleSliderChange = (key, val) => {
    onChange({ ...options, [key]: parseFloat(val) });
  };

  const handleCheckboxChange = (key, val) => {
    onChange({ ...options, [key]: val });
  };

  return (
    <div className="w-full flex flex-col space-y-6 rounded-3xl border border-dark-cardBorder/60 bg-dark-card/40 backdrop-blur-xl p-6 shadow-2xl">
      
      {/* 1. Header Control */}
      <div className="flex items-center space-x-2 border-b border-dark-cardBorder/50 pb-4">
        <Sliders className="h-5 w-5 text-brand-400" />
        <h3 className="text-base font-bold text-white tracking-wide uppercase font-sans">Framing Parameters</h3>
      </div>

      {/* 2. Aspect Ratio Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Aspect Ratio</label>
        <div className="grid grid-cols-2 gap-3">
          {ratios.map((r, i) => {
            const Icon = r.icon;
            const isSelected = Math.abs(options.targetRatio - r.value) < 0.01;
            return (
              <button
                key={i}
                disabled={!hasImage}
                onClick={() => setRatio(r.value)}
                className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all duration-300 ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 text-white shadow-glow-primary'
                    : 'border-dark-cardBorder bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60 hover:text-slate-200'
                } disabled:opacity-40 disabled:pointer-events-none`}
              >
                <Icon className={`h-4.5 w-4.5 mb-2.5 ${isSelected ? 'text-brand-400' : 'text-slate-500'}`} />
                <span className="text-xs font-bold font-sans tracking-tight">{r.label}</span>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5">{r.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Smart Framing Parameters (Dynamic Sliders) */}
      <div className="space-y-5 pt-2 border-t border-dark-cardBorder/40">
        
        {/* Face Padding Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>Face Padding</span>
            </span>
            <span className="text-[11px] font-mono font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
              {Math.round(options.padding * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.5"
            step="0.05"
            disabled={!hasImage || isDetecting}
            value={options.padding}
            onChange={(e) => handleSliderChange('padding', e.target.value)}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 disabled:opacity-30 disabled:pointer-events-none"
          />
          <p className="text-[10px] text-slate-500">Margin spacing preserved around detected subjects.</p>
        </div>

        {/* Auto Zoom Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Maximize className="h-3.5 w-3.5 text-slate-500" />
              <span>Auto Zoom</span>
            </span>
            <span className="text-[11px] font-mono font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
              {options.zoom.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            disabled={!hasImage || isDetecting}
            value={options.zoom}
            onChange={(e) => handleSliderChange('zoom', e.target.value)}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 disabled:opacity-30 disabled:pointer-events-none"
          />
          <p className="text-[10px] text-slate-500">Crop scale factor. Higher zooms focus closer on faces.</p>
        </div>

        {/* Offset Fine Tuning (Double Sliders) */}
        <div className="space-y-4 pt-1">
          <span className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Move className="h-3.5 w-3.5 text-slate-500" />
            <span>Framing Offsets</span>
          </span>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium text-slate-400">
                <span>Shift X</span>
                <span className="font-mono text-brand-400">{Math.round(options.shiftX * 100)}%</span>
              </div>
              <input
                type="range"
                min="-0.4"
                max="0.4"
                step="0.01"
                disabled={!hasImage || isDetecting}
                value={options.shiftX}
                onChange={(e) => handleSliderChange('shiftX', e.target.value)}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-brand-400 disabled:opacity-30 disabled:pointer-events-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium text-slate-400">
                <span>Shift Y</span>
                <span className="font-mono text-brand-400">{Math.round(options.shiftY * 100)}%</span>
              </div>
              <input
                type="range"
                min="-0.4"
                max="0.4"
                step="0.01"
                disabled={!hasImage || isDetecting}
                value={options.shiftY}
                onChange={(e) => handleSliderChange('shiftY', e.target.value)}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-brand-400 disabled:opacity-30 disabled:pointer-events-none"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500">Fine-tune coordinates to offset centering.</p>
        </div>
      </div>

      {/* 4. Background Expansion Option */}
      <div className="space-y-4 pt-4 border-t border-dark-cardBorder/40">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Smart Blur Expand</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Use blurred fill if crop overflows image boundary</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              disabled={!hasImage}
              checked={options.blurBackground}
              onChange={(e) => handleCheckboxChange('blurBackground', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
          </label>
        </div>

        {options.blurBackground && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400">Blur Radius</span>
              <span className="text-[11px] font-mono text-brand-400 font-bold bg-brand-500/10 px-2 py-0.5 rounded">
                {options.blurStrength}px
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              disabled={!hasImage}
              value={options.blurStrength}
              onChange={(e) => handleSliderChange('blurStrength', e.target.value)}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-brand-500"
            />
          </div>
        )}
      </div>

      {/* 5. Core Control Buttons */}
      <div className="flex flex-col space-y-3 pt-4 border-t border-dark-cardBorder/40">
        <button
          onClick={onDownload}
          disabled={!hasImage || isDetecting}
          className="flex w-full items-center justify-center space-x-2.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 py-3.5 text-sm font-bold text-white shadow-glow-primary transition-all duration-300 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
        >
          <Download className="h-4.5 w-4.5" />
          <span>Download Cropped Photo</span>
        </button>

        <button
          onClick={onReset}
          disabled={!hasImage || isDetecting}
          className="flex w-full items-center justify-center space-x-2 rounded-2xl border border-dark-cardBorder bg-slate-900/30 py-3 text-xs font-semibold text-slate-400 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/70 hover:text-slate-200 disabled:opacity-40 disabled:pointer-events-none"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset Parameters</span>
        </button>
      </div>
    </div>
  );
}
