import fs from 'fs';
import path from 'path';
import https from 'https';

const MODELS_DIR = path.resolve('public', 'models');
const BASE_URL = 'https://cdn.jsdelivr.net/gh/cstef/face-api.js-models@master/';

const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2'
];

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

console.log('Starting face-api.js models download...');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: HTTP Status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function main() {
  for (const filename of files) {
    const fileUrl = `${BASE_URL}${filename}`;
    const destPath = path.join(MODELS_DIR, filename);
    
    console.log(`Downloading ${filename}...`);
    try {
      await downloadFile(fileUrl, destPath);
      console.log(`Successfully downloaded ${filename}`);
    } catch (err) {
      console.error(`Error downloading ${filename}:`, err.message);
    }
  }
  console.log('All models downloaded successfully!');
}

main().catch(console.error);
