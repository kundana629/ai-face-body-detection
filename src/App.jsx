import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DragDropZone from './components/DragDropZone';
import PreviewWorkspace from './components/PreviewWorkspace';
import ControlSidebar from './components/ControlSidebar';
import BatchProcessor from './components/BatchProcessor';

import { Sparkles, Files, Image as ImageIcon, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';

const defaultCropOptions = {
  targetRatio: 1.0,
  padding: 0.4,
  zoom: 1.0,
  shiftX: 0.0,
  shiftY: 0.0,
  blurBackground: true,
  blurStrength: 20
};

const defaultResizeOptions = {
  mode: 'custom',
  width: 512,
  height: 512,
  preserveAspect: true
};

export default function App() {
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'batch'
  
  // Selection / Options States
  const [selectedTasks, setSelectedTasks] = useState(['face_detection', 'smart_crop']);
  const [cropOptions, setCropOptions] = useState(defaultCropOptions);
  const [resizeOptions, setResizeOptions] = useState(defaultResizeOptions);

  // Single Editor File States
  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Processed Results from FastAPI
  const [processedResults, setProcessedResults] = useState({
    faces: [],
    bodies: [],
    visualizedImageSrc: null,
    croppedImageSrc: null,
    resizedImageSrc: null,
    resizedDims: null
  });

  // Handle file selection in single editor
  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    
    // Create local object URL for previewing
    const src = URL.createObjectURL(selectedFile);
    setImageSrc(src);
    setError(null);
    
    // Reset previous outputs
    setProcessedResults({
      faces: [],
      bodies: [],
      visualizedImageSrc: null,
      croppedImageSrc: null,
      resizedImageSrc: null,
      resizedDims: null
    });
  };

  // Automatically trigger processing when a new file is uploaded
  useEffect(() => {
    if (file && imageSrc) {
      triggerImageProcessing();
    }
  }, [file]);

  // Main single-image processing orchestrator using FastAPI backend
  const triggerImageProcessing = async () => {
    if (!file) return;
    if (selectedTasks.length === 0) {
      setError('Please select at least one AI task in the sidebar dashboard.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Package tasks, crop options, and resize options as a config JSON string
      const configObj = {
        tasks: selectedTasks,
        cropOptions,
        resizeOptions
      };
      formData.append('config', JSON.stringify(configObj));

      // Make API call to FastAPI backend
      const response = await fetch('http://localhost:5000/api/process', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('API server processing failed. Ensure the FastAPI backend is running on port 5000.');
      }

      const data = await response.json();
      
      if (data.success) {
        setProcessedResults({
          faces: data.faces || [],
          bodies: data.bodies || [],
          visualizedImageSrc: data.visualized_image || null,
          croppedImageSrc: data.smart_cropped_image || null,
          resizedImageSrc: data.resized_image || null,
          resizedDims: data.resized_dims || null
        });
      } else {
        throw new Error(data.error || 'Unknown server processing error.');
      }

    } catch (err) {
      console.error('FastAPI Connection Error:', err);
      setError(err.message || 'Failed to connect to the FastAPI backend service.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle tasks in task dashboard
  const handleToggleTask = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(t => t !== taskId)
        : [...prev, taskId]
    );
  };

  // Reset parameters to defaults
  const handleReset = () => {
    setCropOptions(defaultCropOptions);
    setResizeOptions(defaultResizeOptions);
    setSelectedTasks(['face_detection', 'smart_crop']);
  };

  // Remove current image and return to upload screen
  const removeImage = () => {
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }
    setFile(null);
    setImageSrc(null);
    setError(null);
    setProcessedResults({
      faces: [],
      bodies: [],
      visualizedImageSrc: null,
      croppedImageSrc: null,
      resizedImageSrc: null,
      resizedDims: null
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation & Controls Area */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
              YOLOv8 AI Workbench
            </h2>
            <p className="text-xs text-slate-400">
              Intelligent multi-task object detection, face framing, and precision image scaling workbench.
            </p>
          </div>

          {/* Editor Mode Tabs Toggle */}
          <div className="flex rounded-xl bg-slate-900 border border-dark-cardBorder/50 p-1 self-start sm:self-center shadow-lg">
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

                {/* Error alert banner */}
                {error && (
                  <div className="flex items-start space-x-2.5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400 animate-fade-in">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="font-bold">FastAPI Connection Failure</p>
                      <p className="mt-1 text-slate-400">Please verify that the Python backend is running locally by executing <code className="bg-slate-950 px-1.5 py-0.5 rounded text-[10px]">python backend/run.py</code> in your terminal.</p>
                      <p className="mt-1 font-mono text-[10px] text-red-300">Details: {error}</p>
                    </div>
                  </div>
                )}

                {/* Comparative Workspace Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                  
                  {/* Left Comparison Panel */}
                  <div className="xl:col-span-3">
                    <PreviewWorkspace
                      imageSrc={imageSrc}
                      faces={processedResults.faces}
                      bodies={processedResults.bodies}
                      cropOptions={cropOptions}
                      croppedImageSrc={processedResults.croppedImageSrc}
                      visualizedImageSrc={processedResults.visualizedImageSrc}
                      resizedImageSrc={processedResults.resizedImageSrc}
                      resizedDims={processedResults.resizedDims}
                      isProcessing={isProcessing}
                      selectedTasks={selectedTasks}
                    />
                  </div>

                  {/* Right Control Sidebar */}
                  <div className="xl:col-span-1">
                    <ControlSidebar
                      selectedTasks={selectedTasks}
                      onToggleTask={handleToggleTask}
                      cropOptions={cropOptions}
                      onChangeCrop={setCropOptions}
                      resizeOptions={resizeOptions}
                      onChangeResize={setResizeOptions}
                      onProcess={triggerImageProcessing}
                      onReset={handleReset}
                      hasImage={!!file}
                      isProcessing={isProcessing}
                      hasResults={!!processedResults.visualizedImageSrc || !!processedResults.croppedImageSrc || !!processedResults.resizedImageSrc}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Batch Framing Tab */
          <div className="animate-fade-in py-2">
            <BatchProcessor 
              selectedTasks={selectedTasks}
              cropOptions={cropOptions}
              resizeOptions={resizeOptions}
            />
          </div>
        )}
      </main>

      {/* Decorative premium footer */}
      <footer className="w-full border-t border-dark-cardBorder/40 bg-dark-obsidian py-6 mt-16 text-center text-slate-500 text-[11px] font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:justify-between items-center gap-2">
          <span>&copy; {new Date().getFullYear()} Intelligent YOLOv8 Object Detection Workspace. All rights reserved.</span>
          <span>Powered by FastAPI, PyTorch, Ultralytics and OpenCV.</span>
        </div>
      </footer>
    </div>
  );
}
