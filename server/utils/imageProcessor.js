import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Intelligent crop helper using sharp on the backend.
 * Handles centering on faces, cropping, aspect ratios, and smart background blur overflow.
 * 
 * @param {string} inputPath - Absolute path to input image file
 * @param {string} outputPath - Absolute path to output cropped image file
 * @param {Object} options - Cropping parameters
 * @param {number} options.targetRatio - Target aspect ratio (width/height)
 * @param {Array} options.faces - Array of face bounding boxes (relative coordinates, 0 to 1)
 * @param {number} options.padding - Padding around faces (0 to 2)
 * @param {number} options.zoom - Zoom factor (0.5 to 3)
 * @param {number} options.shiftX - Manual horizontal shift adjustment (-0.5 to 0.5)
 * @param {number} options.shiftY - Manual vertical shift adjustment (-0.5 to 0.5)
 * @param {boolean} options.blurBackground - Whether to use background blur for overflow
 * @param {number} options.blurStrength - Strength of the blur effect (1 to 100)
 */
export async function processImage(inputPath, outputPath, options = {}) {
  const {
    targetRatio = 1.0,
    faces = [],
    padding = 0.5,
    zoom = 1.0,
    shiftX = 0,
    shiftY = 0,
    blurBackground = true,
    blurStrength = 20
  } = options;

  // 1. Get original image metadata
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  // 2. Compute face union bounds (in absolute pixel coordinates)
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
    // Fallback to center if no faces detected
    facesW = 0;
    facesH = 0;
    centerX = width / 2;
    centerY = height / 2;
  }

  // 3. Apply manual shifts
  centerX += shiftX * width;
  centerY += shiftY * height;

  // 4. Compute crop dimensions to fit target aspect ratio
  // Add padding around detected faces
  const padX = facesW * padding;
  const padY = facesH * padding;
  const targetW = Math.max(100, facesW + padX * 2);
  const targetH = Math.max(100, facesH + padY * 2);

  let cropW, cropH;
  if (targetW / targetH > targetRatio) {
    // Face box is wider than target aspect ratio - make crop box taller to fit
    cropH = targetW / targetRatio;
    cropW = targetW;
  } else {
    // Face box is taller than target aspect ratio - make crop box wider to fit
    cropW = targetH * targetRatio;
    cropH = targetH;
  }

  // Apply manual zoom (smaller crop box = zoomed in)
  cropW = cropW / zoom;
  cropH = cropH / zoom;

  // Final pixel bounds (can go outside original image borders)
  let left = Math.round(centerX - cropW / 2);
  let top = Math.round(centerY - cropH / 2);
  let w = Math.round(cropW);
  let h = Math.round(cropH);

  // Check if we need to expand beyond borders
  const isOutOfBounds = left < 0 || top < 0 || (left + w) > width || (top + h) > height;

  if (!blurBackground || !isOutOfBounds) {
    // Mode A: Clamp to borders (standard fit-in)
    // Clamp dimensions to original image
    w = Math.min(width, w);
    h = Math.min(height, h);

    // If cropped area is clamped, adjust crop aspect ratio slightly to keep it correct
    const clampedRatio = w / h;
    if (Math.abs(clampedRatio - targetRatio) > 0.01) {
      if (clampedRatio > targetRatio) {
        w = Math.round(h * targetRatio);
      } else {
        h = Math.round(w / targetRatio);
      }
    }

    // Clamp coordinates inside image boundary
    left = Math.max(0, Math.min(width - w, left));
    top = Math.max(0, Math.min(height - h, top));

    await sharp(inputPath)
      .extract({ left, top, width: w, height: h })
      .toFile(outputPath);
  } else {
    // Mode B: Smart Blur Expand (premium background blur frame)
    // 1. Generate blurred background at exact output dimensions (w x h)
    // We cover the canvas, blur it, and use that as base layer
    const bgBuffer = await sharp(inputPath)
      .resize(w, h, { fit: 'cover' })
      .blur(Math.max(1, Math.min(100, blurStrength)))
      .png()
      .toBuffer();

    // 2. Extract valid inner part from original image
    const validLeft = Math.max(0, left);
    const validTop = Math.max(0, top);
    const validRight = Math.min(width, left + w);
    const validBottom = Math.min(height, top + h);

    const validW = validRight - validLeft;
    const validH = validBottom - validTop;

    if (validW > 0 && validH > 0) {
      const overlayBuffer = await sharp(inputPath)
        .extract({ left: validLeft, top: validTop, width: validW, height: validH })
        .png()
        .toBuffer();

      // 3. Composite the real cropped image on top of the blurred background
      // The offset relative to background is:
      const compositeX = validLeft - left;
      const compositeY = validTop - top;

      await sharp(bgBuffer)
        .composite([{
          input: overlayBuffer,
          left: compositeX,
          top: compositeY
        }])
        .toFile(outputPath);
    } else {
      // Fallback: If no valid content, just write blurred background
      await sharp(bgBuffer).toFile(outputPath);
    }
  }
}
