// PDF des contrats : en-tête et pied de page répétés sur chaque page, avec numéro de page.
// Usage : node documents/build-contrats.js <dossier documents> <nom1> <nom2> …   (Playwright requis)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const dir = process.argv[2], names = process.argv.slice(3);
  const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(dir, 'img', f)).toString('base64');
  const header = `<div style="width:210mm;margin:0;padding:0;font-size:0"><img src="${b64('conseil-header.png')}" style="display:block;width:210mm"></div>`;
  const footer = `<div style="position:relative;width:210mm;height:28mm;margin:0;padding:0;font-size:0">
    <img src="${b64('conseil-footer.png')}" style="position:absolute;left:0;bottom:0;width:210mm;display:block">
    <span style="position:absolute;right:20mm;bottom:11.3mm;font:11px Georgia,serif;color:#5b0f1b"><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await br.newPage();
  for (const n of names) {
    await p.goto('file://' + path.join(dir, n + '.html'));
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.pdf({ path: path.join(dir, 'pdf', n + '.pdf'), format: 'A4', printBackground: true, displayHeaderFooter: true,
      headerTemplate: header, footerTemplate: footer, margin: { top: '50mm', bottom: '28mm', left: '20mm', right: '20mm' } });
    console.log(n, 'ok');
  }
  await br.close();
})();
