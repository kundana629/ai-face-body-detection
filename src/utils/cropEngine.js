/**
 * Computes the crop coordinates based on face boxes and parameters.
 * Same mathematical model as the server-side Sharp processor.
 */
export function calculateCropBox(width, height, faces, options = {}) {
  const {
    targetRatio = 1.0,
    padding = 0.5,
    zoom = 1.0,
    shiftX = 0,
    shiftY = 0
  } = options;

  let centerX, centerY, facesW, facesH;

  if (faces && faces.length > 0) {
    const minX = Math.min(...faces.map(f => f.x)) * width;
    const maxX = Math.max(...faces.map(f => f.x + f.width)) * width;
    const minY = Math.min(...faces.map(f => f.y)) * height;
    const maxY = Math.max(...faces.map(f => f.y + f.height)) * height;

    facesW = maxX - minX;
    facesH = maxY - minY;
    centerX = minX + facesW / 2;
    centerY = minY + facesH / 2;
  } else {
    facesW = 0;
    facesH = 0;
    centerX = width / 2;
    centerY = height / 2;
  }

  // Apply manual shifts
  centerX += shiftX * width;
  centerY += shiftY * height;

  // Add padding
  const padX = facesW * padding;
  const padY = facesH * padding;
  const targetW = Math.max(100, facesW + padX * 2);
  const targetH = Math.max(100, facesH + padY * 2);

  let cropW, cropH;
  if (targetW / targetH > targetRatio) {
    cropH = targetW / targetRatio;
    cropW = targetW;
  } else {
    cropW = targetH * targetRatio;
    cropH = targetH;
  }

  // Apply manual zoom
  cropW = cropW / zoom;
  cropH = cropH / zoom;

  const left = Math.round(centerX - cropW / 2);
  const top = Math.round(centerY - cropH / 2);
  const w = Math.round(cropW);
  const h = Math.round(cropH);

  return { left, top, w, h, centerX, centerY };
}

/**
 * Crops an HTML image element on a canvas and returns the cropped image data URL.
 * Supports smart crop padding, aspect ratio centering, and background blur frames.
 * 
 * @param {HTMLImageElement} img - Loaded image element
 * @param {Array} faces - Array of relative face bounding boxes
 * @param {Object} options - Cropping parameters
 * @returns {string} Cropped image Data URL
 */
export function cropImageOnCanvas(img, faces, options = {}) {
  const {
    targetRatio = 1.0,
    padding = 0.5,
    zoom = 1.0,
    shiftX = 0,
    shiftY = 0,
    blurBackground = true,
    blurStrength = 20
  } = options;

  const width = img.naturalWidth;
  const height = img.naturalHeight;

  // Calculate coordinates
  let { left, top, w, h } = calculateCropBox(width, height, faces, {
    targetRatio,
    padding,
    zoom,
    shiftX,
    shiftY
  });

  const isOutOfBounds = left < 0 || top < 0 || (left + w) > width || (top + h) > height;

  // Create canvas for rendering
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!blurBackground || !isOutOfBounds) {
    // Mode A: Clamp/Fit & Clip (Stay strictly inside image boundary)
    w = Math.min(width, w);
    h = Math.min(height, h);

    // Keep aspect ratio correct under clamps
    const clampedRatio = w / h;
    if (Math.abs(clampedRatio - targetRatio) > 0.01) {
      if (clampedRatio > targetRatio) {
        w = Math.round(h * targetRatio);
      } else {
        h = Math.round(w / targetRatio);
      }
    }

    left = Math.max(0, Math.min(width - w, left));
    top = Math.max(0, Math.min(height - h, top));

    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(img, left, top, w, h, 0, 0, w, h);
  } else {
    // Mode B: Smart Blur Expand
    canvas.width = w;
    canvas.height = h;

    // 1. Draw blurred background covering entire canvas
    // Canvas fit cover algorithm:
    const imgRatio = width / height;
    const canvasRatio = w / h;
    let bgW, bgH, bgX, bgY;

    if (imgRatio > canvasRatio) {
      bgH = h;
      bgW = h * imgRatio;
      bgX = (w - bgW) / 2;
      bgY = 0;
    } else {
      bgW = w;
      bgH = w / imgRatio;
      bgX = 0;
      bgY = (h - bgH) / 2;
    }

    // Apply native browser canvas filter blur
    ctx.filter = `blur(${Math.max(1, blurStrength)}px)`;
    ctx.drawImage(img, bgX, bgY, bgW, bgH);
    ctx.filter = 'none'; // reset filter for standard drawing

    // Apply dark semi-transparent overlay to background for elegant contrast
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw cropped original image centered on top
    const validLeft = Math.max(0, left);
    const validTop = Math.max(0, top);
    const validRight = Math.min(width, left + w);
    const validBottom = Math.min(height, top + h);

    const validW = validRight - validLeft;
    const validH = validBottom - validTop;

    if (validW > 0 && validH > 0) {
      const destX = validLeft - left;
      const destY = validTop - top;

      ctx.drawImage(img, validLeft, validTop, validW, validH, destX, destY, validW, validH);
    }
  }

  return canvas.toDataURL('image/png');
}
