import React, { useState } from 'react';
import { 
  FolderPlus, 
  Files, 
  Trash2, 
  CheckCircle, 
  RefreshCw, 
  Download, 
  AlertCircle,
  Clock,
  Archive,
  Play
} from 'lucide-react';

export default function BatchProcessor({ selectedTasks, cropOptions, resizeOptions }) {
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState(null);

  // Add multiple files to the batch queue
  const handleFileChange = (e) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      status: 'queued' // 'queued', 'processing', 'completed', 'failed'
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

  // Compile batch files, upload to FastAPI server, process, and stream ZIP
  const processAndDownloadBatch = async () => {
    if (queue.length === 0) return;
    if (selectedTasks.length === 0) {
      setError('Please select at least one AI task in the sidebar (Face, Body, Smart Crop, or Resize).');
      return;
    }

    setProcessing(true);
    setProgressMsg('Uploading batch images to FastAPI server...');
    setError(null);

    // Update all files to processing status
    setQueue(prev => prev.map(f => ({ ...f, status: 'processing' })));

    try {
      const formData = new FormData();
      queue.forEach(item => {
        formData.append('images', item.file);
      });

      // Prepare configuration JSON
      const configObj = {
        tasks: selectedTasks,
        cropOptions,
        resizeOptions
      };
      formData.append('config', JSON.stringify(configObj));

      setProgressMsg('FastAPI executing live YOLOv8 & OpenCV pipelines...');
      
      const response = await fetch('http://localhost:5000/api/batch-process', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Batch processing failed on server. Make sure FastAPI backend is active.');
      }

      // Download output zip file
      setProgressMsg('Assembling and downloading ZIP archive...');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `smartcrop_yolov8_batch_${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setProgressMsg('Batch zip file downloaded successfully!');
      
      // Update queue to completed status
      setQueue(prev => prev.map(f => ({ ...f, status: 'completed' })));
      
      // Auto clear queue after 3 seconds on success
      setTimeout(() => {
        setQueue([]);
        setProgressMsg('');
      }, 3000);

    } catch (err) {
      console.error('Batch process failed:', err);
      setError('Batch processing failed: ' + err.message);
      setQueue(prev => prev.map(f => ({ ...f, status: 'failed' })));
    } finally {
      setProcessing(false);
    }
  };

  const hasFiles = queue.length > 0;

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-dark-cardBorder/60 bg-dark-card/30 backdrop-blur-xl p-8 shadow-2xl">
      <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none rounded-3xl"></div>

      {/* Header Description */}
      <div className="mb-8 border-b border-dark-cardBorder/50 pb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white tracking-wide font-sans flex items-center space-x-2">
            <Archive className="h-5.5 w-5.5 text-brand-400" />
            <span>YOLOv8 Batch Auto-Framing Portal</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Upload multiple photos, let the backend YOLOv8 models scan and process all items in parallel, and instantly receive a zipped package of cropped faces/bodies, smart crops, or resized frames.
          </p>
        </div>

        {hasFiles && (
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
          <div className="relative group flex min-h-[220px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-dark-cardBorder bg-slate-900/10 text-center transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/30">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={processing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              accept=".jpg,.jpeg,.png,.webp"
            />
            <div className="flex flex-col items-center p-6 pointer-events-none">
              <FolderPlus className="h-10 w-10 text-slate-500 mb-3 group-hover:text-brand-400 transition-colors" />
              <span className="text-xs font-bold text-slate-300">Add Batch Images</span>
              <span className="text-[10px] text-slate-500 mt-1.5">Supports PNG, JPG, WEBP</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Unified Process & Download Button */}
            <button
              onClick={processAndDownloadBatch}
              disabled={queue.length === 0 || processing || selectedTasks.length === 0}
              className="flex w-full items-center justify-center space-x-2.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 py-4 text-xs font-bold text-white shadow-glow-primary transition-all duration-300 hover:opacity-95 hover:scale-[1.01] disabled:opacity-30 disabled:pointer-events-none"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>{processing ? 'Processing AI...' : 'Process Batch & Download ZIP'}</span>
            </button>
          </div>

          {/* Status logs */}
          {processing && (
            <div className="rounded-2xl border border-dark-cardBorder bg-slate-900/40 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center space-x-2.5">
                <RefreshCw className="h-4 w-4 text-brand-400 animate-spin" />
                <span className="text-xs font-bold text-white leading-tight">{progressMsg}</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 animate-pulse w-full"></div>
              </div>
              <span className="text-[10px] text-slate-500 block">FastAPI is processing all queued files concurrently...</span>
            </div>
          )}

          {error && (
            <div className="flex items-start space-x-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right pane: Queue list */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Queue List ({queue.length} items)</span>
          
          <div className="border border-dark-cardBorder/60 rounded-3xl bg-slate-950/40 min-h-[300px] max-h-[420px] overflow-y-auto p-4 space-y-2">
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
                      <Archive className="h-4 w-4" />
                    </div>
                    <div className="truncate flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">{item.name}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{item.size}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Status badges */}
                    {item.status === 'queued' && (
                      <span className="flex items-center space-x-1 text-[10px] font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-dark-cardBorder">
                        <Clock className="h-3 w-3" />
                        <span>Queued</span>
                      </span>
                    )}

                    {item.status === 'processing' && (
                      <span className="flex items-center space-x-1 text-[10px] font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Processing...</span>
                      </span>
                    )}

                    {item.status === 'completed' && (
                      <span className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle className="h-3 w-3" />
                        <span>Done</span>
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
