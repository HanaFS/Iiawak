const fs = require('fs');
const path = require('path');

const sourceImage = '/Users/hongocgiahan/.gemini/antigravity-ide/brain/c67ceae9-c61a-408b-9356-cb0a8d394a72/iiawak_app_icon_1781114681894.png';
const resDir = path.join(__dirname, 'Iiawak_mobile/app/src/main/res');

const folders = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

try {
  // Replace PNGs in all density folders
  for (const folder of folders) {
    const dir = path.join(resDir, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.copyFileSync(sourceImage, path.join(dir, 'ic_launcher.png'));
    fs.copyFileSync(sourceImage, path.join(dir, 'ic_launcher_round.png'));
    console.log(`Updated icon in ${folder}`);
  }

  // Remove adaptive icon XMLs if they exist, so the OS falls back to the PNGs
  const anyDpiDir = path.join(resDir, 'mipmap-anydpi-v26');
  if (fs.existsSync(anyDpiDir)) {
    const files = fs.readdirSync(anyDpiDir);
    for (const file of files) {
      if (file.includes('ic_launcher')) {
        fs.unlinkSync(path.join(anyDpiDir, file));
        console.log(`Deleted adaptive icon ${file} from anydpi-v26`);
      }
    }
  }

  console.log('App icon updated successfully!');
} catch (e) {
  console.error('Failed to update app icon:', e);
}
