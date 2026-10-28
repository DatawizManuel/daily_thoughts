# Stoic Ranger - Daily Thoughts: handover

State on 28 October 2026, app version **0.1.2**. Written for Manuel and for whoever picks the work up next.

## 1. What was built

| Piece | What it is | Where |
|---|---|---|
| **Challenge coins** | One modern Stoic Ranger challenge coin per author (24) | `/mnt/project-files/author-coins/`, PC `11_StoicRanger\daily-thoughts\author-coins` |
| **Author pages** | Per author: coin, dates, origin, school, summary, a life story of about 500–600 words in sections, quote list, image credit | Artifact https://claude.ai/artifact/WHWD8i3qwibdLN6EMt1gbv, PC `…\author-pages` |
| **Quote one-pagers** | 411 one-pagers: quote, context, historical event where there is one, "Carry it through the day" practice, source and translation note | Same artifact; sources in `content/quotes/<slug>.txt` |
| **Android app** | "Stoic Ranger - Daily Thoughts", launcher name **SR_Daily Thoughts**, package `at.stoicranger.dailythoughts` | PC `daily-thoughts\Android_App\v0.1.x` (APK, source zip, README, MIGRATIONS) |
| **Apple version** | The same app as an installable web app for iPhone and iPad (Safari: Share → Add to Home Screen) | https://datawizmanuel.github.io/daily_thoughts/ (GitHub Pages from `docs/`), PC `daily-thoughts\Apple_WebApp\v0.1.x` |
| **Source** | One codebase for both versions | GitHub `DatawizManuel/daily_thoughts` (public), plus full source zips on the PC |
| **Early preview** | First Marcus Aurelius one-pager | https://claude.ai/artifact/1ijRXbDKoPp6g1etfmtKAc |

**App screens:** Today (Quote of the day one-pager; below it all 24 author coins, the quotes of the last six days, and "Another thought") · Authors (coin grid, with a search over all quotes) · Author page · Quote one-pager (Favourite, Share, Print / PDF, Previous / Next) · Favourites · More (backup save / share / restore, light / dark / follow phone, about).

**Authors (24).**
- Stoics: Zeno of Citium, Cleanthes, Chrysippus, Zeno of Tarsus, Diogenes of Babylon, Antipater of Tarsus, Panaetius, Cato the Younger, Seneca, Musonius Rufus, Epictetus, Junius Rusticus, Marcus Aurelius.
- Others: Socrates, Plato, Aristotle, Heraclitus, Miyamoto Musashi, Sun Tzu, Machiavelli, Epicurus, Plutarch, Confucius, Nietzsche.

**Quotes per author.**
- 25 each for the prolific authors.
- Plutarch 24, Socrates 20, Musonius 16, Zeno of Citium 15, Cleanthes 12, Chrysippus 9, Cato 6.
- Diogenes of Babylon, Antipater and Panaetius 3 each, because only fragments of their words survive.
- Zeno of Tarsus and Junius Rusticus have none, because none of their words survive. Their author pages say so.

## 2. Decisions and why

**Content and look**
- **Modern challenge coin, not an ancient coin or a photo in a circle.** Manuel rejected the Roman-coin look, the drawn busts and plain photos. Recipe: a real public-domain bust photo, cut out and recoloured as a raised gold relief on a bronze field, inside a gold laurel wreath. Around it a ranger-green enamel ring with the name at the top and IMPEDIMENTUM · FIT · VIA at the bottom, plus a tan ribbon with the dates.
- **Gold Stoa column instead of a face** for six authors with no authentic portrait (Zeno of Tarsus, Diogenes of Babylon, Antipater, Panaetius, Musonius Rufus, Junius Rusticus). This avoids inventing faces.
- **Only public-domain or freely licensed portraits**, each credited on its author page.
- **Translations are our own English renderings by default.** The first preview followed a copyrighted modern translation (Hays). Public-domain translations are used verbatim where they read well: Sun Tzu (Giles 1910), The Prince (Marriott 1908) and Discourses on Livy (Thomson 1883). Sayings reported by others name their ancient source.
- **Stoic Ranger Web V1.0 style.** Stone and ranger green in light mode, charcoal and tan in dark mode, the seal as a watermark, Barlow, Cinzel for names, JetBrains Mono for numbers. The coin is always shown round, without a box around it.

**App architecture**
- **Same build as the three Long range shooting apps** (Gun Database, Training Log, Shooting Drills), because Manuel wanted it similar. It is a thin Java shell around an offline web app, with no AndroidX. The data sits in `db.json` with schema versions, migrations and a backup copy, and it uses the same debug signing key (cert SHA-256 0C:F0:92:51…).
- **One codebase for Android and Apple.** The web app inside the APK is the same one published for iPhone, which is what makes "always update both" practical.
- **Apple version as a web app instead of a native iOS app.** A native app needs a Mac with Xcode and an Apple Developer account ($99 a year). The web app installs from Safari, works offline through a service worker, and keeps favourites in its own storage, which Safari does not clear for home-screen apps.
- **Hosting on GitHub Pages from `docs/`.** It is free and needs no extra account. Free Pages only works on a public repo, which is acceptable because the app holds no personal data.
- **Simple password screen for the web app (option 2).** Manuel chose it over Cloudflare Pages with Cloudflare Access, which would give real protection but means e-mail login and a Cloudflare account.
  - The password is asked once per device and remembered across updates, restores and password changes.
  - Only a SHA-256 check value of the password is in the code. The password itself is in `tools/.web-password`, which is kept out of GitHub and saved in the source zips on the PC.
  - Limitation: the files stay publicly readable on GitHub Pages. It keeps casual visitors out, nothing more.
  - The Android app has no password, because the APK is handed out directly.
- **Signing key kept out of the public repo.** `debug.keystore` is shared by all Stoic Ranger test builds, so it is in the PC source zips only.
- **Quote ids are permanent** (`q-<author>-NN`, recorded in `content/quote-ids.json`), because favourites point at them. They are never renumbered or reused.
- **Quote of the day** changes at local midnight and stays the same all day. It follows a fixed shuffled order (`content/day-order.json`), so neighbouring days come from different authors and all 411 quotes come round once before any repeats.
- **No internet permission, all data on the device.** Backup files move favourites between phones, and between Android and iPhone.
- **The app icon** uses the Stoic Ranger emblem in ranger green on tan. Each app in the family gets its own background: Gun Database black, Training Log olive, Shooting Drills coyote brown.

## 3. Standing rules (from Manuel)

1. **New author → always build the coin and the author page**, and add 15–25 one-pagers (fewer only if no words survive). The coin also appears on the author page and, round, on every one-pager.
2. **Every update goes to both versions.** Bump `versionCode` and `versionName` in `app/build.gradle` and `DT.VERSION` in `js/core.js` together. Then run the test, build the APK, build the web app, push `docs/`, and save both to the PC.
3. **An update must never lose data on the phone.** `node tools/test-data-safety.js` must print only PASS before any delivery (19 checks, see MIGRATIONS.md).

## 4. How to make an update (short)

```
# in a clone of DatawizManuel/daily_thoughts; copy debug.keystore and tools/.web-password from the latest PC source zip
python3 tools/make_content.py            # after changing content/ (authors, bios, quotes, coins)
node tools/test-data-safety.js           # only PASS
VERSION_CODE=n VERSION_NAME=x.y.z bash tools/build-debug.sh   # Android APK
bash tools/make-web.sh                   # web app -> docs/ ; then commit + push
```

In the cloud, `dl.google.com` and `maven.google.com` are blocked. Get the build tools with `apt install aapt apksigner dalvik-exchange`, the API 34 `android.jar` from `raw.githubusercontent.com/Sable/android-platforms`, and ecj from Maven Central. Wikimedia is blocked too, so new portraits are downloaded through a session on Manuel's PC (MFP-MAIN). `github.io` can't be reached from the cloud either, so someone has to check the live site on a phone.

## 5. Open points

- **Check GitHub Pages:** Settings → Pages → main, /docs. Then confirm that https://datawizmanuel.github.io/daily_thoughts/ asks for the password and installs on the iPhone.
- **First real-device test** on both an Android phone and an iPhone. So far everything was tested in a desktop browser at phone size, plus the automated data-safety test.
- **Play Store release (optional).** This needs an upload key, a release build through Gradle and a store listing. `targetSdk 35` is already set for Gradle builds.

## 6. Open ideas

- **Daily reminder notification** with the Quote of the day. On Android this is a small native addition. On iPhone, web push needs a server, so it would be a bigger step.
- **Home-screen widget** showing today's quote (Android).
- **Notes or a journal per quote:** what did I practise today? This would be the first user data beyond favourites and needs a schema step (migration 2).
- **Streak or "read" marks** to see which quotes you have already met.
- **More authors** from the "related thinkers" side, for example Boethius, Montaigne, Lao Tzu, Thoreau or Viktor Frankl, always with a coin and an author page (rule 1).
- **German version of the texts.** The app and the quotes are English for now.
- **Linking with the other Stoic Ranger apps**, for example a quote on the Training Log home screen. The shared signing key and the signature permission are already in place.
- **Real access control** if the web app is shared more widely: Cloudflare Pages with Cloudflare Access (free for up to 50 users).
- **Native iOS app** later, if App Store presence matters. The same web app can go inside a Swift WKWebView shell, which needs a Mac or a cloud build and an Apple Developer account.
