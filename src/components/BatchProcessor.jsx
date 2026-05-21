import React, { useState } from 'react';
import { 
  FolderPlus, 
  Files, 
  Trash2, 
  Sparkles, 
  CheckCircle, 
  RefreshCw, 
  Download, 
  AlertCircle,
  HelpCircle,
  Clock,
  Archive
} from 'lucide-react';
import { detectFacesInImage } from '../utils/faceDetector';

export default function BatchProcessor({ globalOptions }) {
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [error, setError] = useState(null);

  // Add multiple files to the batch queue
  const handleFileChange = (e) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      status: 'queued', // 'queued', 'scanning', 'ready', 'failed'
      faces: []
    }));
    setQueue(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const removeFile = (id) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const clearQueue = () => {
    setQueue([]);
    setError(null);
  };

  // Perform client-side face recognition on all queued images
  const analyzeBatch = async () => {
    if (queue.length === 0) return;
    setProcessing(true);
    setProgressMsg('Initializing local AI models...');
    setProcessedCount(0);
    setError(null);

    const updatedQueue = [...queue];

    try {
      for (let i = 0; i < updatedQueue.length; i++) {
        const item = updatedQueue[i];
        if (item.status === 'ready') {
          setProcessedCount(c => c + 1);
          continue;
        }

        setProgressMsg(`AI Scanning: ${item.name} (${i + 1}/${updatedQueue.length})`);
        
        // Mark item as scanning
        setQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'scanning' } : f));

        try {
          // Load file into an image element asynchronously
          const img = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const el = new Image();
              el.src = e.target.result;
              el.onload = () => resolve(el);
              el.onerror = (err) => reject(err);
            };
            reader.readAsDataURL(item.file);
          });

          // Perform face detection
          const detections = await detectFacesInImage(img, { detectorType: 'tiny', scoreThreshold: 0.4 });
          const relativeFaces = detections.map(d => d.relativeBox);

          // Update item state with faces array
          setQueue(prev => prev.map(f => f.id === item.id ? { 
            ...f, 
            status: 'ready', 
            faces: relativeFaces 
          } : f));
          
          updatedQueue[i].status = 'ready';
          updatedQueue[i].faces = relativeFaces;

        } catch (itemErr) {
          console.error(`Failed to scan image ${item.name}:`, itemErr);
          setQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'failed' } : f));
          updatedQueue[i].status = 'failed';
        }

        setProcessedCount(i + 1);
      }

      setProgressMsg('Face analysis completed!');
    } catch (err) {
      setError('An error occurred during image face recognition: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Compile batch files, upload to server, apply crops, and download ZIP archive
  const processAndDownload = async () => {
    const readyItems = queue.filter(item => item.status === 'ready');
    if (readyItems.length === 0) {
      setError('Please analyze the images first using the "Run AI Face Scan" button.');
      return;
    }

    setProcessing(true);
    setProgressMsg('Uploading batch images to server...');
    setError(null);

    try {
      // 1. Upload files via Express backend multipart upload
      const formData = new FormData();
      readyItems.forEach(item => {
        formData.append('images', item.file);
      });

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Server upload failed. Make sure backend is running.');
      }

      const uploadResult = await uploadResponse.json();
      setProgressMsg('Server running intelligent Sharp cropping algorithms...');

      // 2. Map files to uploaded filenames and crop coordinates
      const batchItems = readyItems.map((item, idx) => {
        const uploadedFile = uploadResult.files[idx];
        return {
          filename: uploadedFile.id,
          faces: item.faces,
          options: {} // can override per image options in future
        };
      });

      // 3. Trigger Express to run sharp crop and zip the files
      const cropResponse = await fetch('/api/batch-crop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batchItems,
          globalOptions
        })
      });

      if (!cropResponse.ok) {
        throw new Error('Batch processing or cropping failed on server.');
      }

      // 4. Download output zip file
      setProgressMsg('Downloading smartcropped zip package...');
      const blob = await cropResponse.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `smartcrop-batch-${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setProgressMsg('Zip package downloaded successfully!');
      
      // Clear queue on success
      setQueue([]);
    } catch (err) {
      console.error('Batch crop download failed:', err);
      setError('Batch processing failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const anyScanning = queue.some(f => f.status === 'scanning');
  const allReady = queue.length > 0 && queue.every(f => f.status === 'ready');
  const hasReadyFiles = queue.some(f => f.status === 'ready');

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-dark-cardBorder/60 bg-dark-card/30 backdrop-blur-xl p-8 shadow-2xl">
      <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none rounded-3xl"></div>

      {/* Header Description */}
      <div className="mb-8 border-b border-dark-cardBorder/50 pb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white tracking-wide font-sans flex items-center space-x-2">
            <Files className="h-5.5 w-5.5 text-brand-400" />
            <span>Batch Auto-Framing Portal</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Upload multiple photos, let the client-side browser AI locate all faces, and instantly download a compiled ZIP archive containing perfectly cropped versions.
          </p>
        </div>

        {queue.length > 0 && (
          <button
            onClick={clearQueue}
            disabled={processing}
            className="flex items-center space-x-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Queue</span>
          </button>
        )}
      </div>

      {/* File Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left pane: File drag drop and actions */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <div className="relative group flex min-h-[200px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dark-cardBorder bg-slate-900/10 text-center transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/30">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={processing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              accept=".jpg,.jpeg,.png,.webp"
            />
            <div className="flex flex-col items-center p-6 pointer-events-none">
              <FolderPlus className="h-9 w-9 text-slate-500 mb-3 group-hover:text-brand-400 transition-colors" />
              <span className="text-xs font-bold text-slate-300">Add Batch Images</span>
              <span className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, WEBP</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Action 1: Client Face Recognition */}
            <button
              onClick={analyzeBatch}
              disabled={queue.length === 0 || processing || allReady}
              className="flex w-full items-center justify-center space-x-2.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 py-3.5 text-xs font-bold text-white shadow-glow-primary transition-all duration-300 hover:opacity-95 hover:scale-[1.01] disabled:opacity-30 disabled:pointer-events-none"
            >
              <Sparkles className="h-4 w-4" />
              <span>Run AI Face Scan</span>
            </button>

            {/* Action 2: Batch Crop & Zip Download */}
            <button
              onClick={processAndDownload}
              disabled={!hasReadyFiles || processing}
              className="flex w-full items-center justify-center space-x-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 py-3.5 text-xs font-bold text-emerald-400 transition-all duration-300 hover:bg-emerald-500/20 hover:scale-[1.01] disabled:opacity-30 disabled:pointer-events-none"
            >
              <Archive className="h-4 w-4" />
              <span>Generate & Download ZIP</span>
            </button>
          </div>

          {/* Status logs */}
          {processing && (
            <div className="rounded-2xl border border-dark-cardBorder bg-slate-900/40 p-4 space-y-3">
              <div className="flex items-center space-x-2.5">
                <RefreshCw className="h-4 w-4 text-brand-400 animate-spin" />
                <span className="text-xs font-bold text-white">{progressMsg}</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${(processedCount / queue.length) * 100}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-500 block">Processed: {processedCount} / {queue.length} files</span>
            </div>
          )}

          {error && (
            <div className="flex items-start space-x-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right pane: Queue list */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Queue List ({queue.length} items)</span>
          
          <div className="border border-dark-cardBorder/60 rounded-2xl bg-slate-950/40 min-h-[300px] max-h-[420px] overflow-y-auto p-4 space-y-2">
            {queue.length === 0 ? (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-slate-600">
                <Files className="h-10 w-10 text-slate-700 mb-3" />
                <p className="text-xs font-bold">Queue is empty</p>
                <p className="text-[10px] text-slate-600 max-w-[200px] mt-1">Upload multiple photos from the left box to begin.</p>
              </div>
            ) : (
              queue.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between border border-dark-cardBorder/40 rounded-xl bg-dark-card/20 p-3 hover:border-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 border border-dark-cardBorder text-slate-500">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div className="truncate flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">{item.name}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{item.size}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Status node */}
                    {item.status === 'queued' && (
                      <span className="flex items-center space-x-1 text-[10px] font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-dark-cardBorder">
                        <Clock className="h-3 w-3" />
                        <span>Queued</span>
                      </span>
                    )}

                    {item.status === 'scanning' && (
                      <span className="flex items-center space-x-1 text-[10px] font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Scanning...</span>
                      </span>
                    )}

                    {item.status === 'ready' && (
                      <span className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle className="h-3 w-3" />
                        <span>Ready ({item.faces.length} faces)</span>
                      </span>
                    )}

                    {item.status === 'failed' && (
                      <span className="flex items-center space-x-1 text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                        <AlertCircle className="h-3 w-3" />
                        <span>Failed</span>
                      </span>
                    )}

                    <button
                      onClick={() => removeFile(item.id)}
                      disabled={processing}
                      className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-dark-cardBorder transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
