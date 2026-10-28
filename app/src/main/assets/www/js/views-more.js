/* Stoic Ranger - Daily Thoughts — backup / restore, theme, about. */
'use strict';
(() => {
const { $, esc } = DT;

const backupName = () => `sr-daily-thoughts-backup-${DT.today()}.json`;
const backupText = () => JSON.stringify(DT.db, null, 1);

/** Replace all data with a backup file (the current data is kept as a copy on the phone first). */
DT.restoreBackup = async () => {
  if (DT.readOnly) { DT.toast('Read-only: update the app first.', true); return; }
  const f = await DT.openFile('application/json,text/plain,application/octet-stream');
  if (!f.ok) return;
  let j;
  try { j = JSON.parse(new TextDecoder().decode(f.bytes)); } catch (e) { DT.toast('This is not a backup file.', true); return; }
  if (!DT.isOurs(j)) { DT.toast(j && j.app ? 'That is a backup of another Stoic Ranger app.' : 'This is not a Daily Thoughts backup.', true); return; }
  if (+j.schema > DT.SCHEMA) { DT.toast(`This backup comes from a newer app version (data format ${j.schema}). Update the app first.`, true); return; }
  const m = DT.sheet('Restore backup', `<p>${esc(f.name)}: ${j.favs.length} favourites.</p>
    <p class="note">This replaces the favourites on this phone (now ${DT.db.favs.length}). A copy of the current data is saved on the phone first.</p>
    <div class="stack"><button class="btn pri big" id="rGo">Replace data with this backup</button></div>`);
  $('#rGo', m.body).onclick = () => {
    DT.flush(); DT.backupDb(`db-before-restore-${Date.now()}.json`);
    const keep = DT.db.settings;
    DT.db = DT.migrate(j);
    DT.db.settings.theme = keep.theme;
    DT.save(true); m.close(); DT.applyTheme();
    DT.toast(`Backup restored: ${DT.db.favs.length} favourites.`); DT.go('#/favourites');
  };
};

DT.views.more = {
  render(el) {
    DT.header('More');
    const s = DT.db.settings, info = DT.appInfo();
    const st = DT.AUTHORS.filter(a => a.group === 'Stoics').length;
    el.innerHTML = `
      ${!DT.native && !DT.standalone() ? `<h2>Install on iPhone / iPad</h2>
      <p class="note">In Safari tap <b>Share</b> (the square with the arrow), then <b>Add to Home Screen</b>. Daily Thoughts then opens full-screen from its own icon, works offline and keeps your favourites safe. On Android use the APK.</p>` : ''}
      <h2>Backup</h2>
      <p class="note">Your favourites live only on this phone. Save a backup now and then (Google Drive, e-mail to yourself …); it is also how you move them to a new phone. Quotes, authors and coins come with the app.</p>
      <div class="stack">
        <button class="btn pri" id="mSave">Save a backup file</button>
        <button class="btn" id="mShare">Share a backup file</button>
        <button class="btn" id="mRestore">Restore a backup</button>
      </div>
      <h2>Appearance</h2>
      <div class="seg">${[['auto', 'Follow phone'], ['light', 'Light'], ['dark', 'Dark']].map(([k, l]) => `<a href="javascript:void 0" data-theme="${k}" class="${(s.theme || 'auto') === k ? 'on' : ''}">${l}</a>`).join('')}</div>
      <h2>Quote of the day</h2>
      <p class="note">A new quote every day at midnight, the same one all day. All ${DT.QUOTES.length} quotes come round once before any repeats, in a fixed order mixed across the authors.</p>
      <h2>About</h2>
      <p class="note">Stoic Ranger - Daily Thoughts ${esc(info.version || '')} · data format ${DT.SCHEMA}${DT.native ? ` · Android ${esc(info.android || '')}` : ' · web app'}<br>
      ${DT.QUOTES.length} quotes · ${DT.AUTHORS.length} authors (${st} Stoics, ${DT.AUTHORS.length - st} others) · ${DT.db.favs.length} favourites</p>
      <p class="note">Translations: English renderings by Stoic Ranger, based on the original texts, unless a quote names a public-domain translation (Sun Tzu: Lionel Giles 1910; The Prince: W. K. Marriott 1908; Discourses on Livy: N. H. Thomson 1883). Reported sayings name their ancient source.</p>
      <p class="note">Coins: Stoic Ranger designs. Portraits are public-domain or freely licensed images, credited on each author page. Authors with no authentic portrait show the gold Stoa column.</p>
      <p class="note">Fonts: Barlow, Cinzel, JetBrains Mono (SIL Open Font License).</p>
      <div class="motto">Impedimentum · fit · via</div>`;
    $('#mSave', el).onclick = async () => { DT.flush(); const r = await DT.saveFile(backupName(), 'application/json', backupText()); if (r.ok) DT.toast('Backup saved: ' + r.msg); else if (r.msg !== 'cancelled') DT.toast('Not saved: ' + r.msg, true); };
    $('#mShare', el).onclick = () => { DT.flush(); DT.shareFile(backupName(), 'application/json', backupText(), 'Stoic Ranger - Daily Thoughts backup'); };
    $('#mRestore', el).onclick = DT.restoreBackup;
    el.querySelectorAll('[data-theme]').forEach(a => a.onclick = () => { s.theme = a.dataset.theme; DT.save(); DT.applyTheme(); DT.route(); });
  },
};
})();
