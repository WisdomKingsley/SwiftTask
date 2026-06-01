const Jimp = require('jimp-compact');

async function createSplash() {
  const canvasW = 1242, canvasH = 2688;
  const logoSize = 864;
  const canvas = new Jimp(canvasW, canvasH, 0x0F0F14FF);
  const logo = await Jimp.read('assets/splash-logo.png');
  logo.resize(logoSize, logoSize);
  const x = (canvasW - logoSize) / 2;
  const y = (canvasH - logoSize) / 2;
  canvas.composite(logo, x, y);
  await canvas.writeAsync('assets/splash-screen.png');
  console.log('Done! Splash screen created.');
}

createSplash().catch(console.error);
