#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCRIPT_DIR = __dirname;
const IMAGES_DIR = path.join(SCRIPT_DIR, 'images');
const SOUNDS_DIR = path.join(SCRIPT_DIR, 'sounds');

// Ensure directories exist
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
if (!fs.existsSync(SOUNDS_DIR)) fs.mkdirSync(SOUNDS_DIR, { recursive: true });

const USER_AGENT = 'AnimalExplorer/1.0 (personal project; https://github.com)';

async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

async function downloadFile(url, destPath) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

function convertToMp3(inputPath, outputPath, maxDuration = 5) {
  // Convert audio to mp3, limited to maxDuration seconds
  try {
    execSync(
      `ffmpeg -y -i "${inputPath}" -t ${maxDuration} -codec:a libmp3lame -q:a 4 "${outputPath}"`,
      { stdio: 'pipe' }
    );
    return true;
  } catch (err) {
    console.error(`  ffmpeg error: ${err.message}`);
    return false;
  }
}

async function getWikipediaImageUrl(filename) {
  // Get the actual file URL from Wikipedia
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
  const data = await fetchJSON(url);
  const pages = data.query.pages;
  const page = Object.values(pages)[0];
  if (page.imageinfo && page.imageinfo[0]) {
    return page.imageinfo[0].url;
  }
  return null;
}

async function fetchAnimalData(animalName) {
  console.log(`\nFetching data for: ${animalName}`);

  const safeName = animalName.toLowerCase().replace(/\s+/g, '-');
  const result = {
    name: animalName,
    image: null,
    sound: null
  };

  try {
    // Fetch Wikipedia page content
    const parseUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(animalName)}&format=json&prop=text|images`;
    const parseData = await fetchJSON(parseUrl);

    if (parseData.error) {
      console.error(`  Wikipedia page not found: ${animalName}`);
      return result;
    }

    const html = parseData.parse.text['*'];
    const images = parseData.parse.images || [];

    // Find all images (filter out icons, flags, maps, etc.)
    const imageFiles = images.filter(img =>
      /\.(jpg|jpeg|png)$/i.test(img) &&
      !img.toLowerCase().includes('icon') &&
      !img.toLowerCase().includes('flag') &&
      !img.toLowerCase().includes('map') &&
      !img.toLowerCase().includes('logo') &&
      !img.toLowerCase().includes('symbol') &&
      !img.toLowerCase().includes('range') &&
      !img.toLowerCase().includes('distribution')
    );

    if (imageFiles.length > 0) {
      const maxImages = 10;
      const imagesToFetch = imageFiles.slice(0, maxImages);
      console.log(`  Found ${imageFiles.length} images (fetching first ${imagesToFetch.length})`);
      result.images = [];

      for (let i = 0; i < imagesToFetch.length; i++) {
        const imageFile = imagesToFetch[i];
        const imageUrl = await getWikipediaImageUrl(imageFile);
        if (imageUrl) {
          const ext = path.extname(imageFile).toLowerCase() || '.jpg';
          const filename = imagesToFetch.length === 1
            ? `${safeName}${ext}`
            : `${safeName}-${i + 1}${ext}`;
          const destPath = path.join(IMAGES_DIR, filename);

          console.log(`  Downloading [${i + 1}/${imagesToFetch.length}]: ${imageFile}`);
          try {
            await downloadFile(imageUrl, destPath);
            result.images.push(`images/${filename}`);
          } catch (err) {
            console.log(`    Failed: ${err.message}`);
          }
        }
      }

      // Set first image as the main one
      if (result.images.length > 0) {
        result.image = result.images[0];
        console.log(`  Saved ${result.images.length} images`);
      }
    } else {
      console.log(`  No suitable images found`);
    }

    // Find audio files
    const audioFiles = images.filter(img => /\.(ogg|mp3|wav|oga)$/i.test(img));

    // Also search HTML for audio files that might not be in images array
    const audioRegex = /File:([^"|\]]+\.(ogg|mp3|wav|oga))/gi;
    let match;
    while ((match = audioRegex.exec(html)) !== null) {
      const filename = match[1];
      if (!audioFiles.includes(filename)) {
        audioFiles.push(filename);
      }
    }

    if (audioFiles.length > 0) {
      // Prefer files that seem to be animal sounds
      const soundFile = audioFiles.find(f =>
        f.toLowerCase().includes('call') ||
        f.toLowerCase().includes('song') ||
        f.toLowerCase().includes('sound') ||
        f.toLowerCase().includes(animalName.toLowerCase())
      ) || audioFiles[0];

      console.log(`  Found audio: ${soundFile}`);

      const audioUrl = await getWikipediaImageUrl(soundFile);
      if (audioUrl) {
        const ext = path.extname(soundFile).toLowerCase();
        const tempPath = path.join(SOUNDS_DIR, `${safeName}_temp${ext}`);
        const destPath = path.join(SOUNDS_DIR, `${safeName}.mp3`);

        console.log(`  Downloading audio...`);
        await downloadFile(audioUrl, tempPath);

        console.log(`  Converting to mp3 (max 5 seconds)...`);
        if (convertToMp3(tempPath, destPath)) {
          result.sound = `sounds/${safeName}.mp3`;
          console.log(`  Saved: ${result.sound}`);
        }

        // Clean up temp file
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    } else {
      console.log(`  No audio files found`);
    }

  } catch (err) {
    console.error(`  Error: ${err.message}`);
  }

  return result;
}

async function main() {
  const animals = process.argv.slice(2);

  if (animals.length === 0) {
    console.log('Usage: node fetch-animal.js "Animal1" "Animal2" ...');
    console.log('Example: node fetch-animal.js "Tiger" "Elephant" "Wolf"');
    process.exit(1);
  }

  const results = [];

  for (const animal of animals) {
    const data = await fetchAnimalData(animal);
    results.push(data);
  }

  console.log('\n--- Results ---\n');

  // Output metadata for each animal
  for (const r of results) {
    console.log(`${r.name}:`);
    if (r.images && r.images.length > 0) {
      console.log(`  Images (${r.images.length}):`);
      r.images.forEach(img => console.log(`    - ${img}`));
    } else {
      console.log(`  Images: not found`);
    }
    console.log(`  Sound: ${r.sound || 'not found'}`);
  }

  // Output JS snippet for animals array
  console.log('\n--- JS Snippet (copy to animals array) ---\n');
  for (const r of results) {
    if (r.image) {
      console.log(`{
  name: '${r.name}',
  image: '${r.image}',${r.sound ? `\n  sound: '${r.sound}',` : ''}
  tags: {
    biome: '',
    geography: '',
    class: '',
    diet: '',
    conservation: ''
  }
},`);
    }
  }
}

main();
