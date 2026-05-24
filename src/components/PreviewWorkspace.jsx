import React, { useRef, useEffect, useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Sparkles, 
  RefreshCw, 
  ZoomIn, 
  Layers, 
  Crop,
  Download,
  Image as ImageIcon,
  User,
  UserCheck,
  Scaling,
  Maximize2
} from 'lucide-react';

export default function PreviewWorkspace({
  imageSrc,
  faces = [],
  bodies = [],
  cropOptions,
  croppedImageSrc,
  visualizedImageSrc,
  resizedImageSrc,
  resizedDims,
  isProcessing,
  selectedTasks = []
}) {
  const [activeTab, setActiveTab] = useState('sandbox'); // 'sandbox' | 'crops' | 'sizing'
  const [showOverlays, setShowOverlays] = useState(true);
  const imgRef = useRef(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0, displayWidth: 0, displayHeight: 0 });

  // Update image scale parameters on window resize or load
  const updateImageSizes = () => {
    if (imgRef.current) {
      setImgSize({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
        displayWidth: imgRef.current.clientWidth,
        displayHeight: imgRef.current.clientHeight
      });
    }
  };

  useEffect(() => {
    updateImageSizes();
    window.addEventListener('resize', updateImageSizes);
    return () => window.removeEventListener('resize', updateImageSizes);
  }, [imageSrc, faces, bodies, isProcessing]);

  // Compute absolute scale factor for SVG overlay based on screen display sizes
  const scaleX = imgSize.width ? imgSize.displayWidth / imgSize.width : 0;
  const scaleY = imgSize.height ? imgSize.displayHeight / imgSize.height : 0;

  // Single asset downloader
  const downloadAsset = (base64Src, filename) => {
    if (!base64Src) return;
    const link = document.createElement('a');
    link.href = base64Src;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const hasCrops = (selectedTasks.includes('face_detection') && faces.length > 0) || 
                   (selectedTasks.includes('body_detection') && bodies.length > 0);
                   
  const hasSizing = (selectedTasks.includes('smart_crop') && croppedImageSrc) || 
                    (selectedTasks.includes('resize') && resizedImageSrc);

  return (
    <div className="flex flex-col space-y-6 w-full">
      
      {/* Tab Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-dark-cardBorder/40 pb-3 gap-3">
        <div className="flex bg-slate-950/60 p-1.5 rounded-2xl border border-dark-cardBorder/50">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 ${
              activeTab === 'sandbox'
                ? 'bg-brand-500 text-white shadow-glow-primary'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Detection Sandbox</span>
          </button>
          
          <button
            onClick={() => setActiveTab('crops')}
            disabled={!hasCrops}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 ${
              activeTab === 'crops'
                ? 'bg-brand-500 text-white shadow-glow-primary'
                : 'text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Cropped Assets ({faces.length + bodies.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('sizing')}
            disabled={!hasSizing}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 ${
              activeTab === 'sizing'
                ? 'bg-brand-500 text-white shadow-glow-primary'
                : 'text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400'
            }`}
          >
            <Scaling className="h-3.5 w-3.5" />
            <span>Sizing & Framing</span>
          </button>
        </div>

        {activeTab === 'sandbox' && (faces.length > 0 || bodies.length > 0) && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowOverlays(!showOverlays)}
              className={`flex items-center space-x-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all duration-300 ${
                showOverlays
                  ? 'border-brand-500/30 bg-brand-500/10 text-brand-400'
                  : 'border-dark-cardBorder bg-slate-900/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              {showOverlays ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span>{showOverlays ? 'Hide Box Overlays' : 'Show Box Overlays'}</span>
            </button>

            {visualizedImageSrc && (
              <button
                onClick={() => downloadAsset(visualizedImageSrc, `yolov8_detections_${Date.now()}.png`)}
                className="flex items-center space-x-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 text-xs font-bold hover:bg-emerald-500/25 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save Overlays</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Workspace Frame */}
      <div className="relative overflow-hidden rounded-3xl border border-dark-cardBorder/60 bg-dark-card/20 backdrop-blur-md min-h-[400px] flex items-center justify-center p-6 shadow-xl">
        <div className="absolute inset-0 bg-grid opacity-[0.015] pointer-events-none"></div>

        {/* Loading Spinner Overlays */}
        {isProcessing && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-dark-obsidian/90 backdrop-blur-md p-6 rounded-3xl animate-fade-in">
            <div className="relative mb-6 flex h-14 w-14 items-center justify-center">
              <RefreshCw className="h-10 w-10 text-brand-400 animate-spin" />
              <Sparkles className="absolute h-5 w-5 text-indigo-400 animate-pulse" />
            </div>
            <h5 className="font-bold text-white text-base mb-1.5 font-sans tracking-wide">Executing Live YOLOv8 Models</h5>
            <p className="text-xs text-slate-400 font-medium">Inference in progress. Scanning faces, people, and shapes...</p>
            <div className="mt-4 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-500 to-cyan-500 rounded-full animate-[pulse_1.5s_infinite]"></div>
            </div>
          </div>
        )}

        {/* TAB 1: SANDBOX OVERLAYS VIEW */}
        {activeTab === 'sandbox' && (
          <div className="relative max-w-full max-h-[500px] flex items-center justify-center">
            {imageSrc ? (
              <div className="relative max-w-full max-h-[500px]">
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Source workspace template"
                  onLoad={updateImageSizes}
                  className="max-w-full max-h-[500px] object-contain rounded-2xl block select-none pointer-events-none border border-slate-800/40"
                />

                {/* SVG Live Bounding Box Overlay */}
                {showOverlays && scaleX > 0 && (
                  <svg
                    className="absolute top-0 left-0 w-full h-full pointer-events-none select-none"
                    viewBox={`0 0 ${imgSize.displayWidth} ${imgSize.displayHeight}`}
                  >
                    {/* Render Full Body BBoxes - Magenta */}
                    {bodies.map((body, idx) => {
                      const x = body.absolute_box[0] * scaleX;
                      const y = body.absolute_box[1] * scaleY;
                      const w = body.absolute_box[2] * scaleX;
                      const h = body.absolute_box[3] * scaleY;

                      return (
                        <g key={`body-${idx}`}>
                          <rect
                            x={x}
                            y={y}
                            width={w}
                            height={h}
                            fill="none"
                            stroke="#d946ef"
                            strokeWidth="2"
                            rx="3"
                          />
                          {/* Top-Left Corner Bracket */}
                          <path d={`M ${x} ${y+10} V ${y} H ${x+10}`} stroke="#d946ef" strokeWidth="3.5" fill="none" />
                          <path d={`M ${x+w} ${y+10} V ${y} H ${x+w-10}`} stroke="#d946ef" strokeWidth="3.5" fill="none" />
                          <path d={`M ${x} ${y+h-10} V ${y+h} H ${x+10}`} stroke="#d946ef" strokeWidth="3.5" fill="none" />
                          <path d={`M ${x+w} ${y+h-10} V ${y+h} H ${x+w-10}`} stroke="#d946ef" strokeWidth="3.5" fill="none" />
                          
                          <g transform={`translate(${x}, ${Math.max(14, y - 6)})`}>
                            <rect width="85" height="15" rx="3" fill="#d946ef" />
                            <text x="5" y="11" fill="#0f172a" fontSize="8.5" fontWeight="black" fontFamily="system-ui">
                              BODY #{idx + 1} ({Math.round(body.score * 100)}%)
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    {/* Render Face BBoxes - Cyan */}
                    {faces.map((face, idx) => {
                      const x = face.absolute_box[0] * scaleX;
                      const y = face.absolute_box[1] * scaleY;
                      const w = face.absolute_box[2] * scaleX;
                      const h = face.absolute_box[3] * scaleY;

                      return (
                        <g key={`face-${idx}`}>
                          <rect
                            x={x}
                            y={y}
                            width={w}
                            height={h}
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="2.5"
                            rx="4"
                          />
                          <path d={`M ${x} ${y+8} V ${y} H ${x+8}`} stroke="#06b6d4" strokeWidth="3.5" fill="none" />
                          <path d={`M ${x+w} ${y+8} V ${y} H ${x+w-8}`} stroke="#06b6d4" strokeWidth="3.5" fill="none" />
                          <path d={`M ${x} ${y+h-8} V ${y+h} H ${x+8}`} stroke="#06b6d4" strokeWidth="3.5" fill="none" />
                          <path d={`M ${x+w} ${y+h-8} V ${y+h} H ${x+w-8}`} stroke="#06b6d4" strokeWidth="3.5" fill="none" />

                          <g transform={`translate(${x}, ${Math.max(14, y - 6)})`}>
                            <rect width="85" height="15" rx="3" fill="#06b6d4" />
                            <text x="5" y="11" fill="#0f172a" fontSize="8.5" fontWeight="black" fontFamily="system-ui">
                              FACE #{idx + 1} ({Math.round(face.score * 100)}%)
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-dark-cardBorder bg-slate-900/30 text-slate-600">
                  <ZoomIn className="h-7 w-7" />
                </div>
                <p className="text-sm font-bold text-slate-400">Awaiting image template</p>
                <p className="text-xs text-slate-600 max-w-xs mt-1.5">Upload a photo to run live object detection and intelligent cropping workspace.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CROPPED ASSETS GRID */}
        {activeTab === 'crops' && (
          <div className="w-full flex flex-col space-y-6 animate-fade-in self-start">
            
            {/* Faces section */}
            {faces.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                  <UserCheck className="h-4 w-4" />
                  <span>Detected Human Face Crops ({faces.length})</span>
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {faces.map((f, i) => (
                    <div key={i} className="group relative rounded-2xl border border-dark-cardBorder/50 bg-slate-950/60 p-2 text-center transition-all duration-300 hover:border-cyan-500/40">
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center">
                        <img src={f.crop} alt={`Face ${i+1}`} className="max-w-full max-h-full object-cover transition-all duration-300 group-hover:scale-105" />
                        <button
                          onClick={() => downloadAsset(f.crop, `face_crop_${i+1}.png`)}
                          className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 rounded-xl"
                        >
                          <Download className="h-6 w-6 text-white" />
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mt-2 font-bold">Face #{i+1}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">Conf: {Math.round(f.score * 100)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bodies section */}
            {bodies.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-dark-cardBorder/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center space-x-1.5">
                  <User className="h-4 w-4" />
                  <span>Detected Person Crops ({bodies.length})</span>
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {bodies.map((b, i) => (
                    <div key={i} className="group relative rounded-2xl border border-dark-cardBorder/50 bg-slate-950/60 p-2 text-center transition-all duration-300 hover:border-pink-500/40">
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center">
                        <img src={b.crop} alt={`Body ${i+1}`} className="max-w-full max-h-full object-cover transition-all duration-300 group-hover:scale-105" />
                        <button
                          onClick={() => downloadAsset(b.crop, `person_crop_${i+1}.png`)}
                          className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 rounded-xl"
                        >
                          <Download className="h-6 w-6 text-white" />
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mt-2 font-bold">Body #{i+1}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">Conf: {Math.round(b.score * 100)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SMART AUTO-FRAMING & RESIZING */}
        {activeTab === 'sizing' && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in self-start">
            
            {/* Smart Crop Preview Column */}
            {selectedTasks.includes('smart_crop') && croppedImageSrc && (
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-center bg-slate-950/40 border border-dark-cardBorder/40 rounded-xl p-3.5">
                  <span className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 uppercase tracking-wide">
                    <Crop className="h-4 w-4 text-brand-400" />
                    <span>Auto-Framed Crop</span>
                  </span>
                  
                  <button
                    onClick={() => downloadAsset(croppedImageSrc, `smart_crop_${Date.now()}.png`)}
                    className="flex items-center space-x-1 border border-brand-500/20 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-lg px-2 py-1 text-[10px] font-bold transition-all"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </button>
                </div>

                <div className="relative flex aspect-square items-center justify-center rounded-2xl border border-dark-cardBorder bg-slate-950/40 p-4">
                  <img src={croppedImageSrc} alt="Smart crop" className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-slate-900" />
                  <span className="absolute bottom-3 right-3 rounded bg-slate-900/90 border border-dark-cardBorder px-2 py-0.5 text-[9px] font-mono text-slate-400">
                    Ratio: {cropOptions.targetRatio.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Resized Preview Column */}
            {selectedTasks.includes('resize') && resizedImageSrc && (
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-center bg-slate-950/40 border border-dark-cardBorder/40 rounded-xl p-3.5">
                  <span className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 uppercase tracking-wide">
                    <Scaling className="h-4 w-4 text-amber-400" />
                    <span>Resized Frame</span>
                  </span>
                  
                  <button
                    onClick={() => downloadAsset(resizedImageSrc, `resized_frame_${Date.now()}.png`)}
                    className="flex items-center space-x-1 border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg px-2 py-1 text-[10px] font-bold transition-all"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </button>
                </div>

                <div className="relative flex aspect-square items-center justify-center rounded-2xl border border-dark-cardBorder bg-slate-950/40 p-4">
                  <img src={resizedImageSrc} alt="Resized output" className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-slate-900" />
                  {resizedDims && (
                    <span className="absolute bottom-3 right-3 rounded bg-slate-900/90 border border-dark-cardBorder px-2 py-0.5 text-[9px] font-mono text-slate-400">
                      Size: {resizedDims[0]} x {resizedDims[1]} px
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
