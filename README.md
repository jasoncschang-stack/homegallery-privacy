# Home Gallery — Privacy Policy & User Guide (GitHub Pages)

**This folder alone** is what you publish. It does **not** include the Android app source.

| File | Purpose |
|------|---------|
| [index.html](./index.html) | Public privacy policy (EN + 繁中) |
| [help/index.html](./help/index.html) | Public user guide (EN + 繁中) |
| [README.md](./README.md) | Deploy steps |

- **Contact:** jasoncs311@gmail.com  
- **Package:** `com.jasoncs.homegallery`  
- **Privacy URL:** https://jasoncschang-stack.github.io/homegallery-privacy/  
- **User guide URL:** https://jasoncschang-stack.github.io/homegallery-privacy/help/  
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
```

Open them in a browser (no login). Then paste into Play Console:

| Console field | URL |
|---------------|-----|
| **App content → Privacy policy** | `…/homegallery-privacy/` |
| **Store settings → Website** (optional) | `…/homegallery-privacy/help/` |
| **Store settings → Support URL** (if available) | same help URL |

App entry points (after deploy): **About → User guide**, **Settings → Support → User guide**.

## Optional: custom domain

Not required for Play. You can add a custom domain later under Pages settings.
