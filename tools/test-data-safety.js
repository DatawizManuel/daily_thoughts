/* Data-safety check (run before every release): node tools/test-data-safety.js
   Serves www, then checks with a headless browser that
   1. older/partial data loads without losing favourites (old string lists converted, unknown fields kept),
   2. favourites survive a restart unchanged,
   3. data from a newer app version is opened read-only and never overwritten,
   4. a damaged file falls back to the previous copy,
   5. a backup survives save → restore unchanged and backups of other Stoic Ranger apps are refused,
   6. every favourite id in the test data is still a quote in the app (quote ids are permanent, content/quote-ids.json),
   7. every author has a coin, a life story and an author page, every quote renders its one-pager,
   8. all screens open without script errors. */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const WWW = path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'www');
const IDS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'quote-ids.json'), 'utf8'));
const srv = http.createServer((q, r) => { const f = path.join(WWW, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { r.writeHead(e ? 404 : 200, f.endsWith('.svg') ? { 'content-type': 'image/svg+xml' } : {}); r.end(d); }); });
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
srv.listen(0, async () => {
  const url = `http://localhost:${srv.address().port}/index.html`;
  const b = await chromium.launch();
  const errs = [];
  const page = async (store) => {
    const p = await b.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(url.replace('index.html', 'css/app.css'));
    await p.evaluate(s => { localStorage.clear(); for (const k in s) localStorage.setItem(k, s[k]); }, store);
    await p.goto(url); await p.waitForTimeout(400); return p;
  };
  const old = { schema: 1, favs: ['q-marcus-aurelius-01', { id: 'q-seneca-03', at: '2026-10-27T08:00:00Z', note: 'kept' }, 'q-marcus-aurelius-01', 'q-gone-99'], settings: { theme: 'dark' }, future: 'kept' };
  let p = await page({ 'dt.db': JSON.stringify(old) });
  let d = await p.evaluate(() => DT.db);
  ok(d.favs.length === 3 && d.favs.every(f => f.id), 'favourites kept (old string list converted, duplicate merged)');
  ok(d.favs.some(f => f.id === 'q-gone-99'), 'favourite of a quote missing in this version is kept');
  ok(d.favs[1].note === 'kept' && d.future === 'kept' && d.settings.theme === 'dark', 'unknown fields and settings kept');
  const favs = JSON.stringify(d.favs);
  await p.evaluate(() => DT.save(true));
  await p.reload(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => JSON.stringify(DT.db.favs)) === favs, 'favourites unchanged across restarts');
  const bak = await p.evaluate(() => JSON.stringify(DT.db));
  await p.close();

  p = await page({ 'dt.db': JSON.stringify(Object.assign({}, old, { schema: 99 })) });
  ok(await p.evaluate(() => DT.readOnly), 'newer data opens read-only');
  await p.evaluate(() => { DT.toggleFav('q-plato-01'); DT.save(true); });
  ok(JSON.parse(await p.evaluate(() => localStorage.getItem('dt.db'))).favs.length === 4, 'newer data never overwritten');
  await p.close();

  p = await page({ 'dt.db': '{"favs":[', 'dt.db.bak': bak });
  ok(await p.evaluate(() => DT.recovered && DT.db.favs.length === 3), 'damaged file falls back to previous copy');
  await p.close();

  p = await page({ 'dt.db': bak });
  const re = await p.evaluate(b => JSON.stringify(DT.migrate(JSON.parse(b)).favs), bak);
  ok(re === JSON.stringify(JSON.parse(bak).favs), 'backup restores unchanged');
  ok(await p.evaluate(() => !DT.isOurs({ app: 'sr-shooting-drills', schema: 1, favs: [], results: [] })), 'backup of another Stoic Ranger app is refused');
  const ids = await p.evaluate(() => DT.QUOTES.map(q => q.id));
  ok(Object.values(IDS).every(i => ids.includes(i)) && new Set(ids).size === ids.length, `quote ids permanent and unique (${ids.length} quotes, registry ${Object.keys(IDS).length})`);
  ok(await p.evaluate(() => ['q-marcus-aurelius-01', 'q-seneca-03'].every(DT.quote)), 'favourites in the test data point at quotes in the app');
  const lib = await p.evaluate(async () => {
    const bad = [];
    for (const a of DT.AUTHORS) {
      const r = await fetch('coins/' + a.slug + '.svg'); const t = r.ok ? await r.text() : '';
      if (!t.includes(`id="coin-${a.slug}"`)) bad.push(a.slug + ' coin');
      if (!a.life.length || !a.bio) bad.push(a.slug + ' life story');
      a.quotes.forEach(id => { if (!DT.quote(id) || DT.quote(id).a !== a.slug) bad.push(id); });
    }
    DT.QUOTES.forEach(q => { try { if (!q.q.length || !q.p || !DT.onePager(q).includes(DT.esc(q.ref))) bad.push(q.id + ' one-pager'); } catch (e) { bad.push(q.id + ' ' + e.message); } });
    if (DT.DAY_ORDER.length !== DT.QUOTES.length || DT.DAY_ORDER.some(i => !DT.quote(i))) bad.push('day order');
    return bad;
  });
  ok(!lib.length, 'every author has coin, life story and quotes; every quote renders' + (lib.length ? ': ' + lib.join(', ') : ''));
  ok(await p.evaluate(() => { const s = new Set(); for (let i = 0; i < DT.QUOTES.length; i++) s.add(DT.quoteOfDay(i).id); return s.size === DT.QUOTES.length; }), 'Quote of the day shows every quote once before repeating');
  for (const h of ['#/welcome', '#/today', '#/authors', '#/authors?q=fear', '#/author/marcus-aurelius', '#/author/junius-rusticus', '#/q/q-seneca-03', '#/q/q-gone-99', '#/favourites', '#/more']) { await p.goto(url + h); await p.waitForTimeout(150); }
  ok(!errs.length, 'all screens open without script errors' + (errs.length ? ': ' + errs.join('; ') : ''));
  await p.close();
  await b.close(); srv.close();
});
