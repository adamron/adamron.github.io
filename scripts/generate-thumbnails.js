const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../tools/animal-explorer/images');
const thumbsDir = path.join(imagesDir, 'thumbs');

if (!fs.existsSync(thumbsDir)) {
  fs.mkdirSync(thumbsDir, { recursive: true });
}

const imageFiles = fs.readdirSync(imagesDir)
  .filter(f => /\.(jpg|jpeg|png)$/i.test(f) && !fs.statSync(path.join(imagesDir, f)).isDirectory());

console.log(`Found ${imageFiles.length} images to process`);

async function generateThumbnails() {
  for (const file of imageFiles) {
    const inputPath = path.join(imagesDir, file);
    const outputName = file.replace(/\.[^.]+$/, '.jpg');
    const outputPath = path.join(thumbsDir, outputName);

    try {
      await sharp(inputPath)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
      console.log(`Generated: ${outputName}`);
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }
  console.log('Done!');
}

generateThumbnails();
