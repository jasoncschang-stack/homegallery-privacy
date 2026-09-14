# Home Gallery User Manual

| Item | Value |
|------|------|
| Manual version | 1.45 |
| App version | 1.2.0 |
| Written | 2026/09/14 |

---

## 1. Introduction

**Home Gallery** (家相簿) is an Android photo and video manager for **on-device** media and **home storage** (NAS / PC over SMB). **You choose the space—no extra cloud capacity to buy.** Use the disks you already have; photos stay in storage you control.

- Browse and manage photos and videos in the **local gallery**
- Connect **home albums** to shared folders on a NAS / PC (each card is one host + one share + one folder)
- Register SMB credentials once under **Host connections** in Settings (scan once, sign in once, reuse later)
- View, edit, share, copy, move, rename, and delete photos
- **Slideshow** auto-plays selected photos (local / home albums; **Pro** can also cast the slideshow to a TV)
- Bookmark frequently used folders
- Browse a local **timeline**; browse home media by date with the **home-album timeline**
- **Home videos** can stream on the phone (no full-file download first)

This app does **not** host a cloud gallery. SMB passwords stay on your device. **Basic** is a full, ad-free photo manager (slideshow, home video streaming, timelines, recycle bin, parallel folders, **manual** album backup, and more). **Pro** (optional, one-time purchase) additionally unlocks **automatic** album backup and **photo / slideshow casting** to a TV.

**Requirements:** Android 11 (API 30) or later.

---

## 2. Getting started

### 2.1 Opening the app

The app opens in the **local gallery**. If photo access is not granted yet, allow **Photos and videos**.

### 2.2 Main navigation (bottom bar)

A **bottom navigation bar** switches the main areas (in **landscape** it becomes a side rail with the same items). There are four tabs:

| Tab | What it does |
|------|------|
| **Local** | On-device gallery (folders / timeline). With the **recycle bin** enabled, open it from the local gallery title bar |
| **Home** | Opens your last home album; tap again to open / close the **album picker** (switch albums, manage home albums) |
| **Bookmarks** | Opens / closes the bookmark panel: folder bookmarks and **video bookmarks**; tap to jump or resume |
| **More** | Menu: **Album backup** (if disabled, goes to the Settings toggle; if enabled, opens backup and may show pending / failed badges), **Settings**, **About** |

> There is **no sidebar**. There is also no “network storage” connection list; home files are always opened from the **Home** tab.  
> **About** (rate / share / version) is under **More → About**; Settings → Support can open it too. Upgrade to Pro and report a problem are also in Settings.

**Second tap on Home / Bookmarks:** if you are already on that tab, tapping the same icon toggles the picker panel without leaving what you are browsing.

During multi-select or in the viewer / player, the bottom bar may hide and return when you go back to browsing.

### 2.3 Leaving the app

On main screens such as the local gallery, a home album, or Settings, the first **Back** press shows “Press Back again to exit”; press again within 2 seconds to close the app.

---

## 3. Local gallery

### 3.1 Browsing photos

- The **root** shows folders (for example DCIM, Pictures)
- Open a folder to see a grid of photos
- Tap a photo for **full-screen viewing**
- With the **recycle bin** enabled: the title bar opens the **recycle bin** (a count badge appears when it has items; Basic and Pro can enable this in Settings)

### 3.2 Search and sort

- Use the top search field to search by **file name**; the **X** on the right clears text when present, or closes search when empty
- Tap sort to change the field (name, modified date, capture date, size, folder) and ascending / descending

### 3.3 Multi-select

1. **Long-press** a photo / video to enter selection; at the **folder** root, long-press a folder to select all media inside
2. Tap other items to add them (in folder mode you can also tap a folder to toggle selecting the whole folder)
3. **Range select:** while already selecting, **long-press** another item (or folder) to select **everything** between them (inclusive) in the current browse order; the anchor is the last tap or long-press that entered selection
4. The bottom toolbar shows: **Slideshow**, **Copy**, **Move**, **Delete**, **Share**, **Upload to home album**
5. After deleting a whole folder’s media in folder mode, if the path has no files left, the app tries to **remove the empty folder** (it will not delete system roots such as `DCIM` / `Pictures`; folders that still contain non-media files are kept)

> **Slideshow:** after multi-select, tap **Slideshow** to auto-play the selected **photos** (videos are skipped). See §5.8.

### 3.4 Bookmarks

Tap the **bookmark** icon in the gallery toolbar to bookmark the current folder; open it later from the **Bookmarks** tab.

### 3.5 Browse modes

At the local gallery **root**, switch views in the toolbar:

| Mode | What you see |
|------|------|
| **Folders** | Browse by folder (default); root shows folders, then a photo / video grid |
| **Timeline** | All media newest-first by **capture date**, grouped by day in a grid |

**Timeline:**

- Bottom **date axis:** year / month / day granularity; pinch to change it, or tap “year / month / day” in the hint
- At day granularity the axis shows thumbnails; labels are the date (in Chinese locales `M月d日`) and year
- A **fast scroller** on the right (when there is enough content) jumps quickly
- Search, multi-select, the viewer, and video playback are supported

**Shared:**

- Bookmarks still point at a folder path; opening a bookmark returns to folder mode

**Settings → Local gallery → Grid display** sets the default browse mode (folders / timeline) and default sort; the app also remembers the last mode you used.

---

## 4. Home albums and SMB hosts

> **Haven’t shared a folder on your PC / NAS yet?** Start with the standalone setup guide:  
> [Set up home storage](./setup-home-storage/) ([Windows 11](./setup-home-storage/windows-11.md) · [Synology](./setup-home-storage/synology.md) · [QNAP](./setup-home-storage/qnap.md); if you cannot connect see [Troubleshooting](./setup-home-storage/troubleshooting.md); **away NAS** see [WebDAV](./setup-home-storage/webdav.md); **away Windows / no WebDAV** see [Tailscale](./setup-home-storage/tailscale.md)).

Home files use two layers:

| Concept | Meaning |
|------|------|
| **SMB host** | One NAS / PC plus credentials (registered under Settings → **Host connections**) |
| **Home album** | One card = **one** share on that host + one folder path inside it |

### 4.1 Add an SMB host

1. Open **More → Settings → Host connections → Manage host connections**
2. Tap **Add SMB host** (or “Find a new SMB host” in the home-album flow)
3. The dialog scans the LAN and asks you to confirm **Wi‑Fi is on and on the same network as the storage**
4. Pick a host (already-saved hosts are dimmed) → enter credentials; a host name is used as the display name when available → **Test connection** → **Save**
   - **LAN IPv4:** for home Wi‑Fi (for example `192.168.x.x`)
   - **Remote access** (optional, see §4.4):
     - **WebDAV:** for a NAS while away; enter **external host (DDNS / public IP)** and **HTTPS port** (often `5006`)
     - **Tailscale:** for Windows or when WebDAV is unavailable; enter `100.x`
     - **None:** home LAN only, no away helper
5. You can also type a host address manually

**Connection notes (in Settings)**

- Home albums are meant for the **same home Wi‑Fi (LAN)**; at home the app uses **SMB**
- On mobile data away from home:
  - **NAS:** prefer **WebDAV** (DDNS / public IP); see the [WebDAV guide](./setup-home-storage/webdav.md)
  - **Windows PC** or no WebDAV: use **Tailscale** or an existing LAN VPN; see the [Tailscale guide](./setup-home-storage/tailscale.md)
- The UI may show “home LAN” or “away”; away mode still needs WebDAV, Tailscale, or a VPN configured correctly
- The **connection notes** card on Manage host connections opens the online **WebDAV / Tailscale** setup pages
- **Enable IPv6** (same page, **off by default**): when off, discovery and connect use IPv4 only and IPv6 fields are hidden; saved IPv6 is kept. Turn it on to scan / use IPv6. Away, use WebDAV / Tailscale (see §4.4)

### 4.2 Add a home album

1. Bottom navigation → **Home** (if you have no albums yet, setup is offered; or tap **Home** again → **Manage home albums**)
2. If there is no album yet, tap **Connect home storage** (or the **Add** FAB)
3. **If there is no host yet:** the Add SMB host dialog opens; after you save, setup continues
4. **If hosts already exist:**
   - One host: go straight to **Choose a share**
   - Several hosts: pick a host, then a share
   - **Find a new SMB host** is available when you need a scan
5. **Choose the album folder:** browse subfolders in the share; you can stop at any level as the album root
6. **Display name (optional)** defaults to the folder name → tap **Done** (this creates **one** album)
7. Open it from the **Home** tab; tap **Home** again to switch albums

> Setup **no longer** re-runs a full host scan or lets you multi-select several shares to create many albums in one go.

### 4.3 Browse and manage

1. Bottom navigation → **Home** → open an album (or tap **Home** again and switch in the picker)
2. Browse that source folder (grid / list)
3. The title bar switches **Folders** / **Timeline**. Timeline shows photos and videos by date across folders (**Basic**). The first open builds an index; later visits prefer the cache. If the index is older than about 24 hours it refreshes silently after connect; you can also refresh manually
4. Switching to timeline inside a subfolder shows **only that folder’s scope**
5. Tap a photo to view; the toolbar can **Refresh**
6. Timeline multi-select can **align times** (match a reference photo) or **correct time** on a single photo (date and time)
7. On the home-album **manage** screen, each album has a **timeline scan depth** (1–8 levels, default 4; the album root is level 0)

**Remove an album link**

- On the home-album **manage** screen: long-press a card or tap ⋮ → **Remove album link**
- This only removes the link in the app; it does **not delete** files on the storage device

**Multi-select move / copy**

- The destination picker lists home albums by display name only (no second-line path), then you can enter subfolders

### 4.4 Away access (optional)

After you leave home Wi‑Fi, pick one remote method for the host type:

| Host type | Remote access | Notes |
|----------|----------|------|
| **NAS** (HTTPS WebDAV enabled) | **WebDAV** | DDNS / public IP + port; see [webdav.md](./setup-home-storage/webdav.md) |
| **Windows PC** / no WebDAV | **Tailscale** | Enter `100.x`; see below and [tailscale.md](./setup-home-storage/tailscale.md) |
| Already on the LAN via OpenVPN etc. | **None** (or keep the LAN address) | Usually no extra WebDAV / Tailscale |

#### WebDAV (recommended for NAS)

1. On home Wi‑Fi, set up the host and home album first (§4.1–4.2)
2. Enable **WebDAV HTTPS** on the NAS and prepare **DDNS** or a public IP
3. Edit the host → **Remote access = WebDAV** → enter external host and port → **Test connection** → **Save**
4. Open the home album while away (turn off home Wi‑Fi to verify)

Full steps and security notes: [setup-home-storage/webdav.md](./setup-home-storage/webdav.md).

#### Tailscale (Windows / no WebDAV)

Use **Tailscale** as a secure tunnel so the phone can reach home SMB at **`100.x`**.

**Short flow:**

1. On home Wi‑Fi, set up the host and home album first (§4.1–4.2)
2. **PC / NAS:** install Tailscale → sign in → Connected → **copy that machine’s Tailscale IPv4 (100.x)**
3. **Phone:** install Tailscale → **same account** → Connected
4. Open the home album while away → when prompted **Open Tailscale** → copy the PC `100.x` → return to the app → **Paste** → **Save Tailscale IP and retry**

**Day to day:** open Tailscale when you need the album. When you leave the app or return to home Wi‑Fi, the app asks Tailscale to disconnect to save power. If you already have OpenVPN (or similar) onto the LAN, you usually do not need Tailscale.

Full walkthrough, FAQ, and notes: [setup-home-storage/tailscale.md](./setup-home-storage/tailscale.md).

#### Enable IPv6 (optional)

Under **Host connections** you can toggle **Enable IPv6** (**off by default**):

- **Off:** discovery and connect stay IPv4-only; IPv6 fields are hidden when editing; saved IPv6 is kept
- **On:** the app can scan / fill IPv6 and use it among connection candidates
- For away access use **WebDAV / Tailscale** in §4.4

---

## 5. Photo viewer

Tap a photo in the local or home gallery for full-screen viewing. Other apps (Files, Downloads, Messages, and so on) can also **Open with Home Gallery**.

### 5.1 Gestures

| Action | What it does |
|------|------|
| Swipe left / right | Previous / next photo |
| Pinch | Zoom in / out (about 1×–5×) |
| Drag | Pan after zooming |
| Double-tap | Toggle between 1× and 2.5× |
| Tap the photo | Toggle fullscreen (hide / show toolbars) |

The lower-left corner shows the photo date: if EXIF **DateTimeOriginal / Digitized** exists, it shows **date + time**; otherwise it uses the **earlier** of modified / created and shows **date only** (plain DateTime tags are ignored so a later file time is not used by mistake). Hidden during fullscreen or slideshow.

### 5.2 Top toolbar

| Button | Function |
|------|------|
| ← Back | Return to the album |
| File name | Current photo name |
| Delete | Delete the current photo (confirm) |
| Edit (pencil) | Open the editor (**only some formats**, see §5.6) |

> If the current format cannot be edited, the **Edit** button is not shown.

### 5.3 Side / bottom actions

Tap the arrow to expand the action row (in auto-collapse mode), or set it to **always shown** in Settings.

| Action | What it does |
|------|------|
| Move | Move after choosing a destination folder |
| Copy | Copy after choosing a destination folder |
| Properties | File info and EXIF |
| Rename | Change the file name |
| Share | Share through another app |

> Portrait: actions at the bottom. Landscape: actions on the right.

### 5.4 Properties

The properties dialog shows:

- **File info:** name, path, size, type, created date, modified time
- **EXIF** (when present): resolution, capture settings, GPS, and so on

Photos without EXIF still show file info; **created date** is always shown.

### 5.5 Copy / move

1. Tap Copy or Move
2. Pick a destination in the **folder browser** (fullscreen grid)
   - Empty folders are **hidden** by default; turn on **Show empty folders** to pick a folder that has no files yet
   - The same row has **New folder** and **Confirm**
   - After **New folder**, it becomes the target (shown even if empty) so you can confirm immediately
3. If the destination already has the same name:
   - **Overwrite:** replace with the new file
   - **Keep both:** keep the original; the new file gets a number (`photo (1).jpg`)
   - **Cancel:** abort

Local multi-select: **Move** works for photos and videos; **Copy is hidden** when the selection includes video (video copy is not implemented yet).

### 5.6 Image formats and limits

The app uses the extension and MIME type to decide whether a file can be **viewed** or **edited**. The table applies to the **local gallery** and **home albums** (other files on home storage appear as ordinary files and cannot open in the viewer).

#### Viewable photo formats

`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.heic`, `.heif`, `.svg`, `.svgz`

#### Editable photo formats

Only these formats can enter **Edit** from the viewer, and they stay the same format after save:

| Format | Notes |
|------|------|
| `.jpg` / `.jpeg` | Fully supported |
| `.png` | Fully supported |
| `.webp` | Fully supported |

Other viewable formats (`.gif`, `.bmp`, `.heic`, `.heif`, `.svg`, `.svgz`, and so on) have **no Edit button**, so a save cannot change the format or damage the file.

#### SVG / SVGZ

| Topic | Notes |
|------|------|
| Viewing | Supported. Vectors are **rasterized** to a bitmap |
| Zoom | Extreme zoom may look less sharp than a native vector viewer |
| Editing | **Not supported** (no Edit button) |
| Complex SVG | Some effects (filters, scripts) may not render fully |
| Local index | The device must register the SVG in MediaStore; a file only in Downloads may be missing if the system never indexed it |

#### Other format notes

| Format | View | Edit | Notes |
|------|------|------|------|
| `.gif` | ✓ | ✗ | Still frame only; no animation |
| `.heic` / `.heif` | ✓ | ✗ | Depends on device decode |
| `.bmp` | ✓ | ✗ | Viewable, not editable |

#### Video formats

The app recognizes these video extensions in both the **local gallery** and **home albums**. Playback details are in §5.7.

`.3gp`, `.avi`, `.flv`, `.m2ts`, `.m4v`, `.mkv`, `.mov`, `.mpeg`, `.mpg`, `.mp4`, `.qt`, `.rm`, `.rmvb`, `.swf`, `.ts`, `.vob`, `.webm`, `.wmv`

> Settings → **Media list filters** also lists these video extensions as a reference.

### 5.7 Video playback

**Local** and **home-album** videos can stream in the app (home files do not need a full download first). Slideshow is §5.8.

#### Recognized video extensions

`.3gp`, `.avi`, `.flv`, `.m2ts`, `.m4v`, `.mkv`, `.mov`, `.mpeg`, `.mpg`, `.mp4`, `.qt`, `.rm`, `.rmvb`, `.swf`, `.ts`, `.vob`, `.webm`, `.wmv`

Being on the list means the app **opens the file as video**. It does **not** guarantee decode; that still depends on the inner codec and the device.

#### On the phone

| Topic | Notes |
|------|------|
| Engines | **Local** prefers **ExoPlayer (Media3)**; some containers / codecs use **libVLC**. **Home (SMB)** common `.mp4` / `.mkv` / `.webm` / `.m4v` / `.3gp` use Media3; `.mov` / `.ts` / `.avi` and similar still use **libVLC** (the control bar looks the same) |
| Often Media3 | Local and home `.mp4`, `.mkv`, `.webm`, and similar; a short codec probe may run before play |
| Often libVLC | `.mov`, `.qt`, `.avi`, `.wmv`, `.flv`, `.mpg`, `.vob`, `.rm` / `.rmvb`, `.swf`, `.ts`, `.m2ts`, or codecs that are hard to hardware-decode |
| If neither works | Open with another system app |
| Local swipe | From the local gallery / timeline, swipe left / right to the previous / next video in the list (Media3 path) |
| End of clip | **Replay** appears on the control bar |
| Network buffer | Home streams may buffer on first play; some formats or a subtitle file in the same folder may use a more stable stream path |
| Subtitles / resume / bookmarks / PiP | Same-folder `.srt` / `.vtt` can be chosen on the player. Resume / bookmarks are under **Bookmarks**. **Picture-in-picture still mainly uses local Media3** |

> **Codec limits:** the same extension can hide different codecs. If both engines fail, you may get audio only, a black frame, or no playback.

#### Format summary

| Extension | Recognized | Phone playback |
|--------|------|------|
| `.mp4` | ✓ | Usually plays |
| `.mkv` | ✓ | Usually plays |
| `.mov`, `.qt`, `.m4v`, `.3gp` | ✓ | Depends on codec (often the compatibility engine) |
| `.avi`, `.wmv`, `.flv`, `.webm`, `.ts`, `.m2ts`, `.mpg`, `.mpeg`, `.vob`, `.rm`, `.rmvb`, `.swf` | ✓ | Depends on codec (libVLC) |

#### Cast video to a TV

Casting **video** from local or home albums is **Basic** (photo cast is §5.9). The phone and TV must be on the same LAN. Some extensions (for example `.avi`, `.wmv`) hide the Cast button.

| Codec | How it casts |
|------|----------|
| **H.264 / AVC** (typical phone MP4, including portrait) | **Direct cast**; no transcode just because of bitrate or portrait |
| **HEVC / H.265** and other TV-incompatible codecs | The app transcodes (you may see “Preparing to cast video…”) |

“**This video’s bitrate is too high**” appears only when **transcode is required but the home file is not downloaded / has no transcode cache**. Confirmed H.264 is not blocked for that reason; play on the phone, then retry cast once a local file or cache exists.

### 5.8 Slideshow

Auto-play **photos** from the local or home gallery on the **phone screen**. Available in Basic and Pro. **Pro** can also send the slideshow to a TV (see §5.9). Use the video player for videos (§5.7).

#### How to start

| Method | Notes |
|------|------|
| **From multi-select** | Long-press to select → pick one or more **photos** → tap **Slideshow**. Full-screen viewing **starts immediately** |
| **From the viewer** | Open any photo, then tap **Start slideshow** / **Pause slideshow** (slideshow icon) |

> If the selection has **no photos** (for example videos only), you see “Please select at least one photo” and slideshow does not start.

#### Playback

| Topic | Notes |
|------|------|
| Interval | About **5 seconds** per photo |
| Loop | After the last photo, playback returns to the first |
| On-screen | Lower left shows the index (`3 / 12`); lower right shows the countdown; a pause icon appears when paused |
| Scope | From multi-select, only the **selected photos** (in selection order); from the viewer, photos in the current browse list |

#### Gestures while playing

| Action | Notes |
|------|------|
| **Tap** | Pause |
| **Swipe left** | Next photo (countdown resets) |
| **Swipe right** | Previous photo (countdown resets) |

#### After pause

| Action | Notes |
|------|------|
| **Tap the photo** | Resume (countdown restarts) |
| **Pinch / drag** | Zoom for detail (pinch-zoom is enabled only while paused) |
| Toolbar **Pause slideshow** | Leave slideshow mode and return to normal viewing |

System Back: if a slideshow is running, the first press ends it; another press leaves the viewer (depending on the current screen).

### 5.9 Cast photos to a TV

**Pro** can cast local or home-album photos to a Google Cast TV / Chromecast. Basic still shows the Cast icon on the photo viewer; tapping it prompts an upgrade.

| Topic | Notes |
|------|------|
| Entry | **Cast** icon in the photo viewer title bar |
| After connect | The TV shows the current photo; pinch, pan, and slideshow on the phone sync to the TV |
| Slideshow | Start / pause on the phone also switches the TV |
| Leave the viewer | The TV photo session ends |
| Video | Local / home **video** Cast remains Basic (see §5.7), separate from photo cast |

> Phone and TV must be on the same LAN. Allow local-network permission the first time.

---

## 6. Photo editor

Tap **Edit** in the viewer (**only `.jpg`, `.jpeg`, `.png`, `.webp` show this button**, see §5.6).

Editing is a **draft**. There are two layers:

1. Inside a tool, adjust on the bottom (portrait) or right (landscape); tap **✓** to apply that step to the working preview, or **X** to discard the step and return to tool picker.
2. Back on the tool picker, top **Save** writes every applied step to the file.

> **Landscape:** entering Portrait / Adjust / Crop hides the top title bar for preview space; system Back or toolbar **X** leaves that tool.

### 6.1 Tools

Three tools appear at the bottom (portrait) or right (landscape):

| Tool | Notes |
|------|------|
| Portrait | Face smooth and local tone (brightness / contrast / saturation) |
| Adjust | Brightness, contrast, saturation, color temperature |
| Crop | Aspect crop, tilt, rotate / flip |

### 6.2 Crop

Dark panel; pick an aspect from the icon row:

| Aspect | Notes |
|------|------|
| Free | Drag corners and edges freely |
| Original | Lock the current aspect ratio |
| 3:2, 4:3, 16:9 | Landscape fixed ratios |
| 2:3, 3:4, 9:16 | Portrait fixed ratios |
| 1:1 | Square |

- **Tilt:** −15° to +15°, drag the scale; **Reset** returns to 0
- **Auto:** suggested tilt is computed only when you tap Auto (not when entering Crop)
- **Flip / rotate:** in the middle of the bottom confirm row; they apply to the working image immediately (you still need ✓ later to commit this crop step)
- Drag the crop box to move; drag corners to scale. Rule-of-thirds guides appear only while dragging
- Tap **✓** to apply the step

### 6.3 Adjust

Dark panel; the middle of the confirm row switches four items:

| Item | Notes |
|------|------|
| Brightness / contrast / saturation / temperature | −100 to +100, 0 in the middle; a yellow pointer shows the current value |

- **Reset** on the right resets the current item
- Use **Crop** for rotate / flip
- Tap **✓** to apply the step

### 6.4 Portrait

Dark panel; entering the tool **detects faces** (you can “Detect again”). The confirm row switches: smooth, brightness, contrast, saturation.

| Control | Notes |
|------|------|
| Smooth | Strength 0–100; with a face, a dynamic suggestion based on how large the face is (about 20%–70%) |
| Brightness / contrast / saturation | Only on the face (or a manual box), about ±50% |

**When no face is found:**

- Smooth strength is **0%** and no suggestion is shown
- A circular region appears: **drag with one finger** to move it, use the **slider** to resize, then raise smooth

**When a face is found:**

- Suggested smooth uses the largest face’s share of the frame (closer shots higher, group / distant shots lower) and shows “Suggested N%”
- Faces are outlined

Tap **✓** to apply the step.

### 6.5 Save and cancel

| Button | Where | Notes |
|------|------|------|
| **X** | Bottom of a tool | Discard this tool step and return to the picker |
| **✓** | Bottom of a tool | Merge the tool result into the working preview (not written yet) |
| **Save** | Top of the tool picker | Write all applied edits to the file (local or home album) |
| Back | System / top back | Asks whether to discard unsaved changes |

> Editor preview (tool picker, Portrait, Adjust) supports **pinch-zoom** and **double-tap zoom** (about 1×–3×), then pan; **Crop** does not zoom the preview so gestures stay with the crop box.

---

## 7. Bookmarks

### 7.1 Add a bookmark

In a local or home album, tap the toolbar **bookmark** icon. A “Bookmarked” hint appears at the bottom.

While playing a video, tap the **star** to add a **video bookmark** (including resume position).

### 7.2 Use bookmarks

1. Tap **Bookmarks** in the bottom bar (tap again on that tab to toggle the panel)
2. In the panel you can open:
   - **Folder bookmarks:** jump to that folder
   - **Video bookmarks:** open the player and try to resume

### 7.3 Remove a bookmark

**Long-press** an item in the bookmark panel → confirm (folder and video bookmarks work the same).

---

## 8. Upload to a home album

1. Enter **multi-select** in the local gallery and pick photos / videos
2. Tap the bottom **Upload** icon
3. Choose a **home album** (names only) and an optional subfolder (the private backup zone cannot be chosen)
4. Confirm

**Progress**

- Shows progress (`N / M`), file name, and a byte bar
- **Stop** cancels remaining files; finished files are kept; the result distinguishes success / partial success / cancelled

**Same name**

- If the destination already has the name, the upload is **renamed** to `name (1).ext`, `name (2).ext`, … and does **not overwrite**

**Delete local after a successful upload (Pro)**

- Only when **every item uploaded successfully** and **Pro + recycle bin** are enabled, the app asks whether to **move local copies to the recycle bin**
- Choose **Move to recycle bin** or **Keep on device**; Basic or recycle bin off only shows a success message
- Album backup **does not** offer this; after moving to the recycle bin, a remote backup copy is still kept if that file was already in album backup

---

## 9. Settings

Open **More → Settings**.

### 9.1 Host connections

- View, edit, or delete saved **SMB hosts**
- Add a host from Manage host connections (LAN scan or manual address)
- Connection notes open the online **WebDAV / Tailscale** away-setup pages; the same page toggles **Enable IPv6** (off by default, see §4.1 / §4.4)
- The Settings home screen does **not** repeat **Add SMB host**; use the manage page

### 9.2 Home albums (Settings block)

- Shows how many home albums are configured
- **Photo cast (Pro):** cast local / home photos to a TV. Basic tapping the switch prompts an upgrade; Pro is unlocked (use the viewer Cast button). Home **video** streaming is Basic and no longer needs a Settings switch
- **Portrait H.264 direct cast:** a video-Cast compatibility option (Basic); turn it off only if the TV picture is rotated
- Add / remove albums from the **Home** tab (picker / manage screen)

### 9.3 Local gallery folders

- **Include folders:** which roots to show (defaults `DCIM`, `Pictures`)
- **Exclude folders:** skip specific subfolders

**Basic vs Pro (parallel folders)**

| Edition | Paths you can include | SAF grant |
|------|------|------|
| **Basic** | MediaStore roots: `DCIM`, `Pictures` (videos also `Movies`) and their subfolders; **plus** parallel folders | Requires **Select and authorize folder (read/write)** |
| **Pro** | Same as Basic | Same as Basic |

Basic and Pro can authorize parallel paths such as `Documents` in Settings; without that grant, restore may map into `Pictures/…` (see §9.7).

**Note (Android platform limit):** from Android 11, the system **does not allow** authorizing the entire **`Download` root** with the folder picker—“Use this folder” stays grey. That is not an app bug. Authorize `Documents` (or similar), or create a **subfolder** under Downloads and authorize that subfolder.

**Do not confuse the two grants**

| Grant | Used for |
|------|------|
| **Select and authorize folder (SAF)** | Read/write the parallel folder itself (restore, copy / move **into** it) |
| **Media management (Settings → Local gallery)** | Delete or modify originals in standard albums such as `DCIM` / `Pictures`. Moving **from** the camera folder **into** a parallel folder may still ask to delete the original; after media-management access, that prompt is usually not repeated |

### 9.4 Display

| Setting | Notes |
|------|------|
| Portrait grid columns | Photos per row in portrait |
| Landscape grid columns | Photos per row in landscape |
| Folder name size | Folder title size at the root |
| Viewer action row | Auto-collapse / always shown |

### 9.5 Cache

See cache size and **clear cache** (network thumbnails, image disk cache, network video stream cache, memory cache). Originals are untouched; the next home-album browse must download or rebuild cache.

### 9.6 Media list filters

Hide folder names, file names, or extensions in local and home album lists. Built-in photo / video extension rules are read-only references.

> Settings is grouped: local gallery, media filters, **Host connections**, home albums (including network video streaming), album backup, cache, **Report a problem / export diagnostics**, and so on.

### 9.7 Album backup

Album backup **uploads one way** from the local gallery into a private zone on home storage (`.HomeGallery/backup/{device}/`) so you can restore after a phone failure.

Each device keeps `device_info.json` in its own folder (model, optional display name, last backup time). When several people share the same backup anchor, set **Local backup identity → Display name** in album backup settings; the “Link existing backup” list shows that name / model instead of only `android_xxxx`.

| Topic | Notes |
|------|------|
| **Direction** | **Phone → home storage** (one-way) |
| **Basic / Pro** | **Basic:** manual backup, exclude folders, restore / link an old phone. **Pro:** optional **automatic** backup on Wi‑Fi |
| **Automatic backup** | **Pro only.** Basic can backup and exclude folders manually, with no background sync. When on (and “Wi‑Fi only” is satisfied), connecting to home Wi‑Fi **schedules a scan / upload soon**; the app also checks about every 6 hours and when the gallery changes. Battery savers / a NAS that is not ready yet can delay this—best effort, not second-level |
| **Exclude folders** | **Basic / Pro:** skip local subpaths (for example `DCIM/Screenshots`); already-indexed items leave the queue |
| **Move to recycle bin** | Does **not** delete the home backup; also **not** “Missing on device” (restore the local file from the recycle bin) |
| **Permanent delete in this app** | **Not** “Missing on device”; the next backup deletes the matching `.HomeGallery` file and drops tracking |
| **Gone outside the app** | Listed as “Missing on device”; the home copy is kept for manual restore or cleanup. After **Check pending backup** connects to the NAS, items whose backup file is already gone are removed from the list (no unrestorable ghosts) |
| **Restore** | In **View backup / restore**, pick items **manually** and write them back locally |
| **Not provided** | **Two-way sync** — changing / deleting backup files directly on the NAS does **not** update the phone gallery |

If you **switch to another share**, **change host**, or **change the backup anchor folder**, local tracking starts over: synced / failed / backup-only counts clear. Tap **Check pending backup** to scan again (if the new destination already has a backup for this device, items can align as synced without a full re-upload).

Unlike Basic “upload to a public folder”, the backup zone is app-managed, hidden from normal network browsing by default, and keeps the local copy by default.

**Restore (R1.1)**

1. **More → Album backup** (or Album backup in Settings) → **View backup / restore**
2. Default filter **Missing on device** (backed up before, gone locally; not items in the recycle bin, and not permanent deletes from this app)
3. Tap **Restore all missing**, or multi-select then **Restore selected** → confirm (file count, size, **path-mapping count**) → restore
   (Items after linking an old phone are usually “Backup only”; the Missing-on-device filter also shows those pending files)
4. Restored files appear in the local gallery

**Parallel-folder restore paths (important)**

If the backup contains parallel paths such as `Documents/…`:

| Condition | Where restore writes |
|------|------|
| **Basic**, or **Pro without SAF** for that path | Mapped to **`Pictures/{original relative path}`** (for example `Documents/Office Lens/a.jpg` → `Pictures/Documents/Office Lens/a.jpg`; videos may map under `Movies/…`) |
| **Pro** with **Select and authorize** on that parallel folder | Writes back to the **original relative path** (not mapped into Pictures) |

If the confirm dialog shows path mapping, some files will land under `Pictures`. Device-to-device restore (R2) uses the same rule.

**New phone (R2)** (**Pro:** link existing backup / full restore library)

1. **More → Album backup** → **View backup / restore**
2. Tap **Link existing backup** → pick the old phone’s `backup/{deviceId}/` on the NAS (**restore source only**)
3. After indexing, use the **Backup only** filter for files not on this phone
4. Multi-select or **Restore all missing** (same parallel-folder rule: without SAF they go to **`Pictures/…`**)
5. Later backups from this phone still write to **its own** folder; the old phone can keep backing up separately

**After clearing app storage (same phone)**

1. After a backup, **Export settings** first (this also remembers the backup `deviceId`)
2. Clear app storage (or reinstall) → grant permissions again → **Restore settings as soon as possible** (do not enable album backup first, or a new device identity may be created)
3. Open album backup → **Check pending backup**: the app connects to the home backup zone and marks local files that still match the NAS as synced—**no full re-upload**
4. If you restore settings on **another phone** that already has a different identity: the write identity stays; the imported old `deviceId` is treated as a linked restore source (use “Link existing backup” to index / restore)
5. If the export is old (no `deviceId`), export again after a backup, or pick the old folder with “Link existing backup”

### 9.8 Export and restore settings

| Topic | Notes |
|------|------|
| **Export settings** | Exports local gallery, SMB hosts, home albums, bookmarks, and backup preferences to Downloads / Home Gallery/ |
| **Credentials** | The file includes SMB passwords in an **encoded** form (not plain text, not strong encryption); keep it private—do not upload it to a public cloud |
| **Restore settings** | Pick a recent export or a JSON file; this **overwrites** current settings and credentials |

> If you used an older (`SambaProfile`) test build before the refactor, **clear app data or reinstall**, then set up hosts and home albums again. Do not import old-format settings files.

### 9.9 Report a problem and diagnostics

| Topic | Notes |
|------|------|
| **Report a problem** | Opens email, optionally with version and feature-flag summary |
| **Export diagnostics** | Creates `diagnostics-*.zip` (device info, recent errors, `last_crash.txt`, and so on) with **no** photo contents or SMB passwords |
| **After a crash** | **Reopen the app** before exporting so the ZIP includes the latest fatal crash stack trace |

---

## 10. FAQ

### Q1: Local photos are missing?

- Confirm **Photos and videos** access is granted
- Settings → Local gallery folders: make sure the folder is in **Include folders**

### Q2: Cannot connect to home storage?

- Phone and NAS / PC must be on the same home Wi‑Fi / LAN
- Settings → **Host connections**: check address, account, and password
- Confirm SMB is enabled on the NAS / PC (port 445)
- If scan finds nothing: turn Wi‑Fi on, stay on the same LAN as the storage, then scan again
- **Cannot connect while away:**
  - NAS: remote access must be **WebDAV**, with the correct DDNS / port → [WebDAV guide](./setup-home-storage/webdav.md)
  - Windows / no WebDAV: see the [Tailscale guide](./setup-home-storage/tailscale.md)
  - Other cases: [Troubleshooting §E](./setup-home-storage/troubleshooting.md)

### Q3: A system permission prompt appears when deleting or editing a local photo?

On Android 11+, some media created by other apps needs an extra grant to modify / delete. Allow it in the system dialog.

### Q4: Portrait / smooth looks weak?

- Confirm a face was detected, or drag the circle and resize it with the slider
- Raise **Smooth**
- Apply (✓) then Save

### Q5: Quality drops after editing?

Portrait **preview** uses a lower resolution for speed; **Save** processes at original resolution. If it still looks too strong, lower Smooth.

### Q6: Copy / upload to a home album is slow?

Speed depends on network bandwidth and file size. Use a stable Wi‑Fi connection.

### Q7: Why can I view SVG but not edit it?

SVG is vector. The app can only **view** a rasterized bitmap, not edit vectors and save SVG, so Edit is hidden. See §5.6.

### Q8: Why is there no Edit button for GIF / HEIC?

Those formats can be viewed, but an edited save cannot keep the original format (GIF animation, HEIC encoding). To avoid damage, Edit is only for `.jpg`, `.jpeg`, `.png`, `.webp`.

### Q9: An SVG file is missing from the local gallery?

Confirm Android **MediaStore** indexed it (Downloads is a common case). If the system never registered the SVG as media, this app cannot list it.

### Q10: A video is listed but will not play?

- Confirm the extension is in §5.7
- On the phone: the app tries the built-in engines (Media3 or the compatibility engine); if that fails, open with **another app**. You can also test the same file in another player
- Network video: check the network; if needed, clear cache in Settings and retry

---

## 11. Permissions

| Permission | Why |
|------|------|
| Photos and videos (READ_MEDIA_IMAGES / READ_MEDIA_VIDEO) | Read local photos and videos |
| Internet (INTERNET) | Connect to home SMB storage |
| Network state (ACCESS_NETWORK_STATE) | Detect connectivity |
| Wi‑Fi state (ACCESS_WIFI_STATE) | LAN discovery |

---

## 12. Basic and Pro

Home Gallery offers **Basic** and **Pro**. Basic is **ad-free** and already includes full photo / video management (local and home albums, timelines, home video streaming, recycle bin, parallel folders, manual album backup and exclude folders, restore / link an old phone, and more). Extra space comes from home storage, not cloud quotas. **Pro** is an **optional one-time purchase** that additionally unlocks **automatic** album backup (background upload on Wi‑Fi) and **photo casting** to a TV.

| Edition | Role |
|------|------|
| **Basic** | Full local + home media management; manual backup, exclude folders, and restore |
| **Pro** | Everything in Basic + **automatic backup** (background Wi‑Fi sync) + **photo cast** (TV) |

> Production builds unlock Pro with an in-app purchase; debug builds can toggle related features in Settings for testing.

### 12.1 Basic — free

| Feature | Notes |
|------|------|
| Local gallery | Browse, timeline, search, sort; parallel folders (SAF) |
| Home albums | Hosts, photos and **timeline**, bookmarks; **home videos** stream |
| Photo management | Copy, move, rename, delete, share |
| Photo editor | Crop, adjust, portrait, and more |
| Upload | Upload local photos / videos into a **home album** folder |
| **Album backup** | **Manual** one-way backup; **exclude folders**; **restore** / link an old phone; **no** automatic background sync |
| **Recycle bin** | Enable in Settings; deletes can go to the bin and be restored |
| Local / home video | Play and Cast (device-dependent) |
| Slideshow | Auto-play photos on the phone (see §5.8) |
| Photo cast (TV) | **Requires Pro** (see §5.9) |
| Settings | **More → Settings**: hosts, gallery scope, cache, and more |

### 12.2 Pro — one-time purchase

On top of everything in Basic:

| Feature | Notes |
|------|------|
| **Automatic backup** | **Automatic** one-way backup on Wi‑Fi (background schedule); manual backup, exclude folders, and restore stay the same as Basic |
| **Photo cast** | Cast local / home photos and slideshows to a TV (pinch, pan; see §5.9) |

### 12.3 Related Settings switches

| Where | Notes |
|------|------|
| Settings → **Home albums** → Photo cast | **Pro:** photos / slideshow to a TV. Basic tapping the switch prompts an upgrade |
| Settings → **Home albums** → Portrait H.264 direct cast | Video Cast compatibility (Basic) |
| Settings → **Album backup** | Enable backup, exclude folders, **automatic sync** (automatic sync is Pro only) |
| Settings → **Local gallery** → Recycle bin | Enable the bin and the delete default (Basic and Pro) |

After a successful Pro purchase / restore, a one-time “**You are on Pro**” dialog appears; later launches (including after the process is killed) do not show it again.

**Recycle bin options** (Settings → Local gallery → Recycle bin options): default delete is **Move to recycle bin** or **Permanently delete**; confirm before emptying the bin; expiry reminders (daily notification for items the system will permanently delete within about a day; Android 13+ needs notification permission).

- **Default = Move to recycle bin:** deletes from the local gallery / viewer go to the bin (and can be restored).
- **Default = Permanently delete:** after confirm, local gallery / viewer deletes should actually delete and **must not** enter the bin because of that delete. The bin can still show items for other reasons:
  1. After a **fully successful upload**, you chose to move local copies to the recycle bin (independent of the delete default)
  2. **Photo edit** keeps a pre-edit backup in the recycle bin before overwrite
  3. **Other apps / the system gallery** moved items into the shared MediaStore trash
- With the recycle bin **off**, local deletes are always permanent; a successful upload will not ask to move copies to the bin.

### 12.4 How to upgrade

1. **More → Settings → Upgrade to Pro** (or an upgrade prompt when you try automatic backup, photo cast, and similar)
2. Complete the Google Play one-time purchase
3. After a new phone or reinstall, use **Restore purchases** in Settings

### 12.5 Pro FAQ

**Q: Can Basic edit, delete, and upload?**  
Yes. Basic is a full photo manager, not a view-only app.

**Q: Do local or home videos require Pro?**  
No. Local and home video playback are Basic. Pro unlocks **automatic** album backup and **photo cast**.

**Q: Does photo cast to a TV require Pro?**  
Yes. Basic can play a slideshow on the phone; TV cast needs Pro. Video Cast remains Basic.

**Q: Why does video cast say “bitrate too high”?**  
Only when transcode is required but there is no local file or transcode cache yet. Typical phone **H.264** casts directly and is not blocked by bitrate. HEVC and other TV-incompatible codecs are prepared first. See §5.7.

**Q: How is upload different from backup?**  
Upload is you picking files and a **home album** folder (Basic and Pro). With the **recycle bin on**, a fully successful upload can move local copies to the bin to save space. Backup writes the local gallery **one way** into an app-managed **private backup zone** and keeps local copies by default; restore in the app when you need it.

**Q: How does album backup differ between Basic and Pro?**  
Basic supports **manual** backup, **exclude folders**, and **restore** / linking an old phone. **Pro** can additionally enable **automatic** background backup on Wi‑Fi.

**Q: Is backup two-way?**  
No. Backup is **phone → NAS**. Editing backup files on the NAS does not write back to the phone. Restore is a deliberate action in the app.

**Q: Office Lens files live in Documents. Can Basic see them?**  
Yes. Basic and Pro can **Select and authorize** parallel folders such as `Documents` under Settings → Local gallery.

**Q: When restoring, where do Documents and other parallel folders go?**  
**Without SAF** for that folder: a **mapped path under `Pictures/`** (not back to `Documents/…`). **With** that parallel folder authorized: the original relative path. The restore confirm dialog shows how many paths are mapped. See §9.7.

**Q: Why is “Use this folder” grey when authorizing Download?**  
This is an **Android 11+ system limit**. The app cannot get a tree grant for the Download **root**. Choose `Documents`, or authorize a **subfolder** under Downloads. The app does not offer a “read-only include Download” path (it would disagree with copy / restore writes and be more awkward).

---

## 13. Version info

Under **More → About** (or **More → Settings → About**) you can see:

- Version (currently **1.2.0**; trust **About** in the app)
- Build date
- **User guide** (this online manual: https://jasoncschang-stack.github.io/homegallery-privacy/help/)
- Report a problem
- Copyright

Settings → **Support** opens the same guide.

This public guide matches App **1.2.0** and manual **1.45**.
