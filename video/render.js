// Rend la vidéo image par image : node render.js <dossier-images> <fps> <debut> <fin>   (images numérotées)
// ou, pour des tests : node render.js <dossier> test <t1,t2,...>
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, fps, a, b] = [process.argv[2], process.argv[3], process.argv[4], process.argv[5]];
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await br.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.join(__dirname, 'anim.html'));
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  if (fps === 'test') {
    for (const t of a.split(',')) { await p.evaluate((t) => window.seek(t), +t); await p.screenshot({ path: `${out}/t-${t}.png` }); }
  } else {
    const F = +fps;
    for (let i = +a; i < +b; i++) {
      await p.evaluate((t) => window.seek(t), i / F);
      await p.screenshot({ path: `${out}/${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 });
    }
  }
  await br.close();
})();
