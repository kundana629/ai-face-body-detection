import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DragDropZone from './components/DragDropZone';
import PreviewWorkspace from './components/PreviewWorkspace';
import ControlSidebar from './components/ControlSidebar';
import BatchProcessor from './components/BatchProcessor';

import { loadFaceDetectionModels, detectFacesInImage } from './utils/faceDetector';
import { cropImageOnCanvas } from './utils/cropEngine';
import { Sparkles, Files, Image as ImageIcon, Trash2, ArrowLeft } from 'lucide-react';

const defaultOptions = {
  targetRatio: 1.0,
  padding: 0.5,
  zoom: 1.0,
  shiftX: 0,
  shiftY: 0,
  blurBackground: true,
  blurStrength: 20
};

export default function App() {
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'batch'
  
  // Single Editor States
  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [imgElement, setImgElement] = useState(null);
  const [faces, setFaces] = useState([]);
  const [cropOptions, setCropOptions] = useState(defaultOptions);
  const [croppedImageSrc, setCroppedImageSrc] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState('');

  // 1. Preload Face Detection models in the background on mount
  useEffect(() => {
    loadFaceDetectionModels((msg) => console.log('AI Preload:', msg)).catch(err => {
      console.error('Failed to preload AI models:', err);
    });
  }, []);

  // 2. Handle file selection in single editor
  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    
    // Create local object URL for previewing
    const src = URL.createObjectURL(selectedFile);
    setImageSrc(src);
    setFaces([]);
    setCroppedImageSrc(null);
    setCropOptions(defaultOptions);

    // Create an offscreen HTML image element to read natural dimensions & run AI
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImgElement(img);
      triggerFaceDetection(img);
    };
  };

  // 3. Trigger face-api.js AI detection client-side
  const triggerFaceDetection = async (imgEl) => {
    setIsDetecting(true);
    setDetectionProgress('Loading neural networks...');
    
    try {
      // Load models first if not done
      await loadFaceDetectionModels((progress) => setDetectionProgress(progress));
      
      setDetectionProgress('Scanning coordinates for human faces...');
      
      // Perform detections (use tiny detector for high performance in dashboard)
      const results = await detectFacesInImage(imgEl, { detectorType: 'tiny', scoreThreshold: 0.45 });
      
      setFaces(results);
      setDetectionProgress(`Complete! Detected ${results.length} faces.`);
      
      // If no faces found, alert slightly but continue with center cropping fallback
      if (results.length === 0) {
        console.warn('No faces detected in image, falling back to center cropping.');
      }
    } catch (err) {
      console.error('Face Detection Failed:', err);
      setDetectionProgress('AI detection error. Check logs.');
    } finally {
      setIsDetecting(false);
    }
  };

  // 4. Update the Canvas Crop in real-time when faces, parameters, or image element updates
  useEffect(() => {
    if (imgElement) {
      try {
        // Map faces to relative boxes
        const relativeBoxes = faces.map(f => f.relativeBox);
        const dataUrl = cropImageOnCanvas(imgElement, relativeBoxes, cropOptions);
        setCroppedImageSrc(dataUrl);
      } catch (err) {
        console.error('Cropping failure:', err);
      }
    }
  }, [imgElement, faces, cropOptions]);

  // 5. Trigger Single Cropped Image Download
  const handleDownload = () => {
    if (!croppedImageSrc || !file) return;

    const link = document.createElement('a');
    link.href = croppedImageSrc;
    
    // Get file name without extension
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    link.download = `${baseName}-cropped-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // 6. Reset parameters to defaults
  const handleReset = () => {
    setCropOptions(defaultOptions);
  };

  // 7. Remove current image and return to upload screen
  const removeImage = () => {
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }
    setFile(null);
    setImageSrc(null);
    setImgElement(null);
    setFaces([]);
    setCroppedImageSrc(null);
    setCropOptions(defaultOptions);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation & Controls Area */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
              SmartCrop Workspace
            </h2>
            <p className="text-xs text-slate-400">
              Intelligent social-media auto-cropping and face recognition framing workbench.
            </p>
          </div>

          {/* Editor Mode Tabs Toggle */}
          <div className="flex rounded-xl bg-slate-900 border border-dark-cardBorder/50 p-1 self-start sm:self-center">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200 ${
                activeTab === 'single'
                  ? 'bg-brand-500 text-white shadow-glow-primary'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Single Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200 ${
                activeTab === 'batch'
                  ? 'bg-brand-500 text-white shadow-glow-primary'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Files className="h-3.5 w-3.5" />
              <span>Batch Framing</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === 'single' ? (
          <div>
            {!file ? (
              /* Image Upload Phase */
              <div className="max-w-3xl mx-auto py-6 animate-fade-in">
                <DragDropZone onFileSelect={handleFileSelect} />
              </div>
            ) : (
              /* Active Single Editor Workspace */
              <div className="flex flex-col space-y-6">
                
                {/* Back / Upload new action row */}
                <div className="flex justify-between items-center bg-dark-card/25 border border-dark-cardBorder/40 rounded-2xl p-4">
                  <button
                    onClick={removeImage}
                    className="flex items-center space-x-2 rounded-xl border border-dark-cardBorder bg-slate-900/30 px-3.5 py-2 text-xs font-semibold text-slate-400 transition-all hover:bg-slate-900/70 hover:text-slate-200"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Upload Different Image</span>
                  </button>

                  <div className="flex items-center space-x-2.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      File Loaded:
                    </span>
                    <span className="text-xs font-semibold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20 max-w-[200px] truncate">
                      {file.name}
                    </span>
                  </div>
                </div>

                {/* Comparative Workspace Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                  
                  {/* Left Comparison Panel */}
                  <div className="xl:col-span-3">
                    <PreviewWorkspace
                      imageSrc={imageSrc}
                      faces={faces}
                      cropOptions={cropOptions}
                      croppedImageSrc={croppedImageSrc}
                      isDetecting={isDetecting}
                      detectionProgress={detectionProgress}
                    />
                  </div>

                  {/* Right Control Sidebar */}
                  <div className="xl:col-span-1">
                    <ControlSidebar
                      options={cropOptions}
                      onChange={setFile ? setCropOptions : () => {}}
                      onDownload={handleDownload}
                      onReset={handleReset}
                      hasImage={!!file}
                      isDetecting={isDetecting}
                      hasFaces={faces.length > 0}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Batch Framing Tab */
          <div className="animate-fade-in py-2">
            <BatchProcessor globalOptions={cropOptions} />
          </div>
        )}
      </main>

      {/* Decorative premium footer */}
      <footer className="w-full border-t border-dark-cardBorder/40 bg-dark-obsidian py-6 mt-16 text-center text-slate-500 text-[11px] font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:justify-between items-center gap-2">
          <span>&copy; {new Date().getFullYear()} SmartCrop AI Framing Inc. All rights reserved.</span>
          <span>Crafted with Deep Learning & WebGL Canvas Pipelines.</span>
        </div>
      </footer>
    </div>
  );
}
