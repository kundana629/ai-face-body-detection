# SmartCrop AI - Intelligent Face-Centered Auto-Framing & Resizing Engine

SmartCrop AI is a high-performance, premium web application designed to intelligently crop, resize, and auto-frame images by recognizing human faces using computer vision. It is styled in a sleek, obsidian dark-mode dashboard and supports real-time single photo fine-tuning as well as high-performance batch image processing (yielding ZIP downloads).

---

## Key Features

1. **Local Real-Time Face Detection**: Utilizes `@vladmandic/face-api` (powered by TensorFlow.js WASM and WebGL acceleration) directly in the browser. Zero server lag, absolute data privacy.
2. **Facial Landmarks Visualization**: Draws bounding box reticles and plots a 68-point facial landmark topology (eyes, nose, mouth, jawline) with futuristic overlay grids.
3. **Multi-Ratio Framing presets**:
   - `1:1 Square` (Instagram posts / avatars)
   - `16:9 Wide` (YouTube thumbnails / cinematic banners)
   - `9:16 Story` (TikTok, Reels, YouTube Shorts)
   - `4:3 Standard` (Classic portrait and camera dimensions)
4. **Smart Blur Expand (Premium Out-of-bounds Framing)**: If fitting the subject inside a specific aspect ratio extends the crop box outside the image boundaries, the engine fills the blank space with a beautiful, blurred, scaled backdrop of the original image, ensuring the subject is perfectly centered without clipping.
5. **Interactive Controls Sidebar**: Real-time slider fine-tuning for Face Padding margins, Auto-Zoom scales, Horizontal/Vertical framing offsets, and Background Blur strength.
6. **High-Performance Batch Processing**: Upload multiple files, let the browser analyze faces concurrently, upload to the server, and download a compiled `.zip` containing all perfectly cropped outputs within milliseconds.

---

## Technical Architecture

- **Frontend**: Vite + React + Tailwind CSS v3 + Lucide Icons.
- **Client AI**: `@vladmandic/face-api` + WebGL TF.js.
- **Backend**: Node.js + Express + Multer + Archiver.
- **Backend Image Processor**: High-performance C++ `Sharp` binding for fast file crops, padding, and blur layers.

---

## Project Structure

```
ai-smart-crop/
├── package.json                   # Setup scripts & concurrent dev execution
├── tailwind.config.js             # Customized Obsidian-dark HSL design tokens
├── postcss.config.js
├── scripts/
│   └── download-models.js         # Auto-downloads face-api.js weights locally
├── public/
│   └── models/                    # Locally stored face detection networks
├── src/                           # Frontend React modules
│   ├── main.jsx
│   ├── index.css                  # Background grids, glassmorphism, scanlines
│   ├── App.jsx                    # Central workbench state
│   ├── components/
│   │   ├── Header.jsx             # Obsidian header & connection tags
│   │   ├── DragDropZone.jsx       # Interactive drag upload zone
│   │   ├── PreviewWorkspace.jsx   # Side-by-side visualization & overlay SVG
│   │   ├── ControlSidebar.jsx     # Ratio cards and manual sliders
│   │   └── BatchProcessor.jsx     # Batch queue, file list, and zip downloading
│   └── utils/
│       ├── faceDetector.js        # face-api loading & scanning wrappers
│       └── cropEngine.js          # Hardware accelerated HTML5 Canvas crop engine
└── server/                        # Express Backend
    ├── index.js                   # REST API routes for uploading, cropping, & zipping
    └── utils/
        └── imageProcessor.js      # Server-side Sharp-based smart crop operations
```

---

## Setup & Running Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Installation & Model Downloader
Open a terminal in the project directory `C:\Users\kunda\.gemini\antigravity\scratch\ai-smart-crop` and run the setup command. This will automatically install dependencies and download the face-api models into the public folder:

```bash
npm run setup
```

### 2. Start Development Servers
Run the following command to start both the Vite React Frontend (port 3000) and the Express Backend (port 5000) simultaneously with live reloading:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Deployment Steps

### Frontend Deployment (Netlify or Vercel)
You can deploy the React app as a static frontend to Vercel or Netlify.
1. Connect your Github repository.
2. Configure **Build Settings**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
3. Add a redirection rule for routing if needed (e.g., `netlify.toml` or `vercel.json` with a rewrite rule).

### Backend Deployment (Render or Heroku)
Deploy the Node.js backend to Render:
1. Connect your repository to a **Web Service** on Render.
2. Set environment settings:
   - Build Command: `npm install`
   - Start Command: `node server/index.js`
3. Set environment variable `PORT` if required.
4. Point your Frontend production bundle API endpoint to the Render Web Service URL.
