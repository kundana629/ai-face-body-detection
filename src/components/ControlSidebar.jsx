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
  Layers,
  Crop,
  Scaling,
  UserCheck,
  User,
  Play,
  Settings,
  ShieldCheck
} from 'lucide-react';

const ratios = [
  { label: '1:1 Square', value: 1.0, sub: 'Avatar / Profile', icon: Instagram },
  { label: '16:9 Wide', value: 16/9, sub: 'YouTube Banner', icon: Tv },
  { label: '9:16 Story', value: 9/16, sub: 'TikTok / Reels', icon: Smartphone },
  { label: '4:3 Standard', value: 4/3, sub: 'Classic Photo', icon: Grid },
];

export default function ControlSidebar({
  selectedTasks,
  onToggleTask,
  cropOptions,
  onChangeCrop,
  resizeOptions,
  onChangeResize,
  onProcess,
  onReset,
  hasImage,
  isProcessing,
  hasResults
}) {
  
  const setRatio = (ratioValue) => {
    onChangeCrop({ ...cropOptions, targetRatio: ratioValue });
  };

  const handleCropSliderChange = (key, val) => {
    onChangeCrop({ ...cropOptions, [key]: parseFloat(val) });
  };

  const handleCropCheckboxChange = (key, val) => {
    onChangeCrop({ ...cropOptions, [key]: val });
  };

  const handleResizeChange = (key, val) => {
    onChangeResize({ ...resizeOptions, [key]: val });
  };

  return (
    <div className="w-full flex flex-col space-y-6 rounded-3xl border border-dark-cardBorder/60 bg-dark-card/40 backdrop-blur-xl p-6 shadow-2xl">
      
      {/* 1. Header Control */}
      <div className="flex items-center space-x-2 border-b border-dark-cardBorder/50 pb-4">
        <Settings className="h-5 w-5 text-brand-400" />
        <h3 className="text-base font-bold text-white tracking-wide uppercase font-sans">AI Workspace Control</h3>
      </div>

      {/* 2. Task Selection Dashboard */}
      <div className="space-y-3">
        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">1. Select AI Tasks</label>
        <div className="grid grid-cols-1 gap-2.5">
          {/* Face Detection */}
          <button
            disabled={!hasImage || isProcessing}
            onClick={() => onToggleTask('face_detection')}
            className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-300 ${
              selectedTasks.includes('face_detection')
                ? 'border-cyan-500/50 bg-cyan-950/20 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'border-dark-cardBorder bg-slate-900/30 text-slate-400 hover:border-slate-700'
            } disabled:opacity-40 disabled:pointer-events-none`}
          >
            <div className="flex items-center space-x-3">
              <UserCheck className={`h-4.5 w-4.5 ${selectedTasks.includes('face_detection') ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs font-bold font-sans">Face Detection</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Detect human faces & landmarks</p>
              </div>
            </div>
            <div className={`h-2 w-2 rounded-full ${selectedTasks.includes('face_detection') ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`}></div>
          </button>

          {/* Full Body Detection */}
          <button
            disabled={!hasImage || isProcessing}
            onClick={() => onToggleTask('body_detection')}
            className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-300 ${
              selectedTasks.includes('body_detection')
                ? 'border-magenta-500/50 bg-pink-950/10 text-white shadow-[0_0_15px_rgba(217,70,239,0.15)]'
                : 'border-dark-cardBorder bg-slate-900/30 text-slate-400 hover:border-slate-700'
            } disabled:opacity-40 disabled:pointer-events-none`}
            style={selectedTasks.includes('body_detection') ? { borderColor: 'rgba(217, 70, 239, 0.4)', backgroundColor: 'rgba(217, 70, 239, 0.05)' } : {}}
          >
            <div className="flex items-center space-x-3">
              <User className={`h-4.5 w-4.5 ${selectedTasks.includes('body_detection') ? 'text-pink-400' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs font-bold font-sans">Full Body Detection</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Detect full bodies using YOLOv8</p>
              </div>
            </div>
            <div className={`h-2 w-2 rounded-full ${selectedTasks.includes('body_detection') ? 'bg-pink-400 animate-pulse' : 'bg-slate-700'}`}></div>
          </button>

          {/* Smart Cropping */}
          <button
            disabled={!hasImage || isProcessing}
            onClick={() => onToggleTask('smart_crop')}
            className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-300 ${
              selectedTasks.includes('smart_crop')
                ? 'border-brand-500/50 bg-brand-950/15 text-white shadow-glow-primary'
                : 'border-dark-cardBorder bg-slate-900/30 text-slate-400 hover:border-slate-700'
            } disabled:opacity-40 disabled:pointer-events-none`}
          >
            <div className="flex items-center space-x-3">
              <Crop className={`h-4.5 w-4.5 ${selectedTasks.includes('smart_crop') ? 'text-brand-400' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs font-bold font-sans">Smart Cropping</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Auto-framing with blur overflow</p>
              </div>
            </div>
            <div className={`h-2 w-2 rounded-full ${selectedTasks.includes('smart_crop') ? 'bg-brand-400 animate-pulse' : 'bg-slate-700'}`}></div>
          </button>

          {/* Image Resizing */}
          <button
            disabled={!hasImage || isProcessing}
            onClick={() => onToggleTask('resize')}
            className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-300 ${
              selectedTasks.includes('resize')
                ? 'border-amber-500/50 bg-amber-950/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                : 'border-dark-cardBorder bg-slate-900/30 text-slate-400 hover:border-slate-700'
            } disabled:opacity-40 disabled:pointer-events-none`}
          >
            <div className="flex items-center space-x-3">
              <Scaling className={`h-4.5 w-4.5 ${selectedTasks.includes('resize') ? 'text-amber-400' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs font-bold font-sans">Image Resizing</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Resize to custom dimensions</p>
              </div>
            </div>
            <div className={`h-2 w-2 rounded-full ${selectedTasks.includes('resize') ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'}`}></div>
          </button>
        </div>
      </div>

      {/* 3. Collapsible Smart Cropping Options */}
      {selectedTasks.includes('smart_crop') && (
        <div className="space-y-4 pt-4 border-t border-dark-cardBorder/40 animate-fade-in">
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">2. Smart Crop Settings</label>
          
          {/* Ratio Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aspect Ratio</span>
            <div className="grid grid-cols-2 gap-2">
              {ratios.map((r, i) => {
                const Icon = r.icon;
                const isSelected = Math.abs(cropOptions.targetRatio - r.value) < 0.01;
                return (
                  <button
                    key={i}
                    onClick={() => setRatio(r.value)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 text-white shadow-glow-primary'
                        : 'border-dark-cardBorder bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mb-1.5 ${isSelected ? 'text-brand-400' : 'text-slate-500'}`} />
                    <span className="text-[10px] font-bold font-sans tracking-tight">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Padding and Zoom Sliders */}
          <div className="space-y-3.5">
            {/* Face Padding */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center space-x-1 text-slate-400 font-bold uppercase tracking-wider">
                  <Layers className="h-3 w-3 text-slate-500" />
                  <span>Crop Padding</span>
                </span>
                <span className="font-mono text-brand-400 font-bold bg-brand-500/10 px-1.5 py-0.5 rounded">
                  {Math.round(cropOptions.padding * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={cropOptions.padding}
                onChange={(e) => handleCropSliderChange('padding', e.target.value)}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            {/* Zoom Scale */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center space-x-1 text-slate-400 font-bold uppercase tracking-wider">
                  <Maximize className="h-3 w-3 text-slate-500" />
                  <span>Zoom Scale</span>
                </span>
                <span className="font-mono text-brand-400 font-bold bg-brand-500/10 px-1.5 py-0.5 rounded">
                  {cropOptions.zoom.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={cropOptions.zoom}
                onChange={(e) => handleCropSliderChange('zoom', e.target.value)}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            {/* Manual Offsets */}
            <div className="space-y-3 pt-1">
              <span className="flex items-center space-x-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <Move className="h-3 w-3 text-slate-500" />
                <span>Shift Offsets</span>
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                    <span>Shift X</span>
                    <span className="font-mono text-brand-400">{Math.round(cropOptions.shiftX * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="-0.4"
                    max="0.4"
                    step="0.01"
                    value={cropOptions.shiftX}
                    onChange={(e) => handleCropSliderChange('shiftX', e.target.value)}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-brand-400"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                    <span>Shift Y</span>
                    <span className="font-mono text-brand-400">{Math.round(cropOptions.shiftY * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="-0.4"
                    max="0.4"
                    step="0.01"
                    value={cropOptions.shiftY}
                    onChange={(e) => handleCropSliderChange('shiftY', e.target.value)}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-brand-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Smart Blur Expansion option */}
          <div className="space-y-3 pt-2.5 border-t border-dark-cardBorder/40">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Smart Blur Expand</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Use blurred fill if crop overflows boundary</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cropOptions.blurBackground}
                  onChange={(e) => handleCropCheckboxChange('blurBackground', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-brand-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
              </label>
            </div>

            {cropOptions.blurBackground && (
              <div className="space-y-1.5 animate-fade-in">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-medium">Blur Radius</span>
                  <span className="font-mono text-brand-400 font-bold bg-brand-500/10 px-1.5 py-0.5 rounded">
                    {cropOptions.blurStrength}px
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={cropOptions.blurStrength}
                  onChange={(e) => handleCropSliderChange('blurStrength', e.target.value)}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-brand-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Collapsible Resizing Options */}
      {selectedTasks.includes('resize') && (
        <div className="space-y-4 pt-4 border-t border-dark-cardBorder/40 animate-fade-in">
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">2. Resize Settings</label>
          
          {/* Mode Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resize Format</span>
            <div className="grid grid-cols-3 gap-2">
              {['custom', 'aspect', 'fixed'].map((mode, i) => (
                <button
                  key={i}
                  onClick={() => handleResizeChange('mode', mode)}
                  className={`py-2 rounded-xl border text-center text-[10px] font-bold capitalize transition-all duration-200 ${
                    resizeOptions.mode === mode
                      ? 'border-amber-500 bg-amber-500/10 text-white shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                      : 'border-dark-cardBorder bg-slate-900/30 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {mode === 'aspect' ? 'Ratio Fit' : mode}
                </button>
              ))}
            </div>
          </div>

          {/* Dimension Inputs */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Target Width (px)</label>
              <input
                type="number"
                min="32"
                max="4096"
                value={resizeOptions.width}
                onChange={(e) => handleResizeChange('width', parseInt(e.target.value) || 512)}
                className="w-full bg-slate-950/60 border border-dark-cardBorder focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5" style={{ opacity: resizeOptions.mode === 'aspect' ? 0.5 : 1 }}>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Target Height (px)</label>
              <input
                type="number"
                min="32"
                max="4096"
                disabled={resizeOptions.mode === 'aspect'}
                value={resizeOptions.mode === 'aspect' ? 'Auto' : resizeOptions.height}
                onChange={(e) => handleResizeChange('height', parseInt(e.target.value) || 512)}
                className="w-full bg-slate-950/60 border border-dark-cardBorder focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 outline-none transition-all disabled:text-slate-500 disabled:bg-slate-950/30"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Standard Presets</span>
            <div className="grid grid-cols-3 gap-2">
              {[512, 1024, 2048].map((size, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleResizeChange('width', size);
                    if (resizeOptions.mode !== 'aspect') {
                      handleResizeChange('height', size);
                    }
                  }}
                  className="py-1.5 rounded-lg border border-dark-cardBorder bg-slate-900/20 text-[10px] font-mono text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-all"
                >
                  {size}x{size}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect lock checkbox */}
          {resizeOptions.mode !== 'aspect' && (
            <div className="flex items-center justify-between pt-1 border-t border-dark-cardBorder/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lock Aspect Ratio</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={resizeOptions.preserveAspect}
                  onChange={(e) => handleResizeChange('preserveAspect', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
              </label>
            </div>
          )}
        </div>
      )}

      {/* 5. Core Execution Action Buttons */}
      <div className="flex flex-col space-y-3 pt-4 border-t border-dark-cardBorder/40">
        <button
          onClick={onProcess}
          disabled={!hasImage || isProcessing || selectedTasks.length === 0}
          className="flex w-full items-center justify-center space-x-2.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 py-3.5 text-sm font-bold text-white shadow-glow-primary transition-all duration-300 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
        >
          <Play className="h-4 w-4 fill-white" />
          <span>{isProcessing ? 'Processing AI Models...' : 'Process Image with AI'}</span>
        </button>

        <button
          onClick={onReset}
          disabled={!hasImage || isProcessing}
          className="flex w-full items-center justify-center space-x-2 rounded-2xl border border-dark-cardBorder bg-slate-900/30 py-3 text-xs font-semibold text-slate-400 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/70 hover:text-slate-200 disabled:opacity-40 disabled:pointer-events-none"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset Parameters</span>
        </button>
      </div>

      {/* 6. Model Verification Badge */}
      <div className="flex items-center justify-center space-x-2 pt-2 text-[10px] text-emerald-400 font-semibold bg-emerald-500/5 py-2 rounded-xl border border-emerald-500/10">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Inference Mode: Live YOLOv8 + OpenCV</span>
      </div>

    </div>
  );
}
