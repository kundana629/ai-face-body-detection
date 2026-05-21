import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function DragDropZone({ onFileSelect }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndProcessFile = (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Unsupported file type! Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File is too large! Maximum limit is 15MB.');
      return;
    }

    setError(null);
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex min-h-[350px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
          isDragActive
            ? 'border-brand-500 bg-brand-500/5 shadow-glow-primary scale-[0.99]'
            : 'border-dark-cardBorder bg-dark-card/40 backdrop-blur-md hover:border-slate-700 hover:bg-dark-card/60'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleChange}
        />

        {/* Decorative Grid Effect inside Upload Card */}
        <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none rounded-3xl"></div>

        <div className="relative flex flex-col items-center z-10">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600/10 to-indigo-500/10 border border-brand-500/20 text-brand-400 shadow-glow-primary transition-all duration-300 hover:scale-105">
            <UploadCloud className="h-8 w-8 animate-pulse" />
          </div>

          <h3 className="mb-2 text-xl font-bold tracking-tight text-white font-sans">
            Upload your picture
          </h3>
          <p className="mb-6 max-w-sm text-sm text-slate-400">
            Drag & drop your image here, or{' '}
            <button
              onClick={onButtonClick}
              type="button"
              className="font-semibold text-brand-400 hover:text-brand-300 hover:underline focus:outline-none"
            >
              browse from device
            </button>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 font-medium">
            <span className="flex items-center space-x-1.5 rounded-full bg-slate-900 border border-dark-cardBorder px-3 py-1">
              <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
              <span>JPG, PNG, WEBP</span>
            </span>
            <span className="rounded-full bg-slate-900 border border-dark-cardBorder px-3 py-1">
              Up to 15MB
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center space-x-2.5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
