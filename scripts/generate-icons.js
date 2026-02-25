const fs = require('node:fs')
const path = require('node:path')
const sharp = require('sharp')

const rootDir = path.join(__dirname, '..')
const inputPath = path.join(rootDir, 'resource/logo.png')
const webPublicDir = path.join(rootDir, 'apps/web/public')
const tauriIconsDir = path.join(rootDir, 'apps/app/src-tauri/icons')

async function convertIcons() {
  const logo = sharp(inputPath)

  // Web icons
  console.log('Generating web icons...')

  // Favicon - use PNG format (modern browsers prefer PNG favicon)
  await logo.clone()
    .resize(32, 32)
    .png()
    .toFile(path.join(webPublicDir, 'favicon.png'))
  // Also create favicon.ico as a symlink or copy for older browsers
  await logo.clone()
    .resize(32, 32)
    .png()
    .toFile(path.join(webPublicDir, 'favicon.ico'))
  console.log('  favicon.png, favicon.ico')

  // Apple touch icon (180x180)
  await logo.clone()
    .resize(180, 180)
    .png()
    .toFile(path.join(webPublicDir, 'apple-touch-icon.png'))
  console.log('  apple-touch-icon.png')

  // Android Chrome icons
  await logo.clone()
    .resize(192, 192)
    .png()
    .toFile(path.join(webPublicDir, 'android-chrome-192x192.png'))
  console.log('  android-chrome-192x192.png')

  await logo.clone()
    .resize(512, 512)
    .png()
    .toFile(path.join(webPublicDir, 'android-chrome-512x512.png'))
  console.log('  android-chrome-512x512.png')

  // Tauri icons
  console.log('Generating Tauri icons...')

  // 32x32
  await logo.clone()
    .resize(32, 32)
    .png()
    .toFile(path.join(tauriIconsDir, '32x32.png'))
  console.log('  32x32.png')

  // 128x128
  await logo.clone()
    .resize(128, 128)
    .png()
    .toFile(path.join(tauriIconsDir, '128x128.png'))
  console.log('  128x128.png')

  // 128x128@2x (256x256)
  await logo.clone()
    .resize(256, 256)
    .png()
    .toFile(path.join(tauriIconsDir, '128x128@2x.png'))
  console.log('  128x128@2x.png')

  // Generate ICO file (Windows) - use 256x256 as base
  await logo.clone()
    .resize(256, 256)
    .png()
    .toFile(path.join(tauriIconsDir, 'icon.ico'))
  console.log('  icon.ico')

  // For macOS ICNS, we need to create a proper ICNS file
  // Create a 512x512 PNG first, then convert
  const icon512Path = path.join(tauriIconsDir, 'icon-512.png')
  await logo.clone()
    .resize(512, 512)
    .png()
    .toFile(icon512Path)
  console.log('  icon-512.png (for ICNS)')

  console.log('\nDone! Note: For macOS ICNS, you may need to use iconutil on macOS:')
  console.log('  mkdir -p icons.iconset')
  console.log('  sips -z 16 16 icon.png --out icons.iconset/icon_16x16.png')
  console.log('  sips -z 32 32 icon.png --out icons.iconset/icon_16x16@2x.png')
  console.log('  ...')
  console.log('  iconutil -c icns icons.iconset -o icon.icns')
}

convertIcons().catch(console.error)
