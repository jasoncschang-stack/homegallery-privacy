# Home Gallery — Privacy Policy (GitHub Pages)

**This folder alone** is what you publish. It does **not** include the Android app source.

| File | Purpose |
|------|---------|
| [index.html](./index.html) | Public privacy policy (EN + 繁中) |
| [README.md](./README.md) | Deploy steps |

- **Contact:** jasoncs311@gmail.com  
- **Package:** `com.jasoncs.homegallery`  
- **Effective:** 2026-07-13  

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
git init
git add .
git commit -m "Publish Home Gallery privacy policy"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/homegallery-privacy.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username. Sign in when Git prompts you.

### 3. Enable GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` / `/ (root)`
4. Save — wait 1–2 minutes

### 4. Your public URL

```text
https://YOUR_GITHUB_USERNAME.github.io/homegallery-privacy/
```

Open it in a browser (no login). Then paste the same URL into:

**Play Console → Your app → App content → Privacy policy**

## Optional: custom domain

Not required for Play. You can add a custom domain later under Pages settings.
