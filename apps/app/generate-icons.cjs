const pngToIco = require('png-to-ico').default || require('png-to-ico');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'src-tauri', 'icons');
const outputFile = path.join(iconsDir, 'icon.ico');

// Use multiple PNG sizes for the ICO file (Windows needs various sizes)
const pngFiles = [
  path.join(iconsDir, '32x32.png'),
  path.join(iconsDir, '128x128.png'),
  path.join(iconsDir, '128x128@2x.png'),
  path.join(iconsDir, 'icon-512.png')
];

async function generateIco() {
  try {
    console.log('Generating ICO file from PNG images...');
    const buf = await pngToIco(pngFiles);

    fs.writeFileSync(outputFile, buf);
    console.log(`✓ Successfully generated ${outputFile}`);
  } catch (err) {
    console.error('Error generating ICO file:', err);
    process.exit(1);
  }
}

generateIco();
