const fs = require('node:fs')
const path = require('node:path')
const sharp = require('sharp')

const logoPath = path.join(__dirname, '..', '..', 'resource', 'logo.png')

// Android icon sizes
const androidIcons = [
  { name: 'mipmap-mdpi/ic_launcher.png', size: 48 },
  { name: 'mipmap-mdpi/ic_launcher_round.png', size: 48 },
  { name: 'mipmap-mdpi/ic_launcher_foreground.png', size: 108 },
  { name: 'mipmap-hdpi/ic_launcher.png', size: 72 },
  { name: 'mipmap-hdpi/ic_launcher_round.png', size: 72 },
  { name: 'mipmap-hdpi/ic_launcher_foreground.png', size: 162 },
  { name: 'mipmap-xhdpi/ic_launcher.png', size: 96 },
  { name: 'mipmap-xhdpi/ic_launcher_round.png', size: 96 },
  { name: 'mipmap-xhdpi/ic_launcher_foreground.png', size: 216 },
  { name: 'mipmap-xxhdpi/ic_launcher.png', size: 144 },
  { name: 'mipmap-xxhdpi/ic_launcher_round.png', size: 144 },
  { name: 'mipmap-xxhdpi/ic_launcher_foreground.png', size: 324 },
  { name: 'mipmap-xxxhdpi/ic_launcher.png', size: 192 },
  { name: 'mipmap-xxxhdpi/ic_launcher_round.png', size: 192 },
  { name: 'mipmap-xxxhdpi/ic_launcher_foreground.png', size: 432 },
]

// iOS icon sizes
const iosIcons = [
  { name: 'AppIcon-20x20@1x.png', size: 20 },
  { name: 'AppIcon-20x20@2x.png', size: 40 },
  { name: 'AppIcon-20x20@2x-1.png', size: 40 },
  { name: 'AppIcon-20x20@3x.png', size: 60 },
  { name: 'AppIcon-29x29@1x.png', size: 29 },
  { name: 'AppIcon-29x29@2x.png', size: 58 },
  { name: 'AppIcon-29x29@2x-1.png', size: 58 },
  { name: 'AppIcon-29x29@3x.png', size: 87 },
  { name: 'AppIcon-40x40@1x.png', size: 40 },
  { name: 'AppIcon-40x40@2x.png', size: 80 },
  { name: 'AppIcon-40x40@2x-1.png', size: 80 },
  { name: 'AppIcon-40x40@3x.png', size: 120 },
  { name: 'AppIcon-60x60@2x.png', size: 120 },
  { name: 'AppIcon-60x60@3x.png', size: 180 },
  { name: 'AppIcon-76x76@1x.png', size: 76 },
  { name: 'AppIcon-76x76@2x.png', size: 152 },
  { name: 'AppIcon-83.5x83.5@2x.png', size: 167 },
  { name: 'AppIcon-512@2x.png', size: 1024 },
]

async function generateAndroidIcons() {
  const androidResDir = path.join(__dirname, 'src-tauri', 'gen', 'android', 'app', 'src', 'main', 'res')

  console.log('Generating Android icons...')

  for (const icon of androidIcons) {
    const [folder, filename] = icon.name.split('/')
    const outputDir = path.join(androidResDir, folder)
    const outputPath = path.join(outputDir, filename)

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    try {
      await sharp(logoPath)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath)

      console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`)
    }
    catch (err) {
      console.error(`✗ Failed to generate ${icon.name}:`, err.message)
    }
  }
}

async function generateIosIcons() {
  const iosAssetsDir = path.join(__dirname, 'src-tauri', 'gen', 'apple', 'Assets.xcassets', 'AppIcon.appiconset')

  console.log('\nGenerating iOS icons...')

  // Create directory if it doesn't exist
  if (!fs.existsSync(iosAssetsDir)) {
    fs.mkdirSync(iosAssetsDir, { recursive: true })
  }

  for (const icon of iosIcons) {
    const outputPath = path.join(iosAssetsDir, icon.name)

    try {
      await sharp(logoPath)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath)

      console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`)
    }
    catch (err) {
      console.error(`✗ Failed to generate ${icon.name}:`, err.message)
    }
  }
}

async function main() {
  if (!fs.existsSync(logoPath)) {
    console.error(`Error: logo.png not found at ${logoPath}`)
    process.exit(1)
  }

  console.log('Using logo from:', logoPath)
  console.log('')

  await generateAndroidIcons()
  await generateIosIcons()

  console.log('\n✓ All icons generated successfully!')
}

main().catch(console.error)
