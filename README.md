# Home Gallery — Privacy Policy & User Guide (GitHub Pages)

**This folder alone** is what you publish. It does **not** include the Android app source.

| File | Purpose |
|------|---------|
| [index.html](./index.html) | Public privacy policy (EN + 繁中) |
| [help/index.html](./help/index.html) | Public user guide (EN + 繁中) |
| [help/setup/](./help/setup/) | **Home storage setup** (Windows 11 with screenshots; Synology/QNAP/troubleshooting skeletons) |
| [cast/receiver.html](./cast/receiver.html) | Google Cast custom web receiver |
| [README.md](./README.md) | Deploy steps |

- **Contact:** jasoncs311@gmail.com  
- **Package:** `com.jasoncs.homegallery`  
- **Privacy URL:** https://jasoncschang-stack.github.io/homegallery-privacy/  
- **User guide URL:** https://jasoncschang-stack.github.io/homegallery-privacy/help/  
- **Cast receiver URL:** https://jasoncschang-stack.github.io/homegallery-privacy/cast/receiver.html
- **Crashlytics:** Not enabled for current shipping builds (方案 A)  

## Deploy (about 5 minutes)

### 1. Create an empty public repo on GitHub

1. Open [https://github.com/new](https://github.com/new)
2. Repository name: `homegallery-privacy` (recommended)
3. Visibility: **Public**
4. Do **not** add a README / license (this folder already has files)
5. Create repository

### 2. Push this folder

In PowerShell (adjust the path if needed):

```powershell
cd D:\MyDesign\HomeGallery\privacy-site
git add .
git commit -m "Add Home Gallery user guide"
git push
```

If the remote is not set yet:

```powershell
cd D:\MyDesign\HomeGallery\privacy-site
git init
git add .
git commit -m "Publish Home Gallery privacy policy and user guide"
git branch -M main
git remote add origin https://github.com/jasoncschang-stack/homegallery-privacy.git
git push -u origin main
```

Sign in when Git prompts you.

### 3. Enable GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` / `/ (root)`
4. Save — wait 1–2 minutes

### 4. Public URLs

```text
https://jasoncschang-stack.github.io/homegallery-privacy/
https://jasoncschang-stack.github.io/homegallery-privacy/help/
https://jasoncschang-stack.github.io/homegallery-privacy/help/setup/
https://jasoncschang-stack.github.io/homegallery-privacy/cast/receiver.html
```

| Setup page | URL (after deploy) |
|------------|-------------------|
| Path picker | `…/help/setup/` |
| Windows 11 (zh) | `…/help/setup/windows-11/` |
| Windows 11 (en) | `…/help/setup/windows-11/en.html` |
| Windows 11 (ja) | `…/help/setup/windows-11/ja.html` |
| Windows 11 (ko) | `…/help/setup/windows-11/ko.html` |
| Tailscale (away / IPv4) | `…/help/setup/tailscale/` |
| WebDAV (away / NAS) | `…/help/setup/webdav/` |
| Troubleshooting | `…/help/setup/troubleshooting/` |
Open them in a browser (no login). Then paste into Play Console:

| Console field | URL |
|---------------|-----|
| **App content → Privacy policy** | `…/homegallery-privacy/` |
| **Store settings → Website** (optional) | `…/homegallery-privacy/help/` |
| **Store settings → Support URL** (if available) | same help URL |

App entry points (after deploy): **About → User guide**, **Settings → Support → User guide**.

### When to update the public user guide

`help/index.html` is generated from the app-repo `docs/user-manual.md` (Traditional Chinese), `_user_manual_en.md` (English), `_user_manual_ja.md` (Japanese), and `_user_manual_ko.md` (Korean) via `_build_help.py`. Keep those sources aligned with the **shipping** app version. JA/KO manuals are machine-translated from English (`tools/translate_docs_ja_ko.py`).

Setup pages under `help/setup/` add `ja.html` / `ko.html` (and `#ja` / `#ko` sections) via `_build_setup_locales.py`; screenshots reuse the English folders (`windows-11-en/`, `app-en/`).

**Current public guide:** App **1.2.3** · manual **1.48** (2026-09-20), including backup-zone browse, JA/KO, and WebDAV system-trust + TOFU pinning. Deploy Pages after merging this revision.

Do **not** push `/help/` while a store-review build is pending if the in-repo manual already describes features that build does not ship. After a production release, regenerate and push so Pages matches the store APK.

### Cast receiver deployment

The Cast receiver is deployed with the same GitHub Pages site at
`/cast/receiver.html`. After every receiver update, push the files and wait for
GitHub Pages to finish deploying before testing on a Cast device. Register the
full HTTPS receiver URL in the Google Cast SDK Developer Console as a **Custom
Receiver**, then use its application ID in Home Gallery. For a desktop-only
visual check, open `/cast/receiver.html?demo=1`; demo mode does not require CAF.

## Optional: custom domain

Not required for Play. You can add a custom domain later under Pages settings.
