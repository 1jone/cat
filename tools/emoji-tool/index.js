/**
 * Twemoji 下载和精灵图生成工具
 *
 * 功能：
 * 1. 从 Twemoji CDN 下载指定的 emoji PNG
 * 2. 合成为单张精灵图 (sprite sheet)
 * 3. 生成配套的 JSON 映射文件
 *
 * 使用方法：
 *   cd tools/emoji-tool
 *   npm install
 *   node index.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');
const { EMOJIS, CONFIG } = require('./config');

const outputDir = path.resolve(__dirname, CONFIG.outputDir);
const tempDir = path.resolve(__dirname, 'temp');

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${url} (status: ${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function downloadEmojis() {
  console.log('📥 Downloading Twemoji images...\n');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const downloadedFiles = [];

  for (const item of EMOJIS) {
    const url = `${CONFIG.cdnBase}${item.codepoint}.png`;
    const destPath = path.join(tempDir, `${item.key}.png`);

    try {
      await downloadFile(url, destPath);
      console.log(`  ✓ ${item.emoji} ${item.key} -> ${item.codepoint}.png`);
      downloadedFiles.push({ key: item.key, path: destPath });
    } catch (err) {
      console.error(`  ✗ ${item.emoji} ${item.key} - Error: ${err.message}`);
    }
  }

  console.log(`\n✅ Downloaded ${downloadedFiles.length}/${EMOJIS.length} emojis\n`);
  return downloadedFiles;
}

async function generateSpriteSheet(files) {
  console.log('🎨 Generating sprite sheet...\n');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const size = CONFIG.spriteSize;
  const columns = files.length;
  const width = columns * size;
  const height = size;

  const compositeInputs = [];
  const frames = {};

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const x = i * size;

    compositeInputs.push({
      input: file.path,
      left: x,
      top: 0,
    });

    frames[file.key] = { x, y: 0 };
    console.log(`  ${file.key}: (${x}, 0)`);
  }

  const spriteBuffer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(compositeInputs)
    .png()
    .toBuffer();

  const spritePath = path.join(outputDir, CONFIG.spriteImage);
  fs.writeFileSync(spritePath, spriteBuffer);
  console.log(`\n  📄 Sprite saved: ${spritePath}`);

  const spriteData = {
    image: CONFIG.spriteImage,
    size,
    width,
    height,
    frames,
  };

  const jsonPath = path.join(outputDir, CONFIG.spriteJson);
  fs.writeFileSync(jsonPath, JSON.stringify(spriteData, null, 2));
  console.log(`  📄 JSON saved: ${jsonPath}`);

  console.log('\n✅ Sprite sheet generated successfully!\n');
  return spriteData;
}

function cleanup() {
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      fs.unlinkSync(path.join(tempDir, file));
    }
    fs.rmdirSync(tempDir);
    console.log('🧹 Cleaned up temporary files\n');
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Twemoji Sprite Sheet Generator       ║');
  console.log('║   Emoji by Twitter (CC-BY 4.0)         ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    const files = await downloadEmojis();

    if (files.length === 0) {
      console.error('❌ No emojis were downloaded. Exiting.');
      process.exit(1);
    }

    await generateSpriteSheet(files);
    cleanup();

    console.log('🎉 All done! Your emoji sprite sheet is ready.\n');
    console.log(`   Sprite: assets/emoji/${CONFIG.spriteImage}`);
    console.log(`   Config: assets/emoji/${CONFIG.spriteJson}\n`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
