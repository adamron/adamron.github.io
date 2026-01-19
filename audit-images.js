const fs = require('fs');
const path = require('path');

const animalsFile = '/Users/adamron/dev/personal-site/tools/animal-explorer/animals.js';
const imagesDir = '/Users/adamron/dev/personal-site/tools/animal-explorer/images';

const content = fs.readFileSync(animalsFile, 'utf8');
// Extract the animals array
const animalsMatch = content.match(/const animals = (\[[\s\S]*\]);/);
if (!animalsMatch) {
  console.error('Could not find animals array');
  process.exit(1);
}

// We can't easily eval because of possible dependencies, but let's try a simple approach
// We'll just extract the image paths using regex for now.
const imagePaths = [];
const imageRegex = /image: '(images\/[^']+)'/g;
let match;
while ((match = imageRegex.exec(content)) !== null) {
  imagePaths.push(match[1]);
}

const missing = [];
const multiCandidates = {};

imagePaths.forEach(imgPath => {
  const fullPath = path.join('/Users/adamron/dev/personal-site/tools/animal-explorer', imgPath);
  if (!fs.existsSync(fullPath)) {
    missing.push(imgPath);
    
    // Check for candidates like name-1.jpg
    const basename = path.basename(imgPath, path.extname(imgPath));
    const potentialFiles = fs.readdirSync(imagesDir).filter(f => f.startsWith(`${basename}-`));
    if (potentialFiles.length > 0) {
      multiCandidates[imgPath] = potentialFiles;
    }
  }
});

console.log('Missing images:');
console.log(JSON.stringify(missing, null, 2));
console.log('\nAnimals with multiple candidates but no primary:');
console.log(JSON.stringify(multiCandidates, null, 2));
