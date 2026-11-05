const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  for (const n of process.argv.slice(3)) {
    await p.goto('file://' + process.argv[2] + '/' + n + '.html');
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    await p.pdf({ path: `${process.argv[2]}/pdf/${n}.pdf`, preferCSSPageSize: true, printBackground: true });
    console.log(n, 'ok');
  }
  await b.close();
})();
