import React, { useRef, useEffect, useState } from 'react';
import { Eye, EyeOff, Sparkles, Sliders, RefreshCw, ZoomIn, Layers } from 'lucide-react';
import { calculateCropBox } from '../utils/cropEngine';

export default function PreviewWorkspace({
  imageSrc,
  faces,
  cropOptions,
  croppedImageSrc,
  isDetecting,
  detectionProgress
}) {
  const [showOverlays, setShowOverlays] = useState(true);
  const containerRef = useRef(null);
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
  }, [imageSrc, faces, isDetecting]);

  // Compute absolute scale factor for SVG overlay based on screen display sizes
  const scaleX = imgSize.width ? imgSize.displayWidth / imgSize.width : 0;
  const scaleY = imgSize.height ? imgSize.displayHeight / imgSize.height : 0;

  // Calculate coordinates of the active crop box
  const cropBox = imgSize.width
    ? calculateCropBox(imgSize.width, imgSize.height, faces.map(f => f.relativeBox), cropOptions)
    : null;

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full">
      
      {/* 1. Original Image View (Before) */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">1</span>
            <h4 className="text-sm font-semibold text-slate-300">Original & Facial Recognition</h4>
          </div>

          {/* Toggle Overlay Button */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            disabled={faces.length === 0}
            className={`flex items-center space-x-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
              showOverlays && faces.length > 0
                ? 'border-brand-500/30 bg-brand-500/10 text-brand-400'
                : 'border-dark-cardBorder bg-slate-900/40 text-slate-400 hover:text-slate-200'
            } disabled:opacity-40 disabled:pointer-events-none`}
          >
            {showOverlays ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span>{showOverlays ? 'Hide Overlays' : 'Show Overlays'}</span>
          </button>
        </div>

        {/* Image Display Card */}
        <div className="relative overflow-hidden rounded-3xl border border-dark-cardBorder bg-dark-card/30 backdrop-blur-md min-h-[350px] flex items-center justify-center p-4">
          
          {/* Subtle glow background */}
          <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none"></div>

          {/* Detection Loading Overlay */}
          {isDetecting && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-dark-obsidian/85 backdrop-blur-md p-6 rounded-3xl animate-fade-in">
              <div className="relative mb-6 flex h-14 w-14 items-center justify-center">
                <RefreshCw className="h-10 w-10 text-brand-400 animate-spin" />
                <Sparkles className="absolute h-5 w-5 text-indigo-400 animate-pulse" />
              </div>
              <h5 className="font-bold text-white text-base mb-1.5">Analyzing Facial Anatomy</h5>
              <p className="text-xs text-slate-400 font-medium">{detectionProgress || 'Scanning pixels...'}</p>
              
              {/* Animated Progress Bar */}
              <div className="mt-4 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full animate-[pulse_1.5s_infinite]"></div>
              </div>
            </div>
          )}

          {/* Core Image Container */}
          <div className="relative max-w-full max-h-[500px]">
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Source template"
              onLoad={updateImageSizes}
              className="max-w-full max-h-[500px] object-contain rounded-2xl block select-none pointer-events-none border border-slate-800/40"
            />

            {/* Smart Cyber Scanning Line during AI loading */}
            {isDetecting && <div className="animate-scan"></div>}

            {/* SVG Bounding Box and Landmarks Overlay */}
            {showOverlays && faces.length > 0 && scaleX > 0 && (
              <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none select-none"
                viewBox={`0 0 ${imgSize.displayWidth} ${imgSize.displayHeight}`}
              >
                {/* 1. Crop Region Boundary Overlay */}
                {cropBox && (
                  <g>
                    {/* Shadow masking out-of-crop areas */}
                    <path
                      d={`M 0 0 H ${imgSize.displayWidth} V ${imgSize.displayHeight} H 0 Z 
                          M ${cropBox.left * scaleX} ${cropBox.top * scaleY} 
                          h ${cropBox.w * scaleX} 
                          v ${cropBox.h * scaleY} 
                          h ${-cropBox.w * scaleX} Z`}
                      fill="rgba(0, 0, 0, 0.65)"
                      fillRule="evenodd"
                    />
                    
                    {/* Crop outline box */}
                    <rect
                      x={cropBox.left * scaleX}
                      y={cropBox.top * scaleY}
                      width={cropBox.w * scaleX}
                      height={cropBox.h * scaleY}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="shadow-glow-accent"
                    />

                    {/* Crop Label indicator */}
                    <g transform={`translate(${Math.max(0, cropBox.left * scaleX)}, ${Math.max(20, cropBox.top * scaleY - 6)})`}>
                      <rect width="65" height="18" rx="4" fill="#8b5cf6" />
                      <text x="6" y="12" fill="white" fontSize="9" fontWeight="bold" fontFamily="system-ui">
                        SMART CROP
                      </text>
                    </g>
                  </g>
                )}

                {/* 2. Detected Face Bounding Boxes */}
                {faces.map((face, idx) => {
                  const x = face.absoluteBox.x * scaleX;
                  const y = face.absoluteBox.y * scaleY;
                  const w = face.absoluteBox.width * scaleX;
                  const h = face.absoluteBox.height * scaleY;

                  return (
                    <g key={idx}>
                      {/* Bounding box outline */}
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
                      
                      {/* Bounding Box Corner Reticles */}
                      <path d={`M ${x} ${y+12} V ${y} H ${x+12}`} stroke="#06b6d4" strokeWidth="4" fill="none" />
                      <path d={`M ${x+w} ${y+12} V ${y} H ${x+w-12}`} stroke="#06b6d4" strokeWidth="4" fill="none" />
                      <path d={`M ${x} ${y+h-12} V ${y+h} H ${x+12}`} stroke="#06b6d4" strokeWidth="4" fill="none" />
                      <path d={`M ${x+w} ${y+h-12} V ${y+h} H ${x+w-12}`} stroke="#06b6d4" strokeWidth="4" fill="none" />

                      {/* Face index label tag */}
                      <g transform={`translate(${x}, ${Math.max(16, y - 6)})`}>
                        <rect width="65" height="16" rx="4" fill="#06b6d4" />
                        <text x="6" y="11" fill="#0f172a" fontSize="9" fontWeight="extrabold">
                          FACE #{idx + 1} ({Math.round(face.score * 100)}%)
                        </text>
                      </g>

                      {/* 3. Render 68 facial landmark dots */}
                      {face.landmarks.map((pt, pIdx) => (
                        <circle
                          key={pIdx}
                          cx={pt.x * scaleX}
                          cy={pt.y * scaleY}
                          r="1.5"
                          fill="#22d3ee"
                          opacity="0.85"
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* 2. Intelligent Smart Crop Result View (After) */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] font-bold">2</span>
            <h4 className="text-sm font-semibold text-slate-300">Intelligent Crop Preview</h4>
          </div>

          <div className="flex items-center space-x-1.5 rounded-full border border-brand-500/20 bg-brand-500/5 px-2.5 py-1 text-xs text-brand-400 font-semibold">
            <Sparkles className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider">AI Crop Optimized</span>
          </div>
        </div>

        {/* Crop Preview Display Card */}
        <div className="relative overflow-hidden rounded-3xl border border-dark-cardBorder bg-dark-card/30 backdrop-blur-md min-h-[350px] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none"></div>

          {croppedImageSrc ? (
            <div className="relative flex flex-col items-center justify-center max-w-full max-h-[500px]">
              <img
                src={croppedImageSrc}
                alt="AI smart cropped output"
                className="max-w-full max-h-[500px] object-contain rounded-2xl shadow-2xl border border-slate-800/40 transition-all duration-300"
              />
              <span className="absolute bottom-4 right-4 rounded-lg bg-slate-900/80 backdrop-blur-md border border-dark-cardBorder px-2.5 py-1 text-[10px] font-mono font-medium text-slate-400">
                Aspect Ratio: {cropOptions.targetRatio === 1 ? '1:1' : cropOptions.targetRatio > 1.5 ? '16:9' : cropOptions.targetRatio < 0.6 ? '9:16' : '4:3'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-dark-cardBorder bg-slate-900/40 text-slate-600">
                <ZoomIn className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold">Awaiting cropping parameters</p>
              <p className="text-xs text-slate-600 max-w-xs mt-1">Upload an image and run face detection to compute the smart crop.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
