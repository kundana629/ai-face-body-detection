import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

/**
 * Loads face-api.js models from the locally hosted /models folder.
 * Uses both Tiny Face Detector and SSD Mobilenet v1 for user preference,
 * along with 68-point facial landmarks.
 */
export async function loadFaceDetectionModels(onProgress = () => {}) {
  if (modelsLoaded) return true;

  try {
    onProgress('Loading tiny face detector...');
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    
    onProgress('Loading SSD Mobilenet detector...');
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    
    onProgress('Loading facial landmarks...');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');

    modelsLoaded = true;
    onProgress('All models loaded!');
    return true;
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    onProgress('Error loading models. Check console.');
    throw error;
  }
}

/**
 * Detects faces in an HTML image element.
 * 
 * @param {HTMLImageElement} imgElement - Loaded HTML image element
 * @param {Object} options
 * @param {string} options.detectorType - 'tiny' or 'ssd'
 * @param {number} options.scoreThreshold - Minimum confidence score (0.1 to 0.9)
 * @returns {Promise<Array>} List of detected face details, relative bounding boxes, and landmarks
 */
export async function detectFacesInImage(imgElement, options = {}) {
  const { detectorType = 'tiny', scoreThreshold = 0.5 } = options;

  if (!modelsLoaded) {
    await loadFaceDetectionModels();
  }

  // Define detector based on type
  const detector = detectorType === 'tiny' 
    ? new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold })
    : new faceapi.SsdMobilenetv1Options({ minConfidence: scoreThreshold });

  // Perform detection with landmarks
  const detections = await faceapi
    .detectAllFaces(imgElement, detector)
    .withFaceLandmarks();

  // Convert to clean relative parameters (independent of display layout sizing)
  const naturalWidth = imgElement.naturalWidth;
  const naturalHeight = imgElement.naturalHeight;

  return detections.map((det) => {
    const box = det.detection.box;
    
    // Relative bounding box
    const relativeBox = {
      x: box.x / naturalWidth,
      y: box.y / naturalHeight,
      width: box.width / naturalWidth,
      height: box.height / naturalHeight
    };

    // Absolute points for local rendering overlays
    const absoluteBox = {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height
    };

    // Landmarks points
    const landmarks = det.landmarks.positions.map(p => ({
      x: p.x,
      y: p.y,
      relX: p.x / naturalWidth,
      relY: p.y / naturalHeight
    }));

    // Facial feature groupings
    const jaw = det.landmarks.getJawOutline().map(p => ({ x: p.x, y: p.y }));
    const leftEye = det.landmarks.getLeftEye().map(p => ({ x: p.x, y: p.y }));
    const rightEye = det.landmarks.getRightEye().map(p => ({ x: p.x, y: p.y }));
    const nose = det.landmarks.getNose().map(p => ({ x: p.x, y: p.y }));
    const mouth = det.landmarks.getMouth().map(p => ({ x: p.x, y: p.y }));

    return {
      relativeBox,
      absoluteBox,
      score: det.detection.score,
      landmarks,
      features: { jaw, leftEye, rightEye, nose, mouth }
    };
  });
}
