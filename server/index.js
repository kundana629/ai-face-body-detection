import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { processImage } from './utils/imageProcessor.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Set up temporary directories
const UPLOADS_DIR = path.resolve('uploads');
const OUTPUTS_DIR = path.resolve('outputs');

[UPLOADS_DIR, OUTPUTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure Multer for local temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only images (.jpg, .jpeg, .png, .webp) are supported!'));
    }
  }
});

// Static folder serving for development testing
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/outputs', express.static(OUTPUTS_DIR));

// Serve production static React bundle if it exists
const DIST_DIR = path.resolve('dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

// 1. Basic Health Check Endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'running', service: 'SmartCrop AI Engine' });
});

// 2. Upload Endpoint for batch files
app.post('/api/upload', upload.array('images', 20), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const uploadedFiles = req.files.map(file => ({
      id: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`,
      path: file.path,
      size: file.size
    }));

    res.json({ files: uploadedFiles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Batch Intelligent Cropping & Zip Download Endpoint
app.post('/api/batch-crop', async (req, res) => {
  const { batchItems, globalOptions } = req.body;
  
  if (!batchItems || !Array.isArray(batchItems) || batchItems.length === 0) {
    return res.status(400).json({ error: 'No images specified for batch processing.' });
  }

  const batchId = `batch-${Date.now()}`;
  const batchOutputDir = path.join(OUTPUTS_DIR, batchId);
  fs.mkdirSync(batchOutputDir, { recursive: true });

  const processedFiles = [];

  try {
    // Process each image file in parallel
    await Promise.all(batchItems.map(async (item) => {
      const { filename, faces, options = {} } = item;
      const inputPath = path.join(UPLOADS_DIR, filename);
      const outputFilename = `crop-${filename}`;
      const outputPath = path.join(batchOutputDir, outputFilename);

      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${filename}`);
      }

      // Merge global options with per-image overrides
      const cropOptions = {
        targetRatio: options.targetRatio || globalOptions?.targetRatio || 1.0,
        faces: faces || [],
        padding: options.padding !== undefined ? options.padding : (globalOptions?.padding !== undefined ? globalOptions.padding : 0.5),
        zoom: options.zoom !== undefined ? options.zoom : (globalOptions?.zoom !== undefined ? globalOptions.zoom : 1.0),
        shiftX: options.shiftX !== undefined ? options.shiftX : (globalOptions?.shiftX !== undefined ? globalOptions.shiftX : 0),
        shiftY: options.shiftY !== undefined ? options.shiftY : (globalOptions?.shiftY !== undefined ? globalOptions.shiftY : 0),
        blurBackground: options.blurBackground !== undefined ? options.blurBackground : (globalOptions?.blurBackground !== undefined ? globalOptions.blurBackground : true),
        blurStrength: options.blurStrength !== undefined ? options.blurStrength : (globalOptions?.blurStrength !== undefined ? globalOptions.blurStrength : 20)
      };

      await processImage(inputPath, outputPath, cropOptions);

      processedFiles.push({
        originalName: filename,
        outputFilename,
        path: outputPath
      });
    }));

    // Create a zip archive of all cropped files
    const zipFilename = `smartcrop-${Date.now()}.zip`;
    const zipPath = path.join(OUTPUTS_DIR, zipFilename);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    processedFiles.forEach(file => {
      archive.file(file.path, { name: file.outputFilename });
    });

    await archive.finalize();

    // Set headers and send file
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);

    // Wait until download completes, then clean up this batch session
    res.download(zipPath, zipFilename, (err) => {
      // Clean up async after sending to prevent blocking
      setTimeout(() => {
        try {
          // Remove processed output files & directory
          fs.rmSync(batchOutputDir, { recursive: true, force: true });
          
          // Remove zip file
          if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
          }

          // Optionally delete the temporary uploads involved
          batchItems.forEach(item => {
            const uploadFilePath = path.join(UPLOADS_DIR, item.filename);
            if (fs.existsSync(uploadFilePath)) {
              fs.unlinkSync(uploadFilePath);
            }
          });
        } catch (cleanupErr) {
          console.error('Cleanup Error during batch process:', cleanupErr);
        }
      }, 5000);
    });

  } catch (error) {
    console.error('Batch Crop Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Wildcard SPA route fallback for client-side routing in production
if (fs.existsSync(DIST_DIR)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Start Express Server
app.listen(PORT, () => {
  console.log(`SmartCrop AI Backend running on port ${PORT}`);
});
